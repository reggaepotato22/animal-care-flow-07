import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Activity, AlertTriangle, Clock, UserCheck, Stethoscope, Heart,
  Thermometer, Wind, Plus, Check, Play, FileText, Pill, ClipboardList,
  ChevronRight, CheckCircle2, AlertCircle, Scissors, Syringe, Search,
  Timer, Zap, BarChart2, PenSquare, ChevronDown, ChevronUp, Lock, Unlock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";
import {
  getSurgery, subscribeToSurgery, advanceSurgeryPhase, getPhaseBlockers,
  completeSurgeryTask, updateSurgeryTask, addSurgeryVitals, addProcedureStep,
  addAnesthesiaEntry, addSurgeryNote, updatePreOpChecklist,
  SURGERY_PHASES, PHASE_META,
  type SurgeryRecord, type SurgeryTask, type SurgeryEvent,
  type ProcedureStepType,
} from "@/lib/surgeryStore";

// ── Constants ──────────────────────────────────────────────────────────────────

const ACTIVE_PHASES = ["INDUCTION", "INTRA_OP", "POST_OP"];

const EVT_ICON: Record<string, React.ElementType> = {
  phase_change:    Zap,
  task_completed:  CheckCircle2,
  vitals:          Activity,
  medication:      Pill,
  procedure_step:  Scissors,
  note:            FileText,
  incident:        AlertTriangle,
  anesthesia:      Syringe,
  admission:       ClipboardList,
};
const EVT_COLOR: Record<string, string> = {
  phase_change:    "text-primary bg-primary/10",
  task_completed:  "text-green-600 bg-green-50",
  vitals:          "text-blue-600 bg-blue-50",
  medication:      "text-purple-600 bg-purple-50",
  procedure_step:  "text-orange-600 bg-orange-50",
  note:            "text-indigo-600 bg-indigo-50",
  incident:        "text-red-600 bg-red-50",
  anesthesia:      "text-pink-600 bg-pink-50",
  admission:       "text-teal-600 bg-teal-50",
};

const STEP_TYPES: { value: ProcedureStepType; label: string; Icon: React.ElementType }[] = [
  { value: "incision",   label: "Incision",        Icon: Scissors },
  { value: "suturing",   label: "Suturing",         Icon: Scissors },
  { value: "medication", label: "Medication Given", Icon: Pill },
  { value: "instrument", label: "Instrument Used",  Icon: Stethoscope },
  { value: "finding",    label: "Surgical Finding",  Icon: Search },
  { value: "custom",     label: "Custom Step",       Icon: PenSquare },
];

const CHECKLIST_ITEMS: { key: keyof ReturnType<typeof emptyChecklist>; label: string }[] = [
  { key: "patientIdVerified",          label: "Patient identity verified" },
  { key: "consentObtained",            label: "Signed consent form obtained" },
  { key: "fastingConfirmed",           label: "Fasting confirmed (≥ 6h food, ≥ 2h water)" },
  { key: "labResultsReviewed",         label: "Pre-op blood work and labs reviewed" },
  { key: "allergyConfirmed",           label: "Known allergies confirmed and documented" },
  { key: "preOpVitalsDone",            label: "Pre-op physical exam and vitals completed" },
  { key: "ivPlaced",                   label: "IV access established" },
  { key: "surgicalSitePrepped",        label: "Surgical site clipped and aseptically prepped" },
  { key: "anesthesiaEquipmentChecked", label: "Anesthesia machine and monitoring checked" },
  { key: "instrumentsVerified",        label: "Surgical instruments and packs verified" },
];

function emptyChecklist() {
  return {
    consentObtained: false, fastingConfirmed: false, preOpVitalsDone: false,
    labResultsReviewed: false, ivPlaced: false, surgicalSitePrepped: false,
    anesthesiaEquipmentChecked: false, instrumentsVerified: false,
    allergyConfirmed: false, patientIdVerified: false, notes: "",
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(iso: string) { try { return format(new Date(iso), "HH:mm"); } catch { return "—"; } }
function fmtDate(iso: string) {
  try {
    const d = new Date(iso), tod = new Date().toDateString();
    return d.toDateString() === tod ? "Today" : format(d, "MMM d");
  } catch { return "—"; }
}
function durationLabel(start?: string, end?: string) {
  if (!start) return "—";
  const endD = end ? new Date(end) : new Date();
  const mins = differenceInMinutes(endD, new Date(start));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SurgeryWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useRole();
  const { toast } = useToast();
  const isVet = role === "Vet" || role === "SuperAdmin";

  const [rec, setRec] = useState<SurgeryRecord | null>(null);

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [dlgVitals,   setDlgVitals]   = useState(false);
  const [dlgStep,     setDlgStep]     = useState(false);
  const [dlgAnes,     setDlgAnes]     = useState(false);
  const [dlgNote,     setDlgNote]     = useState(false);
  const [dlgAdvance,  setDlgAdvance]  = useState(false);
  const [dlgTask,     setDlgTask]     = useState<SurgeryTask | null>(null);
  const [taskNote,    setTaskNote]    = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [vitF, setVitF] = useState({ heartRate:"", respiratoryRate:"", temperature:"", spo2:"", bloodPressure:"", anesthesiaDepth:"adequate" as "light"|"adequate"|"deep", notes:"" });
  const [stepF, setStepF] = useState({ type:"custom" as ProcedureStepType, description:"" });
  const [anesF, setAnesF] = useState({ agent:"", dose:"", route:"", notes:"" });
  const [noteF, setNoteF] = useState({ type:"general" as SurgeryNote["type"], title:"", content:"" });
  const [checklist, setChecklist] = useState(emptyChecklist());

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const load = () => {
      const r = getSurgery(id);
      setRec(r);
      if (r?.preOpChecklist) setChecklist(r.preOpChecklist as ReturnType<typeof emptyChecklist>);
    };
    load();
    return subscribeToSurgery(load);
  }, [id]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const tasks     = useMemo(() => rec?.tasks ?? [], [rec]);
  const events    = useMemo(() => [...(rec?.eventLog ?? [])].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [rec]);
  const vitals    = useMemo(() => rec?.vitalsLog ?? [], [rec]);
  const latestV   = useMemo(() => vitals.length ? vitals[vitals.length - 1] : null, [vitals]);
  const steps     = useMemo(() => rec?.procedureSteps ?? [], [rec]);

  const currentStatus = rec?.status ?? "SCHEDULED";
  const phaseMeta     = PHASE_META[currentStatus];
  const phaseIdx      = SURGERY_PHASES.indexOf(currentStatus);
  const nextPhase     = phaseIdx >= 0 && phaseIdx < SURGERY_PHASES.length - 1
    ? SURGERY_PHASES[phaseIdx + 1] : null;
  const blockers      = useMemo(() => rec ? getPhaseBlockers(rec) : [], [rec]);
  const canAdvance    = nextPhase !== null && blockers.length === 0 && currentStatus !== "COMPLETED" && currentStatus !== "CANCELLED";

  const currentTasks  = useMemo(() => tasks.filter(t => t.phase === currentStatus && t.status !== "DONE" && t.status !== "SKIPPED"), [tasks, currentStatus]);
  const doneTasks     = useMemo(() => tasks.filter(t => t.phase === currentStatus && (t.status === "DONE" || t.status === "SKIPPED")), [tasks, currentStatus]);
  const upcomingTasks = useMemo(() => {
    const idx = SURGERY_PHASES.indexOf(currentStatus);
    return tasks.filter(t => SURGERY_PHASES.indexOf(t.phase as typeof SURGERY_PHASES[number]) > idx && t.status === "TODO");
  }, [tasks, currentStatus]);

  const checklistCount = CHECKLIST_ITEMS.length;
  const checklistDone  = useMemo(() => CHECKLIST_ITEMS.filter(i => checklist[i.key]).length, [checklist]);

  const groupedEvents = useMemo(() => {
    const groups: { label: string; items: SurgeryEvent[] }[] = [];
    let cur = "";
    events.forEach(e => {
      const lbl = fmtDate(e.timestamp);
      if (lbl !== cur) { groups.push({ label: lbl, items: [] }); cur = lbl; }
      groups[groups.length - 1].items.push(e);
    });
    return groups;
  }, [events]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCompleteTask = useCallback(() => {
    if (!dlgTask || !id) return;
    completeSurgeryTask(id, dlgTask.id, role, taskNote || undefined);
    toast({ title: "Task completed", description: dlgTask.title });
    setDlgTask(null); setTaskNote("");
  }, [dlgTask, id, role, taskNote, toast]);

  const handleStartTask = useCallback((t: SurgeryTask) => {
    if (!id) return;
    updateSurgeryTask(id, t.id, { status: "IN_PROGRESS" });
    toast({ title: "Task started", description: t.title });
  }, [id, toast]);

  const handleLogVitals = useCallback(() => {
    if (!id) return;
    addSurgeryVitals(id, {
      id: `sv-${Date.now()}`, surgeryId: id, timestamp: new Date().toISOString(), recordedBy: role,
      heartRate:       vitF.heartRate || undefined,
      respiratoryRate: vitF.respiratoryRate || undefined,
      temperature:     vitF.temperature || undefined,
      spo2:            vitF.spo2 || undefined,
      bloodPressure:   vitF.bloodPressure || undefined,
      anesthesiaDepth: vitF.anesthesiaDepth,
      notes:           vitF.notes || undefined,
    });
    setDlgVitals(false);
    setVitF({ heartRate:"", respiratoryRate:"", temperature:"", spo2:"", bloodPressure:"", anesthesiaDepth:"adequate", notes:"" });
    toast({ title: "Vitals recorded" });
  }, [id, role, vitF, toast]);

  const handleLogStep = useCallback((type?: ProcedureStepType, description?: string) => {
    if (!id) return;
    const t = type ?? stepF.type;
    const d = description ?? stepF.description;
    if (!d.trim()) return;
    addProcedureStep(id, { id: `sp-${Date.now()}`, surgeryId: id, timestamp: new Date().toISOString(), by: role, description: d.trim(), type: t });
    setDlgStep(false);
    setStepF({ type: "custom", description: "" });
    toast({ title: "Step logged" });
  }, [id, role, stepF, toast]);

  const handleLogAnes = useCallback(() => {
    if (!id || !anesF.agent.trim() || !anesF.dose.trim()) return;
    addAnesthesiaEntry(id, { id: `ae-${Date.now()}`, surgeryId: id, timestamp: new Date().toISOString(), by: role, ...anesF });
    setDlgAnes(false);
    setAnesF({ agent:"", dose:"", route:"", notes:"" });
    toast({ title: "Anesthesia logged" });
  }, [id, role, anesF, toast]);

  const handleAddNote = useCallback(() => {
    if (!id || !noteF.content.trim()) return;
    addSurgeryNote(id, {
      id: `sn-${Date.now()}`, surgeryId: id, ...noteF,
      title: noteF.title || `${noteF.type.replace(/_/g," ")} note`,
      author: role, createdAt: new Date().toISOString(),
    });
    setDlgNote(false);
    setNoteF({ type: "general", title: "", content: "" });
    toast({ title: "Note saved" });
  }, [id, role, noteF, toast]);

  const handleSaveChecklist = useCallback(() => {
    if (!id) return;
    updatePreOpChecklist(id, { ...checklist, completedAt: new Date().toISOString(), completedBy: role });
    toast({ title: "Checklist saved" });
  }, [id, checklist, role, toast]);

  const handleAdvancePhase = useCallback(() => {
    if (!id || !nextPhase || !canAdvance) return;
    advanceSurgeryPhase(id, nextPhase, role);
    setDlgAdvance(false);
    toast({ title: `Moved to ${PHASE_META[nextPhase].label}` });
  }, [id, nextPhase, canAdvance, role, toast]);

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!rec) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Scissors className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Surgery record not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      </div>
    </div>
  );

  const noteType: SurgeryNote["type"] = (() => {
    if (currentStatus === "PRE_OP") return "pre_op";
    if (currentStatus === "INTRA_OP") return "intra_op";
    if (currentStatus === "POST_OP") return "post_op";
    if (currentStatus === "INDUCTION") return "anesthesia";
    return "general";
  })();

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 flex flex-col bg-background overflow-hidden" style={{ height: "100dvh" }}>

      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-card border-b px-5 py-3 z-30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Button variant="ghost" size="sm" className="mt-0.5 shrink-0 h-7 w-7 p-0"
                onClick={() => {
                  if (rec.hospRecordId) navigate(`/hospitalizations/${rec.hospRecordId}`);
                  else if (rec.encounterId) navigate(-1);
                  else navigate("/surgeries");
                }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-0.5">
                {rec.hospRecordId && <><span className="hover:underline cursor-pointer" onClick={() => navigate(`/hospitalizations/${rec.hospRecordId}`)}>Hospitalization</span><ChevronRight className="h-3 w-3" /></>}
                {!rec.hospRecordId && rec.encounterId && <><span className="hover:underline cursor-pointer" onClick={() => navigate(-1)}>Consultation</span><ChevronRight className="h-3 w-3" /></>}
                {!rec.hospRecordId && !rec.encounterId && <><span className="hover:underline cursor-pointer" onClick={() => navigate("/surgeries")}>Surgery Board</span><ChevronRight className="h-3 w-3" /></>}
                <span className="text-foreground font-medium">Surgery</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Scissors className="h-4 w-4 text-muted-foreground shrink-0" />
                <h1 className="text-base font-bold">{rec.petName}</h1>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-sm font-medium">{rec.surgeryType}</span>
                <Badge className={cn("border text-[11px] h-5", phaseMeta.badge)}>{phaseMeta.label}</Badge>
                {rec.isAggressive && <Badge variant="destructive" className="text-[11px] h-5 gap-1"><AlertTriangle className="h-3 w-3"/>Aggressive</Badge>}
                {ACTIVE_PHASES.includes(currentStatus) && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Live surgery" />}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                <span>{rec.species}</span><span>·</span>
                <span>Owner: <strong className="text-foreground">{rec.patientName}</strong></span><span>·</span>
                <span className="flex items-center gap-1"><UserCheck className="h-3 w-3"/>Surgeon: <strong className="text-foreground">{rec.surgeon}</strong></span>
                {rec.anesthetist && <><span>·</span><span>Anesthetist: {rec.anesthetist}</span></>}
                {rec.operatingRoom && <><span>·</span><span>OR: {rec.operatingRoom}</span></>}
                {rec.startTime && <><span>·</span><span className="flex items-center gap-1"><Timer className="h-3 w-3"/>Duration: {durationLabel(rec.startTime, rec.endTime)}</span></>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {(rec.allergies ?? []).map(a => <Badge key={a} className="bg-red-100 text-red-800 border-red-300 text-[10px] h-5">⚠ {a}</Badge>)}
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setNoteF(p=>({...p,type:noteType})); setDlgNote(true); }}><PenSquare className="h-3.5 w-3.5"/>Note</Button>
            {(currentStatus === "INDUCTION" || currentStatus === "INTRA_OP" || currentStatus === "POST_OP") && (
              <>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setDlgVitals(true)}><Activity className="h-3.5 w-3.5"/>Vitals</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setDlgAnes(true)}><Syringe className="h-3.5 w-3.5"/>Anesthesia</Button>
              </>
            )}
            {currentStatus === "INTRA_OP" && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setDlgStep(true)}><Plus className="h-3.5 w-3.5"/>Log Step</Button>
            )}
          </div>
        </div>
      </header>

      {/* ─── PHASE TRACKER STRIP ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-muted/20 border-b px-5 py-2.5 z-20">
        <div className="flex items-center justify-between gap-4">
          {/* Stepper */}
          <div className="flex items-center gap-0 flex-1 min-w-0">
            {SURGERY_PHASES.filter(p => p !== "CANCELLED").map((phase, i, arr) => {
              const idx = SURGERY_PHASES.indexOf(phase);
              const done    = idx < phaseIdx;
              const current = idx === phaseIdx;
              const future  = idx > phaseIdx;
              const meta    = PHASE_META[phase];
              return (
                <React.Fragment key={phase}>
                  <div className="flex flex-col items-center shrink-0">
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                      done    && "bg-primary border-primary text-primary-foreground",
                      current && "border-primary text-primary bg-primary/10 ring-2 ring-primary/30",
                      future  && "border-border text-muted-foreground bg-background",
                    )}>
                      {done ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                    </div>
                    <span className={cn("text-[10px] mt-0.5 font-medium hidden sm:block",
                      current ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground"
                    )}>{meta.shortLabel}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mx-1", done ? "bg-primary" : "bg-border")} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Advance Phase */}
          {currentStatus !== "COMPLETED" && currentStatus !== "CANCELLED" && isVet && (
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <Button
                size="sm"
                className={cn("h-7 text-xs gap-1.5", canAdvance ? "" : "opacity-60")}
                disabled={!canAdvance}
                onClick={() => setDlgAdvance(true)}
              >
                {canAdvance ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {nextPhase ? `→ ${PHASE_META[nextPhase].label}` : "Completed"}
              </Button>
              {!canAdvance && blockers.length > 0 && (
                <p className="text-[10px] text-red-600 max-w-[220px] text-right leading-tight">
                  {blockers[0]}{blockers.length > 1 ? ` (+${blockers.length - 1})` : ""}
                </p>
              )}
            </div>
          )}
          {currentStatus === "COMPLETED" && (
            <Badge className="bg-green-100 text-green-800 border-green-300 gap-1"><CheckCircle2 className="h-3 w-3"/>Surgery Completed</Badge>
          )}
        </div>
      </div>

      {/* ─── THREE-PANEL BODY ────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT — Timeline */}
        <aside className="w-60 border-r flex flex-col min-h-0 bg-background shrink-0">
          <div className="flex-shrink-0 p-3 border-b">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Timeline</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {groupedEvents.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No events yet</p>
              </div>
            ) : groupedEvents.map(g => (
              <div key={g.label}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-2.5">
                  {g.items.map(evt => {
                    const EIcon = EVT_ICON[evt.type] ?? Activity;
                    const ec    = EVT_COLOR[evt.type] ?? "text-gray-600 bg-gray-50";
                    return (
                      <div key={evt.id} className="flex gap-2">
                        <div className={cn("rounded-full p-1 h-5 w-5 flex items-center justify-center shrink-0 mt-0.5", ec)}>
                          <EIcon className="h-2.5 w-2.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium leading-tight">{evt.title}</p>
                          {evt.detail && <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{evt.detail}</p>}
                          <p className="text-[10px] text-muted-foreground mt-0.5">{fmtTime(evt.timestamp)} · {evt.actor}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN — Phase-specific view */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-shrink-0 border-b bg-muted/10 px-5 py-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{phaseMeta.label}</span>
            <span className="text-muted-foreground text-xs">—</span>
            <span className="text-xs text-muted-foreground">{phaseMeta.description}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5">

            {/* PRE-OP: Safety Checklist */}
            {(currentStatus === "SCHEDULED" || currentStatus === "PRE_OP") && (
              <div className="space-y-5 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Pre-Op Safety Checklist</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{checklistDone}/{checklistCount} items confirmed</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(checklistDone/checklistCount)*100}%` }} />
                    </div>
                    <Button size="sm" onClick={handleSaveChecklist} className="h-7 text-xs gap-1"><Check className="h-3.5 w-3.5"/>Save</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {CHECKLIST_ITEMS.map(item => (
                    <label key={item.key} className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      checklist[item.key] ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" : "bg-card hover:bg-muted/30"
                    )}>
                      <div className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                        checklist[item.key] ? "bg-primary border-primary" : "border-border bg-background"
                      )}>
                        {checklist[item.key] && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <input type="checkbox" className="sr-only"
                        checked={!!checklist[item.key]}
                        onChange={e => setChecklist(p => ({ ...p, [item.key]: e.target.checked }))}
                      />
                      <span className={cn("text-sm", checklist[item.key] && "line-through text-muted-foreground")}>{item.label}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Additional Pre-Op Notes</Label>
                  <Textarea placeholder="Relevant observations, special instructions…"
                    value={checklist.notes ?? ""} onChange={e => setChecklist(p => ({ ...p, notes: e.target.value }))}
                    className="min-h-[70px] text-sm" />
                </div>

                {checklistDone === checklistCount && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    All checklist items confirmed — patient ready for induction.
                  </div>
                )}
              </div>
            )}

            {/* INDUCTION: Anesthesia log + vitals */}
            {currentStatus === "INDUCTION" && (
              <div className="space-y-5">
                <VitalsStrip vitals={latestV} />

                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Anesthesia Log</CardTitle>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setDlgAnes(true)}>
                        <Syringe className="h-3.5 w-3.5" /> Log Agent
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {(rec.anesthesiaLog ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">No anesthesia logged yet</p>
                    ) : (
                      <div className="space-y-2">
                        {[...(rec.anesthesiaLog ?? [])].reverse().map(e => (
                          <div key={e.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border text-sm">
                            <Syringe className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{e.agent} — {e.dose} <span className="text-muted-foreground font-normal">({e.route})</span></div>
                              {e.notes && <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>}
                            </div>
                            <span className="text-[11px] text-muted-foreground shrink-0">{fmtTime(e.timestamp)} · {e.by}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Vitals History</CardTitle>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setDlgVitals(true)}><Activity className="h-3.5 w-3.5"/>Record</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <VitalsTable vitals={rec.vitalsLog ?? []} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* INTRA-OP: Quick log + steps + vitals */}
            {currentStatus === "INTRA_OP" && (
              <div className="space-y-5">
                <VitalsStrip vitals={latestV} />

                {/* Quick-log buttons */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Quick Log</p>
                  <div className="flex flex-wrap gap-2">
                    {STEP_TYPES.filter(s => s.value !== "custom").map(s => (
                      <Button key={s.value} size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                        onClick={() => {
                          const label = `${s.label} — ${format(new Date(), "HH:mm")}`;
                          handleLogStep(s.value, label);
                        }}>
                        <s.Icon className="h-3.5 w-3.5" />{s.label}
                      </Button>
                    ))}
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setDlgStep(true)}>
                      <PenSquare className="h-3.5 w-3.5" /> Custom Step
                    </Button>
                  </div>
                </div>

                {/* Procedure steps */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm">Procedure Log ({steps.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {steps.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">No steps logged yet — use Quick Log above</p>
                    ) : (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {[...steps].reverse().map(s => {
                          const st = STEP_TYPES.find(t => t.value === s.type);
                          return (
                            <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded bg-muted/20 border text-sm">
                              {st && <st.Icon className="h-3.5 w-3.5 text-orange-600 shrink-0" />}
                              <span className="flex-1">{s.description}</span>
                              <span className="text-[11px] text-muted-foreground shrink-0">{fmtTime(s.timestamp)} · {s.by}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Vitals History</CardTitle>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setDlgVitals(true)}><Activity className="h-3.5 w-3.5"/>Record</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <VitalsTable vitals={rec.vitalsLog ?? []} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* POST-OP: Recovery */}
            {currentStatus === "POST_OP" && (
              <div className="space-y-5">
                <VitalsStrip vitals={latestV} />
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Recovery Monitoring</h2>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setDlgVitals(true)}><Activity className="h-3.5 w-3.5"/>Record Vitals</Button>
                </div>
                <VitalsTable vitals={rec.vitalsLog ?? []} />

                {/* Post-op notes */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Post-Op Notes</CardTitle>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                        onClick={() => { setNoteF(p=>({...p,type:"post_op"})); setDlgNote(true); }}>
                        <Plus className="h-3.5 w-3.5"/>Add Note
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {(rec.surgeryNotes ?? []).filter(n => n.type === "post_op").length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">No post-op notes yet — required before completing surgery</p>
                    ) : (
                      <div className="space-y-2">
                        {(rec.surgeryNotes ?? []).filter(n => n.type === "post_op").map(n => (
                          <div key={n.id} className="p-3 rounded-lg border bg-muted/20 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{n.title}</span>
                              <span className="text-[11px] text-muted-foreground">{fmtTime(n.createdAt)} · {n.author}</span>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* COMPLETED: Surgery summary */}
            {currentStatus === "COMPLETED" && (
              <div className="space-y-5 max-w-2xl">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900">
                  <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">Surgery Completed</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {rec.surgeryType} — Duration: {durationLabel(rec.startTime, rec.endTime)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg border space-y-1">
                    <p className="text-xs text-muted-foreground">Surgeon</p>
                    <p className="font-medium">{rec.surgeon}</p>
                  </div>
                  {rec.anesthetist && <div className="p-3 rounded-lg border space-y-1">
                    <p className="text-xs text-muted-foreground">Anesthetist</p>
                    <p className="font-medium">{rec.anesthetist}</p>
                  </div>}
                  <div className="p-3 rounded-lg border space-y-1">
                    <p className="text-xs text-muted-foreground">Start Time</p>
                    <p className="font-medium">{rec.startTime ? format(new Date(rec.startTime), "HH:mm, MMM d") : "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg border space-y-1">
                    <p className="text-xs text-muted-foreground">End Time</p>
                    <p className="font-medium">{rec.endTime ? format(new Date(rec.endTime), "HH:mm, MMM d") : "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg border space-y-1">
                    <p className="text-xs text-muted-foreground">Procedure Steps</p>
                    <p className="font-medium">{steps.length}</p>
                  </div>
                  <div className="p-3 rounded-lg border space-y-1">
                    <p className="text-xs text-muted-foreground">Vitals Readings</p>
                    <p className="font-medium">{vitals.length}</p>
                  </div>
                </div>

                {(rec.surgeryNotes ?? []).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Surgical Notes</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      {(rec.surgeryNotes ?? []).map(n => (
                        <div key={n.id} className="p-3 rounded-lg border bg-muted/20 space-y-1">
                          <div className="flex justify-between"><span className="text-xs font-medium">{n.title}</span><Badge variant="outline" className="text-[10px] h-4">{n.type.replace(/_/g," ")}</Badge></div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.content}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {rec.hospRecordId && (
                  <Button variant="outline" onClick={() => navigate(`/hospitalizations/${rec.hospRecordId}`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Return to Hospitalization Record
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT — Task Engine */}
        <aside className="w-72 border-l flex flex-col min-h-0 bg-background shrink-0">
          <div className="flex-shrink-0 p-3 border-b">
            <div className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tasks</span>
              {currentTasks.length > 0 && <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] h-4 ml-auto">{currentTasks.length} pending</Badge>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Current phase tasks */}
            {currentTasks.length === 0 && doneTasks.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-xs text-muted-foreground">All tasks complete</p>
              </div>
            )}

            {currentTasks.map(t => (
              <TaskCard key={t.id} task={t}
                onStart={() => handleStartTask(t)}
                onComplete={() => { setDlgTask(t); setTaskNote(""); }}
              />
            ))}

            {/* Completed this phase */}
            {doneTasks.length > 0 && (
              <div>
                <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground w-full py-1"
                  onClick={() => setShowCompleted(p => !p)}>
                  {showCompleted ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {doneTasks.length} completed this phase
                </button>
                {showCompleted && doneTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded text-xs text-muted-foreground line-through">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 no-underline" style={{ textDecoration:"none" }} />
                    {t.title}
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming tasks (next phase) */}
            {upcomingTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mt-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {upcomingTasks.slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded text-xs text-muted-foreground border border-dashed mb-1">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{t.title}</span>
                    <Badge variant="outline" className="text-[9px] h-3.5 px-1 shrink-0">{PHASE_META[t.phase as SurgeryStatus]?.shortLabel}</Badge>
                  </div>
                ))}
                {upcomingTasks.length > 4 && <p className="text-[10px] text-muted-foreground px-2">+{upcomingTasks.length - 4} more…</p>}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ─── DIALOGS ──────────────────────────────────────────────────────── */}

      {/* Advance Phase */}
      <Dialog open={dlgAdvance} onOpenChange={setDlgAdvance}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Advance to {nextPhase ? PHASE_META[nextPhase].label : ""}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{nextPhase ? PHASE_META[nextPhase].description : ""}</p>
          {blockers.length > 0 && (
            <div className="space-y-1">
              {blockers.map((b, i) => <div key={i} className="flex items-center gap-2 text-xs text-red-600"><AlertCircle className="h-3.5 w-3.5 shrink-0"/>{b}</div>)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgAdvance(false)}>Cancel</Button>
            <Button onClick={handleAdvancePhase} disabled={!canAdvance}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Task */}
      <Dialog open={!!dlgTask} onOpenChange={o => { if (!o) { setDlgTask(null); setTaskNote(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Complete Task</DialogTitle></DialogHeader>
          <p className="text-sm font-medium">{dlgTask?.title}</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea placeholder="Observations, outcome…" value={taskNote} onChange={e => setTaskNote(e.target.value)} className="min-h-[70px] text-sm" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDlgTask(null); setTaskNote(""); }}>Cancel</Button>
            <Button onClick={handleCompleteTask}><Check className="h-4 w-4 mr-1.5"/>Mark Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Vitals */}
      <Dialog open={dlgVitals} onOpenChange={setDlgVitals}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Activity className="h-4 w-4"/>Log Vitals</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {([
              { label:"Heart Rate (bpm)",    key:"heartRate" },
              { label:"Resp. Rate (rpm)",    key:"respiratoryRate" },
              { label:"Temperature (°C)",    key:"temperature" },
              { label:"SpO₂ (%)",            key:"spo2" },
              { label:"Blood Pressure",      key:"bloodPressure" },
            ] as { label:string; key:keyof typeof vitF }[]).map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input placeholder="—" value={vitF[f.key] as string} onChange={e => setVitF(p => ({ ...p, [f.key]: e.target.value }))} className="h-8 text-sm" />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">Anesthesia Depth</Label>
              <Select value={vitF.anesthesiaDepth} onValueChange={v => setVitF(p => ({ ...p, anesthesiaDepth: v as typeof vitF.anesthesiaDepth }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="adequate">Adequate</SelectItem>
                  <SelectItem value="deep">Deep</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Input placeholder="Observations…" value={vitF.notes} onChange={e => setVitF(p => ({ ...p, notes: e.target.value }))} className="text-sm" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgVitals(false)}>Cancel</Button>
            <Button onClick={handleLogVitals}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Procedure Step */}
      <Dialog open={dlgStep} onOpenChange={setDlgStep}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Scissors className="h-4 w-4"/>Log Procedure Step</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Step Type</Label>
              <Select value={stepF.type} onValueChange={v => setStepF(p => ({ ...p, type: v as ProcedureStepType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STEP_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description *</Label>
              <Textarea placeholder="Describe the step…" value={stepF.description} onChange={e => setStepF(p => ({ ...p, description: e.target.value }))} className="min-h-[70px] text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgStep(false)}>Cancel</Button>
            <Button onClick={() => handleLogStep()} disabled={!stepF.description.trim()}>Log Step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Anesthesia */}
      <Dialog open={dlgAnes} onOpenChange={setDlgAnes}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Syringe className="h-4 w-4"/>Log Anesthesia</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Agent *</Label>
              <Input placeholder="e.g. Propofol, Ketamine" value={anesF.agent} onChange={e => setAnesF(p => ({ ...p, agent: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dose *</Label>
              <Input placeholder="e.g. 4 mg/kg" value={anesF.dose} onChange={e => setAnesF(p => ({ ...p, dose: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Route</Label>
              <Input placeholder="e.g. IV, IM" value={anesF.route} onChange={e => setAnesF(p => ({ ...p, route: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input placeholder="Patient response, observations…" value={anesF.notes} onChange={e => setAnesF(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgAnes(false)}>Cancel</Button>
            <Button onClick={handleLogAnes} disabled={!anesF.agent.trim() || !anesF.dose.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note */}
      <Dialog open={dlgNote} onOpenChange={setDlgNote}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-4 w-4"/>Add Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Note Type</Label>
                <Select value={noteF.type} onValueChange={v => setNoteF(p => ({ ...p, type: v as SurgeryNote["type"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_op">Pre-Op</SelectItem>
                    <SelectItem value="intra_op">Intra-Op</SelectItem>
                    <SelectItem value="post_op">Post-Op</SelectItem>
                    <SelectItem value="anesthesia">Anesthesia</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Title (optional)</Label>
                <Input placeholder="Note title…" value={noteF.title} onChange={e => setNoteF(p => ({ ...p, title: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Content *</Label>
              <Textarea placeholder="Clinical observations, findings, plan…" value={noteF.content} onChange={e => setNoteF(p => ({ ...p, content: e.target.value }))} className="min-h-[100px] text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgNote(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={!noteF.content.trim()}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

type SurgeryNote = import("@/lib/surgeryStore").SurgeryNote;

function VitalsStrip({ vitals }: { vitals: import("@/lib/surgeryStore").SurgeryVitals | null }) {
  const fields = [
    { Icon: Heart,       label: "HR",    val: vitals?.heartRate,        unit: "bpm", warnFn: (v: string) => +v > 160 || +v < 40 },
    { Icon: Wind,        label: "RR",    val: vitals?.respiratoryRate,  unit: "rpm", warnFn: (v: string) => +v > 40 || +v < 8 },
    { Icon: Thermometer, label: "Temp",  val: vitals?.temperature,      unit: "°C",  warnFn: (v: string) => +v > 39.5 || +v < 37.5 },
    { Icon: Activity,    label: "SpO₂",  val: vitals?.spo2,             unit: "%",   warnFn: (v: string) => +v < 95 },
    { Icon: BarChart2,   label: "BP",    val: vitals?.bloodPressure,    unit: "",    warnFn: () => false },
  ] as { Icon: React.ElementType; label: string; val?: string; unit: string; warnFn: (v: string) => boolean }[];

  return (
    <div className="flex flex-wrap gap-4 p-3 rounded-xl border bg-muted/20">
      {fields.map(f => {
        const warn = f.val ? f.warnFn(f.val) : false;
        return (
          <div key={f.label} className="flex items-center gap-1.5">
            <f.Icon className={cn("h-4 w-4", warn ? "text-red-500" : "text-muted-foreground")} />
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <span className={cn("text-sm font-semibold", warn && "text-red-600")}>
              {f.val ? `${f.val}${f.unit}` : <span className="text-muted-foreground font-normal">—</span>}
            </span>
          </div>
        );
      })}
      {vitals && (
        <span className="text-[10px] text-muted-foreground ml-auto">
          Updated {formatDistanceToNow(new Date(vitals.timestamp), { addSuffix: true })} · {vitals.recordedBy}
        </span>
      )}
      {!vitals && <span className="text-xs text-muted-foreground ml-auto">No vitals recorded yet</span>}
    </div>
  );
}

function VitalsTable({ vitals }: { vitals: import("@/lib/surgeryStore").SurgeryVitals[] }) {
  if (vitals.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">No vitals recorded yet</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">Time</th>
            <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">HR</th>
            <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">RR</th>
            <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">Temp</th>
            <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">SpO₂</th>
            <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">By</th>
          </tr>
        </thead>
        <tbody>
          {[...vitals].reverse().map(v => (
            <tr key={v.id} className="border-b last:border-0">
              <td className="py-1.5 pr-3 font-mono">{format(new Date(v.timestamp), "HH:mm")}</td>
              <td className="py-1.5 pr-3">{v.heartRate ? `${v.heartRate} bpm` : "—"}</td>
              <td className="py-1.5 pr-3">{v.respiratoryRate ? `${v.respiratoryRate} rpm` : "—"}</td>
              <td className="py-1.5 pr-3">{v.temperature ? `${v.temperature}°C` : "—"}</td>
              <td className="py-1.5 pr-3">{v.spo2 ? `${v.spo2}%` : "—"}</td>
              <td className="py-1.5 pr-3 text-muted-foreground">{v.recordedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskCard({ task, onStart, onComplete }: { task: SurgeryTask; onStart: () => void; onComplete: () => void }) {
  const isInProgress = task.status === "IN_PROGRESS";
  return (
    <div className={cn(
      "rounded-lg border p-2.5 space-y-2 text-sm",
      task.required ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20" : "bg-card",
      isInProgress && "border-blue-300 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20",
    )}>
      <div className="flex items-start gap-2">
        <div className={cn("mt-0.5 h-4 w-4 rounded-full border-2 shrink-0",
          isInProgress ? "border-blue-500 bg-blue-100" : "border-muted-foreground/40")} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-snug">{task.title}</p>
          {task.description && <p className="text-[11px] text-muted-foreground mt-0.5">{task.description}</p>}
        </div>
        {task.required && <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[9px] h-4 px-1 shrink-0">Required</Badge>}
      </div>
      <div className="flex items-center gap-1.5 pl-6">
        {!isInProgress && (
          <Button size="sm" variant="ghost" className="h-6 text-[11px] gap-1 px-2" onClick={onStart}>
            <Play className="h-3 w-3" /> Start
          </Button>
        )}
        <Button size="sm" className="h-6 text-[11px] gap-1 px-2 ml-auto" onClick={onComplete}>
          <Check className="h-3 w-3" /> Done
        </Button>
      </div>
    </div>
  );
}

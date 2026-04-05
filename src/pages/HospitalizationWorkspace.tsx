import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Activity, AlertTriangle, Clock, UserCheck, Stethoscope, Heart,
  Thermometer, Wind, Plus, Check, Play, FileText, Pill, BarChart2, ClipboardList,
  ChevronDown, ChevronRight, LogOut, CheckCircle2, Timer, AlertCircle, Repeat,
  Bed, PenSquare, Bell, Eye, AlarmClock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";
import {
  getHospRecord, subscribeToHospitalization, addHospTask, updateHospTask,
  completeHospTask, addVitalsEntry, addFlowsheetRow, updateCarePlan,
  addHospNote, updateHospWorkspaceStatus, WORKSPACE_STATUS_META,
  type HospRecord, type HospTask, type VitalsEntry, type HospEvent,
  type FlowsheetRow, type HospCarePlan, type HospNote,
  type HospTaskType, type HospTaskPriority,
} from "@/lib/hospitalizationStore";

// ── Constants ─────────────────────────────────────────────────────────────────
const TASK_TYPE_META: Record<HospTaskType, { label: string; Icon: React.ElementType; color: string }> = {
  medication: { label: "Medication", Icon: Pill,          color: "text-blue-600" },
  monitoring: { label: "Monitoring", Icon: Activity,      color: "text-purple-600" },
  procedure:  { label: "Procedure",  Icon: Stethoscope,   color: "text-orange-600" },
  feeding:    { label: "Feeding",    Icon: Heart,         color: "text-green-600" },
  custom:     { label: "Custom",     Icon: ClipboardList, color: "text-gray-500" },
};
const PRIORITY_META: Record<HospTaskPriority, { label: string; bg: string }> = {
  low:    { label: "Low",    bg: "bg-gray-100 text-gray-600 border-gray-300" },
  normal: { label: "Normal", bg: "bg-blue-100 text-blue-700 border-blue-300" },
  high:   { label: "High",   bg: "bg-amber-100 text-amber-700 border-amber-300" },
  urgent: { label: "Urgent", bg: "bg-red-100 text-red-700 border-red-300" },
};
const EVT_ICON: Record<string, React.ElementType> = {
  vitals: Activity, task_completed: CheckCircle2, task_started: Play, medication: Pill,
  note: FileText, incident: AlertTriangle, status_change: Bell,
  order: ClipboardList, admission: Bed, feeding: Heart,
};
const EVT_COLOR: Record<string, string> = {
  vitals: "text-blue-600 bg-blue-50", task_completed: "text-green-600 bg-green-50",
  task_started: "text-amber-600 bg-amber-50", medication: "text-purple-600 bg-purple-50",
  note: "text-indigo-600 bg-indigo-50", incident: "text-red-600 bg-red-50",
  status_change: "text-orange-600 bg-orange-50", order: "text-cyan-600 bg-cyan-50",
  admission: "text-teal-600 bg-teal-50", feeding: "text-green-600 bg-green-50",
};

function fmtTime(iso: string) { try { return format(new Date(iso), "HH:mm"); } catch { return "—"; } }
function fmtDate(iso: string) {
  try {
    const d = new Date(iso), today = new Date().toDateString(), yest = new Date(Date.now()-86400000).toDateString();
    return d.toDateString()===today?"Today":d.toDateString()===yest?"Yesterday":format(d,"MMM d");
  } catch { return "—"; }
}
function losLabel(adm: string) {
  const d = differenceInDays(new Date(), new Date(adm));
  return d === 0 ? "Day 1 (Today)" : `${d} day${d!==1?"s":""}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HospitalizationWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useRole();
  const { toast } = useToast();
  const isVet = role === "Vet" || role === "SuperAdmin";

  const [rec, setRec] = useState<HospRecord | null>(null);
  const tasks     = useMemo(() => rec?.tasks     ?? [], [rec]);
  const events    = useMemo(() => rec?.eventLog  ?? [], [rec]);
  const vitalsLog = useMemo(() => rec?.vitalsLog ?? [], [rec]);
  const flowsheet = useMemo(() => rec?.flowsheet ?? [], [rec]);
  const hospNotes = useMemo(() => rec?.hospNotes ?? [], [rec]);

  const [mainView,      setMainView]      = useState<"careplan"|"flowsheet"|"notes">("careplan");
  const [tlFilter,      setTlFilter]      = useState<"all"|"notes"|"tasks"|"vitals"|"medications">("all");
  const [activeNoteId,  setActiveNoteId]  = useState<string|null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [dlgTask,       setDlgTask]       = useState(false);
  const [dlgVitals,     setDlgVitals]     = useState(false);
  const [dlgNote,       setDlgNote]       = useState(false);
  const [dlgDischarge,  setDlgDischarge]  = useState(false);
  const [dlgComplete,   setDlgComplete]   = useState<HospTask|null>(null);
  const [completeNote,  setCompleteNote]  = useState("");

  const [taskF, setTaskF] = useState({
    title:"", type:"monitoring" as HospTaskType, priority:"normal" as HospTaskPriority,
    scheduledAt: new Date().toISOString().slice(0,16), assignee:"",
    recurring:false, recurEveryHours:4, recurDurationDays:1,
  });
  const [vitF, setVitF] = useState({ temperature:"", heartRate:"", respiratoryRate:"", weight:"", painScore:"", notes:"" });
  const [noteF, setNoteF] = useState<{ type:HospNote["type"]; title:string; content:string }>({ type:"progress", title:"", content:"" });
  const [cpDraft, setCpDraft] = useState<HospCarePlan>({
    goals:"", instructions:"", dietaryRestrictions:"", activityLevel:"",
    monitoringFrequency:"every 4 hours", updatedAt:"", updatedBy:"",
  });
  const [fsRow, setFsRow] = useState({ temperature:"", heartRate:"", respiratoryRate:"", weight:"", notes:"" });

  useEffect(() => {
    if (!id) return;
    const load = () => { const r = getHospRecord(id); setRec(r); if (r?.carePlan) setCpDraft(r.carePlan); };
    load();
    return subscribeToHospitalization(load);
  }, [id]);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const latestVitals = useMemo(() => vitalsLog.length ? vitalsLog[vitalsLog.length-1] : null, [vitalsLog]);
  const now30 = new Date(Date.now() + 30*60_000);
  const dueNow   = useMemo(() => tasks.filter(t=>t.status!=="DONE"&&new Date(t.scheduledAt)<=now30).sort((a,b)=>new Date(a.scheduledAt).getTime()-new Date(b.scheduledAt).getTime()),[tasks]);
  const upcoming = useMemo(() => tasks.filter(t=>t.status==="TODO"&&new Date(t.scheduledAt)>now30).sort((a,b)=>new Date(a.scheduledAt).getTime()-new Date(b.scheduledAt).getTime()),[tasks]);
  const completed= useMemo(() => tasks.filter(t=>t.status==="DONE").sort((a,b)=>new Date(b.completedAt??"").getTime()-new Date(a.completedAt??"").getTime()),[tasks]);

  const filteredEvts = useMemo(() => {
    const maps: Record<string,string[]> = { all:[], notes:["note"], tasks:["task_completed","task_started"], vitals:["vitals"], medications:["medication"] };
    const types = maps[tlFilter];
    const sorted = [...events].sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime());
    return types.length ? sorted.filter(e=>types.includes(e.type)) : sorted;
  }, [events, tlFilter]);

  const groupedTl = useMemo(() => {
    const groups: { label:string; items:HospEvent[] }[] = [];
    let cur = "";
    filteredEvts.forEach(e => {
      const lbl = fmtDate(e.timestamp);
      if (lbl!==cur) { groups.push({label:lbl,items:[]}); cur=lbl; }
      groups[groups.length-1].items.push(e);
    });
    return groups;
  }, [filteredEvts]);

  const wsStatus = rec?.workspaceStatus ?? "ADMITTED";
  const statusMeta = WORKSPACE_STATUS_META[wsStatus];
  const disChk = useMemo(() => ({
    dueTasks:   dueNow.length===0,
    hasNotes:   hospNotes.length>0,
    notCritical:wsStatus!=="CRITICAL",
  }), [dueNow.length, hospNotes.length, wsStatus]);
  const canDischarge = Object.values(disChk).every(Boolean);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleCompleteTask = useCallback(() => {
    if (!dlgComplete||!id) return;
    completeHospTask(id, dlgComplete.id, role, completeNote||undefined);
    toast({ title:"Task completed", description:dlgComplete.title });
    setDlgComplete(null); setCompleteNote("");
  }, [dlgComplete, id, role, completeNote, toast]);

  const handleStartTask = useCallback((t: HospTask) => {
    if (!id) return;
    updateHospTask(id, t.id, { status:"IN_PROGRESS" });
    toast({ title:"Task started", description:t.title });
  }, [id, toast]);

  const handleAddTask = useCallback(() => {
    if (!id||!taskF.title.trim()) return;
    addHospTask(id, {
      id:`task-${Date.now()}`, hospId:id, title:taskF.title.trim(), type:taskF.type,
      priority:taskF.priority, scheduledAt:new Date(taskF.scheduledAt).toISOString(),
      status:"TODO", assignee:taskF.assignee||undefined,
      recurring:taskF.recurring, recurEveryHours:taskF.recurring?taskF.recurEveryHours:undefined,
      recurDurationDays:taskF.recurring?taskF.recurDurationDays:undefined,
    });
    setDlgTask(false);
    setTaskF({title:"",type:"monitoring",priority:"normal",scheduledAt:new Date().toISOString().slice(0,16),assignee:"",recurring:false,recurEveryHours:4,recurDurationDays:1});
    toast({ title:"Task added" });
  }, [id, taskF, toast]);

  const handleAddVitals = useCallback(() => {
    if (!id) return;
    addVitalsEntry(id, {
      id:`v-${Date.now()}`, hospId:id, timestamp:new Date().toISOString(), recordedBy:role,
      temperature:vitF.temperature||undefined, heartRate:vitF.heartRate||undefined,
      respiratoryRate:vitF.respiratoryRate||undefined, weight:vitF.weight||undefined,
      painScore:vitF.painScore?+vitF.painScore:undefined, notes:vitF.notes||undefined,
    });
    setDlgVitals(false);
    setVitF({temperature:"",heartRate:"",respiratoryRate:"",weight:"",painScore:"",notes:""});
    toast({ title:"Vitals recorded" });
  }, [id, role, vitF, toast]);

  const handleAddFlowsheetRow = useCallback(() => {
    if (!id) return;
    addFlowsheetRow(id, { id:`fs-${Date.now()}`, hospId:id, timestamp:new Date().toISOString(),
      ...fsRow, recordedBy:role });
    setFsRow({temperature:"",heartRate:"",respiratoryRate:"",weight:"",notes:""});
    toast({ title:"Row added" });
  }, [id, role, fsRow, toast]);

  const handleSaveCarePlan = useCallback(() => {
    if (!id) return;
    updateCarePlan(id, {...cpDraft, updatedAt:new Date().toISOString(), updatedBy:role});
    toast({ title:"Care plan saved" });
  }, [id, cpDraft, role, toast]);

  const handleAddNote = useCallback(() => {
    if (!id||!noteF.content.trim()) return;
    const note: HospNote = {
      id:`hn-${Date.now()}`, hospId:id, type:noteF.type,
      title:noteF.title||(noteF.type.charAt(0).toUpperCase()+noteF.type.slice(1))+" Note",
      content:noteF.content.trim(), author:role, createdAt:new Date().toISOString(),
    };
    addHospNote(id, note);
    setActiveNoteId(note.id); setMainView("notes");
    setDlgNote(false); setNoteF({type:"progress",title:"",content:""});
    toast({ title:"Note added" });
  }, [id, role, noteF, toast]);

  const handleDischarge = useCallback(() => {
    if (!id||!canDischarge) return;
    updateHospWorkspaceStatus(id, "DISCHARGED", role);
    toast({ title:"Patient discharged" });
    navigate("/hospitalization");
  }, [id, canDischarge, role, toast, navigate]);

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (!rec) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Bed className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Record not found.</p>
        <Button variant="outline" onClick={() => navigate("/hospitalization")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 flex flex-col bg-background overflow-hidden"
      style={{ height: "100dvh" }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-card border-b px-5 py-3 z-30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Button variant="ghost" size="sm" className="mt-0.5 shrink-0 h-7 w-7 p-0" onClick={() => navigate("/hospitalization")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold">{rec.petName}</h1>
                <Badge className={cn("border text-[11px] h-5", statusMeta.color)}>{statusMeta.label}</Badge>
                {rec.isAggressive && <Badge variant="destructive" className="text-[11px] h-5 gap-1"><AlertTriangle className="h-3 w-3"/>Aggressive</Badge>}
                {(rec.criticalAlerts??[]).map(a=><Badge key={a} className="bg-red-100 text-red-800 border-red-300 text-[11px] h-5">{a}</Badge>)}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                <span>{rec.species}</span><span>·</span>
                <span>Owner: <strong className="text-foreground">{rec.patientName}</strong></span><span>·</span>
                <span className="flex items-center gap-1"><Bed className="h-3 w-3"/>{rec.ward}</span><span>·</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>Admitted {format(new Date(rec.admissionDate),"MMM d, yyyy")} {rec.admissionTime}</span><span>·</span>
                <span className="flex items-center gap-1 font-semibold text-foreground"><Timer className="h-3 w-3"/>LOS: {losLabel(rec.admissionDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground border rounded px-2 py-1">
              <UserCheck className="h-3.5 w-3.5"/><span>{rec.attendingVet}</span>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={()=>setDlgVitals(true)}><Activity className="h-3.5 w-3.5"/>Vitals</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={()=>setDlgNote(true)}><PenSquare className="h-3.5 w-3.5"/>Note</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={()=>setDlgTask(true)}><Plus className="h-3.5 w-3.5"/>Task</Button>
            {isVet && <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={()=>setDlgDischarge(true)}><LogOut className="h-3.5 w-3.5"/>Discharge</Button>}
          </div>
        </div>
      </header>

      {/* ─── VITALS STRIP ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-muted/30 border-b px-5 py-2 z-20">
        <div className="flex items-center gap-5 flex-wrap">
          {([
            { Icon:Thermometer, label:"Temp",  val:latestVitals?.temperature,     unit:"°C",  warn:(v:string)=>+v>39.5||+v<37.5 },
            { Icon:Heart,       label:"HR",    val:latestVitals?.heartRate,        unit:"bpm", warn:(v:string)=>+v>160||+v<40 },
            { Icon:Wind,        label:"RR",    val:latestVitals?.respiratoryRate,  unit:"rpm", warn:(v:string)=>+v>40||+v<10 },
            { Icon:Activity,    label:"Wt",    val:latestVitals?.weight,           unit:"kg",  warn:()=>false },
          ] as { Icon:React.ElementType; label:string; val?:string; unit:string; warn:(v:string)=>boolean }[]).map(v=>{
            const isWarn = v.val ? v.warn(v.val) : false;
            return (
              <div key={v.label} className="flex items-center gap-1.5">
                <v.Icon className={cn("h-3.5 w-3.5", isWarn?"text-red-500":"text-muted-foreground")}/>
                <span className="text-[11px] text-muted-foreground">{v.label}</span>
                <span className={cn("text-sm font-semibold", isWarn?"text-red-600":"")}>
                  {v.val ? `${v.val} ${v.unit}` : <span className="text-muted-foreground font-normal text-xs">—</span>}
                </span>
              </div>
            );
          })}
          {latestVitals && <span className="text-[10px] text-muted-foreground">Updated {formatDistanceToNow(new Date(latestVitals.timestamp),{addSuffix:true})} · {latestVitals.recordedBy}</span>}
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {(rec.allergies??[]).map(a=><Badge key={a} className="bg-red-100 text-red-800 border-red-300 text-[10px] h-5">⚠ {a}</Badge>)}
            {dueNow.length>0 && <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] h-5 gap-1"><AlarmClock className="h-3 w-3"/>{dueNow.length} due</Badge>}
          </div>
        </div>
      </div>

      {/* ─── THREE-PANEL ROW ──────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT — Timeline */}
        <aside className="w-64 border-r flex flex-col min-h-0 bg-background shrink-0">
          <div className="flex-shrink-0 p-3 border-b space-y-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground"/>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Timeline</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(["all","notes","tasks","vitals","medications"] as const).map(f=>(
                <button key={f} onClick={()=>setTlFilter(f)}
                  className={cn("px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-colors",
                    tlFilter===f?"bg-primary text-primary-foreground":"bg-muted/60 text-muted-foreground hover:bg-muted")}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {groupedTl.length===0 ? (
              <div className="text-center py-8"><Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2"/><p className="text-xs text-muted-foreground">No events yet</p></div>
            ) : groupedTl.map(g=>(
              <div key={g.label}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</span>
                  <div className="flex-1 h-px bg-border"/>
                </div>
                <div className="space-y-2.5">
                  {g.items.map(evt=>{
                    const EIcon = EVT_ICON[evt.type] ?? Activity;
                    const ec = EVT_COLOR[evt.type] ?? "text-gray-600 bg-gray-50";
                    return (
                      <div key={evt.id} className="flex gap-2">
                        <div className={cn("rounded-full p-1 h-5 w-5 flex items-center justify-center shrink-0 mt-0.5",ec)}>
                          <EIcon className="h-2.5 w-2.5"/>
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

        {/* MAIN — Views */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-shrink-0 border-b bg-background px-4 py-2 flex items-center gap-1">
            {([
              { id:"careplan",  label:"Care Plan",  Icon:ClipboardList },
              { id:"flowsheet", label:"Flowsheet",  Icon:BarChart2 },
              { id:"notes",     label:"Notes",      Icon:FileText },
            ] as { id:typeof mainView; label:string; Icon:React.ElementType }[]).map(v=>(
              <button key={v.id} onClick={()=>setMainView(v.id)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  mainView===v.id?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <v.Icon className="h-4 w-4"/>
                {v.label}
                {v.id==="notes"&&hospNotes.length>0&&<Badge variant="secondary" className="h-4 px-1 text-[10px]">{hospNotes.length}</Badge>}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">

            {/* CARE PLAN */}
            {mainView==="careplan"&&(
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Care Plan</h2>
                    <p className="text-xs text-muted-foreground">{rec.carePlan?`Last updated ${formatDistanceToNow(new Date(rec.carePlan.updatedAt),{addSuffix:true})} by ${rec.carePlan.updatedBy}`:"No care plan set"}</p>
                  </div>
                  {isVet&&<Button size="sm" onClick={handleSaveCarePlan} className="gap-1.5"><Check className="h-4 w-4"/>Save</Button>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clinical Goals</Label>
                  <Textarea placeholder="Patient goals and expected outcomes…" value={cpDraft.goals} onChange={e=>setCpDraft(p=>({...p,goals:e.target.value}))} disabled={!isVet} className="min-h-[70px] text-sm"/>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vet Instructions (for nursing team)</Label>
                  <Textarea placeholder="Step-by-step care instructions…" value={cpDraft.instructions} onChange={e=>setCpDraft(p=>({...p,instructions:e.target.value}))} disabled={!isVet} className="min-h-[90px] text-sm"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dietary Restrictions</Label>
                    <Input placeholder="e.g. NPO after midnight" value={cpDraft.dietaryRestrictions} onChange={e=>setCpDraft(p=>({...p,dietaryRestrictions:e.target.value}))} disabled={!isVet} className="text-sm"/>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity Level</Label>
                    <Select value={cpDraft.activityLevel} onValueChange={v=>setCpDraft(p=>({...p,activityLevel:v}))} disabled={!isVet}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Select…"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strict_rest">Strict Rest</SelectItem>
                        <SelectItem value="cage_rest">Cage Rest</SelectItem>
                        <SelectItem value="leash_only">Leash Only</SelectItem>
                        <SelectItem value="light_activity">Light Activity</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monitoring Frequency</Label>
                    <Select value={cpDraft.monitoringFrequency} onValueChange={v=>setCpDraft(p=>({...p,monitoringFrequency:v}))} disabled={!isVet}>
                      <SelectTrigger className="text-sm"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {["every 1 hour","every 2 hours","every 4 hours","every 6 hours","every 8 hours","twice daily","once daily"].map(o=><SelectItem key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!isVet&&<p className="text-xs text-muted-foreground italic flex items-center gap-1.5"><Eye className="h-3.5 w-3.5"/>Read-only — vets only can edit the care plan</p>}
              </div>
            )}

            {/* FLOWSHEET */}
            {mainView==="flowsheet"&&(
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold">Flowsheet</h2>
                  <p className="text-xs text-muted-foreground">Rapid vitals entry — one row per observation period</p>
                </div>
                <div className="rounded-lg border p-3 bg-primary/5 border-primary/30 space-y-2">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">Add Observation</p>
                  <div className="flex items-end gap-2 flex-wrap">
                    {([{k:"temperature",p:"Temp °C"},{k:"heartRate",p:"HR bpm"},{k:"respiratoryRate",p:"RR rpm"},{k:"weight",p:"Wt kg"},{k:"notes",p:"Notes"}]).map(f=>(
                      <div key={f.k} className="space-y-1">
                        <Label className="text-[10px]">{f.p}</Label>
                        <Input placeholder={f.p} value={fsRow[f.k as keyof typeof fsRow]} onChange={e=>setFsRow(p=>({...p,[f.k]:e.target.value}))} className="h-7 text-xs w-28"/>
                      </div>
                    ))}
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={handleAddFlowsheetRow}><Plus className="h-3 w-3"/>Add Row</Button>
                  </div>
                </div>
                <div className="rounded-lg border overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {["Time","Temp °C","HR bpm","RR rpm","Wt kg","Notes","By"].map(h=><th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[...flowsheet].reverse().map((r,i)=>(
                        <tr key={r.id} className={cn("border-b",i%2===0?"bg-background":"bg-muted/20")}>
                          <td className="px-3 py-2 font-medium whitespace-nowrap">{format(new Date(r.timestamp),"MMM d HH:mm")}</td>
                          <td className="px-3 py-2">{r.temperature||"—"}</td>
                          <td className="px-3 py-2">{r.heartRate||"—"}</td>
                          <td className="px-3 py-2">{r.respiratoryRate||"—"}</td>
                          <td className="px-3 py-2">{r.weight||"—"}</td>
                          <td className="px-3 py-2 max-w-[160px] truncate">{r.notes||"—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.recordedBy}</td>
                        </tr>
                      ))}
                      {flowsheet.length===0&&<tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No entries yet — add a row above</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* NOTES */}
            {mainView==="notes"&&(
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Clinical Notes</h2>
                    <p className="text-xs text-muted-foreground">{hospNotes.length} note{hospNotes.length!==1?"s":""}</p>
                  </div>
                  <Button size="sm" onClick={()=>setDlgNote(true)} className="gap-1.5"><Plus className="h-4 w-4"/>Add Note</Button>
                </div>
                <div className="flex gap-4 min-h-[380px]">
                  <div className="w-64 shrink-0 space-y-2">
                    {hospNotes.map(n=>(
                      <button key={n.id} onClick={()=>setActiveNoteId(n.id)}
                        className={cn("w-full text-left p-3 rounded-lg border transition-colors",activeNoteId===n.id?"border-primary bg-primary/5":"hover:bg-muted/50")}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">{n.type}</Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto">{fmtTime(n.createdAt)}</span>
                        </div>
                        <p className="text-xs font-semibold truncate">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground">{n.author}</p>
                      </button>
                    ))}
                    {hospNotes.length===0&&<div className="text-center py-8 text-muted-foreground"><FileText className="h-7 w-7 mx-auto mb-2 opacity-50"/><p className="text-xs">No notes yet</p></div>}
                  </div>
                  <div className="flex-1">
                    {activeNoteId?(()=>{
                      const n=hospNotes.find(x=>x.id===activeNoteId);
                      if(!n) return null;
                      return (
                        <Card className="h-full">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2"><Badge variant="outline" className="capitalize text-xs">{n.type}</Badge><CardTitle className="text-sm">{n.title}</CardTitle></div>
                            <CardDescription className="text-xs">By {n.author} · {format(new Date(n.createdAt),"PPp")}</CardDescription>
                          </CardHeader>
                          <CardContent><p className="text-sm whitespace-pre-wrap">{n.content}</p></CardContent>
                        </Card>
                      );
                    })():<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Select a note to read it</div>}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* RIGHT — Task Engine */}
        <aside className="w-76 border-l flex flex-col min-h-0 bg-background shrink-0" style={{width:"19rem"}}>
          <div className="flex-shrink-0 p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary"/>
              <span className="text-[11px] font-semibold uppercase tracking-wide">Task Engine</span>
            </div>
            <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1" onClick={()=>setDlgTask(true)}><Plus className="h-3 w-3"/>Add</Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* DUE NOW */}
            {dueNow.length>0&&(
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>
                  <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">Due Now ({dueNow.length})</span>
                </div>
                <div className="space-y-2">
                  {dueNow.map(t=><TaskCard key={t.id} task={t} onStart={()=>handleStartTask(t)} onComplete={()=>setDlgComplete(t)} urgent/>)}
                </div>
              </div>
            )}
            {/* UPCOMING */}
            {upcoming.length>0&&(
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="h-2 w-2 rounded-full bg-blue-400"/>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Upcoming ({upcoming.length})</span>
                </div>
                <div className="space-y-2">
                  {upcoming.map(t=><TaskCard key={t.id} task={t} onStart={()=>handleStartTask(t)} onComplete={()=>setDlgComplete(t)}/>)}
                </div>
              </div>
            )}
            {/* COMPLETED */}
            {completed.length>0&&(
              <div>
                <button className="flex items-center gap-1.5 mb-2 w-full" onClick={()=>setCompletedOpen(p=>!p)}>
                  {completedOpen?<ChevronDown className="h-3 w-3 text-muted-foreground"/>:<ChevronRight className="h-3 w-3 text-muted-foreground"/>}
                  <div className="h-2 w-2 rounded-full bg-green-400"/>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Completed ({completed.length})</span>
                </button>
                {completedOpen&&<div className="space-y-2">{completed.map(t=><TaskCard key={t.id} task={t} done/>)}</div>}
              </div>
            )}
            {tasks.length===0&&(
              <div className="text-center py-8">
                <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                <p className="text-xs text-muted-foreground">No tasks yet</p>
                <Button size="sm" variant="outline" className="mt-3 text-xs h-7 gap-1" onClick={()=>setDlgTask(true)}><Plus className="h-3 w-3"/>Add first task</Button>
              </div>
            )}
          </div>
        </aside>

      </div>

      {/* ─── DIALOGS ──────────────────────────────────────────────────────── */}

      {/* Complete task */}
      <Dialog open={!!dlgComplete} onOpenChange={()=>{setDlgComplete(null);setCompleteNote("");}}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Complete Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium">{dlgComplete?.title}</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Execution notes (optional)</Label>
              <Textarea placeholder="How was this performed?" value={completeNote} onChange={e=>setCompleteNote(e.target.value)} className="min-h-[70px] text-sm"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDlgComplete(null)}>Cancel</Button>
            <Button onClick={handleCompleteTask} className="gap-1.5"><CheckCircle2 className="h-4 w-4"/>Mark Complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add task */}
      <Dialog open={dlgTask} onOpenChange={setDlgTask}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input placeholder="e.g. Administer Amoxicillin 250mg" value={taskF.title} onChange={e=>setTaskF(p=>({...p,title:e.target.value}))} className="text-sm"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={taskF.type} onValueChange={v=>setTaskF(p=>({...p,type:v as HospTaskType}))}>
                  <SelectTrigger className="text-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.entries(TASK_TYPE_META).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={taskF.priority} onValueChange={v=>setTaskF(p=>({...p,priority:v as HospTaskPriority}))}>
                  <SelectTrigger className="text-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.entries(PRIORITY_META).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Scheduled At</Label>
                <Input type="datetime-local" value={taskF.scheduledAt} onChange={e=>setTaskF(p=>({...p,scheduledAt:e.target.value}))} className="text-sm"/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Assignee</Label>
                <Input placeholder="e.g. Nurse Jane" value={taskF.assignee} onChange={e=>setTaskF(p=>({...p,assignee:e.target.value}))} className="text-sm"/>
              </div>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5"/>Recurring</Label>
                <Switch checked={taskF.recurring} onCheckedChange={v=>setTaskF(p=>({...p,recurring:v}))}/>
              </div>
              {taskF.recurring&&(
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Every (hours)</Label><Input type="number" min={1} max={24} value={taskF.recurEveryHours} onChange={e=>setTaskF(p=>({...p,recurEveryHours:+e.target.value}))} className="text-sm h-8"/></div>
                  <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">For (days)</Label><Input type="number" min={1} max={30} value={taskF.recurDurationDays} onChange={e=>setTaskF(p=>({...p,recurDurationDays:+e.target.value}))} className="text-sm h-8"/></div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDlgTask(false)}>Cancel</Button>
            <Button onClick={handleAddTask} disabled={!taskF.title.trim()}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add vitals */}
      <Dialog open={dlgVitals} onOpenChange={setDlgVitals}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Vitals</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {([{k:"temperature",l:"Temperature (°C)",p:"e.g. 38.5"},{k:"heartRate",l:"Heart Rate (bpm)",p:"e.g. 80"},
               {k:"respiratoryRate",l:"Resp Rate (rpm)",p:"e.g. 20"},{k:"weight",l:"Weight (kg)",p:"e.g. 12.5"},
               {k:"painScore",l:"Pain Score (0-10)",p:"0-10"}]).map(f=>(
              <div key={f.k} className="space-y-1.5">
                <Label className="text-xs">{f.l}</Label>
                <Input placeholder={f.p} value={vitF[f.k as keyof typeof vitF]} onChange={e=>setVitF(p=>({...p,[f.k]:e.target.value}))} className="text-sm"/>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea placeholder="Any observations…" value={vitF.notes} onChange={e=>setVitF(p=>({...p,notes:e.target.value}))} className="min-h-[55px] text-sm"/>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDlgVitals(false)}>Cancel</Button>
            <Button onClick={handleAddVitals}>Save Vitals</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add note */}
      <Dialog open={dlgNote} onOpenChange={setDlgNote}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Clinical Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Note Type</Label>
                <Select value={noteF.type} onValueChange={v=>setNoteF(p=>({...p,type:v as HospNote["type"]}))}>
                  <SelectTrigger className="text-sm"><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="soap">SOAP</SelectItem><SelectItem value="progress">Progress</SelectItem><SelectItem value="procedure">Procedure</SelectItem><SelectItem value="general">General</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input placeholder="Note title" value={noteF.title} onChange={e=>setNoteF(p=>({...p,title:e.target.value}))} className="text-sm"/>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Content *</Label>
              <Textarea placeholder="Enter clinical note…" value={noteF.content} onChange={e=>setNoteF(p=>({...p,content:e.target.value}))} className="min-h-[120px] text-sm"/>
            </div>
            <p className="text-xs text-muted-foreground">Author: <strong>{role}</strong></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDlgNote(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={!noteF.content.trim()}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discharge */}
      <Dialog open={dlgDischarge} onOpenChange={setDlgDischarge}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Discharge Patient</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Complete the discharge checklist:</p>
            <div className="rounded-lg border p-4 space-y-2.5">
              {([
                {k:"dueTasks",    l:"No overdue tasks"},
                {k:"hasNotes",    l:"At least one clinical note added"},
                {k:"notCritical", l:"Patient status is not Critical"},
              ] as {k:keyof typeof disChk;l:string}[]).map(item=>(
                <div key={item.k} className="flex items-center gap-3">
                  <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0",disChk[item.k]?"bg-green-100 text-green-600":"bg-red-100 text-red-500")}>
                    {disChk[item.k]?<Check className="h-3 w-3"/>:<AlertCircle className="h-3 w-3"/>}
                  </div>
                  <span className={cn("text-sm",disChk[item.k]?"":"text-muted-foreground line-through")}>{item.l}</span>
                </div>
              ))}
            </div>
            {!canDischarge&&<p className="text-xs text-destructive">Complete all items before discharge.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDlgDischarge(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDischarge} disabled={!canDischarge} className="gap-1.5"><LogOut className="h-4 w-4"/>Confirm Discharge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onStart, onComplete, urgent, done }:
  { task:HospTask; onStart?:()=>void; onComplete?:()=>void; urgent?:boolean; done?:boolean }) {
  const { Icon, color } = TASK_TYPE_META[task.type] ?? TASK_TYPE_META.custom;
  const pm = PRIORITY_META[task.priority] ?? PRIORITY_META.normal;
  const isIP = task.status==="IN_PROGRESS";
  return (
    <div className={cn("rounded-lg border p-2.5 space-y-2 transition-colors text-left w-full",
      urgent&&!done?"border-red-300 bg-red-50/60 dark:bg-red-950/20":"",
      isIP?"border-amber-300 bg-amber-50/60 dark:bg-amber-950/20":"",
      done?"opacity-55 bg-muted/30 border-muted":"")}>
      <div className="flex items-start gap-2">
        <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5",done?"text-muted-foreground":color)}/>
        <div className="flex-1 min-w-0">
          <p className={cn("text-[11px] font-semibold leading-tight",done&&"line-through text-muted-foreground")}>{task.title}</p>
          {task.assignee&&<p className="text-[10px] text-muted-foreground mt-0.5">→ {task.assignee}</p>}
        </div>
        <Badge className={cn("text-[10px] h-4 px-1 shrink-0 border",pm.bg)}>{pm.label}</Badge>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/>{fmtTime(task.scheduledAt)}</span>
        {task.recurring&&<span className="text-[10px] text-muted-foreground flex items-center gap-1"><Repeat className="h-3 w-3"/>every {task.recurEveryHours}h</span>}
      </div>
      {done&&task.completedBy&&<p className="text-[10px] text-muted-foreground">✓ {task.completedBy} {task.completedAt?`at ${fmtTime(task.completedAt)}`:""}</p>}
      {!done&&(
        <div className="flex gap-1.5">
          {!isIP&&onStart&&<Button size="sm" variant="outline" className="flex-1 h-6 text-[10px] gap-1" onClick={onStart}><Play className="h-3 w-3"/>Start</Button>}
          {onComplete&&<Button size="sm" className={cn("flex-1 h-6 text-[10px] gap-1",urgent?"bg-red-600 hover:bg-red-700":"")} onClick={onComplete}><Check className="h-3 w-3"/>Done</Button>}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Stethoscope,
  Activity,
  ArrowRight,
  UserCheck,
  Pill,
  CheckCheck,
  Users,
  Trash2,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useRole } from "@/contexts/RoleContext";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import { useToast } from "@/hooks/use-toast";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { useEncounter } from "@/contexts/EncounterContext";
import { cn } from "@/lib/utils";
import type { WorkflowStepId } from "@/config/workflow";
import type { EncounterStatus } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/contexts/NotificationContext";
import { loadStoredAppointments, subscribeToAppointments, isToday, isoToTimeLabel } from "@/lib/appointmentStore";
import { getPatients, clearAllData, generateMockPatients } from "@/lib/patientStore";
import { useAccount } from "@/contexts/AccountContext";
import { getAccountScopedKey } from "@/lib/accountStore";
import { getHospChannelName } from "@/lib/hospitalizationStore";

// ─── Seed appointment data (removed as requested) ──────────────
const SEED_APPOINTMENTS: any[] = [];

type DashAppt = { id: string; patient: string; owner: string; time: string; type: string; patientId: string };

function buildDashAppointments(): DashAppt[] {
  const stored = loadStoredAppointments().filter(s => isToday(s.date));
  const merged: DashAppt[] = [];
  stored.forEach(s => {
    merged.push({
      id:        s.id,
      patient:   s.petName,
      owner:     s.ownerName,
      time:      isoToTimeLabel(s.date, s.time),
      type:      s.type,
      patientId: s.patientId,
    });
  });
  return merged;
}

// ─── Step config ──────────────────────────────────────────────────────────────
const STEP_CONFIG: Record<WorkflowStepId, { label: string; color: string; icon: React.ElementType; route: string }> = {
  REGISTERED:   { label: "Checked In",   color: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border border-slate-300",      icon: UserCheck,   route: "/" },
  TRIAGE:       { label: "Triage",       color: "text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 border border-amber-400",       icon: Stethoscope, route: "/triage" },
  CONSULTATION: { label: "Consultation", color: "text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-300 border border-blue-400",            icon: Activity,    route: "/records" },
  PHARMACY:     { label: "Pharmacy",     color: "text-purple-700 bg-purple-100 dark:bg-purple-950 dark:text-purple-300 border border-purple-400",  icon: Pill,        route: "/inventory" },
  COMPLETED:    { label: "Completed",    color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400", icon: CheckCheck, route: "/" },
};

// ─── Encounter status highlighted badge config ────────────────────────────────
const ENC_STATUS_CONFIG: Record<EncounterStatus, { label: string; cls: string; pulse?: boolean }> = {
  WAITING:         { label: "Awaiting Triage",    cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-400 font-semibold",   pulse: false },
  IN_TRIAGE:       { label: "Triage in Progress", cls: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200 border border-orange-400 font-semibold", pulse: true  },
  TRIAGED:         { label: "Triage Complete",    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-500 font-semibold" },
  IN_CONSULTATION: { label: "In Consultation",    cls: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-500 font-semibold",           pulse: true  },
  IN_SURGERY:      { label: "In Surgery",         cls: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border border-red-500 font-semibold",                 pulse: true  },
  RECOVERY:        { label: "In Recovery",        cls: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border border-purple-400 font-semibold" },
  DISCHARGED:      { label: "Discharged",         cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-300" },
};

// ─── Role-specific static alerts (removed as requested) ──────────────
const ROLE_ALERTS: Record<string, { message: string; type: string; timestamp: Date }[]> = {
  Receptionist: [],
  Nurse: [],
  Vet: [],
  Pharmacist: [],
  SuperAdmin: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const walkinPatientId = new URLSearchParams(location.search).get("walkin") ?? "";
  const appointmentsCardRef = useRef<HTMLDivElement>(null);
  const { has, role } = useRole();
  const { activeAccountId } = useAccount();
  const { toast } = useToast();
  const wf = useWorkflowContext();
  const { createEncounter, getActiveEncounterForPatient, updateEncounterStatus } = useEncounter();
  const { notifications } = useNotifications();
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  // Scroll to check-in section when arriving via ?walkin=
  useEffect(() => {
    if (walkinPatientId && appointmentsCardRef.current) {
      const el = appointmentsCardRef.current;
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
    }
  }, [walkinPatientId]);

  // Live today's appointments (seed + stored), refresh on every booking
  const [allAppointments, setAllAppointments] = useState<DashAppt[]>(buildDashAppointments);
  useEffect(() => {
    const unsub = subscribeToAppointments(() => setAllAppointments(buildDashAppointments()));
    return unsub;
  }, []);

  // ── Sync: re-render on any patient action from any panel ─────────────────
  const [, forceRefresh] = useState(0);
  useEffect(() => {
    const bump = () => forceRefresh(n => n + 1);
    const channels: BroadcastChannel[] = [];
    [getHospChannelName(), "acf_workflow_updates", `acct:${activeAccountId}:acf_encounter_updates`].forEach(name => {
      try { const ch = new BroadcastChannel(name); ch.onmessage = bump; channels.push(ch); } catch {}
    });
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === getAccountScopedKey("acf_clinical_records", activeAccountId) ||
        e.key === getAccountScopedKey("acf_hospitalization_records", activeAccountId) ||
        e.key === "acf_workflow_patient_steps" ||
        e.key === "acf_patient_lifecycle_status"
      ) bump();
    };
    window.addEventListener("storage", onStorage);
    return () => { channels.forEach(c => c.close()); window.removeEventListener("storage", onStorage); };
  }, [activeAccountId]);

  const allCheckedIn = wf.getCheckedInPatients();
  const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;
  const activePatients = allCheckedIn.filter(p => {
    if (p.step === "COMPLETED") return false;
    return (Date.now() - new Date(p.checkedInAt).getTime()) < TWENTY_FOUR_H;
  });

  // Auto-clear patients checked in >24 hours ago from active state
  useEffect(() => {
    allCheckedIn.forEach(p => {
      if (p.step !== "COMPLETED" && (Date.now() - new Date(p.checkedInAt).getTime()) >= TWENTY_FOUR_H) {
        wf.clearPatientFromActive(p.patientId);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Get completed patients from process history for timeline data
  const processHistory = wf.getProcessHistory ? wf.getProcessHistory() : [];
  const todaysCompleted = processHistory.filter(p => {
    const completedDate = new Date(p.completedAt);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  });

  // Pending: not yet checked-in (receptionist/admin view)
  const pendingAppts = allAppointments.filter(a => !wf.isCheckedIn(a.patientId));

  // Nurse: checked-in patients awaiting or in triage
  const nurseTriageQueue = allCheckedIn.filter(p => {
    const enc = getActiveEncounterForPatient(p.patientId);
    return enc && ["WAITING", "IN_TRIAGE"].includes(enc.status);
  });

  const stats = {
    patientCount: getPatients().length
  };

  // Vet: triaged patients ready for consultation
  const vetConsultQueue = allCheckedIn.filter(p => {
    const enc = getActiveEncounterForPatient(p.patientId);
    return enc && enc.status === "TRIAGED";
  });

  const getEncounterStatus = (patientId: string): EncounterStatus | null =>
    getActiveEncounterForPatient(patientId)?.status ?? null;

  // ── Today's count label by role ─────────────────────────────────────────────
  const todayCount =
    role === "Nurse" ? nurseTriageQueue.length :
    role === "Vet"   ? vetConsultQueue.length  : pendingAppts.length;

  // ── Role-scoped Go-to button for Live Progress ──────────────────────────────
  // Receptionist = no button (read-only progress view)
  // Nurse        = "Go to Triage" only when patient is at TRIAGE step
  // Vet          = "Go to Consultation" only when patient is at CONSULTATION step
  // Pharmacist   = "Go to Pharmacy" only when patient is at PHARMACY step
  // SuperAdmin   = button matches current step always
  const getGoToAction = (patientStep: WorkflowStepId): { label: string; route: string } | null => {
    if (role === "Receptionist")                                  return null;
    if (role === "Nurse"      && patientStep !== "TRIAGE")       return null;
    if (role === "Vet"        && patientStep !== "CONSULTATION") return null;
    if (role === "Pharmacist" && patientStep !== "PHARMACY")     return null;
    const cfg = STEP_CONFIG[patientStep];
    return { label: `Go to ${cfg.label}`, route: cfg.route };
  };

  // ── Role-specific alerts ─────────────────────────────────────────────────────
  const roleAlerts = ROLE_ALERTS[role] ?? ROLE_ALERTS.SuperAdmin;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCheckIn = (appt: DashAppt) => {
    createEncounter(appt.patientId, {
      reason: appt.type, petName: appt.patient, ownerName: appt.owner,
      appointmentTime: appt.time, appointmentType: appt.type,
    });
    wf.checkIn(appt.patientId, {
      name: appt.patient, owner: appt.owner, time: appt.time,
      type: appt.type, checkedInAt: new Date().toISOString(),
    });
    toast({ title: "✓ Checked In", description: `${appt.patient} is now in the Triage queue.` });
  };

  const handleMarkComplete = (patientId: string, patientName: string) => {
    const enc = getActiveEncounterForPatient(patientId);
    if (enc) updateEncounterStatus(enc.id, "DISCHARGED");
    wf.setStep(patientId, "COMPLETED");
    toast({ title: "✓ Completed", description: `${patientName} has been marked as complete and removed from the queue.` });
  };

  const handleNurseTriage = (patientId: string) => {
    const enc = getActiveEncounterForPatient(patientId);
    if (enc) updateEncounterStatus(enc.id, "IN_TRIAGE");
    navigate(`/triage?patientId=${patientId}`);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {has("can_register_patients") && (
          <Button size="sm" data-tutorial="dashboard-new-patient" onClick={() => navigate("/patients/add")}>+ New Patient</Button>
        )}
      </div>

      <DashboardStats />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* LIVE PATIENT PROGRESS — TOP (primary feature)                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Card className="border-primary/30 shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
              Live Patient Progress
            </span>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground font-normal hidden sm:inline">Real-time sync</span>
              <Badge variant="outline" className="text-[10px] font-normal h-5 px-1.5">{activePatients.length} active</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          {activePatients.length === 0 ? (
            <div className="flex items-center justify-center gap-3 py-5 text-muted-foreground">
              <Users className="h-5 w-5 opacity-30" />
              <p className="text-xs">No patients in clinic yet — checked-in patients appear here.</p>
            </div>
          ) : (
            <ScrollArea className="h-[480px] pr-2 overflow-y-auto">
              <div className="space-y-1.5">
                {activePatients.map((patient, i) => {
                  const encStatus = getEncounterStatus(patient.patientId);
                  const encCfg   = encStatus ? ENC_STATUS_CONFIG[encStatus] : null;
                  const stepCfg  = STEP_CONFIG[patient.step] ?? STEP_CONFIG.TRIAGE;
                  const StepIcon = stepCfg.icon;
                  const goTo     = getGoToAction(patient.step);
                  const isLive   = encStatus === "IN_TRIAGE" || encStatus === "IN_CONSULTATION" || encStatus === "IN_SURGERY";

                  return (
                    <div key={patient.patientId}>
                      {i > 0 && <Separator className="my-1.5" />}
                      <div className={cn(
                        "rounded-lg px-3 py-2 transition-colors",
                        isLive ? "bg-primary/5" : "hover:bg-muted/40"
                      )}>
                        {/* Top row: name + badges + time + button */}
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold text-xs shrink-0">{patient.name}</p>

                          {/* Workflow step badge */}
                          <span className={cn(
                            "inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                            stepCfg.color
                          )}>
                            <StepIcon className="h-2.5 w-2.5" />
                            {stepCfg.label}
                          </span>

                          {/* Encounter status badge — highlighted */}
                          {encCfg && (
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full shrink-0",
                              encCfg.cls
                            )}>
                              {encCfg.pulse && <span className="h-1 w-1 rounded-full bg-current animate-pulse" />}
                              {encCfg.label}
                            </span>
                          )}

                          {/* Lifecycle status badge (Hospitalized/Referred/Deceased) */}
                          {(() => {
                            const lc = wf.getPatientStatus(patient.patientId);
                            if (lc === "Active") return null;
                            const lcColors = {
                              Hospitalized: "bg-orange-100 text-orange-800 border border-orange-400",
                              Referred: "bg-sky-100 text-sky-800 border border-sky-400",
                              Deceased: "bg-gray-100 text-gray-600 border border-gray-300",
                            };
                            return (
                              <span className={cn(
                                "inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold",
                                lcColors[lc as keyof typeof lcColors]
                              )}>
                                {lc}
                              </span>
                            );
                          })()}

                          <span className="text-[9px] text-muted-foreground ml-auto shrink-0">
                            {formatDistanceToNow(new Date(patient.checkedInAt), { addSuffix: true })}
                          </span>

                          {/* Role-gated Go to button */}
                          {goTo && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 text-[9px] px-1.5 gap-0.5 text-primary hover:bg-primary/10 shrink-0"
                              onClick={() => navigate(goTo.route)}
                            >
                              {goTo.label}
                              <ArrowRight className="h-2.5 w-2.5" />
                            </Button>
                          )}

                          {/* Mark as Complete — visible to SuperAdmin, Vet, Nurse */}
                          {(role === "SuperAdmin" || role === "Vet" || role === "Nurse") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 text-[9px] px-1.5 gap-0.5 text-emerald-700 hover:bg-emerald-50 shrink-0"
                              onClick={() => handleMarkComplete(patient.patientId, patient.name)}
                            >
                              <CheckCheck className="h-2.5 w-2.5" />
                              Complete
                            </Button>
                          )}
                        </div>

                        {/* Bottom row: compact progress bar */}
                        <div className="mt-1.5">
                          <WorkflowProgress patientId={patient.patientId} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Data Management + Stats row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Patients</p>
            <p className="text-2xl font-bold text-foreground">{stats.patientCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              const patients = generateMockPatients(5);
              toast({ title: "Mock data generated", description: `${patients.length} sample patients added.` });
              window.location.reload();
            }}
          >
            <Database className="h-3.5 w-3.5" />
            Generate Mock Data
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => {
              clearAllData();
              toast({ title: "Data cleared", description: "All data reset to empty state." });
              window.location.reload();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All Data
          </Button>
        </div>
      </div>

      {/* ── Today's Appointments + Alerts row ───────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Today's Appointments — content differs per role */}
        <Card ref={appointmentsCardRef} className={walkinPatientId ? "ring-2 ring-primary/50 transition-all" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {role === "Nurse"      ? "Triage Queue"
                  : role === "Vet"    ? "Ready for Consultation"
                  : "Today's Appointments"}
              </span>
              <Badge
                variant={todayCount > 0 ? "default" : "outline"}
                className="text-xs font-normal"
              >
                {todayCount} {role === "Nurse" ? "waiting" : role === "Vet" ? "ready" : "pending"}
              </Badge>
            </CardTitle>
            {walkinPatientId && role !== "Nurse" && role !== "Vet" && (
              <div className="mt-1 flex items-center gap-2 rounded-md bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs text-primary font-medium">
                <UserCheck className="h-3.5 w-3.5 shrink-0" />
                Walk-in patient added — click <strong>Check-in</strong> below to proceed
              </div>
            )}
          </CardHeader>
          <CardContent>
            {todayCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <CheckCircle2 className="h-8 w-8 text-primary/30" />
                <p className="text-sm font-medium">
                  {role === "Nurse" ? "No patients waiting for triage"
                    : role === "Vet" ? "No patients ready for consultation"
                    : "All patients checked in"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">

                {/* ── RECEPTIONIST / SUPERADMIN: unchecked-in appointments ── */}
                {role !== "Nurse" && role !== "Vet" && pendingAppts.map(appt => (
                  <div key={appt.id}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg transition-colors",
                      walkinPatientId && appt.patientId === walkinPatientId
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                        : "border-border hover:bg-muted/40"
                    )}>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{appt.patient}</p>
                      <p className="text-xs text-muted-foreground">{appt.owner}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-medium">{appt.time}</p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{appt.type}</Badge>
                      </div>
                      {has("can_register_patients") && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleCheckIn(appt)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />Check-in
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* ── NURSE: checked-in patients awaiting/in triage ── */}
                {role === "Nurse" && nurseTriageQueue.map(p => {
                  const enc    = getActiveEncounterForPatient(p.patientId);
                  const encCfg = enc ? ENC_STATUS_CONFIG[enc.status] : null;
                  return (
                    <div key={p.patientId}
                      className="flex items-center justify-between p-3 border border-amber-200 dark:border-amber-900 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.owner}</p>
                        {encCfg && (
                          <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full mt-1", encCfg.cls)}>
                            {encCfg.pulse && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
                            {encCfg.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-medium">{p.time}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.type}</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                          onClick={() => handleNurseTriage(p.patientId)}
                        >
                          <Stethoscope className="h-3 w-3 mr-1" />Triage
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* ── VET: triaged patients ready for consultation ── */}
                {role === "Vet" && vetConsultQueue.map(p => {
                  const enc    = getActiveEncounterForPatient(p.patientId);
                  const encCfg = enc ? ENC_STATUS_CONFIG[enc.status] : null;
                  return (
                    <div key={p.patientId}
                      className="flex items-center justify-between p-3 border border-emerald-200 dark:border-emerald-900 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.owner}</p>
                        {encCfg && (
                          <span className={cn("inline-flex items-center text-[10px] px-2 py-0.5 rounded-full mt-1", encCfg.cls)}>
                            {encCfg.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-xs font-medium hidden sm:block">{p.time}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-blue-400 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                          onClick={() => navigate(`/records/new?patientId=${p.patientId}&petName=${encodeURIComponent(p.name)}&owner=${encodeURIComponent(p.owner)}&draft=true`)}
                        >
                          <Activity className="h-3 w-3 mr-1" />Consult
                        </Button>
                      </div>
                    </div>
                  );
                })}

              </div>
            )}
            <Button variant="outline" className="w-full mt-3 h-8 text-xs" onClick={() => navigate("/appointments")}>
              View All Appointments
            </Button>
          </CardContent>
        </Card>

        {/* Role-specific Alerts & Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Alerts & Notifications
              </span>
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {notifications.filter(n => !n.read).length} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Live workflow notifications (from NotificationContext — synced cross-tab) */}
              {notifications.slice(0, 2).map(n => (
                <div key={n.id}
                  className={cn("p-3 rounded-lg border-l-4 text-xs", {
                    "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20": n.type === "success",
                    "border-primary bg-primary/10":    n.type === "info",
                    "border-warning bg-warning/10":    n.type === "warning",
                    "border-destructive bg-destructive/10": n.type === "critical",
                  })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("flex-1", !n.read && "font-semibold")}>{n.message}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
              {/* Role-specific static alerts (fill remaining slots) */}
              {roleAlerts.slice(0, Math.max(1, 3 - notifications.slice(0, 2).length)).map((alert, i) => (
                <div key={`ra-${i}`}
                  className={cn("p-3 rounded-lg border-l-4 text-xs", {
                    "border-destructive bg-destructive/10": alert.type === "critical",
                    "border-warning bg-warning/10":         alert.type === "warning",
                    "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20": alert.type === "success",
                    "border-primary bg-primary/10":         alert.type === "info",
                  })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1">{alert.message}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-3 h-8 text-xs" onClick={() => setIsAlertsModalOpen(true)}>
              View All Alerts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Completed Today ──────────────────────────────────────────────────── */}
      {todaysCompleted.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <CheckCheck className="h-4 w-4 text-emerald-600" />
                Completed Today ({todaysCompleted.length})
              </span>
              <Badge className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-normal hover:bg-emerald-100">
                Total: {todaysCompleted.reduce((acc, p) => acc + p.durationMinutes, 0)} min
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {todaysCompleted.map(p => (
                <div key={p.patientId}
                  className="flex items-center gap-3 p-3 border border-emerald-200 dark:border-emerald-900 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
                  <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{p.petName}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.owner}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                        {Math.floor(p.durationMinutes / 60)}h {p.durationMinutes % 60}m
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {p.finalStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Alerts Modal */}
      <Dialog open={isAlertsModalOpen} onOpenChange={setIsAlertsModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4" />
              All Alerts & Notifications
            </DialogTitle>
            <DialogDescription>Role-specific alerts and live workflow notifications</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-2">
              {notifications.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Live Workflow Notifications</p>
                  {notifications.map(n => (
                    <div key={n.id}
                      className={cn("p-3 rounded-lg border-l-4 mb-1", {
                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20": n.type === "success",
                        "border-primary bg-primary/10":    n.type === "info",
                        "border-warning bg-warning/10":    n.type === "warning",
                        "border-destructive bg-destructive/10": n.type === "critical",
                      })}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-xs flex-1", !n.read && "font-semibold")}>{n.message}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      {n.step && <Badge variant="outline" className="text-[9px] mt-1 px-1.5 py-0 h-3.5">{n.step}</Badge>}
                    </div>
                  ))}
                </>
              )}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-2">System Alerts for {role}</p>
              {roleAlerts.map((alert, i) => (
                <div key={`modal-ra-${i}`}
                  className={cn("p-3 rounded-lg border-l-4", {
                    "border-destructive bg-destructive/10": alert.type === "critical",
                    "border-warning bg-warning/10":         alert.type === "warning",
                    "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20": alert.type === "success",
                    "border-primary bg-primary/10":         alert.type === "info",
                  })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs flex-1">{alert.message}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;

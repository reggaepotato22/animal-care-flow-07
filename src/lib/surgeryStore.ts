// Surgery Store — localStorage + BroadcastChannel sync
// State machine: SCHEDULED → PRE_OP → INDUCTION → INTRA_OP → POST_OP → COMPLETED

import { getAccountScopedKey, getActiveAccountId } from "@/lib/accountStore";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SurgeryStatus =
  | "SCHEDULED"
  | "PRE_OP"
  | "INDUCTION"
  | "INTRA_OP"
  | "POST_OP"
  | "COMPLETED"
  | "CANCELLED";

export type SurgeryTaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "SKIPPED";

export interface PreOpChecklist {
  consentObtained: boolean;
  fastingConfirmed: boolean;
  preOpVitalsDone: boolean;
  labResultsReviewed: boolean;
  ivPlaced: boolean;
  surgicalSitePrepped: boolean;
  anesthesiaEquipmentChecked: boolean;
  instrumentsVerified: boolean;
  allergyConfirmed: boolean;
  patientIdVerified: boolean;
  notes?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface SurgeryTask {
  id: string;
  surgeryId: string;
  phase: SurgeryStatus;
  title: string;
  description?: string;
  assignedTo?: string;
  status: SurgeryTaskStatus;
  required: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface SurgeryVitals {
  id: string;
  surgeryId: string;
  timestamp: string;
  recordedBy: string;
  heartRate?: string;
  respiratoryRate?: string;
  temperature?: string;
  spo2?: string;
  bloodPressure?: string;
  anesthesiaDepth?: "light" | "adequate" | "deep";
  notes?: string;
}

export type ProcedureStepType =
  | "incision" | "suturing" | "medication" | "instrument" | "finding" | "custom";

export interface ProcedureStep {
  id: string;
  surgeryId: string;
  timestamp: string;
  by: string;
  description: string;
  type: ProcedureStepType;
}

export interface AnesthesiaEntry {
  id: string;
  surgeryId: string;
  timestamp: string;
  by: string;
  agent: string;
  dose: string;
  route: string;
  notes?: string;
}

export interface SurgeryNote {
  id: string;
  surgeryId: string;
  type: "pre_op" | "intra_op" | "post_op" | "anesthesia" | "general";
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface SurgeryEvent {
  id: string;
  surgeryId: string;
  timestamp: string;
  actor: string;
  type:
    | "phase_change"
    | "task_completed"
    | "vitals"
    | "medication"
    | "procedure_step"
    | "note"
    | "incident"
    | "anesthesia"
    | "admission";
  title: string;
  detail?: string;
  linkedId?: string;
}

export interface SurgeryRecord {
  id: string;
  patientId: string;
  patientName: string;
  petName: string;
  species: string;
  hospRecordId?: string;
  encounterId?: string;
  surgeryType: string;
  status: SurgeryStatus;
  scheduledTime?: string;
  startTime?: string;
  endTime?: string;
  surgeon: string;
  anesthetist?: string;
  assistant?: string;
  priority: "elective" | "urgent" | "emergency";
  ward?: string;
  operatingRoom?: string;
  notes?: string;
  allergies?: string[];
  isAggressive?: boolean;
  preOpChecklist?: PreOpChecklist;
  tasks?: SurgeryTask[];
  vitalsLog?: SurgeryVitals[];
  procedureSteps?: ProcedureStep[];
  anesthesiaLog?: AnesthesiaEntry[];
  surgeryNotes?: SurgeryNote[];
  eventLog?: SurgeryEvent[];
  phaseHistory?: { phase: SurgeryStatus; timestamp: string; by?: string }[];
  createdAt: string;
  updatedAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SX_KEY_BASE   = "acf_surgery_records";
const SX_CH_BASE    = "acf_surgery_channel";
const SX_EVT_BASE   = "acf_surgery_updated";

function sxKey()      { return getAccountScopedKey(SX_KEY_BASE); }
function sxEvtName()  { return getAccountScopedKey(SX_EVT_BASE); }
function sxChannel()  { const id = getActiveAccountId(); return `acct:${id}:${SX_CH_BASE}`; }

export function getSurgeryChannelName() { return sxChannel(); }
export function getSurgeryEventName()   { return sxEvtName(); }

// ── State machine metadata ─────────────────────────────────────────────────────

export const SURGERY_PHASES: SurgeryStatus[] = [
  "SCHEDULED", "PRE_OP", "INDUCTION", "INTRA_OP", "POST_OP", "COMPLETED",
];

export const PHASE_META: Record<SurgeryStatus, {
  label: string; shortLabel: string; badge: string; description: string;
}> = {
  SCHEDULED:  { label: "Scheduled",  shortLabel: "Sched.",    badge: "bg-gray-100 text-gray-700 border-gray-300",        description: "Surgery scheduled, awaiting pre-op" },
  PRE_OP:     { label: "Pre-Op",     shortLabel: "Pre-Op",    badge: "bg-amber-100 text-amber-800 border-amber-300",      description: "Pre-operative preparation and checklist" },
  INDUCTION:  { label: "Induction",  shortLabel: "Induct.",   badge: "bg-orange-100 text-orange-800 border-orange-300",   description: "Anesthesia induction and monitoring" },
  INTRA_OP:   { label: "Intra-Op",   shortLabel: "Intra-Op",  badge: "bg-red-100 text-red-800 border-red-300",            description: "Surgical procedure in progress" },
  POST_OP:    { label: "Post-Op",    shortLabel: "Post-Op",   badge: "bg-purple-100 text-purple-800 border-purple-300",   description: "Post-operative recovery and monitoring" },
  COMPLETED:  { label: "Completed",  shortLabel: "Done",      badge: "bg-green-100 text-green-800 border-green-300",      description: "Surgery completed successfully" },
  CANCELLED:  { label: "Cancelled",  shortLabel: "Cancelled", badge: "bg-gray-100 text-gray-500 border-gray-300",         description: "Surgery cancelled" },
};

// ── Default task templates per phase ──────────────────────────────────────────

export function generateDefaultTasks(surgeryId: string, surgeryType: string): SurgeryTask[] {
  let idx = 0;
  const make = (
    phase: SurgeryStatus,
    title: string,
    required = true,
    description?: string,
  ): SurgeryTask => ({
    id: `sxtask-${Date.now()}-${++idx}`,
    surgeryId,
    phase,
    title,
    description,
    status: "TODO",
    required,
  });

  return [
    // PRE_OP
    make("PRE_OP", "Verify patient identity and signed consent form"),
    make("PRE_OP", "Confirm fasting status (min. 6h food, 2h water)"),
    make("PRE_OP", "Review pre-op blood work and lab results"),
    make("PRE_OP", "Complete pre-op physical exam and baseline vitals"),
    make("PRE_OP", "Establish IV access"),
    make("PRE_OP", "Administer pre-medication / sedation"),
    make("PRE_OP", "Clip and aseptically prep surgical site"),
    make("PRE_OP", "Verify surgical instruments, packs, and equipment"),
    make("PRE_OP", "Surgeon briefing and team time-out"),
    // INDUCTION
    make("INDUCTION", "Administer induction agent"),
    make("INDUCTION", "Verify adequate anesthesia depth"),
    make("INDUCTION", "Place and secure endotracheal tube"),
    make("INDUCTION", "Connect to anesthesia machine and patient monitor"),
    make("INDUCTION", "Record baseline vitals (HR, RR, Temp, SpO₂)"),
    // INTRA_OP
    make("INTRA_OP", "Final surgical site draping"),
    make("INTRA_OP", `Record incision time — ${surgeryType}`),
    make("INTRA_OP", "Monitor vitals every 5 minutes", true, "Log HR, RR, Temp, SpO₂"),
    make("INTRA_OP", `Perform procedure: ${surgeryType}`),
    make("INTRA_OP", "Administer intra-op analgesics / medications", false),
    make("INTRA_OP", "Final instrument and sponge count"),
    make("INTRA_OP", "Close incision / suturing"),
    make("INTRA_OP", "Apply wound dressing"),
    // POST_OP
    make("POST_OP", "Transfer patient to recovery area"),
    make("POST_OP", "Extubate when appropriate"),
    make("POST_OP", "Monitor vitals every 15 minutes", true, "Check HR, RR, Temp, pain score"),
    make("POST_OP", "Assess and document pain score"),
    make("POST_OP", "Administer post-op analgesics"),
    make("POST_OP", "Check surgical site for bleeding or discharge"),
    make("POST_OP", "Complete post-operative surgical notes"),
    make("POST_OP", "Brief owner / update hospitalization record"),
  ];
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function loadSurgeries(): SurgeryRecord[] {
  try { const r = localStorage.getItem(sxKey()); return r ? JSON.parse(r) : []; } catch { return []; }
}

export function saveSurgery(rec: SurgeryRecord): void {
  try {
    const all = loadSurgeries();
    const i = all.findIndex(r => r.id === rec.id);
    if (i >= 0) all[i] = rec; else all.unshift(rec);
    localStorage.setItem(sxKey(), JSON.stringify(all));
  } catch {}
}

export function getSurgery(id: string): SurgeryRecord | null {
  return loadSurgeries().find(r => r.id === id) ?? null;
}

export function patchSurgery(id: string, patch: Partial<SurgeryRecord>): SurgeryRecord | null {
  const all = loadSurgeries();
  const i = all.findIndex(r => r.id === id);
  if (i < 0) return null;
  all[i] = { ...all[i], ...patch, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(sxKey(), JSON.stringify(all)); } catch {}
  broadcastSurgeryUpdate();
  return all[i];
}

export function createSurgery(data: Omit<SurgeryRecord, "id"|"tasks"|"vitalsLog"|"procedureSteps"|"anesthesiaLog"|"surgeryNotes"|"eventLog"|"phaseHistory"|"createdAt"|"updatedAt">): SurgeryRecord {
  const id = `SX-${Date.now()}`;
  const now = new Date().toISOString();
  const rec: SurgeryRecord = {
    ...data,
    id,
    tasks: generateDefaultTasks(id, data.surgeryType),
    vitalsLog: [],
    procedureSteps: [],
    anesthesiaLog: [],
    surgeryNotes: [],
    phaseHistory: [{ phase: data.status, timestamp: now, by: data.surgeon }],
    eventLog: [{
      id: `sxevt-${Date.now()}`,
      surgeryId: id,
      timestamp: now,
      actor: data.surgeon,
      type: "admission",
      title: `Surgery scheduled: ${data.surgeryType}`,
      detail: `Priority: ${data.priority}${data.scheduledTime ? ` · Scheduled: ${data.scheduledTime}` : ""}`,
    }],
    createdAt: now,
    updatedAt: now,
  };
  saveSurgery(rec);
  broadcastSurgeryUpdate();
  return rec;
}

// ── Pub/sub ────────────────────────────────────────────────────────────────────

export function broadcastSurgeryUpdate(): void {
  window.dispatchEvent(new CustomEvent(sxEvtName()));
  try { const ch = new BroadcastChannel(sxChannel()); ch.postMessage({ type: sxEvtName() }); ch.close(); } catch {}
}

export function subscribeToSurgery(cb: () => void): () => void {
  const onEvt = () => cb();
  const name = sxEvtName();
  window.addEventListener(name, onEvt);
  let ch: BroadcastChannel | null = null;
  try { ch = new BroadcastChannel(sxChannel()); ch.onmessage = () => cb(); } catch {}
  return () => { window.removeEventListener(name, onEvt); ch?.close(); };
}

// ── Phase transition ──────────────────────────────────────────────────────────

export function advanceSurgeryPhase(
  surgeryId: string,
  newPhase: SurgeryStatus,
  by: string,
): SurgeryRecord | null {
  const rec = getSurgery(surgeryId);
  if (!rec) return null;
  const now = new Date().toISOString();
  const event: SurgeryEvent = {
    id: `sxevt-${Date.now()}`,
    surgeryId,
    timestamp: now,
    actor: by,
    type: "phase_change",
    title: `Advanced to ${PHASE_META[newPhase].label}`,
  };
  return patchSurgery(surgeryId, {
    status: newPhase,
    startTime: newPhase === "INTRA_OP" && !rec.startTime ? now : rec.startTime,
    endTime:   newPhase === "COMPLETED" ? now : rec.endTime,
    phaseHistory: [...(rec.phaseHistory ?? []), { phase: newPhase, timestamp: now, by }],
    eventLog:  [...(rec.eventLog  ?? []), event],
  });
}

// ── Phase gating ──────────────────────────────────────────────────────────────
// Returns blocker messages. Empty array = can advance.
export function getPhaseBlockers(rec: SurgeryRecord): string[] {
  const blockers: string[] = [];
  const tasks = rec.tasks ?? [];
  const requiredForPhase = (ph: SurgeryStatus) =>
    tasks.filter(t => t.phase === ph && t.required && t.status !== "DONE" && t.status !== "SKIPPED");

  switch (rec.status) {
    case "SCHEDULED":
      break;
    case "PRE_OP": {
      const inc = requiredForPhase("PRE_OP");
      if (inc.length) blockers.push(`${inc.length} required Pre-Op task${inc.length>1?"s":""} not completed`);
      const cl = rec.preOpChecklist;
      if (!cl) { blockers.push("Pre-op safety checklist not filled in"); break; }
      const clItems: (keyof PreOpChecklist)[] = [
        "consentObtained","fastingConfirmed","preOpVitalsDone","labResultsReviewed",
        "ivPlaced","surgicalSitePrepped","anesthesiaEquipmentChecked",
        "instrumentsVerified","allergyConfirmed","patientIdVerified",
      ];
      const missing = clItems.filter(k => !cl[k]);
      if (missing.length) blockers.push(`${missing.length} checklist item${missing.length>1?"s":""} unchecked`);
      break;
    }
    case "INDUCTION": {
      const inc = requiredForPhase("INDUCTION");
      if (inc.length) blockers.push(`${inc.length} required Induction task${inc.length>1?"s":""} not completed`);
      break;
    }
    case "INTRA_OP": {
      const inc = requiredForPhase("INTRA_OP");
      if (inc.length) blockers.push(`${inc.length} required Intra-Op task${inc.length>1?"s":""} not completed`);
      break;
    }
    case "POST_OP": {
      const inc = requiredForPhase("POST_OP");
      if (inc.length) blockers.push(`${inc.length} required Post-Op task${inc.length>1?"s":""} not completed`);
      if (!(rec.surgeryNotes ?? []).some(n => n.type === "post_op"))
        blockers.push("Post-operative note required");
      break;
    }
    default:
      break;
  }
  return blockers;
}

// ── Tasks ──────────────────────────────────────────────────────────────────────

export function completeSurgeryTask(
  surgeryId: string, taskId: string, by: string, notes?: string,
): SurgeryRecord | null {
  const rec = getSurgery(surgeryId);
  if (!rec) return null;
  const task = (rec.tasks ?? []).find(t => t.id === taskId);
  const tasks = (rec.tasks ?? []).map(t =>
    t.id === taskId
      ? { ...t, status: "DONE" as SurgeryTaskStatus, completedAt: new Date().toISOString(), completedBy: by, notes: notes ?? t.notes }
      : t
  );
  const event: SurgeryEvent = {
    id: `sxevt-${Date.now()}`, surgeryId, timestamp: new Date().toISOString(),
    actor: by, type: "task_completed",
    title: `${task?.title ?? "Task"} completed`, detail: notes, linkedId: taskId,
  };
  return patchSurgery(surgeryId, { tasks, eventLog: [...(rec.eventLog ?? []), event] });
}

export function updateSurgeryTask(surgeryId: string, taskId: string, update: Partial<SurgeryTask>): void {
  const rec = getSurgery(surgeryId);
  if (!rec) return;
  patchSurgery(surgeryId, { tasks: (rec.tasks ?? []).map(t => t.id === taskId ? { ...t, ...update } : t) });
}

// ── Vitals ─────────────────────────────────────────────────────────────────────

export function addSurgeryVitals(surgeryId: string, entry: SurgeryVitals): void {
  const rec = getSurgery(surgeryId);
  if (!rec) return;
  const event: SurgeryEvent = {
    id: `sxevt-${Date.now()}`, surgeryId, timestamp: entry.timestamp,
    actor: entry.recordedBy, type: "vitals",
    title: "Vitals recorded",
    detail: [
      entry.heartRate       && `HR: ${entry.heartRate} bpm`,
      entry.respiratoryRate && `RR: ${entry.respiratoryRate} rpm`,
      entry.temperature     && `Temp: ${entry.temperature}°C`,
      entry.spo2            && `SpO₂: ${entry.spo2}%`,
      entry.bloodPressure   && `BP: ${entry.bloodPressure}`,
    ].filter(Boolean).join("  "),
    linkedId: entry.id,
  };
  patchSurgery(surgeryId, {
    vitalsLog: [...(rec.vitalsLog ?? []), entry],
    eventLog:  [...(rec.eventLog  ?? []), event],
  });
}

// ── Procedure steps ────────────────────────────────────────────────────────────

export function addProcedureStep(surgeryId: string, step: ProcedureStep): void {
  const rec = getSurgery(surgeryId);
  if (!rec) return;
  const event: SurgeryEvent = {
    id: `sxevt-${Date.now()}`, surgeryId, timestamp: step.timestamp,
    actor: step.by, type: "procedure_step",
    title: step.description, linkedId: step.id,
  };
  patchSurgery(surgeryId, {
    procedureSteps: [...(rec.procedureSteps ?? []), step],
    eventLog:       [...(rec.eventLog       ?? []), event],
  });
}

// ── Anesthesia log ─────────────────────────────────────────────────────────────

export function addAnesthesiaEntry(surgeryId: string, entry: AnesthesiaEntry): void {
  const rec = getSurgery(surgeryId);
  if (!rec) return;
  const event: SurgeryEvent = {
    id: `sxevt-${Date.now()}`, surgeryId, timestamp: entry.timestamp,
    actor: entry.by, type: "anesthesia",
    title: `${entry.agent} ${entry.dose} (${entry.route})`,
    detail: entry.notes, linkedId: entry.id,
  };
  patchSurgery(surgeryId, {
    anesthesiaLog: [...(rec.anesthesiaLog ?? []), entry],
    eventLog:      [...(rec.eventLog      ?? []), event],
  });
}

// ── Surgery notes ──────────────────────────────────────────────────────────────

export function addSurgeryNote(surgeryId: string, note: SurgeryNote): void {
  const rec = getSurgery(surgeryId);
  if (!rec) return;
  const event: SurgeryEvent = {
    id: `sxevt-${Date.now()}`, surgeryId, timestamp: note.createdAt,
    actor: note.author, type: "note",
    title: `${note.type.replace(/_/g, " ")} note`,
    detail: note.title, linkedId: note.id,
  };
  patchSurgery(surgeryId, {
    surgeryNotes: [note, ...(rec.surgeryNotes ?? [])],
    eventLog:     [...(rec.eventLog ?? []), event],
  });
}

// ── Checklist ──────────────────────────────────────────────────────────────────

export function updatePreOpChecklist(surgeryId: string, checklist: PreOpChecklist): void {
  patchSurgery(surgeryId, { preOpChecklist: checklist });
}

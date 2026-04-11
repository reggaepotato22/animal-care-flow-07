// Shared hospitalization store — localStorage + BroadcastChannel sync
// All stage changes write here; clinical records and notifications are
// automatically dispatched on every status transition.

import { getAccountScopedKey, getActiveAccountId } from "@/lib/accountStore";
import { upsertClinicalRecord, broadcastClinicalRecordUpdate } from "@/lib/clinicalRecordStore";

export type SurgeryStage =
  | "AWAITING_SURGERY"
  | "PREP_FOR_SURGERY"
  | "IN_SURGERY"
  | "POST_SURGERY_RECOVERY"
  | "IN_WARD"
  | "DISCHARGED";

export type HospStatus = "admitted" | "critical" | "discharged" | "surgery_prep" | "in_surgery" | "recovery" | "in_ward";

export interface WellnessCheck {
  id: string;
  timestamp: string;
  recordedBy: string;
  shift: "morning" | "afternoon" | "night";
  foodIntake: "none" | "partial" | "full";
  waterIntake: "none" | "reduced" | "normal" | "increased";
  stoolOutput: "none" | "soft" | "normal" | "diarrhea" | "bloody";
  urineOutput: "none" | "reduced" | "normal" | "increased";
  behavior: "normal" | "lethargic" | "agitated" | "restless";
  notes?: string;
}

export interface ProgressNote {
  id: string;
  date: string;
  time: string;
  veterinarian: string;
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  weight?: string;
  painScore: number;
  assessment: string;
  plan: string;
  modifications: string[];
  nextReview: string;
  condition: "improving" | "stable" | "declining";
}

export interface HospRecord {
  id: string;
  patientId: string;
  patientName: string;
  petName: string;
  species: string;
  admissionDate: string;
  admissionTime: string;
  reason: string;
  attendingVet: string;
  ward: string;
  status: HospStatus;
  surgeryStage?: SurgeryStage;
  daysStay: number;
  notes?: string;
  priority?: "routine" | "urgent" | "emergency";
  stageHistory?: { stage: string; timestamp: string; by?: string; note?: string }[];
  feedingSchedule?: FeedingEntry[];
  wellnessChecks?: WellnessCheck[];
  progressNotes?: ProgressNote[];
  /** Kennel/cage ID assigned at admission */
  kennelId?: string;
  /** Pre-operative flags */
  preOpSedation?: boolean;
  preOpFasting?: boolean;
  /** Payment status — used for discharge hard-lock */
  paymentStatus?: "pending" | "paid" | "pre_authorized";
  createdAt: string;
  updatedAt: string;
  // ── Workspace fields ──────────────────────────────────────────────────────
  workspaceStatus?: HospWorkspaceStatus;
  allergies?: string[];
  isAggressive?: boolean;
  criticalAlerts?: string[];
  tasks?: HospTask[];
  vitalsLog?: VitalsEntry[];
  eventLog?: HospEvent[];
  flowsheet?: FlowsheetRow[];
  carePlan?: HospCarePlan;
  hospNotes?: HospNote[];
}

export interface FeedingEntry {
  id: string;
  time: string;
  foodType: string;
  amount: string;
  givenBy?: string;
  notes?: string;
  completed: boolean;
  completedAt?: string;
}

const HOSP_STORAGE_KEY_BASE = "acf_hospitalization_records";
const HOSP_CHANNEL_BASE = "acf_hospitalization_channel";
const HOSP_EVENT_BASE = "acf_hospitalization_updated";

function hospKey() {
  return getAccountScopedKey(HOSP_STORAGE_KEY_BASE);
}

function hospEventName() {
  return getAccountScopedKey(HOSP_EVENT_BASE);
}

function hospChannelName() {
  const id = getActiveAccountId();
  return `acct:${id}:${HOSP_CHANNEL_BASE}`;
}

export function getHospChannelName(): string {
  return hospChannelName();
}

export function getHospEventName(): string {
  return hospEventName();
}

export const SURGERY_STAGE_LABELS: Record<SurgeryStage, { label: string; color: string; description: string }> = {
  AWAITING_SURGERY:      { label: "Awaiting Surgery",      color: "bg-yellow-100 text-yellow-800 border-yellow-300",  description: "Patient scheduled and awaiting surgery" },
  PREP_FOR_SURGERY:      { label: "Prep for Surgery",      color: "bg-orange-100 text-orange-800 border-orange-300",  description: "Pre-operative preparation in progress" },
  IN_SURGERY:            { label: "In Surgery",            color: "bg-red-100 text-red-800 border-red-300",           description: "Surgical procedure currently ongoing" },
  POST_SURGERY_RECOVERY: { label: "Post-Surgery Recovery", color: "bg-purple-100 text-purple-800 border-purple-300",  description: "Recovering in surgery recovery suite" },
  IN_WARD:               { label: "In Ward",               color: "bg-blue-100 text-blue-800 border-blue-300",        description: "Stable, monitoring in general ward" },
  DISCHARGED:            { label: "Discharged",            color: "bg-green-100 text-green-800 border-green-300",     description: "Patient discharged from hospital" },
};

export const SURGERY_STAGE_ORDER: SurgeryStage[] = [
  "AWAITING_SURGERY",
  "PREP_FOR_SURGERY",
  "IN_SURGERY",
  "POST_SURGERY_RECOVERY",
  "IN_WARD",
  "DISCHARGED",
];

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function loadHospRecords(): HospRecord[] {
  try {
    const raw = localStorage.getItem(hospKey());
    return raw ? (JSON.parse(raw) as HospRecord[]) : [];
  } catch { return []; }
}

export function saveHospRecord(rec: HospRecord): void {
  try {
    const all = loadHospRecords();
    const idx = all.findIndex(r => r.id === rec.id);
    if (idx >= 0) all[idx] = rec;
    else all.unshift(rec);
    localStorage.setItem(hospKey(), JSON.stringify(all));
  } catch {}
}

// ── Stage transition ──────────────────────────────────────────────────────────

export function advanceSurgeryStage(
  recordId: string,
  newStage: SurgeryStage,
  by?: string,
  note?: string
): HospRecord | null {
  const all = loadHospRecords();
  const idx = all.findIndex(r => r.id === recordId);
  if (idx < 0) return null;

  const rec = { ...all[idx] };
  rec.surgeryStage = newStage;
  rec.updatedAt    = new Date().toISOString();

  // Map surgery stage → overall status
  const stageToStatus: Record<SurgeryStage, HospStatus> = {
    AWAITING_SURGERY:      "admitted",
    PREP_FOR_SURGERY:      "surgery_prep",
    IN_SURGERY:            "in_surgery",
    POST_SURGERY_RECOVERY: "recovery",
    IN_WARD:               "in_ward",
    DISCHARGED:            "discharged",
  };
  rec.status = stageToStatus[newStage];

  // Append to stage history
  if (!rec.stageHistory) rec.stageHistory = [];
  rec.stageHistory.push({
    stage:     newStage,
    timestamp: new Date().toISOString(),
    by,
    note,
  });

  all[idx] = rec;
  try { localStorage.setItem(hospKey(), JSON.stringify(all)); } catch {}

  // Sync to clinical records
  syncToClinicalRecords(rec, newStage, by, note);

  // Fire notification
  dispatchHospNotification(rec, newStage);

  return rec;
}

// ── Clinical records sync ─────────────────────────────────────────────────────

function syncToClinicalRecords(
  rec: HospRecord,
  stage: SurgeryStage,
  by?: string,
  note?: string
): void {
  try {
    const entryId = `hosp-${rec.id}-${Date.now()}`;
    upsertClinicalRecord({
      id:          entryId,
      encounterId: entryId,
      patientId:   rec.patientId,
      petName:     rec.petName,
      ownerName:   rec.patientName,
      status:      stage,
      savedAt:     new Date().toISOString(),
      veterinarian: by ?? rec.attendingVet,
      data: {
        type:  "hospitalization",
        label: SURGERY_STAGE_LABELS[stage].label,
        note:  note ?? SURGERY_STAGE_LABELS[stage].description,
        hospitalRecordId: rec.id,
      },
    });
    broadcastClinicalRecordUpdate();
  } catch {}
}

// ── Notifications ─────────────────────────────────────────────────────────────

function dispatchHospNotification(rec: HospRecord, stage: SurgeryStage): void {
  const cfg = SURGERY_STAGE_LABELS[stage];
  const isUrgent = stage === "IN_SURGERY" || stage === "PREP_FOR_SURGERY";
  window.dispatchEvent(new CustomEvent("acf:notification", {
    detail: {
      type:        isUrgent ? "warning" : "info",
      message:     `${rec.petName} — ${cfg.label}`,
      patientId:   rec.patientId,
      patientName: rec.petName,
      targetRoles: ["SuperAdmin", "Receptionist", "Vet", "Nurse", "Pharmacist"],
    },
  }));
  try {
    const ch = new BroadcastChannel(hospChannelName());
    ch.postMessage({ type: hospEventName(), recordId: rec.id, stage });
    ch.close();
  } catch {}
}

// ── Wellness checks ───────────────────────────────────────────────────────────

export function addWellnessCheck(recordId: string, check: WellnessCheck): void {
  const all = loadHospRecords();
  const idx = all.findIndex(r => r.id === recordId);
  if (idx < 0) return;
  if (!all[idx].wellnessChecks) all[idx].wellnessChecks = [];
  all[idx].wellnessChecks!.push(check);
  all[idx].updatedAt = new Date().toISOString();
  try { localStorage.setItem(hospKey(), JSON.stringify(all)); } catch {}
  broadcastHospUpdate();
  // Notify attendant-role notification
  const rec = all[idx];
  window.dispatchEvent(new CustomEvent("acf:notification", {
    detail: {
      type: "info",
      message: `Wellness check logged for ${rec.petName} — ${check.shift} shift`,
      patientId: rec.patientId,
      patientName: rec.petName,
      targetRoles: ["Vet", "SuperAdmin"],
    },
  }));
}

// ── Progress notes (persisted) ────────────────────────────────────────────────

export function addProgressNote(recordId: string, note: ProgressNote): void {
  const all = loadHospRecords();
  const idx = all.findIndex(r => r.id === recordId);
  if (idx < 0) return;
  if (!all[idx].progressNotes) all[idx].progressNotes = [];
  all[idx].progressNotes!.unshift(note);
  all[idx].updatedAt = new Date().toISOString();
  try { localStorage.setItem(hospKey(), JSON.stringify(all)); } catch {}
  broadcastHospUpdate();
  // Notify attendant that vet has completed daily progress note
  const rec = all[idx];
  window.dispatchEvent(new CustomEvent("acf:notification", {
    detail: {
      type: "success",
      message: `Progress note added for ${rec.petName} by ${note.veterinarian} — ${note.condition} (Temp: ${note.temperature})`,
      patientId: rec.patientId,
      patientName: rec.petName,
      targetRoles: ["Nurse", "SuperAdmin", "Receptionist"],
    },
  }));
}

/** Returns true if a progress note was submitted today for this record */
export function hasTodayProgressNote(recordId: string): boolean {
  const rec = loadHospRecords().find(r => r.id === recordId);
  if (!rec?.progressNotes?.length) return false;
  const today = new Date().toISOString().slice(0, 10);
  return rec.progressNotes.some(n => n.date === today);
}

// ── Payment / discharge ───────────────────────────────────────────────────────

export function updatePaymentStatus(
  recordId: string,
  status: "pending" | "paid" | "pre_authorized",
  by?: string
): HospRecord | null {
  const all = loadHospRecords();
  const idx = all.findIndex(r => r.id === recordId);
  if (idx < 0) return null;
  all[idx].paymentStatus = status;
  all[idx].updatedAt = new Date().toISOString();
  try { localStorage.setItem(hospKey(), JSON.stringify(all)); } catch {}
  broadcastHospUpdate();
  const rec = all[idx];
  if (status === "paid" || status === "pre_authorized") {
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: "success",
        message: `Payment ${status === "paid" ? "confirmed" : "pre-authorized"} for ${rec.petName} — discharge unlocked`,
        patientId: rec.patientId,
        patientName: rec.petName,
        targetRoles: ["Receptionist", "SuperAdmin"],
      },
    }));
  }
  return all[idx];
}

// ── Feeding schedule helpers ──────────────────────────────────────────────────

export function addFeedingEntry(recordId: string, entry: FeedingEntry): void {
  const all = loadHospRecords();
  const idx = all.findIndex(r => r.id === recordId);
  if (idx < 0) return;
  if (!all[idx].feedingSchedule) all[idx].feedingSchedule = [];
  all[idx].feedingSchedule!.push(entry);
  all[idx].updatedAt = new Date().toISOString();
  try { localStorage.setItem(hospKey(), JSON.stringify(all)); } catch {}
}

export function completeFeedingEntry(recordId: string, entryId: string): void {
  const all = loadHospRecords();
  const idx = all.findIndex(r => r.id === recordId);
  if (idx < 0) return;
  const schedule = all[idx].feedingSchedule ?? [];
  const eIdx = schedule.findIndex(e => e.id === entryId);
  if (eIdx >= 0) {
    schedule[eIdx] = { ...schedule[eIdx], completed: true, completedAt: new Date().toISOString() };
    all[idx].feedingSchedule = schedule;
    all[idx].updatedAt       = new Date().toISOString();
  }
  // Dispatch feeding reminder notification
  const rec = all[idx];
  const entry = schedule[eIdx];
  if (entry) {
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type:        "info",
        message:     `Feeding completed for ${rec.petName} — ${entry.foodType} at ${entry.time}`,
        patientId:   rec.patientId,
        patientName: rec.petName,
        targetRoles: ["SuperAdmin", "Nurse", "Vet"],
      },
    }));
  }
  try { localStorage.setItem(hospKey(), JSON.stringify(all)); } catch {}
  broadcastHospUpdate();
}

// ── Subscribe ─────────────────────────────────────────────────────────────────

export function broadcastHospUpdate(): void {
  window.dispatchEvent(new CustomEvent(hospEventName()));
  try {
    const ch = new BroadcastChannel(hospChannelName());
    ch.postMessage({ type: hospEventName() });
    ch.close();
  } catch {}
}

export function subscribeToHospitalization(cb: () => void): () => void {
  const onEvent = () => cb();
  const eventName = hospEventName();
  window.addEventListener(eventName, onEvent);
  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(hospChannelName());
    ch.onmessage = () => cb();
  } catch {}
  return () => {
    window.removeEventListener(eventName, onEvent);
    ch?.close();
  };
}

// ── Role label helper ─────────────────────────────────────────────────────────

const ROLE_LABEL_KEY = "acf_role_labels";
export function getRoleLabel(role: string): string {
  try {
    const raw = localStorage.getItem(ROLE_LABEL_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, string>;
      if (map[role]) return map[role];
    }
  } catch {}
  return role;
}
// ── Workspace Types ───────────────────────────────────────────────────────────

export type HospWorkspaceStatus =
  | "ADMITTED" | "ACTIVE" | "CRITICAL" | "READY_FOR_DISCHARGE" | "DISCHARGED";

export type HospTaskStatus   = "TODO" | "IN_PROGRESS" | "DONE";
export type HospTaskType     = "medication" | "monitoring" | "procedure" | "feeding" | "custom";
export type HospTaskPriority = "low" | "normal" | "high" | "urgent";

export interface HospTask {
  id: string;
  hospId: string;
  type: HospTaskType;
  title: string;
  scheduledAt: string;
  status: HospTaskStatus;
  assignee?: string;
  priority: HospTaskPriority;
  executionNotes?: string;
  completedAt?: string;
  completedBy?: string;
  recurring?: boolean;
  recurEveryHours?: number;
  recurDurationDays?: number;
}

export interface VitalsEntry {
  id: string;
  hospId: string;
  timestamp: string;
  recordedBy: string;
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  weight?: string;
  painScore?: number;
  notes?: string;
}

export interface HospEvent {
  id: string;
  hospId: string;
  timestamp: string;
  actor: string;
  actorRole?: string;
  type:
    | "vitals" | "task_completed" | "task_started"
    | "medication" | "note" | "incident"
    | "status_change" | "order" | "admission" | "feeding";
  title: string;
  detail?: string;
  linkedId?: string;
}

export interface FlowsheetRow {
  id: string;
  hospId: string;
  timestamp: string;
  temperature: string;
  heartRate: string;
  respiratoryRate: string;
  weight: string;
  notes: string;
  recordedBy: string;
}

export interface HospCarePlan {
  goals: string;
  instructions: string;
  dietaryRestrictions: string;
  activityLevel: string;
  monitoringFrequency: string;
  updatedAt: string;
  updatedBy: string;
}

export interface HospNote {
  id: string;
  hospId: string;
  type: "soap" | "progress" | "procedure" | "general";
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

// ── Workspace CRUD ─────────────────────────────────────────────────────────────

export function getHospRecord(id: string): HospRecord | null {
  return loadHospRecords().find(r => r.id === id) ?? null;
}

export function patchHospRecord(id: string, patch: Partial<HospRecord>): HospRecord | null {
  const all = loadHospRecords();
  const idx = all.findIndex(r => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(hospKey(), JSON.stringify(all)); } catch {}
  broadcastHospUpdate();
  return all[idx];
}

// ── Tasks ──────────────────────────────────────────────────────────────────────

export function addHospTask(hospId: string, task: HospTask): void {
  const rec = getHospRecord(hospId);
  if (!rec) return;
  patchHospRecord(hospId, { tasks: [...(rec.tasks ?? []), task] });
}

export function updateHospTask(hospId: string, taskId: string, updates: Partial<HospTask>): void {
  const rec = getHospRecord(hospId);
  if (!rec) return;
  const tasks = (rec.tasks ?? []).map(t => t.id === taskId ? { ...t, ...updates } : t);
  patchHospRecord(hospId, { tasks });
}

export function completeHospTask(
  hospId: string, taskId: string, by: string, notes?: string
): HospRecord | null {
  const rec = getHospRecord(hospId);
  if (!rec) return null;
  const task = (rec.tasks ?? []).find(t => t.id === taskId);
  const tasks = (rec.tasks ?? []).map(t =>
    t.id === taskId
      ? { ...t, status: "DONE" as HospTaskStatus, completedAt: new Date().toISOString(), completedBy: by, executionNotes: notes ?? t.executionNotes }
      : t
  );
  const event: HospEvent = {
    id: `evt-${Date.now()}`,
    hospId,
    timestamp: new Date().toISOString(),
    actor: by,
    type: task?.type === "medication" ? "medication" : "task_completed",
    title: `${task?.title ?? "Task"} completed`,
    detail: notes,
    linkedId: taskId,
  };
  // If recurring, generate next occurrence
  const nextTasks: HospTask[] = [];
  if (task?.recurring && task.recurEveryHours) {
    const nextAt = new Date(new Date().getTime() + task.recurEveryHours * 3_600_000);
    nextTasks.push({
      ...task,
      id: `task-${Date.now()}-next`,
      status: "TODO",
      completedAt: undefined,
      completedBy: undefined,
      executionNotes: undefined,
      scheduledAt: nextAt.toISOString(),
      parentTaskId: taskId,
    });
  }
  return patchHospRecord(hospId, { tasks: [...tasks, ...nextTasks], eventLog: [...(rec.eventLog ?? []), event] });
}

// ── Vitals ─────────────────────────────────────────────────────────────────────

export function addVitalsEntry(hospId: string, entry: VitalsEntry): void {
  const rec = getHospRecord(hospId);
  if (!rec) return;
  const event: HospEvent = {
    id: `evt-${Date.now()}`,
    hospId,
    timestamp: entry.timestamp,
    actor: entry.recordedBy,
    type: "vitals",
    title: "Vitals recorded",
    detail: [
      entry.temperature && `Temp: ${entry.temperature}°C`,
      entry.heartRate   && `HR: ${entry.heartRate} bpm`,
      entry.respiratoryRate && `RR: ${entry.respiratoryRate} rpm`,
      entry.weight      && `Wt: ${entry.weight} kg`,
    ].filter(Boolean).join("  "),
    linkedId: entry.id,
  };
  patchHospRecord(hospId, {
    vitalsLog: [...(rec.vitalsLog ?? []), entry],
    eventLog:  [...(rec.eventLog  ?? []), event],
  });
}

// ── Flowsheet ─────────────────────────────────────────────────────────────────

export function addFlowsheetRow(hospId: string, row: FlowsheetRow): void {
  const rec = getHospRecord(hospId);
  if (!rec) return;
  patchHospRecord(hospId, { flowsheet: [...(rec.flowsheet ?? []), row] });
}

// ── Care Plan ─────────────────────────────────────────────────────────────────

export function updateCarePlan(hospId: string, plan: HospCarePlan): void {
  const rec = getHospRecord(hospId);
  if (!rec) return;
  const event: HospEvent = {
    id: `evt-${Date.now()}`,
    hospId,
    timestamp: plan.updatedAt,
    actor: plan.updatedBy,
    type: "order",
    title: "Care plan updated",
  };
  patchHospRecord(hospId, { carePlan: plan, eventLog: [...(rec.eventLog ?? []), event] });
}

// ── Hosp Notes ────────────────────────────────────────────────────────────────

export function addHospNote(hospId: string, note: HospNote): void {
  const rec = getHospRecord(hospId);
  if (!rec) return;
  const event: HospEvent = {
    id: `evt-${Date.now()}`,
    hospId,
    timestamp: note.createdAt,
    actor: note.author,
    type: "note",
    title: `${note.type.charAt(0).toUpperCase() + note.type.slice(1)} note added`,
    detail: note.title,
    linkedId: note.id,
  };
  patchHospRecord(hospId, {
    hospNotes: [note, ...(rec.hospNotes ?? [])],
    eventLog: [...(rec.eventLog ?? []), event],
  });
}

// ── Workspace Status ──────────────────────────────────────────────────────────

export function updateHospWorkspaceStatus(
  hospId: string, status: HospWorkspaceStatus, by?: string
): void {
  const rec = getHospRecord(hospId);
  if (!rec) return;
  const event: HospEvent = {
    id: `evt-${Date.now()}`,
    hospId,
    timestamp: new Date().toISOString(),
    actor: by ?? "System",
    type: "status_change",
    title: `Status changed to ${status.replace(/_/g, " ")}`,
  };
  patchHospRecord(hospId, { workspaceStatus: status, eventLog: [...(rec.eventLog ?? []), event] });
}

export const WORKSPACE_STATUS_META: Record<HospWorkspaceStatus, { label: string; color: string }> = {
  ADMITTED:            { label: "Admitted",          color: "bg-blue-100 text-blue-800 border-blue-300" },
  ACTIVE:              { label: "Active",             color: "bg-green-100 text-green-800 border-green-300" },
  CRITICAL:            { label: "Critical",           color: "bg-red-100 text-red-800 border-red-300" },
  READY_FOR_DISCHARGE: { label: "Ready to Discharge", color: "bg-amber-100 text-amber-800 border-amber-300" },
  DISCHARGED:          { label: "Discharged",         color: "bg-gray-100 text-gray-600 border-gray-300" },
};

export function saveRoleLabels(map: Record<string, string>): void {
  try { localStorage.setItem(ROLE_LABEL_KEY, JSON.stringify(map)); } catch {}
}
export function loadRoleLabels(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ROLE_LABEL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

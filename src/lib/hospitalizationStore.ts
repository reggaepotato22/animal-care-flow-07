// Shared hospitalization store — localStorage + BroadcastChannel sync
// All stage changes write here; clinical records and notifications are
// automatically dispatched on every status transition.

import { getAccountScopedKey, getActiveAccountId } from "@/lib/accountStore";

export type SurgeryStage =
  | "AWAITING_SURGERY"
  | "PREP_FOR_SURGERY"
  | "IN_SURGERY"
  | "POST_SURGERY_RECOVERY"
  | "IN_WARD"
  | "DISCHARGED";

export type HospStatus = "admitted" | "critical" | "discharged" | "surgery_prep" | "in_surgery" | "recovery" | "in_ward";

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
  createdAt: string;
  updatedAt: string;
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
    const savedKey = "acf_clinical_records";
    const existing: unknown[] = JSON.parse(localStorage.getItem(savedKey) ?? "[]");
    const entry = {
      id:          `hosp-${rec.id}-${Date.now()}`,
      patientId:   rec.patientId,
      petName:     rec.petName,
      ownerName:   rec.patientName,
      type:        "hospitalization",
      status:      stage,
      label:       SURGERY_STAGE_LABELS[stage].label,
      note:        note ?? SURGERY_STAGE_LABELS[stage].description,
      by:          by ?? rec.attendingVet,
      savedAt:     new Date().toISOString(),
      hospitalRecordId: rec.id,
    };
    localStorage.setItem(savedKey, JSON.stringify([entry, ...existing]));
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
export function saveRoleLabels(map: Record<string, string>): void {
  try { localStorage.setItem(ROLE_LABEL_KEY, JSON.stringify(map)); } catch {}
}
export function loadRoleLabels(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ROLE_LABEL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

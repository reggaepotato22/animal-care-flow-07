import { getAccountScopedKey, getActiveAccountId } from "@/lib/accountStore";

export interface SavedClinicalRecord {
  id: string;
  encounterId: string;
  patientId: string;
  petName?: string;
  ownerName?: string;
  ownerEmail?: string;
  veterinarian?: string;
  status?: string;
  savedAt: string;
  data: Record<string, unknown>;
}

const RECORDS_KEY_BASE = "acf_clinical_records";
const CHANNEL_BASE = "acf_clinical_records_channel";
const EVENT_BASE = "acf_clinical_records_updated";

function recordsKey() {
  return getAccountScopedKey(RECORDS_KEY_BASE);
}

function eventName() {
  return getAccountScopedKey(EVENT_BASE);
}

function channelName() {
  const id = getActiveAccountId();
  return `acct:${id}:${CHANNEL_BASE}`;
}

export function loadClinicalRecords(): SavedClinicalRecord[] {
  try {
    const raw = localStorage.getItem(recordsKey());
    return raw ? (JSON.parse(raw) as SavedClinicalRecord[]) : [];
  } catch {
    return [];
  }
}

export function upsertClinicalRecord(input: Omit<SavedClinicalRecord, "id"> & { id?: string }): SavedClinicalRecord {
  const id = input.id ?? input.encounterId;
  const rec: SavedClinicalRecord = { ...input, id };
  try {
    const all = loadClinicalRecords();
    const idx = all.findIndex(r => r.id === id);
    if (idx >= 0) all[idx] = rec;
    else all.unshift(rec);
    localStorage.setItem(recordsKey(), JSON.stringify(all));
  } catch {}
  return rec;
}

export function getClinicalRecordById(id: string): SavedClinicalRecord | null {
  return loadClinicalRecords().find(r => r.id === id || r.encounterId === id) ?? null;
}

export function broadcastClinicalRecordUpdate() {
  window.dispatchEvent(new CustomEvent(eventName()));
  try {
    const ch = new BroadcastChannel(channelName());
    ch.postMessage({ type: eventName() });
    ch.close();
  } catch {}
}

export function subscribeToClinicalRecords(cb: () => void): () => void {
  const ev = eventName();
  const onEvent = () => cb();
  window.addEventListener(ev, onEvent);
  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(channelName());
    ch.onmessage = (e) => {
      if (e.data?.type === ev) cb();
    };
  } catch {}
  const onStorage = (e: StorageEvent) => {
    if (e.key === recordsKey()) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(ev, onEvent);
    window.removeEventListener("storage", onStorage);
    try { ch?.close(); } catch {}
  };
}

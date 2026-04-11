export interface ParkedPatient {
  patientId: string;
  patientName: string;
  species?: string;
  encounterId?: string;
  returnPath: string;
  parkedAt: string;
  draftNote?: string;
  tentativeFindings?: number;
  pendingLabs?: number;
  draftLabel?: string;
}

const KEY = "acf_parked_patients";

export function getParkedPatients(): ParkedPatient[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function parkPatient(data: Omit<ParkedPatient, "parkedAt">): void {
  const existing = getParkedPatients().filter(
    (p) => p.patientId !== data.patientId
  );
  const updated = [
    { ...data, parkedAt: new Date().toISOString() },
    ...existing,
  ].slice(0, 8);
  localStorage.setItem(KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("acf:parked-patients-changed"));
}

export function unparkPatient(patientId: string): void {
  const updated = getParkedPatients().filter((p) => p.patientId !== patientId);
  localStorage.setItem(KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("acf:parked-patients-changed"));
}

export function updateParkedDraft(patientId: string, draftNote: string): void {
  const updated = getParkedPatients().map((p) =>
    p.patientId === patientId ? { ...p, draftNote } : p
  );
  localStorage.setItem(KEY, JSON.stringify(updated));
}

export function isPatientParked(patientId: string): boolean {
  return getParkedPatients().some((p) => p.patientId === patientId);
}

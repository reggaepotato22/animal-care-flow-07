// Shared appointment persistence + cross-tab sync
// All appointment booking flows write here; dashboards & lists read from here.

export interface StoredAppointment {
  id: string;
  petName: string;
  ownerName: string;
  ownerId?: string;
  ownerPhone: string;
  ownerEmail: string;
  date: string;        // ISO date string
  time: string;
  type: string;
  vet: string;
  notes?: string;
  reason?: string;
  examRoom?: string;
  location?: string;
  status: "SCHEDULED" | "CONFIRMED" | "CHECKED_IN" | "NO_SHOW" | "CANCELLED";
  patientId: string;   // used as workflow/encounter ID
  duration: number;    // minutes, default 30
  createdAt: string;   // ISO
}

export const APT_STORAGE_KEY = "acf_appointments";
export const APT_CHANNEL     = "acf_appointments_channel";
export const APT_EVENT       = "acf_appointments_updated";

export type AppointmentResource = {
  id: string;
  name: string;
  type: "doctor" | "exam-room" | "resource";
  color: string;
};

export const DEMO_APPOINTMENT_RESOURCES: AppointmentResource[] = [
  { id: "dr-johnson", name: "Dr. Sarah Johnson", type: "doctor", color: "#3b82f6" },
  { id: "dr-smith", name: "Dr. Michael Smith", type: "doctor", color: "#10b981" },
  { id: "dr-wilson", name: "Dr. Emily Wilson", type: "doctor", color: "#8b5cf6" },
  { id: "exam-room-1", name: "Exam Room 1", type: "exam-room", color: "#f59e0b" },
  { id: "exam-room-2", name: "Exam Room 2", type: "exam-room", color: "#ef4444" },
  { id: "surgery-suite", name: "Surgery Suite", type: "resource", color: "#ec4899" },
];

// ── Read ──────────────────────────────────────────────────────────────────────

export function loadStoredAppointments(): StoredAppointment[] {
  try {
    const raw = localStorage.getItem(APT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredAppointment[];
  } catch {
    return [];
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function saveAppointment(appt: StoredAppointment): void {
  try {
    const existing = loadStoredAppointments();
    const idx = existing.findIndex(a => a.id === appt.id);
    if (idx >= 0) {
      existing[idx] = appt;
    } else {
      existing.push(appt);
    }
    localStorage.setItem(APT_STORAGE_KEY, JSON.stringify(existing));
  } catch {}
}

export function saveAppointments(appts: StoredAppointment[]): void {
  try {
    localStorage.setItem(APT_STORAGE_KEY, JSON.stringify(appts));
  } catch {}
}

export function updateAppointmentStatus(
  id: string,
  status: StoredAppointment["status"]
): void {
  const existing = loadStoredAppointments();
  const idx = existing.findIndex(a => a.id === id);
  if (idx < 0) return;
  existing[idx] = { ...existing[idx], status };
  try {
    localStorage.setItem(APT_STORAGE_KEY, JSON.stringify(existing));
  } catch {}
}

// ── Broadcast (same-tab + cross-tab) ─────────────────────────────────────────

let _channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel {
  if (!_channel) _channel = new BroadcastChannel(APT_CHANNEL);
  return _channel;
}

export function broadcastAppointmentUpdate(): void {
  // Same-tab listeners
  window.dispatchEvent(new CustomEvent(APT_EVENT));
  // Cross-tab listeners
  try {
    getChannel().postMessage({ type: APT_EVENT });
  } catch {}
}

/** Call this in a component to subscribe to appointment changes */
export function subscribeToAppointments(cb: () => void): () => void {
  const onEvent = () => cb();
  window.addEventListener(APT_EVENT, onEvent);

  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(APT_CHANNEL);
    ch.onmessage = () => cb();
  } catch {}

  return () => {
    window.removeEventListener(APT_EVENT, onEvent);
    ch?.close();
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Update an existing appointment (for Edit functionality) */
export function updateAppointment(
  id: string,
  updates: Partial<Omit<StoredAppointment, "id" | "createdAt">>
): StoredAppointment | null {
  try {
    const existing = loadStoredAppointments();
    const idx = existing.findIndex(a => a.id === id);
    if (idx < 0) return null;
    const updated = { ...existing[idx], ...updates, updatedAt: new Date().toISOString() };
    existing[idx] = updated;
    localStorage.setItem(APT_STORAGE_KEY, JSON.stringify(existing));
    return updated;
  } catch {
    return null;
  }
}

/** Cancel/delete an appointment */
export function deleteAppointment(id: string): boolean {
  try {
    const existing = loadStoredAppointments();
    const filtered = existing.filter(a => a.id !== id);
    if (filtered.length === existing.length) return false;
    localStorage.setItem(APT_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/** ISO date string → "HH:MM AM/PM" style label used in dashboard */
export function isoToTimeLabel(isoDate: string, time: string): string {
  // time is already "09:00" format — convert to "9:00 AM"
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Returns true if the appointment is scheduled for today */
export function isToday(isoDate: string): boolean {
  const apptDate = new Date(isoDate);
  const now = new Date();
  return (
    apptDate.getFullYear() === now.getFullYear() &&
    apptDate.getMonth()    === now.getMonth()    &&
    apptDate.getDate()     === now.getDate()
  );
}

export function createDemoAppointments(patientId: string): StoredAppointment[] {
  const today = new Date().toISOString().split("T")[0];
  return [
    {
      id: "appt-1",
      petName: "Max",
      ownerName: "Sarah Johnson",
      ownerId: "C-DEMO-001",
      ownerPhone: "555-0101",
      ownerEmail: "sarah@example.com",
      date: today,
      time: "09:00",
      type: "Checkup",
      vet: "dr-smith",
      status: "SCHEDULED",
      patientId,
      duration: 30,
      createdAt: new Date().toISOString(),
    },
  ];
}

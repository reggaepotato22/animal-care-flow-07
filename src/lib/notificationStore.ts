// ═══════════════════════════════════════════════════════════════════════════
// notificationStore.ts — Role-targeted, persisted notification system
// ═══════════════════════════════════════════════════════════════════════════
import { EVENTS, type RealtimeEvent } from "./realtimeEngine";

export interface NotificationItem {
  id: string;
  eventType: string;
  title: string;
  body: string;
  targetRoles: string[];
  read: boolean;
  timestamp: string;
  patientName?: string;
  invoiceId?: string;
}

const NOTIF_KEY  = "acf_notifications";
const MAX_NOTIFS = 100;

// ─── Role Routing Map ─────────────────────────────────────────────────────────
// "Nurse" covers Attendant role (mapped to Nurse in RBAC)
export const EVENT_ROUTING: Record<string, string[]> = {
  [EVENTS.PATIENT_ADMITTED]:        ["Vet", "Nurse"],
  [EVENTS.PATIENT_DISCHARGED]:      ["Receptionist", "Pharmacist"],
  [EVENTS.LAB_READY]:               ["Vet"],
  [EVENTS.VITALS_UPDATED]:          ["Vet", "SuperAdmin"],
  [EVENTS.RX_DISPENSED]:            ["Vet", "SuperAdmin"],
  [EVENTS.BILLING_LOCKED]:          ["SuperAdmin", "Receptionist"],
  [EVENTS.FEEDING_DUE]:             ["Nurse"],
  [EVENTS.WELLNESS_CHECK]:          ["Nurse", "SuperAdmin"],
  [EVENTS.APPOINTMENT_CONFIRMED]:   ["Receptionist", "SuperAdmin"],
};

// ─── Event → Notification text ────────────────────────────────────────────────
function toText(event: RealtimeEvent): { title: string; body: string } {
  const p = event.payload as Record<string, string>;
  switch (event.type) {
    case EVENTS.PATIENT_ADMITTED:
      return {
        title: "Patient Admitted",
        body: `${p.patientName || "A patient"} has been admitted${p.ward ? ` to ${p.ward}` : ""}.`,
      };
    case EVENTS.PATIENT_DISCHARGED:
      return {
        title: "Patient Discharged",
        body: `${p.patientName || "A patient"} has been discharged. Ready for billing.`,
      };
    case EVENTS.LAB_READY:
      return {
        title: "Lab Results Ready",
        body: `Results for ${p.patientName || "a patient"} are ready for review.`,
      };
    case EVENTS.VITALS_UPDATED:
      return {
        title: "Vitals Recorded",
        body: `${p.patientName || "A patient"}'s vitals recorded by ${event.actorName}.`,
      };
    case EVENTS.RX_DISPENSED:
      return {
        title: "Prescription Dispensed",
        body: `${p.medication || "Medication"} dispensed for ${p.patientName || "a patient"}.`,
      };
    case EVENTS.BILLING_LOCKED:
      return {
        title: "Invoice Finalised",
        body: `Invoice for ${p.patientName || "a patient"} paid — ${p.amount || "see billing"}.`,
      };
    case EVENTS.FEEDING_DUE:
      return {
        title: "Feeding Due",
        body: `${p.patientName || "A patient"} is due for feeding${p.ward ? ` in ${p.ward}` : ""}.`,
      };
    case EVENTS.WELLNESS_CHECK:
      return {
        title: "Wellness Check",
        body: `Scheduled wellness check for ${p.patientName || "a patient"}.`,
      };
    case EVENTS.APPOINTMENT_CONFIRMED:
      return {
        title: "Appointment Confirmed",
        body: `Appointment confirmed for ${p.ownerName || "a client"}'s ${p.patientName || "pet"}.`,
      };
    default:
      return {
        title: String(event.type).replace(/_/g, " "),
        body: event.actorName ? `Action by ${event.actorName}` : "New event",
      };
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export function getNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotifications(items: NotificationItem[]): void {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(items)); } catch {}
}

export function getNotificationsForRole(role: string): NotificationItem[] {
  return getNotifications().filter(n => n.targetRoles.includes(role));
}

export function pushFromEvent(event: RealtimeEvent): void {
  const targetRoles = EVENT_ROUTING[event.type];
  if (!targetRoles || targetRoles.length === 0) return;

  // Deduplicate — same event id should not be stored twice
  const existing = getNotifications();
  const notifId  = `n-${event.id}`;
  if (existing.some(n => n.id === notifId)) return;

  const { title, body } = toText(event);
  const item: NotificationItem = {
    id:          notifId,
    eventType:   event.type,
    title,
    body,
    targetRoles,
    read:        false,
    timestamp:   event.timestamp,
    patientName: (event.payload as Record<string, string>).patientName,
    invoiceId:   (event.payload as Record<string, string>).invoiceId,
  };
  saveNotifications([item, ...existing].slice(0, MAX_NOTIFS));
}

export function markRead(id: string): void {
  saveNotifications(getNotifications().map(n => n.id === id ? { ...n, read: true } : n));
}

export function markAllRead(role: string): void {
  saveNotifications(getNotifications().map(n =>
    n.targetRoles.includes(role) ? { ...n, read: true } : n
  ));
}

export function clearNotifications(): void {
  try { localStorage.removeItem(NOTIF_KEY); } catch {}
}

export type ActivityType =
  | "login"
  | "login_failed"
  | "token_validated"
  | "token_invalid"
  | "logout"
  | "patient_added"
  | "patient_updated"
  | "appointment_booked"
  | "triage_completed"
  | "consultation_started"
  | "consultation_completed"
  | "prescription_created"
  | "invoice_created"
  | "payment_received"
  | "inventory_updated"
  | "drug_dispensed"
  | "report_generated"
  | "system";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  email?: string;
  tokenCode?: string;
  tokenPlan?: string;
  clinicName?: string;
  timestamp: string;
  ip?: string;
}

const ACTIVITY_KEY = "acf_activity_log";
const MAX_EVENTS = 200;

export function logActivity(event: Omit<ActivityEvent, "id" | "timestamp">): void {
  try {
    const all = loadAllActivities();
    const newEvent: ActivityEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEvent, ...all].slice(0, MAX_EVENTS);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
    // Broadcast to other tabs
    window.dispatchEvent(new CustomEvent("acf:activity", { detail: newEvent }));
  } catch {}
}

export function loadAllActivities(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? (JSON.parse(raw) as ActivityEvent[]) : [];
  } catch { return []; }
}

export function clearActivities(): void {
  localStorage.removeItem(ACTIVITY_KEY);
}

// Icon + colour mapping used in AdminDashboard
export const ACTIVITY_META: Record<ActivityType, { label: string; color: string; bg: string }> = {
  login:                  { label: "Sign In",              color: "text-emerald-700",  bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  login_failed:           { label: "Sign In Failed",       color: "text-red-700",      bg: "bg-red-100 dark:bg-red-900/30" },
  token_validated:        { label: "Token Accepted",       color: "text-primary",      bg: "bg-primary/10" },
  token_invalid:          { label: "Invalid Token",        color: "text-red-700",      bg: "bg-red-100 dark:bg-red-900/30" },
  logout:                 { label: "Sign Out",             color: "text-muted-foreground", bg: "bg-muted" },
  patient_added:          { label: "Patient Added",        color: "text-sky-700",      bg: "bg-sky-100 dark:bg-sky-900/30" },
  patient_updated:        { label: "Patient Updated",      color: "text-sky-700",      bg: "bg-sky-100 dark:bg-sky-900/30" },
  appointment_booked:     { label: "Appointment Booked",   color: "text-indigo-700",   bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  triage_completed:       { label: "Triage Completed",     color: "text-amber-700",    bg: "bg-amber-100 dark:bg-amber-900/30" },
  consultation_started:   { label: "Consultation Started", color: "text-blue-700",     bg: "bg-blue-100 dark:bg-blue-900/30" },
  consultation_completed: { label: "Consultation Done",    color: "text-blue-700",     bg: "bg-blue-100 dark:bg-blue-900/30" },
  prescription_created:   { label: "Prescription",        color: "text-purple-700",   bg: "bg-purple-100 dark:bg-purple-900/30" },
  invoice_created:        { label: "Invoice Created",      color: "text-orange-700",   bg: "bg-orange-100 dark:bg-orange-900/30" },
  payment_received:       { label: "Payment Received",     color: "text-emerald-700",  bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  inventory_updated:      { label: "Inventory Update",     color: "text-teal-700",     bg: "bg-teal-100 dark:bg-teal-900/30" },
  drug_dispensed:         { label: "Drug Dispensed",       color: "text-purple-700",   bg: "bg-purple-100 dark:bg-purple-900/30" },
  report_generated:       { label: "Report Generated",     color: "text-slate-700",    bg: "bg-slate-100 dark:bg-slate-900/30" },
  system:                 { label: "System",               color: "text-slate-600",    bg: "bg-muted" },
};

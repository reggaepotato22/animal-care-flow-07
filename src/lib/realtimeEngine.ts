// ═══════════════════════════════════════════════════════════════════════════
// realtimeEngine.ts — Real-time multi-tab sync via BroadcastChannel + localStorage
// ═══════════════════════════════════════════════════════════════════════════

export interface RealtimeEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  actorRole: string;
  actorName: string;
  clinicId: string;
  timestamp: string;
}

type EventHandler = (event: RealtimeEvent) => void;

const CHANNEL_NAME = "vetcare-realtime";
const STORAGE_KEY = "acf_live_feed";

// ─── Event Types ────────────────────────────────────────────────────────────
export const EVENTS = {
  // Clinical
  PATIENT_ADMITTED: "PATIENT_ADMITTED",
  VITALS_UPDATED: "VITALS_UPDATED",
  TRIAGE_COMPLETED: "TRIAGE_COMPLETED",
  SOAP_CREATED: "SOAP_CREATED",
  RX_LINKED: "RX_LINKED",
  RX_DISPENSED: "RX_DISPENSED",
  DISCHARGE_READY: "DISCHARGE_READY",
  WELLNESS_CHECK: "WELLNESS_CHECK",
  FEEDING_DUE: "FEEDING_DUE",
  
  // Financial
  INVOICE_CREATED: "INVOICE_CREATED",
  BILLING_LOCKED: "BILLING_LOCKED",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  
  // Inventory
  STOCK_LOW: "STOCK_LOW",
  STOCK_OUT: "STOCK_OUT",
  DRUG_EXPIRING: "DRUG_EXPIRING",
  
  // System
  APPOINTMENT_BOOKED: "APPOINTMENT_BOOKED",
  EMERGENCY_ALERT: "EMERGENCY_ALERT",
  BROADCAST: "BROADCAST",
} as const;

// ─── In-memory subscribers ──────────────────────────────────────────────────
const subscribers = new Set<EventHandler>();

// ─── BroadcastChannel setup ───────────────────────────────────────────────────
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (e) => {
        if (e.data?.type) {
          handleEvent(e.data as RealtimeEvent);
        }
      };
    } catch {
      // BroadcastChannel not supported
    }
  }
  return channel;
}

// ─── Event handling ─────────────────────────────────────────────────────────
function handleEvent(event: RealtimeEvent) {
  // Store in live feed
  storeEvent(event);
  
  // Notify local subscribers
  subscribers.forEach((handler) => {
    try {
      handler(event);
    } catch (err) {
      console.error("Realtime subscriber error:", err);
    }
  });
}

function storeEvent(event: RealtimeEvent) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLiveFeed();
    const updated = [event, ...existing].slice(0, 100); // Keep last 100
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full or unavailable
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function broadcast(event: Omit<RealtimeEvent, "id">): void {
  const fullEvent: RealtimeEvent = {
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  
  // Broadcast to other tabs
  const ch = getChannel();
  if (ch) {
    ch.postMessage(fullEvent);
  }
  
  // Handle locally
  handleEvent(fullEvent);
}

export function subscribe(handler: EventHandler): () => void {
  subscribers.add(handler);
  return () => subscribers.delete(handler);
}

export function getLiveFeed(): RealtimeEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RealtimeEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearLiveFeed(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Specialized broadcast helpers ───────────────────────────────────────────

export function broadcastTreatmentsUpdate() {
  broadcast({
    type: EVENTS.RX_LINKED,
    payload: { message: "Treatments updated" },
    actorRole: "System",
    actorName: "Treatment Store",
    clinicId: "system",
    timestamp: new Date().toISOString(),
  });
}

export function broadcastHospUpdate() {
  broadcast({
    type: EVENTS.WELLNESS_CHECK,
    payload: { message: "Hospitalization updated" },
    actorRole: "System",
    actorName: "Hospitalization Store",
    clinicId: "system",
    timestamp: new Date().toISOString(),
  });
}

export function broadcastClinicalRecordUpdate() {
  broadcast({
    type: EVENTS.SOAP_CREATED,
    payload: { message: "Clinical record updated" },
    actorRole: "System",
    actorName: "Clinical Record Store",
    clinicId: "system",
    timestamp: new Date().toISOString(),
  });
}

// Cleanup on hot reload (dev only)
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (channel) {
      channel.close();
    }
  });
}

export default {
  broadcast,
  subscribe,
  getLiveFeed,
  clearLiveFeed,
  EVENTS,
};

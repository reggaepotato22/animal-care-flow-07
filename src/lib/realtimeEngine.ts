// ═══════════════════════════════════════════════════════════════════════════
// realtimeEngine.ts — BroadcastChannel + localStorage event bus
// Simulates Supabase Realtime for multi-tab/multi-device sync
// ═══════════════════════════════════════════════════════════════════════════

export const EVENTS = {
  PATIENT_ADMITTED:       "PATIENT_ADMITTED",
  PATIENT_DISCHARGED:     "PATIENT_DISCHARGED",
  LAB_READY:              "LAB_READY",
  VITALS_UPDATED:         "VITALS_UPDATED",
  RX_DISPENSED:           "RX_DISPENSED",
  BILLING_LOCKED:         "BILLING_LOCKED",
  FEEDING_DUE:            "FEEDING_DUE",
  WELLNESS_CHECK:         "WELLNESS_CHECK",
  APPOINTMENT_CONFIRMED:  "APPOINTMENT_CONFIRMED",
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];

export interface RealtimeEvent {
  id: string;
  type: EventType | string;
  payload: Record<string, unknown>;
  actorRole: string;
  actorName: string;
  clinicId: string;
  timestamp: string;
}

const CHANNEL_NAME   = "acf_realtime";
const WIN_EVENT_NAME = "acf:realtime";
const FEED_KEY       = "acf_live_feed";
const FEED_CAP       = 200;

// ─── Broadcast ───────────────────────────────────────────────────────────────
export function broadcast(event: Omit<RealtimeEvent, "id">): RealtimeEvent {
  const full: RealtimeEvent = {
    ...event,
    id: `re-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };

  // 1. BroadcastChannel → other tabs
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage(full);
    ch.close();
  } catch {}

  // 2. CustomEvent → same tab (BroadcastChannel skips sender tab)
  try {
    window.dispatchEvent(new CustomEvent(WIN_EVENT_NAME, { detail: full }));
  } catch {}

  // 3. Persist to localStorage feed (capped at FEED_CAP)
  try {
    const raw  = localStorage.getItem(FEED_KEY);
    const feed: RealtimeEvent[] = raw ? JSON.parse(raw) : [];
    feed.unshift(full);
    if (feed.length > FEED_CAP) feed.length = FEED_CAP;
    localStorage.setItem(FEED_KEY, JSON.stringify(feed));
  } catch {}

  return full;
}

// ─── Subscribe ────────────────────────────────────────────────────────────────
export function subscribe(handler: (e: RealtimeEvent) => void): () => void {
  // Cross-tab: BroadcastChannel
  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(CHANNEL_NAME);
    ch.onmessage = (evt) => handler(evt.data as RealtimeEvent);
  } catch {}

  // Same-tab: CustomEvent
  const onWin = (e: Event) => handler((e as CustomEvent<RealtimeEvent>).detail);
  window.addEventListener(WIN_EVENT_NAME, onWin);

  return () => {
    try { ch?.close(); } catch {}
    window.removeEventListener(WIN_EVENT_NAME, onWin);
  };
}

// ─── Live Feed ────────────────────────────────────────────────────────────────
export function getLiveFeed(): RealtimeEvent[] {
  try {
    const raw = localStorage.getItem(FEED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function clearLiveFeed(): void {
  try { localStorage.removeItem(FEED_KEY); } catch {}
}

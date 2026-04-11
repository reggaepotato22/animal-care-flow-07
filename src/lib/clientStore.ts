import { getAccountScopedKey } from "@/lib/accountStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LifecycleStatus = "new" | "active" | "dormant" | "high-value" | "at-risk";
export type CommChannel = "sms" | "email" | "phone" | "whatsapp";
export type RelationshipRole = "owner" | "caretaker" | "emergency_contact" | "billing_only";
export type CommEventType = "sms" | "email" | "call" | "whatsapp" | "note";
export type CommDirection = "inbound" | "outbound";
export type CommStatus = "sent" | "delivered" | "read" | "failed" | "pending";
export type TimelineEventType = "visit" | "lab" | "comm" | "payment" | "refund" | "vaccine" | "surgery" | "note" | "alert";

export interface CommPreferences {
  smsOptIn: boolean;
  emailOptIn: boolean;
  callOptIn: boolean;
  preferredChannel: CommChannel;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  postalCode?: string;
  avatarInitials?: string;
  lifecycleStatus: LifecycleStatus;
  commPreferences: CommPreferences;
  behavioralFlags: string[];
  tags: string[];
  totalSpend: number;
  outstandingBalance: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPatientLink {
  id: string;
  clientId: string;
  patientId: string;
  patientName: string;
  role: RelationshipRole;
  financialResponsibilityShare: number;
  isPrimaryCommsTarget: boolean;
  lastVisit?: string;
  nextVaccinesDue?: string;
  createdAt: string;
}

export interface CommEvent {
  id: string;
  clientId: string;
  patientId?: string;
  patientName?: string;
  type: CommEventType;
  direction: CommDirection;
  content: string;
  subject?: string;
  status: CommStatus;
  reactions?: string[];
  isPinned?: boolean;
  createdAt: string;
  createdBy: string;
}

export interface TimelineEvent {
  id: string;
  clientId: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  patientId?: string;
  patientName?: string;
  amount?: number;
  status?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const key = (base: string) => getAccountScopedKey(base);
const CLIENTS_KEY = "acf_clients";
const LINKS_KEY = "acf_client_patient_links";
const COMM_KEY = "acf_client_comm_events";
const TIMELINE_KEY = "acf_client_timeline";

function load<T>(base: string): T[] {
  try {
    const raw = localStorage.getItem(key(base));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function save<T>(base: string, data: T[]) {
  localStorage.setItem(key(base), JSON.stringify(data));
}

// ─── Client CRUD ──────────────────────────────────────────────────────────────

export function getClients(): Client[] { return load<Client>(CLIENTS_KEY); }

export function getClientById(id: string): Client | undefined {
  return getClients().find(c => c.id === id);
}

export function upsertClient(client: Client): Client {
  const all = getClients();
  const idx = all.findIndex(c => c.id === client.id);
  const updated = { ...client, updatedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = updated; else all.unshift(updated);
  save(CLIENTS_KEY, all);
  return updated;
}

export function deleteClient(id: string) {
  save(CLIENTS_KEY, getClients().filter(c => c.id !== id));
}

export function createClient(partial: Omit<Client, "id" | "createdAt" | "updatedAt">): Client {
  const client: Client = {
    ...partial,
    id: `CLT-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = getClients();
  all.unshift(client);
  save(CLIENTS_KEY, all);
  return client;
}

// ─── Relationship Links ────────────────────────────────────────────────────────

export function getLinksForClient(clientId: string): ClientPatientLink[] {
  return load<ClientPatientLink>(LINKS_KEY).filter(l => l.clientId === clientId);
}

export function getLinksForPatient(patientId: string): ClientPatientLink[] {
  return load<ClientPatientLink>(LINKS_KEY).filter(l => l.patientId === patientId);
}

export function upsertLink(link: ClientPatientLink): ClientPatientLink {
  const all = load<ClientPatientLink>(LINKS_KEY);
  const idx = all.findIndex(l => l.id === link.id);
  if (idx >= 0) all[idx] = link; else all.push(link);
  save(LINKS_KEY, all);
  return link;
}

export function createLink(partial: Omit<ClientPatientLink, "id" | "createdAt">): ClientPatientLink {
  const link: ClientPatientLink = {
    ...partial,
    id: `LNK-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  const all = load<ClientPatientLink>(LINKS_KEY);
  all.push(link);
  save(LINKS_KEY, all);
  return link;
}

export function deleteLink(id: string) {
  save(LINKS_KEY, load<ClientPatientLink>(LINKS_KEY).filter(l => l.id !== id));
}

// ─── Communication Events ─────────────────────────────────────────────────────

export function getCommEvents(clientId: string): CommEvent[] {
  return load<CommEvent>(COMM_KEY)
    .filter(e => e.clientId === clientId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addCommEvent(partial: Omit<CommEvent, "id" | "createdAt">): CommEvent {
  const event: CommEvent = {
    ...partial,
    id: `MSG-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  const all = load<CommEvent>(COMM_KEY);
  all.push(event);
  save(COMM_KEY, all);
  addTimelineEvent({
    clientId: event.clientId,
    type: "comm",
    title: `${event.direction === "outbound" ? "Sent" : "Received"} ${event.type.toUpperCase()}`,
    description: event.content.slice(0, 80),
    patientId: event.patientId,
    patientName: event.patientName,
    status: event.status,
    timestamp: event.createdAt,
    metadata: { commEventId: event.id },
  });
  return event;
}

export function updateCommEventStatus(id: string, status: CommStatus) {
  const all = load<CommEvent>(COMM_KEY);
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) { all[idx].status = status; save(COMM_KEY, all); }
}

export function toggleCommPin(id: string) {
  const all = load<CommEvent>(COMM_KEY);
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) { all[idx].isPinned = !all[idx].isPinned; save(COMM_KEY, all); }
}

// ─── Timeline Events ───────────────────────────────────────────────────────────

export function getTimeline(clientId: string): TimelineEvent[] {
  return load<TimelineEvent>(TIMELINE_KEY)
    .filter(e => e.clientId === clientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function addTimelineEvent(partial: Omit<TimelineEvent, "id">): TimelineEvent {
  const event: TimelineEvent = {
    ...partial,
    id: `TL-${Date.now().toString(36).toUpperCase()}`,
  };
  const all = load<TimelineEvent>(TIMELINE_KEY);
  all.push(event);
  save(TIMELINE_KEY, all);
  return event;
}

// ─── Seed Demo Data ────────────────────────────────────────────────────────────

// ─── Cross-Module Sync Helpers ────────────────────────────────────────────────

/** Find the primary-comms client linked to a patient (falls back to first link) */
export function getClientByPatientId(patientId: string): Client | undefined {
  const links = load<ClientPatientLink>(LINKS_KEY).filter(l => l.patientId === patientId);
  if (links.length === 0) return undefined;
  const primary = links.find(l => l.isPrimaryCommsTarget) ?? links[0];
  return getClientById(primary.clientId);
}

/** Dispatch an acf:notification custom event (works same-tab; cross-tab via BroadcastChannel) */
export function dispatchClientNotification(payload: {
  message: string;
  type?: "info" | "warning" | "critical" | "success";
  patientId?: string;
  patientName?: string;
  targetRoles?: string[];
}) {
  try {
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: payload.type ?? "info",
        message: payload.message,
        patientId: payload.patientId,
        patientName: payload.patientName,
        targetRoles: payload.targetRoles ?? ["SuperAdmin", "Receptionist"],
      },
    }));
  } catch {}
}

/**
 * Find the client linked to a patient and add a timeline event.
 * Safe to call from any module — silently skips if no client is linked.
 */
export function pushClientEvent(
  patientId: string,
  event: Omit<TimelineEvent, "id" | "clientId">
): void {
  const client = getClientByPatientId(patientId);
  if (!client) return;
  addTimelineEvent({ ...event, clientId: client.id });
}

/**
 * Call when a payment is recorded for a patient.
 * Adds a financial timeline event and notifies the front desk.
 */
export function syncPaymentToClient(opts: {
  patientId: string;
  patientName: string;
  amount: number;
  description: string;
}) {
  const client = getClientByPatientId(opts.patientId);
  if (!client) return;

  addTimelineEvent({
    clientId: client.id,
    type: "payment",
    title: "Payment Recorded",
    description: opts.description,
    patientId: opts.patientId,
    patientName: opts.patientName,
    amount: opts.amount,
    status: "paid",
    timestamp: new Date().toISOString(),
  });

  // Update client totals
  const updated: Client = {
    ...client,
    totalSpend: client.totalSpend + opts.amount,
    outstandingBalance: Math.max(0, client.outstandingBalance - opts.amount),
  };
  upsertClient(updated);

  dispatchClientNotification({
    type: "success",
    message: `Payment of KSh ${opts.amount.toLocaleString()} recorded for ${client.name} — ${opts.patientName}`,
    patientId: opts.patientId,
    patientName: opts.patientName,
    targetRoles: ["SuperAdmin", "Receptionist"],
  });
}

/**
 * Call when a lab order is created for a patient.
 * Adds a lab timeline event to the linked client.
 */
export function syncLabToClient(opts: {
  patientId: string;
  patientName: string;
  testName: string;
  caseId: string;
  priority?: string;
}) {
  const client = getClientByPatientId(opts.patientId);
  if (!client) return;

  addTimelineEvent({
    clientId: client.id,
    type: "lab",
    title: `Lab Order — ${opts.testName}`,
    description: `Case #${opts.caseId}${opts.priority ? ` · ${opts.priority.toUpperCase()}` : ""}`,
    patientId: opts.patientId,
    patientName: opts.patientName,
    status: "pending",
    timestamp: new Date().toISOString(),
    metadata: { caseId: opts.caseId },
  });

  dispatchClientNotification({
    type: "info",
    message: `Lab order created for ${opts.patientName} (${client.name}) — ${opts.testName}`,
    patientId: opts.patientId,
    patientName: opts.patientName,
    targetRoles: ["Vet", "SuperAdmin"],
  });
}

/**
 * Call when a clinical visit/encounter status changes.
 * Adds a visit timeline event.
 */
export function syncVisitToClient(opts: {
  patientId: string;
  patientName: string;
  status: string;
  description?: string;
}) {
  const client = getClientByPatientId(opts.patientId);
  if (!client) return;

  addTimelineEvent({
    clientId: client.id,
    type: "visit",
    title: `Visit — ${opts.status.replace(/_/g, " ")}`,
    description: opts.description,
    patientId: opts.patientId,
    patientName: opts.patientName,
    status: opts.status === "COMPLETED" || opts.status === "DISCHARGED" ? "completed" : "in-progress",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Scan all clients for at-risk conditions and fire notifications.
 * Call once on app startup or from a dashboard component.
 */
export function runAtRiskChecks(): void {
  const clients = getClients();
  const sixMonthsAgo = Date.now() - 180 * 86400000;

  clients.forEach(client => {
    const timeline = getTimeline(client.id);

    // At-risk: no visit in 6 months AND was previously active/high-value
    const lastVisit = timeline.find(e => e.type === "visit");
    const isInactive = !lastVisit || new Date(lastVisit.timestamp).getTime() < sixMonthsAgo;
    if (isInactive && (client.lifecycleStatus === "active" || client.lifecycleStatus === "high-value")) {
      const updated = { ...client, lifecycleStatus: "at-risk" as const };
      upsertClient(updated);
      dispatchClientNotification({
        type: "warning",
        message: `Client "${client.name}" hasn't had a visit in 6+ months — marked At-Risk`,
        targetRoles: ["SuperAdmin", "Receptionist"],
      });
    }

    // Outstanding balance alert
    if (client.outstandingBalance > 5000) {
      dispatchClientNotification({
        type: "warning",
        message: `Client "${client.name}" has an outstanding balance of KSh ${client.outstandingBalance.toLocaleString()}`,
        targetRoles: ["SuperAdmin", "Receptionist"],
      });
    }
  });
}

/**
 * Called from AddPatient on submit.
 * Creates a new Client from owner info (or finds existing by phone/email),
 * then creates a ClientPatientLink so the patient appears in the CRM household.
 */
export function syncPatientToClientCRM(opts: {
  patientId: string;
  patientName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerAddress?: string;
  species?: string;
}): Client {
  const existing = getClients().find(
    c => (opts.ownerPhone && c.phone === opts.ownerPhone) ||
         (opts.ownerEmail && c.email === opts.ownerEmail)
  );

  const client: Client = existing ?? createClient({
    name: opts.ownerName || "Unknown Owner",
    email: opts.ownerEmail || "",
    phone: opts.ownerPhone || "",
    address: opts.ownerAddress || "",
    city: "Nairobi",
    lifecycleStatus: "new",
    commPreferences: {
      smsOptIn: true,
      emailOptIn: !!opts.ownerEmail,
      callOptIn: true,
      preferredChannel: "sms",
    },
    behavioralFlags: [],
    tags: ["Registered"],
    totalSpend: 0,
    outstandingBalance: 0,
    notes: "",
  });

  // Only link if not already linked
  const already = load<ClientPatientLink>(LINKS_KEY)
    .find(l => l.clientId === client.id && l.patientId === opts.patientId);

  if (!already) {
    createLink({
      clientId: client.id,
      patientId: opts.patientId,
      patientName: opts.patientName,
      role: "owner",
      financialResponsibilityShare: 100,
      isPrimaryCommsTarget: true,
      lastVisit: new Date().toISOString().split("T")[0],
    });
    addTimelineEvent({
      clientId: client.id,
      type: "note",
      title: "Patient Registered",
      description: `${opts.patientName} (${opts.species ?? "animal"}) registered to this client.`,
      patientId: opts.patientId,
      patientName: opts.patientName,
      status: "completed",
      timestamp: new Date().toISOString(),
    });
    dispatchClientNotification({
      type: "info",
      message: `New patient ${opts.patientName} registered — linked to client "${client.name}"`,
      patientId: opts.patientId,
      patientName: opts.patientName,
      targetRoles: ["SuperAdmin", "Receptionist"],
    });
  }

  return client;
}

export function seedDemoClients() {
  if (getClients().length > 0) return;

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  const clients: Client[] = [
    {
      id: "CLT-DEMO-001", name: "Sarah Johnson", email: "sarah.johnson@email.com",
      phone: "+1 (555) 123-4567", alternatePhone: "+1 (555) 123-4568",
      address: "123 Oak Street", city: "Downtown", postalCode: "12345",
      lifecycleStatus: "high-value", tags: ["VIP", "SMS-OPT-IN"],
      commPreferences: { smsOptIn: true, emailOptIn: true, callOptIn: true, preferredChannel: "sms" },
      behavioralFlags: ["Requires detailed invoices"],
      totalSpend: 4820, outstandingBalance: 0,
      notes: "Long-term client since 2019. Has two dogs.",
      createdAt: daysAgo(420), updatedAt: daysAgo(2),
    },
    {
      id: "CLT-DEMO-002", name: "James & Maria Chen",
      email: "jchen@email.com", phone: "+1 (555) 987-6543",
      address: "45 Willow Ave", city: "Westside", postalCode: "12350",
      lifecycleStatus: "active", tags: ["SPLIT-BILLING"],
      commPreferences: { smsOptIn: true, emailOptIn: true, callOptIn: false, preferredChannel: "email" },
      behavioralFlags: ["Divorced — separate billing", "No calls before 9am"],
      totalSpend: 2150, outstandingBalance: 380,
      notes: "Shared custody of Mochi. James pays 60%, Maria pays 40%.",
      createdAt: daysAgo(300), updatedAt: daysAgo(5),
    },
    {
      id: "CLT-DEMO-003", name: "Paws & Claws Rescue",
      email: "care@pawsrescue.org", phone: "+1 (555) 555-0190",
      address: "78 Rescue Lane", city: "Eastville", postalCode: "12360",
      lifecycleStatus: "active", tags: ["RESCUE-ORG", "BULK-ACCOUNT"],
      commPreferences: { smsOptIn: false, emailOptIn: true, callOptIn: true, preferredChannel: "email" },
      behavioralFlags: ["Invoice monthly", "CC Director on all reports"],
      totalSpend: 12400, outstandingBalance: 1200,
      notes: "Rescue org — 12 active patients. Monthly consolidated invoicing.",
      createdAt: daysAgo(600), updatedAt: daysAgo(1),
    },
    {
      id: "CLT-DEMO-004", name: "Marcus Webb",
      email: "mwebb@vip.com", phone: "+1 (555) 321-7890",
      address: "1 Penthouse Blvd", city: "Uptown", postalCode: "12370",
      lifecycleStatus: "at-risk", tags: ["DEBTOR"],
      commPreferences: { smsOptIn: false, emailOptIn: false, callOptIn: true, preferredChannel: "phone" },
      behavioralFlags: ["Aggressive on phone", "Dispute — overdue $620"],
      totalSpend: 870, outstandingBalance: 620,
      notes: "Last visit 8 months ago. Two reminder calls sent. Dispute ongoing.",
      createdAt: daysAgo(500), updatedAt: daysAgo(30),
    },
  ];

  save(CLIENTS_KEY, clients);

  // Seed timeline for Sarah
  const tlEvents: Omit<TimelineEvent, "id">[] = [
    { clientId: "CLT-DEMO-001", type: "visit", title: "Annual Wellness — Max", patientName: "Max", description: "All vitals normal. Booster due next month.", timestamp: daysAgo(14), status: "completed" },
    { clientId: "CLT-DEMO-001", type: "lab", title: "CBC & Chemistry Panel — Max", patientName: "Max", description: "Results: Normal ranges across all markers.", timestamp: daysAgo(14), status: "completed" },
    { clientId: "CLT-DEMO-001", type: "payment", title: "Payment Received", description: "$320.00 via credit card", amount: 320, timestamp: daysAgo(13), status: "paid" },
    { clientId: "CLT-DEMO-001", type: "comm", title: "SMS Sent", description: "Reminder: Max's booster is due in 30 days.", timestamp: daysAgo(7), status: "read" },
    { clientId: "CLT-DEMO-001", type: "vaccine", title: "Vaccine Due — Max", patientName: "Max", description: "Rabies booster overdue by 2 weeks.", timestamp: daysAgo(2), status: "overdue" },
  ];

  const tlEventsWithIds = tlEvents.map(e => ({ ...e, id: `TL-SEED-${Math.random().toString(36).slice(2)}` }));
  save(TIMELINE_KEY, tlEventsWithIds);

  // Seed comm events for Sarah
  const commEvents: Omit<CommEvent, "id" | "createdAt">[] = [
    { clientId: "CLT-DEMO-001", type: "sms", direction: "outbound", content: "Hi Sarah! This is a reminder that Max's Rabies booster is due. Please book soon to keep him protected. 🐾", status: "read", createdBy: "Dr. Smith", isPinned: false },
    { clientId: "CLT-DEMO-001", type: "sms", direction: "inbound", content: "Thanks for the reminder! Can I book for next Saturday?", status: "read", createdBy: "Sarah Johnson", isPinned: false },
    { clientId: "CLT-DEMO-001", type: "sms", direction: "outbound", content: "Absolutely! Saturday 10am works great. Confirmed for Max. See you then! 🐕", status: "delivered", createdBy: "Dr. Smith", isPinned: true },
    { clientId: "CLT-DEMO-001", type: "email", direction: "outbound", subject: "Max's Lab Results — All Clear!", content: "Dear Sarah, great news! Max's CBC and chemistry panel results are all within normal ranges. Full report attached.", status: "read", createdBy: "System", isPinned: false },
  ];

  const now2 = new Date();
  const stored = commEvents.map((e, i) => ({
    ...e,
    id: `MSG-SEED-${i}`,
    createdAt: new Date(now2.getTime() - (commEvents.length - i) * 3600000 * 24).toISOString(),
  }));
  save(COMM_KEY, stored);
}

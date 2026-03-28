export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VIEW" | "LOGIN" | "LOGOUT" | "EXPORT" | "IMPORT" | "APPROVE" | "REJECT";

export type AuditEntityType = "Patient" | "Record" | "Invoice" | "System" | "Appointment" | "Encounter" | "LabOrder" | "Prescription" | "Attachment" | "User" | "Workflow";

export type AuditRecord = {
  id: string;
  timestamp: number;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  field: string;
  previousValue: string;
  newValue: string;
  changedBy: string;
  changedById?: string;
  reason?: string;
  metadata?: Record<string, any>;
};

const STORAGE_KEY = "acf_audit_trail";

function read(): AuditRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuditRecord[]) : [];
  } catch {
    return [];
  }
}

function write(entries: AuditRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

type Listener = (records: AuditRecord[]) => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(records: AuditRecord[]) {
  for (const l of listeners) l(records);
}

export function getLogs(): AuditRecord[] {
  return read().sort((a, b) => b.timestamp - a.timestamp);
}

export function logChange(args: {
  entityType: AuditEntityType;
  entityId: string;
  action?: AuditAction;
  field: string;
  previousValue: string | number | null | undefined;
  newValue: string | number | null | undefined;
  changedBy: string;
  changedById?: string;
  reason?: string;
  metadata?: Record<string, any>;
}) {
  const records = read();
  const rec: AuditRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    entityType: args.entityType,
    entityId: args.entityId,
    action: args.action || "UPDATE",
    field: args.field,
    previousValue: args.previousValue == null ? "" : String(args.previousValue),
    newValue: args.newValue == null ? "" : String(args.newValue),
    changedBy: args.changedBy,
    changedById: args.changedById,
    reason: args.reason,
    metadata: args.metadata,
  };
  const updated = [rec, ...records];
  write(updated);
  notify(updated);
}

// Helper functions for common audit actions
export function logCreate(args: Omit<Parameters<typeof logChange>[0], 'action'>) {
  return logChange({ ...args, action: "CREATE", previousValue: "" });
}

export function logUpdate(args: Omit<Parameters<typeof logChange>[0], 'action'>) {
  return logChange({ ...args, action: "UPDATE" });
}

export function logDelete(args: Omit<Parameters<typeof logChange>[0], 'action'>) {
  return logChange({ ...args, action: "DELETE", newValue: "" });
}

export function logView(args: Omit<Parameters<typeof logChange>[0], 'action' | 'previousValue' | 'newValue'>) {
  return logChange({ ...args, action: "VIEW", previousValue: "", newValue: "" });
}

export function logLogin(userId: string, userName: string) {
  return logChange({
    entityType: "User",
    entityId: userId,
    action: "LOGIN",
    field: "Session",
    previousValue: "",
    newValue: "Active",
    changedBy: userName,
    changedById: userId,
  });
}

export function logLogout(userId: string, userName: string) {
  return logChange({
    entityType: "User",
    entityId: userId,
    action: "LOGOUT",
    field: "Session",
    previousValue: "Active",
    newValue: "Ended",
    changedBy: userName,
    changedById: userId,
  });
}


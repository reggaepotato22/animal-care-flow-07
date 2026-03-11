export type AuditRecord = {
  id: string;
  timestamp: number;
  entityType: "Patient" | "Record" | "Invoice" | "System";
  entityId: string;
  field: string;
  previousValue: string;
  newValue: string;
  changedBy: string;
  reason?: string;
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
  entityType: AuditRecord["entityType"];
  entityId: string;
  field: string;
  previousValue: string | number | null | undefined;
  newValue: string | number | null | undefined;
  changedBy: string;
  reason?: string;
}) {
  const records = read();
  const rec: AuditRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    entityType: args.entityType,
    entityId: args.entityId,
    field: args.field,
    previousValue: args.previousValue == null ? "" : String(args.previousValue),
    newValue: args.newValue == null ? "" : String(args.newValue),
    changedBy: args.changedBy,
    reason: args.reason,
  };
  const updated = [rec, ...records];
  write(updated);
  notify(updated);
}


import { getAccountScopedKey } from "@/lib/accountStore";

export type AccountAuditAction =
  | "ACCOUNT_CREATED"
  | "ACCOUNT_UPDATED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_CANCELED"
  | "PLAN_CHANGED"
  | "SUBSCRIPTION_UPDATED"
  | "SETTINGS_UPDATED";

export interface AccountAuditEvent {
  id: string;
  accountId: string;
  timestamp: string;
  action: AccountAuditAction;
  actor: string;
  detail: string;
}

const ACCOUNT_AUDIT_KEY_BASE = "acf_account_audit";

function auditKey(accountId: string) {
  return getAccountScopedKey(ACCOUNT_AUDIT_KEY_BASE, accountId);
}

export function getAccountAudit(accountId: string): AccountAuditEvent[] {
  try {
    const raw = localStorage.getItem(auditKey(accountId));
    return raw ? (JSON.parse(raw) as AccountAuditEvent[]) : [];
  } catch {
    return [];
  }
}

export function appendAccountAudit(event: Omit<AccountAuditEvent, "id" | "timestamp">): AccountAuditEvent {
  const full: AccountAuditEvent = {
    ...event,
    id: `acct-audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
  };
  try {
    const existing = getAccountAudit(event.accountId);
    existing.unshift(full);
    localStorage.setItem(auditKey(event.accountId), JSON.stringify(existing));
  } catch {}
  return full;
}

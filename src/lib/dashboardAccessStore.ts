import { getAccountScopedKey } from "@/lib/accountStore";
import type { Permission, Role } from "@/lib/rbac";

export type DashboardControlledPermission = Extract<
  Permission,
  "can_view_weekly_revenue" | "can_view_active_staff"
>;

export type DashboardAccessOverrides = Partial<
  Record<Role, Partial<Record<DashboardControlledPermission, boolean>>>
>;

const DASHBOARD_ACCESS_KEY_BASE = "acf_dashboard_access";

function key(accountId?: string) {
  return getAccountScopedKey(DASHBOARD_ACCESS_KEY_BASE, accountId);
}

export function getDashboardAccessOverrides(accountId?: string): DashboardAccessOverrides {
  try {
    const raw = localStorage.getItem(key(accountId));
    return raw ? (JSON.parse(raw) as DashboardAccessOverrides) : {};
  } catch {
    return {};
  }
}

export function setDashboardAccessOverride(
  role: Role,
  permission: DashboardControlledPermission,
  value: boolean,
  accountId?: string
): void {
  try {
    const current = getDashboardAccessOverrides(accountId);
    const roleOverrides = { ...(current[role] ?? {}) };
    roleOverrides[permission] = value;
    const next = { ...current, [role]: roleOverrides };
    localStorage.setItem(key(accountId), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(key(accountId)));
  } catch {}
}

export function subscribeToDashboardAccessOverrides(cb: () => void, accountId?: string): () => void {
  const eventName = key(accountId);
  const onEvent = () => cb();
  window.addEventListener(eventName, onEvent);
  const onStorage = (e: StorageEvent) => {
    if (e.key === eventName) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(eventName, onEvent);
    window.removeEventListener("storage", onStorage);
  };
}

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROLE_PERMISSIONS, type Permission, type Role } from "@/lib/rbac";
import { logChange } from "@/lib/audit";
import { useAccount } from "@/contexts/AccountContext";
import { getDashboardAccessOverrides, subscribeToDashboardAccessOverrides, type DashboardControlledPermission } from "@/lib/dashboardAccessStore";
import { getAccountScopedKey, getActiveAccountId } from "@/lib/accountStore";

const ROLE_BASE_KEY = "acf_role";

function readRole(accountId: string): Role {
  try {
    const scoped = localStorage.getItem(getAccountScopedKey(ROLE_BASE_KEY, accountId));
    if (scoped) return JSON.parse(scoped) as Role;
    // backward-compat: check legacy flat key
    const legacy = localStorage.getItem(ROLE_BASE_KEY);
    if (legacy) return JSON.parse(legacy) as Role;
  } catch {}
  return "SuperAdmin";
}

function writeRole(accountId: string, role: Role) {
  try {
    localStorage.setItem(getAccountScopedKey(ROLE_BASE_KEY, accountId), JSON.stringify(role));
  } catch {}
}

interface RoleContextValue {
  role: Role;
  permissions: Permission[];
  setRole: (role: Role, changedBy?: string) => void;
  has: (perm: Permission) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { activeAccountId } = useAccount();
  const [role, setRoleState] = useState<Role>(() => readRole(getActiveAccountId()));
  const [dashboardOverrides, setDashboardOverrides] = useState(() => getDashboardAccessOverrides(activeAccountId));
  const permissions = useMemo(() => ROLE_PERMISSIONS[role], [role]);

  useEffect(() => {
    setDashboardOverrides(getDashboardAccessOverrides(activeAccountId));
    const unsub = subscribeToDashboardAccessOverrides(
      () => setDashboardOverrides(getDashboardAccessOverrides(activeAccountId)),
      activeAccountId
    );
    return () => unsub();
  }, [activeAccountId]);

  // Re-read role whenever the active account changes (login / account switch)
  useEffect(() => {
    setRoleState(readRole(activeAccountId));
  }, [activeAccountId]);

  const setRole = (r: Role, changedBy = "admin") => {
    const prev = role;
    setRoleState(r);
    writeRole(activeAccountId, r);
    logChange({
      entityType: "System",
      entityId: "role",
      field: "Role",
      previousValue: prev,
      newValue: r,
      changedBy,
      reason: "Role changed via settings",
    });
  };

  const has = (perm: Permission) => {
    if (perm === "can_view_weekly_revenue" || perm === "can_view_active_staff") {
      const override = dashboardOverrides?.[role]?.[perm as DashboardControlledPermission];
      if (typeof override === "boolean") return override;
    }
    return permissions.includes(perm);
  };

  const value: RoleContextValue = { role, permissions, setRole, has };
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

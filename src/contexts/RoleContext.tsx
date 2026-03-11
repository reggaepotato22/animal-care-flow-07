import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROLE_PERMISSIONS, type Permission, type Role } from "@/lib/rbac";
import { logChange } from "@/lib/audit";

const STORAGE_KEY = "acf_role";

interface RoleContextValue {
  role: Role;
  permissions: Permission[];
  setRole: (role: Role, changedBy?: string) => void;
  has: (perm: Permission) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Role;
    } catch {}
    return "SuperAdmin";
  });
  const permissions = useMemo(() => ROLE_PERMISSIONS[role], [role]);

  const setRole = (r: Role, changedBy = "admin") => {
    const prev = role;
    setRoleState(r);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    } catch {}
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

  const has = (perm: Permission) => permissions.includes(perm);

  const value: RoleContextValue = { role, permissions, setRole, has };
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}


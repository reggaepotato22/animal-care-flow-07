import { ReactNode } from "react";
import { useRole } from "@/contexts/RoleContext";
import type { Permission } from "@/lib/rbac";

export function PermissionGuard({
  permission,
  children,
  fallback = null,
  hide,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  hide?: boolean;
}) {
  const { has } = useRole();
  if (has(permission)) return <>{children}</>;
  if (hide) return null;
  return <>{fallback}</>;
}


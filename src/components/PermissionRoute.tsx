import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import type { Permission } from "@/lib/rbac";

export function PermissionRoute({ permission }: { permission: Permission }) {
  const { has } = useRole();
  const location = useLocation();
  if (!has(permission)) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

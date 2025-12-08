import { RoleManagement } from "@/components/RoleManagement";

export default function Users() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, user groups, and permissions
          </p>
        </div>
      </div>

      <RoleManagement />
    </div>
  );
}




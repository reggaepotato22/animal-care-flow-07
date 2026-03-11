export type Role = "SuperAdmin" | "Vet" | "Nurse" | "Receptionist";

export type Permission =
  | "can_edit_medical_records"
  | "can_view_audit"
  | "can_manage_users"
  | "can_manage_inventory"
  | "can_access_billing"
  | "can_triage"
  | "can_view_records";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SuperAdmin: [
    "can_edit_medical_records",
    "can_view_audit",
    "can_manage_users",
    "can_manage_inventory",
    "can_access_billing",
    "can_triage",
    "can_view_records",
  ],
  Vet: [
    "can_edit_medical_records",
    "can_view_records",
  ],
  Nurse: [
    "can_triage",
    "can_view_records",
  ],
  Receptionist: [
    "can_access_billing",
  ],
};


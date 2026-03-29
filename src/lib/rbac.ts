export type Role = "SuperAdmin" | "Vet" | "Nurse" | "Receptionist" | "Pharmacist";

export type Permission =
  | "can_edit_medical_records"
  | "can_view_audit"
  | "can_manage_users"
  | "can_manage_inventory"
  | "can_access_billing"
  | "can_triage"
  | "can_view_records"
  | "can_prescribe"
  | "can_dispense"
  | "can_register_patients"
  | "can_view_patients"
  | "can_edit_patients"
  | "can_view_weekly_revenue"
  | "can_view_active_staff";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SuperAdmin: [
    "can_edit_medical_records",
    "can_view_audit",
    "can_manage_users",
    "can_manage_inventory",
    "can_access_billing",
    "can_triage",
    "can_view_records",
    "can_prescribe",
    "can_dispense",
    "can_register_patients",
    "can_view_patients",
    "can_edit_patients",
    "can_view_weekly_revenue",
    "can_view_active_staff",
  ],
  Vet: [
    "can_edit_medical_records",
    "can_view_records",
    "can_prescribe",
    "can_triage",
    "can_view_patients",
    "can_edit_patients",
  ],
  Nurse: [
    "can_triage",
    "can_view_records",
    "can_view_patients",
    "can_edit_patients",
  ],
  Receptionist: [
    "can_access_billing",
    "can_register_patients",
    "can_view_patients",
    "can_edit_patients",
  ],
  Pharmacist: [
    "can_dispense",
    "can_manage_inventory",
    "can_view_records",
    "can_view_patients",
  ],
};

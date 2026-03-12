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
  | "can_register_patients";

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
  ],
  Vet: [
    "can_edit_medical_records",
    "can_view_records",
    "can_prescribe",
    "can_triage",
  ],
  Nurse: [
    "can_triage",
    "can_view_records",
  ],
  Receptionist: [
    "can_access_billing",
    "can_register_patients",
  ],
  Pharmacist: [
    "can_dispense",
    "can_manage_inventory",
    "can_view_records",
  ],
};


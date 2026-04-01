
import { savePatients, samplePatients, generatePatientId, generateOwnerId, AUTH_PRESERVE_KEYS } from "./patientStore";
import { saveStaff, sampleStaff } from "./staffStore";
import { createDemoAppointments, saveAppointments } from "./appointmentStore";
import { saveRoles, saveGroups, saveUsers, sampleRoles, sampleGroups, sampleUsers } from "./roleStore";
import { getAccountScopedKey } from "./accountStore";
import { generateMockInventory, clearInventoryData } from "./inventoryStore";

export function clearAllData() {
  if (typeof window === "undefined") return;
  const preserved: Record<string, string> = {};
  for (const key of AUTH_PRESERVE_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) preserved[key] = val;
  }
  localStorage.clear();
  for (const [key, val] of Object.entries(preserved)) {
    localStorage.setItem(key, val);
  }
  clearInventoryData();
  window.location.reload();
}

export function seedMockData() {
  if (typeof window === "undefined") return;

  // Seed Patients
  const patients = samplePatients.map((p, i) => ({
    ...p,
    id: `sample-${Date.now()}-${i}`,
    patientId: generatePatientId(),
    ownerId: generateOwnerId(),
  }));
  savePatients(patients);

  // Seed Staff
  const staff = sampleStaff.map((s, i) => ({
    ...s,
    id: `staff-${Date.now()}-${i}`,
  }));
  saveStaff(staff);

  // Seed Roles, Groups, Users
  saveRoles(sampleRoles);
  saveGroups(sampleGroups);
  saveUsers(sampleUsers);

  saveAppointments(createDemoAppointments(patients[0]?.id || "p1"));

  // Seed Inventory
  generateMockInventory();

  // Mark as initialized
  localStorage.setItem(getAccountScopedKey("vetcare_sample_patients_initialized"), "true");
  localStorage.setItem(getAccountScopedKey("vetcare_mock_data_seeded"), "true");

  window.location.reload();
}

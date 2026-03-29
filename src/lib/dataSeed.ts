
import { savePatients, samplePatients, generatePatientId, generateOwnerId } from "./patientStore";
import { saveStaff, sampleStaff } from "./staffStore";
import { createDemoAppointments, saveAppointments } from "./appointmentStore";
import { saveRoles, saveGroups, saveUsers, sampleRoles, sampleGroups, sampleUsers } from "./roleStore";
import { getAccountScopedKey } from "./accountStore";

export function clearAllData() {
  if (typeof window === "undefined") return;
  localStorage.clear();
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

  // Mark as initialized
  localStorage.setItem(getAccountScopedKey("vetcare_sample_patients_initialized"), "true");
  localStorage.setItem(getAccountScopedKey("vetcare_mock_data_seeded"), "true");

  window.location.reload();
}


import { savePatients, samplePatients, generatePatientId, generateOwnerId } from "./patientStore";
import { saveStaff, sampleStaff } from "./staffStore";
import { createDemoAppointments, saveAppointments } from "./appointmentStore";
import { HOSP_STORAGE_KEY } from "./hospitalizationStore";
import { saveRoles, saveGroups, saveUsers, sampleRoles, sampleGroups, sampleUsers } from "./roleStore";

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

  // Seed Hospitalization (Optional)
  localStorage.setItem(HOSP_STORAGE_KEY, JSON.stringify([]));

  // Mark as initialized
  localStorage.setItem("vetcare_sample_patients_initialized", "true");
  localStorage.setItem("vetcare_mock_data_seeded", "true");

  window.location.reload();
}

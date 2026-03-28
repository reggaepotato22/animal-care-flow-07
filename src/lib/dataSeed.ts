
import { savePatients, samplePatients, generatePatientId, generateOwnerId } from "./patientStore";
import { saveStaff, sampleStaff } from "./staffStore";
import { APT_STORAGE_KEY } from "./appointmentStore";
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

  // Seed Appointments (Optional: add some sample appointments)
  const sampleAppointments = [
    {
      id: "appt-1",
      petName: "Max",
      ownerName: "Sarah Johnson",
      ownerPhone: "555-0101",
      ownerEmail: "sarah@example.com",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      type: "Checkup",
      vet: "Dr. Smith",
      status: "SCHEDULED",
      patientId: patients[0]?.id || "p1",
      duration: 30,
      createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem(APT_STORAGE_KEY, JSON.stringify(sampleAppointments));

  // Seed Hospitalization (Optional)
  localStorage.setItem(HOSP_STORAGE_KEY, JSON.stringify([]));

  // Mark as initialized
  localStorage.setItem("vetcare_sample_patients_initialized", "true");
  localStorage.setItem("vetcare_mock_data_seeded", "true");

  window.location.reload();
}

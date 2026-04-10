import { PatientRow } from "@/data/patients";
import { logCreate, logUpdate, logDelete } from "./audit";
import { getAccountScopedKey, getActiveAccountId } from "@/lib/accountStore";
import { broadcast, EVENTS } from "@/lib/realtimeEngine";

const PATIENTS_STORAGE_KEY_BASE = "vetcare_patients";
const SAMPLE_PATIENTS_INITIALIZED_KEY_BASE = "vetcare_sample_patients_initialized";

function patientsKey() {
  return getAccountScopedKey(PATIENTS_STORAGE_KEY_BASE);
}

function initializedKey() {
  return getAccountScopedKey(SAMPLE_PATIENTS_INITIALIZED_KEY_BASE);
}

// Generate unique IDs
export function generatePatientId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `P-${timestamp}-${random}`;
}

export function generateOwnerId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `C-${timestamp}-${random}`;
}

// Sample patients data (deletable)
export const samplePatients: Omit<PatientRow, "id" | "patientId">[] = [
  {
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    age: "3 years",
    weight: "28kg",
    sex: "Male",
    color: "Golden",
    microchip: "123456789012345",
    owner: "Sarah Johnson",
    ownerType: "Individual",
    phone: "+1 (555) 123-4567",
    alternatePhone: "+1 (555) 123-4568",
    email: "sarah.johnson@email.com",
    preferredContact: "Phone",
    address: "123 Oak Street, Downtown",
    city: "Downtown",
    postalCode: "12345",
    billingAddress: "123 Oak Street, Downtown",
    location: "Downtown Clinic",
    lastVisit: "2024-01-15",
    nextAppointment: "2024-02-15",
    status: "healthy",
    vaccinations: [
      { name: "Rabies", date: "2023-03-15", due: "2024-03-15" },
      { name: "DHPP", date: "2023-04-10", due: "2024-04-10" },
      { name: "Lyme Disease", date: "2023-05-01", due: "2024-05-01" }
    ],
    allergies: ["Beef", "Pollen"],
    medications: [
      { name: "Heartworm Prevention", dosage: "Monthly", prescribed: "2024-01-15" }
    ],
    vitals: [
      { date: "2024-01-15", temperature: "38.5°C", heartRate: "80 bpm", respiratoryRate: "20 rpm", weight: "28kg", bloodPressure: "Normal" },
      { date: "2023-11-20", temperature: "38.2°C", heartRate: "85 bpm", respiratoryRate: "18 rpm", weight: "27.8kg", bloodPressure: "Normal" }
    ],
    recentVisits: [
      { date: "2024-01-15", reason: "Annual Checkup", vet: "Dr. Smith", notes: "Healthy dog, all vitals normal" },
      { date: "2023-11-20", reason: "Vaccination", vet: "Dr. Johnson", notes: "Booster shots administered" }
    ],
    medicalHistory: [
      {
        id: "MH-001",
        date: "2024-01-15",
        time: "10:30 AM",
        type: "Checkup",
        personnel: "Dr. Sarah Smith",
        role: "Veterinarian",
        description: "Annual wellness examination",
        quantity: 1,
        amount: 150.00,
        status: "Completed",
        notes: "Healthy dog, all vitals normal. Recommended continued exercise routine."
      }
    ]
  },
  {
    name: "Whiskers",
    species: "Cat",
    breed: "Persian",
    age: "5 years",
    weight: "4.2kg",
    sex: "Female",
    color: "White",
    microchip: "987654321098765",
    owner: "Michael Chen",
    ownerType: "Individual",
    phone: "+1 (555) 987-6543",
    alternatePhone: "",
    email: "michael.chen@email.com",
    preferredContact: "Email",
    address: "456 Pine Avenue, North District",
    city: "North District",
    postalCode: "67890",
    billingAddress: "456 Pine Avenue, North District",
    location: "North Branch",
    lastVisit: "2024-01-18",
    nextAppointment: "2024-02-20",
    status: "treatment",
    vaccinations: [
      { name: "FVRCP", date: "2023-06-15", due: "2024-06-15" },
      { name: "Rabies", date: "2023-07-01", due: "2024-07-01" }
    ],
    allergies: ["Fish", "Dairy"],
    medications: [
      { name: "Antibiotics", dosage: "Twice daily", prescribed: "2024-01-18" }
    ],
    vitals: [
      { date: "2024-01-18", temperature: "39.1°C", heartRate: "95 bpm", respiratoryRate: "25 rpm", weight: "4.2kg", bloodPressure: "Slightly Elevated" }
    ],
    medicalHistory: [
      {
        id: "MH-009",
        date: "2024-01-18",
        time: "3:30 PM",
        type: "Emergency",
        personnel: "Dr. Emily Brown",
        role: "Veterinarian",
        description: "Upper respiratory infection treatment",
        quantity: 1,
        amount: 280.00,
        status: "Active",
        notes: "Prescribed antibiotics, follow-up in 2 weeks. Patient showing improvement."
      }
    ]
  },
  {
    name: "Luna",
    species: "Cat",
    breed: "Maine Coon",
    age: "2 years",
    weight: "5.1kg",
    sex: "Female",
    color: "Gray Tabby",
    microchip: "456789123456789",
    owner: "Emily Rodriguez",
    ownerType: "Individual",
    phone: "+1 (555) 456-7890",
    alternatePhone: "+1 (555) 456-7891",
    email: "emily.rodriguez@email.com",
    preferredContact: "SMS",
    address: "789 Maple Drive, Central City",
    city: "Central City",
    postalCode: "54321",
    billingAddress: "789 Maple Drive, Central City",
    location: "Main Office",
    lastVisit: "2024-01-20",
    nextAppointment: "2024-03-01",
    status: "healthy",
    vaccinations: [
      { name: "FVRCP", date: "2023-08-15", due: "2024-08-15" }
    ],
    allergies: ["None known"],
    vitals: [
      { date: "2024-01-20", temperature: "38.1°C", heartRate: "75 bpm", respiratoryRate: "16 rpm", weight: "5.1kg", bloodPressure: "Normal" }
    ],
    medicalHistory: [
      {
        id: "MH-012",
        date: "2024-01-20",
        time: "11:00 AM",
        type: "Checkup",
        personnel: "Dr. James Wilson",
        role: "Veterinarian",
        description: "Annual wellness examination",
        quantity: 1,
        amount: 120.00,
        status: "Completed",
        notes: "Excellent health, continue current diet. All vitals within normal range."
      }
    ]
  },
  {
    name: "Rocky",
    species: "Dog",
    breed: "German Shepherd",
    age: "7 years",
    weight: "35kg",
    sex: "Male",
    color: "Black and Tan",
    microchip: "789012345678901",
    owner: "David Thompson",
    ownerType: "Individual",
    phone: "+1 (555) 321-0987",
    alternatePhone: "",
    email: "david.thompson@email.com",
    preferredContact: "Phone",
    address: "321 Elm Street, Emergency District",
    city: "Emergency District",
    postalCode: "98765",
    billingAddress: "321 Elm Street, Emergency District",
    location: "Emergency Center",
    lastVisit: "2024-01-19",
    nextAppointment: "",
    status: "critical",
    vaccinations: [],
    allergies: ["Chicken", "Wheat"],
    medications: [],
    vitals: [],
    recentVisits: [],
    medicalHistory: []
  },
  {
    name: "Bella",
    species: "Dog",
    breed: "Beagle",
    age: "4 years",
    weight: "12kg",
    sex: "Female",
    color: "Tri-color",
    microchip: "234567890123456",
    owner: "Lisa Anderson",
    ownerType: "Individual",
    phone: "+1 (555) 222-3333",
    alternatePhone: "",
    email: "lisa.anderson@email.com",
    preferredContact: "Email",
    address: "222 Birch Lane, Suburbs",
    city: "Suburbs",
    postalCode: "54322",
    billingAddress: "222 Birch Lane, Suburbs",
    location: "Downtown Clinic",
    lastVisit: "2024-02-01",
    nextAppointment: "2024-03-15",
    status: "healthy",
    vaccinations: [
      { name: "Rabies", date: "2023-02-01", due: "2024-02-01" },
      { name: "DHPP", date: "2023-02-01", due: "2024-02-01" }
    ],
    allergies: [],
    medications: [],
    vitals: [
      { date: "2024-02-01", temperature: "38.3°C", heartRate: "78 bpm", respiratoryRate: "18 rpm", weight: "12kg", bloodPressure: "Normal" }
    ],
    recentVisits: [
      { date: "2024-02-01", reason: "Annual Checkup", vet: "Dr. Smith", notes: "Healthy, all vaccinations up to date" }
    ],
    medicalHistory: [
      {
        id: "MH-015",
        date: "2024-02-01",
        time: "2:00 PM",
        type: "Checkup",
        personnel: "Dr. Sarah Smith",
        role: "Veterinarian",
        description: "Annual wellness examination and vaccination update",
        quantity: 1,
        amount: 180.00,
        status: "Completed",
        notes: "All vitals normal. Updated rabies and DHPP vaccines."
      }
    ]
  }
];

// Mock avatar URLs for demo/production
export const MOCK_PATIENT_AVATARS: Record<string, string[]> = {
  dog: [
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1583511655857-d19bc40da7e6?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=200&h=200&fit=crop",
  ],
  cat: [
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=200&h=200&fit=crop",
  ],
  bird: [
    "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1544568100-847a948585b9?w=200&h=200&fit=crop",
  ],
  rabbit: [
    "https://images.unsplash.com/photo-1585110396000-c928ffd6f5c3?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1518796745738-41048802f99a?w=200&h=200&fit=crop",
  ],
  other: [
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=200&h=200&fit=crop",
  ],
};

// Get random mock avatar based on species
export function getMockPatientAvatar(species: string = "dog"): string {
  const key = species.toLowerCase() as keyof typeof MOCK_PATIENT_AVATARS;
  const avatars = MOCK_PATIENT_AVATARS[key] || MOCK_PATIENT_AVATARS.other;
  return avatars[Math.floor(Math.random() * avatars.length)];
}

// Initialize sample patients - DISABLED by default (zero data start)
// Call this function explicitly to generate demo data
export function initializeSamplePatients(): void {
  if (typeof window === "undefined") return;
  
  const alreadyInitialized = localStorage.getItem(initializedKey());
  if (alreadyInitialized) return;

  const existingPatients = getPatients();
  if (existingPatients.length > 0) {
    localStorage.setItem(initializedKey(), "true");
    return;
  }

  // Create sample patients with generated IDs - ONLY when explicitly called
  const patients: PatientRow[] = samplePatients.map((patient, index) => ({
    ...patient,
    id: `sample-${Date.now()}-${index}`,
    patientId: generatePatientId(),
    ownerId: generateOwnerId(),
    photoUrl: getMockPatientAvatar(patient.species),
  }));

  savePatients(patients);
  localStorage.setItem(initializedKey(), "true");
}

// Get all patients from localStorage
export function getPatients(): PatientRow[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(patientsKey());
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save patients to localStorage
export function savePatients(patients: PatientRow[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(patientsKey(), JSON.stringify(patients));
}

// Add a new patient
export function addPatient(patient: Omit<PatientRow, "id" | "patientId">, userName: string = "System"): PatientRow {
  const patients = getPatients();
  const newPatient: PatientRow = {
    ...patient,
    id: `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    patientId: generatePatientId(),
  };
  
  savePatients([...patients, newPatient]);
  
  // Audit log
  logCreate({
    entityType: "Patient",
    entityId: newPatient.patientId,
    field: "Patient Registration",
    previousValue: "",
    newValue: newPatient.name,
    changedBy: userName,
    reason: "New patient registered",
  });

  // Real-time broadcast → notifies Vet + Nurse
  try {
    broadcast({
      type: EVENTS.PATIENT_ADMITTED,
      payload: { patientName: newPatient.name, patientId: newPatient.patientId, species: newPatient.species ?? "" },
      actorRole: "System",
      actorName: userName,
      clinicId: getActiveAccountId(),
      timestamp: new Date().toISOString(),
    });
  } catch {}

  return newPatient;
}

// Delete a patient by ID
export function deletePatient(patientId: string, userName: string = "System"): boolean {
  const patients = getPatients();
  const patient = patients.find(p => p.id === patientId);
  
  if (!patient) return false;
  
  const filtered = patients.filter(p => p.id !== patientId);
  savePatients(filtered);
  
  // Audit log
  logDelete({
    entityType: "Patient",
    entityId: patient.patientId,
    field: "Patient Deletion",
    previousValue: patient.name,
    newValue: "",
    changedBy: userName,
    reason: "Patient record deleted",
  });
  
  return true;
}

// Update a patient
export function updatePatient(patientId: string, updates: Partial<PatientRow>, userName: string = "System"): PatientRow | null {
  const patients = getPatients();
  const index = patients.findIndex(p => p.id === patientId);
  
  if (index === -1) return null;
  
  const oldPatient = { ...patients[index] };
  patients[index] = { ...patients[index], ...updates };
  savePatients(patients);
  
  // Audit log for each changed field
  Object.keys(updates).forEach(key => {
    if (key !== "id" && key !== "patientId") {
      const oldValue = oldPatient[key as keyof PatientRow];
      const newValue = updates[key as keyof PatientRow];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        logUpdate({
          entityType: "Patient",
          entityId: patients[index].patientId,
          field: key,
          previousValue: String(oldValue ?? ""),
          newValue: String(newValue ?? ""),
          changedBy: userName,
          reason: `Updated ${key}`,
        });
      }
    }
  });
  
  return patients[index];
}

// Get a single patient by ID
export function getPatientById(patientId: string): PatientRow | undefined {
  return getPatients().find(p => p.id === patientId);
}

// Clear all app data except patients (for cache clearing)
export function clearCache(): void {
  if (typeof window === "undefined") return;
  
  // Preserve patients and initialization flag
  const patients = localStorage.getItem(patientsKey());
  const initialized = localStorage.getItem(initializedKey());
  
  // List of keys to preserve (patients and related)
  const keysToPreserve = [
    patientsKey(),
    initializedKey(),
    "user_preferences",
    "appearance_settings",
  ];
  
  // Get all keys
  const allKeys = Object.keys(localStorage);
  
  // Clear everything except preserved keys
  allKeys.forEach(key => {
    if (!keysToPreserve.includes(key)) {
      localStorage.removeItem(key);
    }
  });
  
  // Restore preserved data
  if (patients) localStorage.setItem(patientsKey(), patients);
  if (initialized) localStorage.setItem(initializedKey(), initialized);
}

// Clear all app data including patients (complete reset)
// Auth/account keys are preserved so the active session survives the reload.
export const AUTH_PRESERVE_KEYS = [
  "vetcare-demo-auth",
  "vetcare-admin-auth",
  "vetcare_registered_users",
  "acf_demo_credentials",
  "acf_accounts",
  "acf_active_account_id",
];

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  // Snapshot auth keys before wiping
  const preserved: Record<string, string> = {};
  for (const key of AUTH_PRESERVE_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) preserved[key] = val;
  }
  localStorage.clear();
  // Restore auth keys so the session stays alive after reload
  for (const [key, val] of Object.entries(preserved)) {
    localStorage.setItem(key, val);
  }
}

/** Clear only patient/clinical data — leaves inventory and auth untouched. */
export function clearPatientData(): void {
  if (typeof window === "undefined") return;
  const PRESERVE_KEYS = new Set([
    ...AUTH_PRESERVE_KEYS,
    "acf_inventory_items",
  ]);
  const preserved: Record<string, string> = {};
  for (const key of PRESERVE_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) preserved[key] = val;
  }
  localStorage.clear();
  for (const [key, val] of Object.entries(preserved)) {
    localStorage.setItem(key, val);
  }
}

// Reset and re-initialize sample patients
export function resetSamplePatients(): void {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem(patientsKey());
  localStorage.removeItem(initializedKey());
  initializeSamplePatients();
}

// Generate and save mock patients (up to `count`), returns saved records
export function generateMockPatients(count: number = 5): PatientRow[] {
  if (typeof window === "undefined") return [];

  const existing = getPatients();
  const toAdd = samplePatients.slice(0, Math.min(count, samplePatients.length));

  const newRecords: PatientRow[] = toAdd.map((p, i) => ({
    ...p,
    id: `mock-${Date.now()}-${i}`,
    patientId: generatePatientId(),
    ownerId: generateOwnerId(),
    photoUrl: getMockPatientAvatar(p.species),
  }));

  savePatients([...existing, ...newRecords]);
  
  // Real-time broadcast for each new patient
  newRecords.forEach(patient => {
    try {
      broadcast({
        type: EVENTS.PATIENT_ADMITTED,
        payload: { patientName: patient.name, patientId: patient.patientId, species: patient.species ?? "" },
        actorRole: "System",
        actorName: "Demo Generator",
        clinicId: getActiveAccountId(),
        timestamp: new Date().toISOString(),
      });
    } catch {}
  });
  
  return newRecords;
}

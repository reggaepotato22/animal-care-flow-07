export type PatientRow = {
  id: string;
  patientId: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  owner: string;
  phone: string;
  location: string;
  lastVisit: string;
  status: "healthy" | "treatment" | "critical";
  sex: string;
  color: string;
  microchip: string;
  ownerId?: string;
  ownerType?: string;
  alternatePhone?: string;
  email: string;
  preferredContact?: string;
  address: string;
  city?: string;
  postalCode?: string;
  billingAddress?: string;
  nextAppointment?: string;
  vaccinations?: Array<{ name: string; date: string; due: string }>;
  allergies: string[];
  medications?: Array<{ name: string; dosage: string; prescribed: string }>;
  vitals?: Array<{ date: string; temperature: string; heartRate: string; respiratoryRate: string; weight: string; bloodPressure: string }>;
  recentVisits?: Array<{ date: string; reason: string; vet: string; notes: string }>;
  medicalHistory?: Array<{
    id: string;
    date: string;
    time: string;
    type: string;
    personnel: string;
    role: string;
    description: string;
    quantity: number;
    amount: number;
    status: string;
    notes: string;
  }>;
};

/**
 * @deprecated This constant is deprecated. Use the patientStore functions from '@/lib/patientStore' instead.
 * The sample patients are now stored in localStorage and can be deleted via the Settings page.
 * Use `initializeSamplePatients()` to create the 5 sample patients on app startup.
 * Use `getPatients()` to retrieve all patients.
 */
export const mockPatients: PatientRow[] = [
  {
    id: "1",
    patientId: "P-2025-10234",
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    age: "3 years",
    weight: "28kg",
    sex: "Male",
    color: "Golden",
    microchip: "123456789012345",
    owner: "Sarah Johnson",
    ownerId: "C-2025-001",
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
      { date: "2023-11-20", temperature: "38.2°C", heartRate: "85 bpm", respiratoryRate: "18 rpm", weight: "27.8kg", bloodPressure: "Normal" },
      { date: "2023-08-10", temperature: "38.3°C", heartRate: "82 bpm", respiratoryRate: "19 rpm", weight: "27.5kg", bloodPressure: "Normal" }
    ],
    recentVisits: [
      { date: "2024-01-15", reason: "Annual Checkup", vet: "Dr. Smith", notes: "Healthy dog, all vitals normal" },
      { date: "2023-11-20", reason: "Vaccination", vet: "Dr. Johnson", notes: "Booster shots administered" },
      { date: "2023-08-10", reason: "Dental Cleaning", vet: "Dr. Smith", notes: "Routine dental cleaning completed" }
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
      },
      {
        id: "MH-002",
        date: "2023-12-20",
        time: "2:15 PM",
        type: "Vaccination",
        personnel: "Dr. Michael Johnson",
        role: "Veterinarian",
        description: "Rabies vaccination booster",
        quantity: 1,
        amount: 85.00,
        status: "Completed",
        notes: "Annual rabies booster administered. No adverse reactions observed."
      }
    ]
  },
  {
    id: "2",
    patientId: "P-2025-10235",
    name: "Whiskers",
    species: "Cat",
    breed: "Persian",
    age: "5 years",
    weight: "4.2kg",
    sex: "Female",
    color: "White",
    microchip: "987654321098765",
    owner: "Michael Chen",
    ownerId: "C-2025-002",
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
    id: "3",
    patientId: "P-2025-10236",
    name: "Luna",
    species: "Cat",
    breed: "Maine Coon",
    age: "2 years",
    weight: "5.1kg",
    sex: "Female",
    color: "Gray Tabby",
    microchip: "456789123456789",
    owner: "Emily Rodriguez",
    ownerId: "C-2025-003",
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
    id: "4",
    patientId: "P-2025-10237",
    name: "Rocky",
    species: "Dog",
    breed: "German Shepherd",
    age: "7 years",
    weight: "35kg",
    sex: "Male",
    color: "Black and Tan",
    microchip: "789012345678901",
    owner: "David Thompson",
    phone: "+1 (555) 321-0987",
    email: "david.thompson@email.com",
    address: "321 Elm Street, Emergency District",
    location: "Emergency Center",
    lastVisit: "2024-01-19",
    status: "critical",
    allergies: ["Chicken", "Wheat"],
  },
  {
    id: "5",
    patientId: "P-2025-10238",
    name: "Bella",
    species: "Dog",
    breed: "Beagle",
    age: "4 years",
    weight: "12kg",
    sex: "Female",
    color: "Tri-color",
    microchip: "234567890123456",
    owner: "Lisa Anderson",
    phone: "+1 (555) 222-3333",
    email: "lisa.anderson@email.com",
    address: "222 Birch Lane, Suburbs",
    location: "Downtown Clinic",
    lastVisit: "2024-02-01",
    status: "healthy",
    allergies: [],
  },
  {
    id: "6",
    patientId: "P-2025-10239",
    name: "Oliver",
    species: "Cat",
    breed: "Siamese",
    age: "1 year",
    weight: "3.8kg",
    sex: "Male",
    color: "Seal Point",
    microchip: "345678901234567",
    owner: "James Wilson",
    phone: "+1 (555) 444-5555",
    email: "james.wilson@email.com",
    address: "444 Cedar Road, Heights",
    location: "North Branch",
    lastVisit: "2024-02-05",
    status: "treatment",
    allergies: ["Seafood"],
  },
  {
    id: "7",
    patientId: "P-2025-10240",
    name: "Daisy",
    species: "Rabbit",
    breed: "Holland Lop",
    age: "2 years",
    weight: "1.5kg",
    sex: "Female",
    color: "Brown",
    microchip: "456789012345678",
    owner: "Robert Taylor",
    phone: "+1 (555) 666-7777",
    email: "robert.taylor@email.com",
    address: "666 Willow Way, Riverside",
    location: "Main Office",
    lastVisit: "2024-02-10",
    status: "healthy",
    allergies: [],
  },
  {
    id: "8",
    patientId: "P-2025-10241",
    name: "Charlie",
    species: "Dog",
    breed: "Labrador",
    age: "6 years",
    weight: "32kg",
    sex: "Male",
    color: "Black",
    microchip: "567890123456789",
    owner: "Jennifer Martinez",
    phone: "+1 (555) 888-9999",
    email: "jennifer.martinez@email.com",
    address: "888 Poplar Street, Parkside",
    location: "Downtown Clinic",
    lastVisit: "2024-02-12",
    status: "healthy",
    allergies: [],
  },
  {
    id: "9",
    patientId: "P-2025-10242",
    name: "Milo",
    species: "Dog",
    breed: "Poodle",
    age: "8 years",
    weight: "8kg",
    sex: "Male",
    color: "White",
    microchip: "678901234567890",
    owner: "William Davis",
    phone: "+1 (555) 111-2222",
    email: "william.davis@email.com",
    address: "111 Aspen Court, Hills",
    location: "North Branch",
    lastVisit: "2024-02-15",
    status: "treatment",
    allergies: ["Grass"],
  },
  {
    id: "10",
    patientId: "P-2025-10243",
    name: "Coco",
    species: "Bird",
    breed: "African Grey",
    age: "15 years",
    weight: "450g",
    sex: "Unknown",
    color: "Grey",
    microchip: "N/A",
    owner: "Patricia Garcia",
    phone: "+1 (555) 333-4444",
    email: "patricia.garcia@email.com",
    address: "333 Magnolia Drive, Gardens",
    location: "Main Office",
    lastVisit: "2024-02-20",
    status: "healthy",
    allergies: [],
  },
];


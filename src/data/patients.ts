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
};

export const mockPatients: PatientRow[] = [
  {
    id: "1",
    patientId: "P-2025-10234",
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    age: "3 years",
    weight: "28kg",
    owner: "Sarah Johnson",
    phone: "+1 (555) 123-4567",
    location: "Downtown Clinic",
    lastVisit: "2024-01-15",
    status: "healthy",
  },
  {
    id: "2",
    patientId: "P-2025-10235",
    name: "Whiskers",
    species: "Cat",
    breed: "Persian",
    age: "5 years",
    weight: "4.2kg",
    owner: "Michael Chen",
    phone: "+1 (555) 987-6543",
    location: "North Branch",
    lastVisit: "2024-01-18",
    status: "treatment",
  },
  {
    id: "3",
    patientId: "P-2025-10236",
    name: "Luna",
    species: "Cat",
    breed: "Maine Coon",
    age: "2 years",
    weight: "5.1kg",
    owner: "Emily Rodriguez",
    phone: "+1 (555) 456-7890",
    location: "Main Office",
    lastVisit: "2024-01-20",
    status: "healthy",
  },
  {
    id: "4",
    patientId: "P-2025-10237",
    name: "Rocky",
    species: "Dog",
    breed: "German Shepherd",
    age: "7 years",
    weight: "35kg",
    owner: "David Thompson",
    phone: "+1 (555) 321-0987",
    location: "Emergency Center",
    lastVisit: "2024-01-19",
    status: "critical",
  },
];


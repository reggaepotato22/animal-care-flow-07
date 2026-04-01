export interface Owner {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: "dog" | "cat" | "bird" | "rabbit" | "hamster" | "reptile" | "other";
  breed: string;
  age?: string;
  weight?: string;
}

export type EncounterType = "CONSULTATION" | "TRIAGE" | "PROCEDURE" | "SURGERY" | "FOLLOW_UP" | "HOSPITAL_ROUND";

export type EncounterStatus =
  | "WAITING"
  | "IN_TRIAGE" | "TRIAGED"
  | "IN_CONSULTATION"
  | "IN_PROCEDURE"
  | "IN_SURGERY" | "RECOVERY"
  | "IN_FOLLOW_UP"
  | "IN_HOSPITAL_ROUND"
  | "DISCHARGED";

export interface Encounter {
  id: string;
  patientId: string;
  type?: EncounterType;
  status: EncounterStatus;
  startTime: string;
  endTime?: string;
  reason: string;
  chiefComplaint: string;
  veterinarian: string;
  notes?: string;
  petName?: string;
  ownerName?: string;
  appointmentTime?: string;
  appointmentType?: string;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  encounterId?: string;
  visitDate: string;
  diagnosis?: string;
  prescription?: string;
  veterinarian?: string;
  signature?: string;
}

export interface InvoiceLine {
  id: string;
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  petId: string;
  ownerId: string;
  createdAt: string;
  lines: InvoiceLine[];
  total: number;
  currency: "KES";
  status: "unpaid" | "paid" | "void";
}


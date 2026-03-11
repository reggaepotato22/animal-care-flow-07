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

export interface MedicalRecord {
  id: string;
  petId: string;
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


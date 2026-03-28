
import { logCreate, logUpdate, logDelete } from "./audit";

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: string;
  startDate: string;
  schedule: string;
  avatar: string | null;
}

const STAFF_STORAGE_KEY = "vetcare_staff";

export const sampleStaff: Omit<Staff, "id">[] = [
  {
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@vetcare.com",
    phone: "(555) 123-4567",
    role: "Senior Veterinarian",
    department: "Clinical",
    status: "active",
    startDate: "2022-01-15",
    schedule: "Monday-Friday, 8:00 AM - 6:00 PM",
    avatar: null,
  },
  {
    name: "Michael Chen",
    email: "michael.chen@vetcare.com", 
    phone: "(555) 234-5678",
    role: "Veterinary Technician",
    department: "Clinical",
    status: "active",
    startDate: "2023-03-20",
    schedule: "Tuesday-Saturday, 9:00 AM - 5:00 PM",
    avatar: null,
  },
  {
    name: "Emma Rodriguez",
    email: "emma.rodriguez@vetcare.com",
    phone: "(555) 345-6789",
    role: "Practice Manager",
    department: "Administration",
    status: "active",
    startDate: "2021-11-08",
    schedule: "Monday-Friday, 7:00 AM - 4:00 PM",
    avatar: null,
  },
  {
    name: "David Kim",
    email: "david.kim@vetcare.com",
    phone: "(555) 456-7890",
    role: "Receptionist",
    department: "Front Office",
    status: "active",
    startDate: "2023-06-12",
    schedule: "Wednesday-Sunday, 10:00 AM - 6:00 PM",
    avatar: null,
  },
];

export function getStaff(): Staff[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STAFF_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveStaff(staff: Staff[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
}

export function addStaff(member: Omit<Staff, "id">): Staff {
  const staff = getStaff();
  const newMember = { ...member, id: Math.random().toString(36).substr(2, 9) };
  staff.push(newMember);
  saveStaff(staff);
  logCreate({
    entityType: "User", // Use User for staff members as well in audit logs
    entityId: newMember.id,
    field: "name",
    previousValue: "",
    newValue: newMember.name,
    changedBy: "System",
    reason: `Added staff member: ${newMember.name}`
  });
  return newMember;
}

export function initializeSampleStaff(): void {
  const existing = getStaff();
  if (existing.length === 0) {
    const seeded = sampleStaff.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
    saveStaff(seeded);
  }
}

export function clearStaff(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STAFF_STORAGE_KEY);
}

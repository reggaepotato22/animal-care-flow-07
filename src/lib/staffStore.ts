
import { logCreate, logUpdate, logDelete } from "./audit";
import { getAccountScopedKey } from "@/lib/accountStore";

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
  availability: string;
  avatar: string | null;
}

const STAFF_STORAGE_KEY_BASE = "vetcare_staff";

function staffKey() {
  return getAccountScopedKey(STAFF_STORAGE_KEY_BASE);
}

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
    availability: "available",
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
    availability: "available",
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
    availability: "available",
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
    availability: "available",
    avatar: null,
  },
];

export function getStaff(): Staff[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(staffKey());
  return stored ? JSON.parse(stored) : [];
}

export function saveStaff(staff: Staff[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(staffKey(), JSON.stringify(staff));
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

// Mock staff avatar URLs
export const MOCK_STAFF_AVATARS = [
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop",
];

// Get random mock staff avatar
export function getMockStaffAvatar(index?: number): string {
  if (index !== undefined && index >= 0 && index < MOCK_STAFF_AVATARS.length) {
    return MOCK_STAFF_AVATARS[index];
  }
  return MOCK_STAFF_AVATARS[Math.floor(Math.random() * MOCK_STAFF_AVATARS.length)];
}

// Initialize sample staff - DISABLED by default (zero data start)
// Call this function explicitly to generate demo data
export function initializeSampleStaff(): void {
  const existing = getStaff();
  if (existing.length === 0) {
    const seeded = sampleStaff.map((s, i) => ({ 
      ...s, 
      id: Math.random().toString(36).substr(2, 9),
      avatar: getMockStaffAvatar(i),
    }));
    saveStaff(seeded);
  }
}

export function clearStaff(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(staffKey());
}

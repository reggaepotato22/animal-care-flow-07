import type { Role } from "@/lib/rbac";

export interface StaffProfile {
  id: string;
  name: string;
  role: Role;
  displayRole: string;
  email: string;
  initials: string;
}

const PROFILES_KEY = "acf_staff_profiles";

export function getStaffProfiles(): StaffProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveStaffProfiles(profiles: StaffProfile[]): void {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch {}
}

export function addStaffProfile(profile: Omit<StaffProfile, "id">): StaffProfile {
  const p: StaffProfile = { ...profile, id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  saveStaffProfiles([...getStaffProfiles(), p]);
  return p;
}

export function getActiveStaffProfile(): StaffProfile | null {
  try {
    const raw = localStorage.getItem("acf_active_profile");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function seedDemoStaffProfiles(): void {
  if (getStaffProfiles().length > 0) return;
  saveStaffProfiles([
    { id: "sp-1", name: "Dr. Andrew Kamau", role: "SuperAdmin",   displayRole: "Super Admin",   email: "andrew@innovetpro.clinic", initials: "AK" },
    { id: "sp-2", name: "Dr. Sarah Omondi", role: "Vet",          displayRole: "Veterinarian",  email: "sarah@innovetpro.clinic",  initials: "SO" },
    { id: "sp-3", name: "Faith Wanjiku",    role: "Receptionist", displayRole: "Receptionist",  email: "faith@innovetpro.clinic",  initials: "FW" },
    { id: "sp-4", name: "James Mwangi",     role: "Pharmacist",   displayRole: "Pharmacist",    email: "james@innovetpro.clinic",  initials: "JM" },
    { id: "sp-5", name: "Grace Atieno",     role: "Nurse",        displayRole: "Nurse",         email: "grace@innovetpro.clinic",  initials: "GA" },
    { id: "sp-6", name: "Peter Otieno",     role: "Nurse",        displayRole: "Attendant",     email: "peter@innovetpro.clinic",  initials: "PO" },
  ]);
}

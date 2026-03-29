
import { logCreate } from "./audit";
import { getAccountScopedKey } from "@/lib/accountStore";

export interface Role {
  id: string;
  title: string;
  department: string;
  staffCount: number;
  permissions: string[];
  modulePermissions: ModulePermissions;
  description: string;
  groupId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId?: string;
  groupIds: string[];
  status: "active" | "inactive";
  startDate: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  roleIds: string[];
  color?: string;
}

export interface ModulePermissions {
  [key: string]: {
    read: boolean;
    create: boolean;
    write: boolean;
    delete: boolean;
  };
}

const ROLES_KEY_BASE = "vetcare_roles";
const GROUPS_KEY_BASE = "vetcare_groups";
const USERS_KEY_BASE = "vetcare_users";

function rolesKey() {
  return getAccountScopedKey(ROLES_KEY_BASE);
}

function groupsKey() {
  return getAccountScopedKey(GROUPS_KEY_BASE);
}

function usersKey() {
  return getAccountScopedKey(USERS_KEY_BASE);
}

export function getRoles(): Role[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(rolesKey());
  return stored ? JSON.parse(stored) : [];
}

export function saveRoles(roles: Role[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(rolesKey(), JSON.stringify(roles));
}

export function getGroups(): UserGroup[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(groupsKey());
  return stored ? JSON.parse(stored) : [];
}

export function saveGroups(groups: UserGroup[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(groupsKey(), JSON.stringify(groups));
}

export function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(usersKey());
  return stored ? JSON.parse(stored) : [];
}

export function saveUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(usersKey(), JSON.stringify(users));
}

export const sampleRoles: Role[] = [
  {
    id: "1",
    title: "Senior Veterinarian",
    department: "Clinical",
    staffCount: 4,
    permissions: ["all_access", "clinical_authority", "prescribe"],
    modulePermissions: {
      patients: { read: true, create: true, write: true, delete: false },
      appointments: { read: true, create: true, write: true, delete: true },
      records: { read: true, create: true, write: true, delete: true },
      labs: { read: true, create: true, write: true, delete: false },
      postmortem: { read: true, create: true, write: true, delete: false },
      hospitalization: { read: true, create: true, write: true, delete: false },
      treatments: { read: true, create: true, write: true, delete: false },
      inventory: { read: true, create: false, write: false, delete: false },
      staff: { read: true, create: false, write: false, delete: false },
      reports: { read: true, create: true, write: true, delete: false },
    },
    description: "Lead veterinarian with full clinical authority",
    groupId: "group-4",
  }
];

export const sampleGroups: UserGroup[] = [
  {
    id: "group-4",
    name: "Veterinarians",
    description: "Clinical staff with full medical authority",
    roleIds: ["1"],
    color: "bg-blue-100 text-blue-800",
  }
];

export const sampleUsers: User[] = [
  {
    id: "user-1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@vetcare.com",
    phone: "(555) 123-4567",
    roleId: "1",
    groupIds: ["group-4"],
    status: "active",
    startDate: "2022-01-15",
  }
];

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Users, Settings, UserCog, FolderTree, UserPlus, Bell, Send, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define system modules
export const SYSTEM_MODULES = [
  { id: "patients", name: "Patients" },
  { id: "appointments", name: "Appointments" },
  { id: "records", name: "Clinical Records" },
  { id: "labs", name: "Labs" },
  { id: "postmortem", name: "Post-Mortem" },
  { id: "hospitalization", name: "Hospitalization" },
  { id: "treatments", name: "Treatments" },
  { id: "inventory", name: "Inventory" },
  { id: "staff", name: "Staff" },
  { id: "reports", name: "Reports" },
] as const;

// Define permission types
export const PERMISSION_TYPES = [
  { id: "read", name: "Read" },
  { id: "create", name: "Create" },
  { id: "write", name: "Write" },
  { id: "delete", name: "Delete" },
] as const;

// Type definitions
export type ModuleId = typeof SYSTEM_MODULES[number]["id"];
export type PermissionType = typeof PERMISSION_TYPES[number]["id"];

export interface ModulePermissions {
  [moduleId: string]: {
    read: boolean;
    create: boolean;
    write: boolean;
    delete: boolean;
  };
}

export interface Role {
  id: string;
  title: string;
  department: string;
  staffCount: number;
  permissions: string[]; // Legacy permissions array
  modulePermissions?: ModulePermissions; // New module-based permissions
  description: string;
  groupId?: string; // User group this role belongs to
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  roleIds: string[]; // Roles that belong to this group
  color?: string; // Optional color for visual distinction
  // Note: Permissions are computed from assigned roles, not stored
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId?: string; // Assigned role
  groupIds: string[]; // Assigned user groups
  status: "active" | "inactive";
  startDate: string;
}

// Initialize default permissions (all false)
const getDefaultModulePermissions = (): ModulePermissions => {
  const permissions: ModulePermissions = {};
  SYSTEM_MODULES.forEach((module) => {
    permissions[module.id] = {
      read: false,
      create: false,
      write: false,
      delete: false,
    };
  });
  return permissions;
};

// Calculate aggregated permissions from roles
const calculateGroupPermissions = (roleIds: string[], allRoles: Role[]): ModulePermissions => {
  const aggregatedPermissions: ModulePermissions = getDefaultModulePermissions();
  
  // Get all roles assigned to this group
  const groupRoles = allRoles.filter((role) => roleIds.includes(role.id));
  
  // Aggregate permissions: if ANY role has a permission, the group has it
  groupRoles.forEach((role) => {
    const rolePermissions = role.modulePermissions || {};
    SYSTEM_MODULES.forEach((module) => {
      const modulePerms = rolePermissions[module.id];
      if (modulePerms) {
        // Use OR logic: if any role has permission, group has it
        aggregatedPermissions[module.id] = {
          read: aggregatedPermissions[module.id].read || modulePerms.read,
          create: aggregatedPermissions[module.id].create || modulePerms.create,
          write: aggregatedPermissions[module.id].write || modulePerms.write,
          delete: aggregatedPermissions[module.id].delete || modulePerms.delete,
        };
      }
    });
  });
  
  return aggregatedPermissions;
};

// Mock user groups data
// Note: Permissions are computed from assigned roles, not stored
const mockUserGroups: UserGroup[] = [
  {
    id: "group-1",
    name: "Administrators",
    description: "Full system access and administrative privileges",
    roleIds: ["3"],
    color: "bg-red-100 text-red-800",
  },
  {
    id: "group-2",
    name: "Technicians",
    description: "Clinical support staff with technical expertise",
    roleIds: ["2"],
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "group-3",
    name: "Front Desk / Reception",
    description: "Front office staff handling customer interactions",
    roleIds: ["4"],
    color: "bg-green-100 text-green-800",
  },
  {
    id: "group-4",
    name: "Veterinarians",
    description: "Licensed veterinarians with clinical authority",
    roleIds: ["1"],
    color: "bg-purple-100 text-purple-800",
  },
];

// Mock roles data
const mockRoles: Role[] = [
  {
    id: "1",
    title: "Senior Veterinarian",
    department: "Clinical",
    staffCount: 2,
    permissions: ["diagnose", "prescribe", "surgery", "supervise"],
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
  },
  {
    id: "2", 
    title: "Veterinary Technician",
    department: "Clinical",
    staffCount: 3,
    permissions: ["assist", "administer_meds", "lab_work"],
    modulePermissions: {
      patients: { read: true, create: false, write: true, delete: false },
      appointments: { read: true, create: true, write: true, delete: false },
      records: { read: true, create: true, write: true, delete: false },
      labs: { read: true, create: true, write: true, delete: false },
      postmortem: { read: true, create: false, write: false, delete: false },
      hospitalization: { read: true, create: true, write: true, delete: false },
      treatments: { read: true, create: true, write: true, delete: false },
      inventory: { read: true, create: false, write: false, delete: false },
      staff: { read: false, create: false, write: false, delete: false },
      reports: { read: true, create: false, write: false, delete: false },
    },
    description: "Licensed technician providing veterinary support",
    groupId: "group-2",
  },
  {
    id: "3",
    title: "Practice Manager",
    department: "Administration", 
    staffCount: 1,
    permissions: ["manage_staff", "finances", "scheduling", "reports"],
    modulePermissions: {
      patients: { read: true, create: true, write: true, delete: true },
      appointments: { read: true, create: true, write: true, delete: true },
      records: { read: true, create: true, write: true, delete: true },
      labs: { read: true, create: true, write: true, delete: true },
      postmortem: { read: true, create: true, write: true, delete: true },
      hospitalization: { read: true, create: true, write: true, delete: true },
      treatments: { read: true, create: true, write: true, delete: true },
      inventory: { read: true, create: true, write: true, delete: true },
      staff: { read: true, create: true, write: true, delete: true },
      reports: { read: true, create: true, write: true, delete: true },
    },
    description: "Oversees practice operations and staff management",
    groupId: "group-1",
  },
  {
    id: "4",
    title: "Receptionist",
    department: "Front Office",
    staffCount: 2,
    permissions: ["appointments", "customer_service", "billing"],
    modulePermissions: {
      patients: { read: true, create: true, write: true, delete: false },
      appointments: { read: true, create: true, write: true, delete: true },
      records: { read: true, create: false, write: false, delete: false },
      labs: { read: true, create: false, write: false, delete: false },
      postmortem: { read: false, create: false, write: false, delete: false },
      hospitalization: { read: true, create: false, write: false, delete: false },
      treatments: { read: true, create: false, write: false, delete: false },
      inventory: { read: true, create: false, write: false, delete: false },
      staff: { read: false, create: false, write: false, delete: false },
      reports: { read: false, create: false, write: false, delete: false },
    },
    description: "Front desk operations and customer service",
    groupId: "group-3",
  },
];

// Mock users data
const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@vetcare.com",
    phone: "(555) 123-4567",
    roleId: "1",
    groupIds: ["group-4"],
    status: "active",
    startDate: "2022-01-15",
  },
  {
    id: "user-2",
    name: "Michael Chen",
    email: "michael.chen@vetcare.com",
    phone: "(555) 234-5678",
    roleId: "2",
    groupIds: ["group-2"],
    status: "active",
    startDate: "2023-03-20",
  },
  {
    id: "user-3",
    name: "Emma Rodriguez",
    email: "emma.rodriguez@vetcare.com",
    phone: "(555) 345-6789",
    roleId: "3",
    groupIds: ["group-1"],
    status: "active",
    startDate: "2021-11-08",
  },
  {
    id: "user-4",
    name: "David Kim",
    email: "david.kim@vetcare.com",
    phone: "(555) 456-7890",
    roleId: "4",
    groupIds: ["group-3"],
    status: "active",
    startDate: "2023-06-12",
  },
];

// Add/Edit Role Dialog Component
interface RoleDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (roleData: Omit<Role, "id" | "staffCount" | "permissions" | "groupId">) => void;
}

function RoleDialog({ role, open, onOpenChange, onSave }: RoleDialogProps) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<ModulePermissions>(getDefaultModulePermissions());

  useEffect(() => {
    if (role) {
      setTitle(role.title);
      setDepartment(role.department);
      setDescription(role.description);
      setPermissions(role.modulePermissions || getDefaultModulePermissions());
    } else {
      setTitle("");
      setDepartment("");
      setDescription("");
      setPermissions(getDefaultModulePermissions());
    }
  }, [role, open]);

  const handleSave = () => {
    if (!title.trim() || !department.trim()) {
      return;
    }
    onSave({
      title: title.trim(),
      department: department.trim(),
      description: description.trim(),
      modulePermissions: permissions,
    });
    onOpenChange(false);
  };

  const handlePermissionToggle = (
    moduleId: string,
    permissionType: PermissionType,
    checked: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [permissionType]: checked,
      },
    }));
  };

  const handleSelectAll = (moduleId: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        read: checked,
        create: checked,
        write: checked,
        delete: checked,
      },
    }));
  };

  const handleSelectAllModules = (permissionType: PermissionType, checked: boolean) => {
    const newPermissions: ModulePermissions = {};
    SYSTEM_MODULES.forEach((module) => {
      newPermissions[module.id] = {
        ...permissions[module.id],
        [permissionType]: checked,
      };
    });
    setPermissions(newPermissions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "Add New Role"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Update role details, information, and permissions."
              : "Create a new role with specific permissions and responsibilities."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pr-4">
          {/* Basic Role Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Role Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Veterinarian"
              />
            </div>
            <div>
              <Label htmlFor="department">User Group</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clinical">Clinical</SelectItem>
                  <SelectItem value="Surgery">Surgery</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Front Office">Front Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Role responsibilities and requirements"
              />
            </div>
          </div>

          {/* Permissions Section */}
          <div>
            <Label>Permissions</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select the permissions for this role across different modules.
            </p>
            <div className="space-y-3 border rounded-md p-4">
              {/* Permission Type Headers */}
              <div className="sticky top-0 bg-background z-10 pb-2 border-b">
                <div className="grid grid-cols-[200px_repeat(4,1fr)] gap-4 items-center">
                  <div className="font-semibold text-sm">Module</div>
                  {PERMISSION_TYPES.map((permType) => (
                    <div key={permType.id} className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium">{permType.name}</span>
                      <Switch
                        checked={SYSTEM_MODULES.every(
                          (module) => permissions[module.id]?.[permType.id] === true
                        )}
                        onCheckedChange={(checked) => handleSelectAllModules(permType.id, checked)}
                        className="scale-75"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Rows */}
              {SYSTEM_MODULES.map((module) => {
                const modulePerms = permissions[module.id] || {
                  read: false,
                  create: false,
                  write: false,
                  delete: false,
                };
                const allSelected =
                  modulePerms.read && modulePerms.create && modulePerms.write && modulePerms.delete;

                return (
                  <div
                    key={module.id}
                    className="grid grid-cols-[200px_repeat(4,1fr)] gap-4 items-center py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{module.name}</span>
                      <Switch
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAll(module.id, checked)}
                        className="scale-75"
                      />
                    </div>
                    {PERMISSION_TYPES.map((permType) => (
                      <div key={permType.id} className="flex justify-center">
                        <Switch
                          checked={modulePerms[permType.id] || false}
                          onCheckedChange={(checked) =>
                            handlePermissionToggle(module.id, permType.id, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !department.trim()}>
            {role ? "Update Role" : "Create Role"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Permissions Management Dialog Component
interface PermissionsDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (permissions: ModulePermissions) => void;
}

function PermissionsDialog({ role, open, onOpenChange, onSave }: PermissionsDialogProps) {
  const [permissions, setPermissions] = useState<ModulePermissions>(
    role?.modulePermissions || getDefaultModulePermissions()
  );

  // Update permissions when role changes
  useEffect(() => {
    if (role) {
      setPermissions(role.modulePermissions || getDefaultModulePermissions());
    }
  }, [role]);

  const handlePermissionToggle = (
    moduleId: string,
    permissionType: PermissionType,
    checked: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [permissionType]: checked,
      },
    }));
  };

  const handleSave = () => {
    onSave(permissions);
    onOpenChange(false);
  };

  const handleSelectAll = (moduleId: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        read: checked,
        create: checked,
        write: checked,
        delete: checked,
      },
    }));
  };

  const handleSelectAllModules = (permissionType: PermissionType, checked: boolean) => {
    const newPermissions: ModulePermissions = {};
    SYSTEM_MODULES.forEach((module) => {
      newPermissions[module.id] = {
        ...permissions[module.id],
        [permissionType]: checked,
      };
    });
    setPermissions(newPermissions);
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {role.title}</DialogTitle>
          <DialogDescription>
            Enable or disable permissions for different modules in the system.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Permission Type Headers */}
            <div className="sticky top-0 bg-background z-10 pb-2 border-b">
              <div className="grid grid-cols-[200px_repeat(4,1fr)] gap-4 items-center">
                <div className="font-semibold">Module</div>
                {PERMISSION_TYPES.map((permType) => (
                  <div key={permType.id} className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium">{permType.name}</span>
                    <Switch
                      checked={SYSTEM_MODULES.every(
                        (module) => permissions[module.id]?.[permType.id] === true
                      )}
                      onCheckedChange={(checked) =>
                        handleSelectAllModules(permType.id, checked)
                      }
                      className="scale-75"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Module Rows */}
            {SYSTEM_MODULES.map((module) => {
              const modulePerms = permissions[module.id] || {
                read: false,
                create: false,
                write: false,
                delete: false,
              };
              const allSelected =
                modulePerms.read &&
                modulePerms.create &&
                modulePerms.write &&
                modulePerms.delete;

              return (
                <div
                  key={module.id}
                  className="grid grid-cols-[200px_repeat(4,1fr)] gap-4 items-center py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{module.name}</span>
                    <Switch
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        handleSelectAll(module.id, checked)
                      }
                      className="scale-75"
                    />
                  </div>
                  {PERMISSION_TYPES.map((permType) => (
                    <div key={permType.id} className="flex justify-center">
                      <Switch
                        checked={modulePerms[permType.id] || false}
                        onCheckedChange={(checked) =>
                          handlePermissionToggle(module.id, permType.id, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Permissions</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// User Group Management Dialog Component
interface UserGroupDialogProps {
  group: UserGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (group: Omit<UserGroup, "id">, userIds?: string[]) => void;
  allRoles: Role[];
  allUsers: User[];
  onUpdateUsers?: (groupId: string, userIds: string[]) => void;
}

function UserGroupDialog({ group, open, onOpenChange, onSave, allRoles, allUsers, onUpdateUsers }: UserGroupDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [usersToAdd, setUsersToAdd] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description);
      setSelectedRoleIds(group.roleIds);
      // Get users currently in this group
      const groupUserIds = allUsers
        .filter((user) => user.groupIds.includes(group.id))
        .map((user) => user.id);
      setSelectedUserIds(groupUserIds);
      setUsersToAdd([]);
      setUserSearchQuery("");
    } else {
      setName("");
      setDescription("");
      setSelectedRoleIds([]);
      setSelectedUserIds([]);
      setUsersToAdd([]);
      setUserSearchQuery("");
    }
  }, [group, allUsers]);

  // Calculate aggregated permissions from selected roles
  const aggregatedPermissions = calculateGroupPermissions(selectedRoleIds, allRoles);

  const handleSave = () => {
    // Combine existing users and newly added users
    const finalUserIds = group 
      ? [...new Set([...selectedUserIds, ...usersToAdd])]
      : [...usersToAdd];
    
    onSave({
      name,
      description,
      roleIds: selectedRoleIds,
      color: group?.color,
    }, finalUserIds);
    
    // Update users if group exists and onUpdateUsers is provided
    if (group && onUpdateUsers) {
      onUpdateUsers(group.id, finalUserIds);
    }
    
    onOpenChange(false);
  };

  const handleAddUsers = (userIds: string[]) => {
    setUsersToAdd((prev) => [...new Set([...prev, ...userIds])]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    setUsersToAdd((prev) => prev.filter((id) => id !== userId));
  };

  // Get users currently in the group
  const currentGroupUsers = allUsers.filter((user) => 
    group ? user.groupIds.includes(group.id) : false
  );

  // Get users not in the group (available to add)
  const availableUsers = allUsers.filter((user) => 
    group ? !user.groupIds.includes(group.id) : allUsers
  );

  // Filter available users based on search query
  const filteredAvailableUsers = availableUsers.filter((user) => {
    if (!userSearchQuery.trim()) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query)
    );
  });

  // Combine current and newly added users for display
  const allSelectedUsers = [
    ...currentGroupUsers.filter((u) => selectedUserIds.includes(u.id)),
    ...allUsers.filter((u) => usersToAdd.includes(u.id)),
  ];

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    } else {
      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== roleId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{group ? "Edit User Group" : "Create User Group"}</DialogTitle>
          <DialogDescription>
            {group
              ? "Update user group details and permissions."
              : "Create a new user group to organize roles with similar permissions."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Administrators, Technicians"
              />
            </div>
            <div>
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose and scope of this user group"
              />
            </div>
            <div>
              <Label>Assign Roles</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {allRoles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Switch
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={(checked) => handleRoleToggle(role.id, checked)}
                    />
                    <span className="text-sm">{role.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {role.department}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Aggregated Permissions</Label>
              <p className="text-sm text-muted-foreground mb-3">
                These permissions are automatically calculated from all roles assigned to this group. 
                The group inherits permissions from all its roles (union of all role permissions).
              </p>
              <div className="space-y-3 border rounded-md p-4 bg-muted/30">
                <div className="grid grid-cols-[200px_repeat(4,1fr)] gap-4 items-center pb-2 border-b">
                  <div className="font-semibold text-sm">Module</div>
                  {PERMISSION_TYPES.map((permType) => (
                    <div key={permType.id} className="text-sm font-medium text-center">
                      {permType.name}
                    </div>
                  ))}
                </div>
                {SYSTEM_MODULES.map((module) => {
                  const modulePerms = aggregatedPermissions[module.id] || {
                    read: false,
                    create: false,
                    write: false,
                    delete: false,
                  };
                  return (
                    <div
                      key={module.id}
                      className="grid grid-cols-[200px_repeat(4,1fr)] gap-4 items-center py-2 border-b last:border-0"
                    >
                      <div className="text-sm font-medium">{module.name}</div>
                      {PERMISSION_TYPES.map((permType) => (
                        <div key={permType.id} className="flex justify-center">
                          <div className="flex items-center gap-2">
                            {modulePerms[permType.id] ? (
                              <Badge variant="default" className="text-xs">✓</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">—</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {selectedRoleIds.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No roles assigned. Assign roles to see aggregated permissions.
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>{group ? "Manage Users" : "Assign Users"}</Label>
              <p className="text-sm text-muted-foreground mb-3">
                {group 
                  ? "Add or remove users from this group. You can select multiple users at once."
                  : "Select users to assign to this group. You can select multiple users at once."}
              </p>
              
              {/* Current Users in Group (only for existing groups) */}
              {group && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Users in Group ({allSelectedUsers.length})
                    </span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {allSelectedUsers.length > 0 ? (
                      allSelectedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {user.email}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveUser(user.id)}
                            title="Remove from group"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No users in this group
                      </p>
                    )}
                  </div>
                </div>
              )}

                {/* Add Users Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Available Users ({availableUsers.length})
                    </span>
                  </div>
                  {/* Search Input */}
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name, email, or phone..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {filteredAvailableUsers.length > 0 ? (
                      filteredAvailableUsers.map((user) => {
                        const isSelected = usersToAdd.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                          >
                            <Switch
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setUsersToAdd((prev) => [...prev, user.id]);
                                } else {
                                  setUsersToAdd((prev) => prev.filter((id) => id !== user.id));
                                }
                              }}
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">{user.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : userSearchQuery.trim() ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No users found matching "{userSearchQuery}"
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        {group 
                          ? "All users are already in this group"
                          : "No users available"}
                      </p>
                    )}
                  </div>
                  {usersToAdd.length > 0 && (
                    <div className="mt-2 p-2 bg-primary/10 rounded-md">
                      <p className="text-xs text-primary font-medium">
                        {usersToAdd.length} user{usersToAdd.length !== 1 ? "s" : ""} {group ? "selected to add" : "selected"}
                      </p>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{group ? "Update Group" : "Create Group"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add/Edit User Dialog Component
interface UserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userData: Omit<User, "id">) => void;
  allRoles: Role[];
  allGroups: UserGroup[];
}

function UserDialog({ user, open, onOpenChange, onSave, allRoles, allGroups }: UserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setRoleId(user.roleId || "");
      setSelectedGroupIds(user.groupIds);
      setStatus(user.status);
      setStartDate(user.startDate);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setRoleId("");
      setSelectedGroupIds([]);
      setStatus("active");
      setStartDate(new Date().toISOString().split("T")[0]);
    }
  }, [user, open]);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      return;
    }
    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      roleId: roleId || undefined,
      groupIds: selectedGroupIds,
      status,
      startDate: startDate || new Date().toISOString().split("T")[0],
    });
    onOpenChange(false);
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    } else {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Update user details and group assignments."
              : "Create a new user and assign them to user groups."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
              />
            </div>
            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., john.doe@vetcare.com"
              />
            </div>
            <div>
              <Label htmlFor="user-phone">Phone</Label>
              <Input
                id="user-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="user-role">Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No role assigned</SelectItem>
                  {allRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>User Groups</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Assign this user to one or more user groups. The user will inherit permissions from all assigned groups.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {allGroups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Switch
                      checked={selectedGroupIds.includes(group.id)}
                      onCheckedChange={(checked) => handleGroupToggle(group.id, checked)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Badge className={group.color || "bg-gray-100 text-gray-800"}>
                        {group.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{group.description}</span>
                    </div>
                  </div>
                ))}
                {allGroups.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No user groups available. Create a user group first.
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user-status">Status</Label>
                <Select value={status} onValueChange={(value: "active" | "inactive") => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="user-start-date">Start Date</Label>
                <Input
                  id="user-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !email.trim()}>
            {user ? "Update User" : "Create User"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mass Actions Dialog Component
interface MassActionsDialogProps {
  group: UserGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
}

function MassActionsDialog({ group, open, onOpenChange, users }: MassActionsDialogProps) {
  const [notificationSubject, setNotificationSubject] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Get users in this group
  const groupUsers = group ? users.filter((user) => user.groupIds.includes(group.id)) : [];

  useEffect(() => {
    if (open) {
      setNotificationSubject("");
      setNotificationMessage("");
      setSending(false);
    }
  }, [open]);

  const handleSendNotification = () => {
    if (!notificationSubject.trim() || !notificationMessage.trim() || !group) {
      return;
    }

    setSending(true);
    
    // Simulate sending notification
    setTimeout(() => {
      console.log(`Sending notification to ${groupUsers.length} users in group "${group.name}"`);
      console.log("Subject:", notificationSubject);
      console.log("Message:", notificationMessage);
      console.log("Recipients:", groupUsers.map(u => u.email).join(", "));
      
      setSending(false);
      onOpenChange(false);
      
      // In a real app, you would make an API call here
      alert(`Notification sent to ${groupUsers.length} user(s) in ${group.name}`);
    }, 1000);
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mass Actions - {group.name}</DialogTitle>
          <DialogDescription>
            Perform actions on all users in this group ({groupUsers.length} user{groupUsers.length !== 1 ? "s" : ""}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Send Notification</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Send a notification to all users in this group.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="notification-subject">Subject</Label>
                <Input
                  id="notification-subject"
                  value={notificationSubject}
                  onChange={(e) => setNotificationSubject(e.target.value)}
                  placeholder="e.g., Important Update"
                />
              </div>
              <div>
                <Label htmlFor="notification-message">Message</Label>
                <Textarea
                  id="notification-message"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter your notification message..."
                  rows={6}
                />
              </div>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-1">Recipients ({groupUsers.length}):</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {groupUsers.length > 0 ? (
                    groupUsers.map((user) => (
                      <div key={user.id} className="text-sm text-muted-foreground">
                        {user.name} ({user.email})
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No users assigned to this group.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendNotification} 
            disabled={!notificationSubject.trim() || !notificationMessage.trim() || groupUsers.length === 0 || sending}
          >
            {sending ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [userGroups, setUserGroups] = useState<UserGroup[]>(mockUserGroups);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showMassActionsDialog, setShowMassActionsDialog] = useState(false);
  const [selectedGroupForMassActions, setSelectedGroupForMassActions] = useState<UserGroup | null>(null);

  const handleOpenPermissionsDialog = (role: Role) => {
    setSelectedRoleForPermissions(role);
    setShowPermissionsDialog(true);
  };

  const handleSavePermissions = (permissions: ModulePermissions) => {
    if (selectedRoleForPermissions) {
      setRoles((prevRoles) =>
        prevRoles.map((role) =>
          role.id === selectedRoleForPermissions.id
            ? { ...role, modulePermissions: permissions }
            : role
        )
      );
      setSelectedRoleForPermissions(null);
    }
  };

  const handleOpenEditDialog = (role: Role) => {
    setEditingRole(role);
    setShowEditDialog(true);
  };

  const handleSaveRole = (roleData: Omit<Role, "id" | "staffCount" | "permissions" | "groupId">) => {
    if (editingRole) {
      // Update existing role
      setRoles((prevRoles) =>
        prevRoles.map((role) =>
          role.id === editingRole.id
            ? { ...role, ...roleData }
            : role
        )
      );
      setEditingRole(null);
    } else {
      // Create new role
      const newRole: Role = {
        id: `role-${Date.now()}`,
        ...roleData,
        staffCount: 0,
        permissions: [],
      };
      setRoles([...roles, newRole]);
    }
    setShowEditDialog(false);
    setShowAddDialog(false);
  };

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role);
  };

  const confirmDeleteRole = () => {
    if (roleToDelete) {
      // Remove role from roles list
      setRoles((prevRoles) => prevRoles.filter((role) => role.id !== roleToDelete.id));
      
      // Remove role from user groups
      setUserGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          roleIds: group.roleIds.filter((id) => id !== roleToDelete.id),
        }))
      );
      
      setRoleToDelete(null);
    }
  };

  const handleSaveGroup = (groupData: Omit<UserGroup, "id">, userIds?: string[]) => {
    if (editingGroup) {
      // Remove roles from other groups first
      setUserGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          roleIds: group.id === editingGroup.id 
            ? groupData.roleIds 
            : group.roleIds.filter((id) => !groupData.roleIds.includes(id)),
        }))
      );
      
      // Update the edited group (permissions are computed, not stored)
      setUserGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === editingGroup.id
            ? { ...group, ...groupData }
            : group
        )
      );
      
      // Update roles to reflect group assignment
      setRoles((prevRoles) =>
        prevRoles.map((role) => ({
          ...role,
          groupId: groupData.roleIds.includes(role.id) ? editingGroup.id : 
                   (role.groupId === editingGroup.id ? undefined : role.groupId),
        }))
      );
    } else {
      const newGroup: UserGroup = {
        id: `group-${Date.now()}`,
        ...groupData,
      };
      
      // Remove roles from other groups
      setUserGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          roleIds: group.roleIds.filter((id) => !groupData.roleIds.includes(id)),
        }))
      );
      
      setUserGroups((prevGroups) => [...prevGroups, newGroup]);
      
      // Update roles to reflect group assignment
      setRoles((prevRoles) =>
        prevRoles.map((role) => ({
          ...role,
          groupId: groupData.roleIds.includes(role.id) ? newGroup.id : role.groupId,
        }))
      );

      // Assign users to the new group if any were selected
      if (userIds && userIds.length > 0) {
        setUsers((prevUsers) =>
          prevUsers.map((user) => ({
            ...user,
            groupIds: userIds.includes(user.id)
              ? [...new Set([...user.groupIds, newGroup.id])]
              : user.groupIds,
          }))
        );
      }
    }
    setEditingGroup(null);
  };

  const handleOpenGroupDialog = (group?: UserGroup) => {
    setEditingGroup(group || null);
    setShowGroupDialog(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    setUserGroups((prevGroups) => prevGroups.filter((g) => g.id !== groupId));
    // Remove group assignment from roles
    setRoles((prevRoles) =>
      prevRoles.map((role) => (role.groupId === groupId ? { ...role, groupId: undefined } : role))
    );
  };

  const getGroupForRole = (roleId: string) => {
    return userGroups.find((group) => group.roleIds.includes(roleId));
  };

  const handleOpenAddUserDialog = () => {
    setEditingUser(null);
    setShowAddUserDialog(true);
  };

  const handleOpenEditUserDialog = (user: User) => {
    setEditingUser(user);
    setShowEditUserDialog(true);
  };

  const handleAddUser = (userData: Omit<User, "id">) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...userData,
    };
    setUsers((prevUsers) => [...prevUsers, newUser]);
    setShowAddUserDialog(false);
  };

  const handleUpdateUser = (userData: Omit<User, "id">) => {
    if (!editingUser) return;
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === editingUser.id ? { ...user, ...userData } : user
      )
    );
    setEditingUser(null);
    setShowEditUserDialog(false);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDelete.id));
      setUserToDelete(null);
    }
  };

  const getUserRole = (roleId?: string) => {
    return roles.find((role) => role.id === roleId);
  };

  const getUserGroups = (groupIds: string[]) => {
    return userGroups.filter((group) => groupIds.includes(group.id));
  };

  const getUsersInGroup = (groupId: string) => {
    return users.filter((user) => user.groupIds.includes(groupId));
  };

  const handleOpenMassActionsDialog = (group: UserGroup) => {
    setSelectedGroupForMassActions(group);
    setShowMassActionsDialog(true);
  };

  const handleUpdateUsersInGroup = (groupId: string, userIds: string[]) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => ({
        ...user,
        groupIds: userIds.includes(user.id)
          ? [...new Set([...user.groupIds, groupId])] // Add group if not already present
          : user.groupIds.filter((id) => id !== groupId), // Remove group
      }))
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="roles" className="space-y-6">
        
        <TabsList>
          <TabsTrigger value="roles">
            <UserCog className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="groups">
            <FolderTree className="h-4 w-4 mr-2" />
            User Groups
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingRole(null);
              setShowAddDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>

      {/* Roles Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{role.title}</CardTitle>
              <Badge variant="secondary" className="w-fit">
                {role.department}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{role.staffCount} staff members</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>User Group</TableHead>
                <TableHead>Staff Count</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                // Count enabled permissions
                const modulePerms = role.modulePermissions || {};
                const enabledPermsCount = Object.values(modulePerms).reduce(
                  (count, perms) => {
                    return count + (perms.read ? 1 : 0) + (perms.create ? 1 : 0) + (perms.write ? 1 : 0) + (perms.delete ? 1 : 0);
                  },
                  0
                );

                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{role.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{role.department}</Badge>
                        {getGroupForRole(role.id) && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getGroupForRole(role.id)?.color || ""}`}
                          >
                            {getGroupForRole(role.id)?.name}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{role.staffCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 items-center">
                        {enabledPermsCount > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {enabledPermsCount} permissions enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            No permissions
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenPermissionsDialog(role)}
                          title="Manage Permissions"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenEditDialog(role)}
                          title="Edit Role"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteRole(role)}
                          title="Delete Role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

          {/* Add Role Dialog */}
          <RoleDialog
            role={null}
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onSave={handleSaveRole}
          />

          {/* Edit Role Dialog */}
          <RoleDialog
            role={editingRole}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSave={handleSaveRole}
          />

          {/* Permissions Management Dialog */}
          <PermissionsDialog
            role={selectedRoleForPermissions}
            open={showPermissionsDialog}
            onOpenChange={setShowPermissionsDialog}
            onSave={handleSavePermissions}
          />

          {/* Delete Role Confirmation Dialog */}
          <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the role{" "}
                  <span className="font-semibold">{roleToDelete?.title}</span> and remove it from
                  any associated user groups.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteRole}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenGroupDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add User Group
            </Button>
          </div>

          {/* User Groups Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userGroups.map((group) => {
              const groupRoles = roles.filter((role) => group.roleIds.includes(role.id));
              const totalStaff = groupRoles.reduce((sum, role) => sum + role.staffCount, 0);
              const groupUsers = getUsersInGroup(group.id);
              const aggregatedPerms = calculateGroupPermissions(group.roleIds, roles);
              const enabledPermsCount = Object.values(aggregatedPerms).reduce(
                (count, perms) => {
                  return (
                    count +
                    (perms.read ? 1 : 0) +
                    (perms.create ? 1 : 0) +
                    (perms.write ? 1 : 0) +
                    (perms.delete ? 1 : 0)
                  );
                },
                0
              );

              return (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenMassActionsDialog(group)}>
                            <Bell className="h-4 w-4 mr-2" />
                            Mass Actions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenGroupDialog(group)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Group
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Badge className={`${group.color || "bg-gray-100 text-gray-800"}`}>
                      {groupRoles.length} {groupRoles.length === 1 ? "role" : "roles"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{groupUsers.length} user{groupUsers.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{enabledPermsCount} aggregated permissions</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-2">Roles in this group:</p>
                        <div className="flex flex-wrap gap-1">
                          {groupRoles.map((role) => (
                            <Badge key={role.id} variant="outline" className="text-xs">
                              {role.title}
                            </Badge>
                          ))}
                          {groupRoles.length === 0 && (
                            <span className="text-xs text-muted-foreground">No roles assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* User Groups Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Groups Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Staff Count</TableHead>
                    <TableHead>Aggregated Permissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userGroups.map((group) => {
                    const groupRoles = roles.filter((role) => group.roleIds.includes(role.id));
                    const totalStaff = groupRoles.reduce((sum, role) => sum + role.staffCount, 0);
                    const aggregatedPerms = calculateGroupPermissions(group.roleIds, roles);
                    const enabledPermsCount = Object.values(aggregatedPerms).reduce(
                      (count, perms) => {
                        return (
                          count +
                          (perms.read ? 1 : 0) +
                          (perms.create ? 1 : 0) +
                          (perms.write ? 1 : 0) +
                          (perms.delete ? 1 : 0)
                        );
                      },
                      0
                    );

                    return (
                      <TableRow key={group.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={group.color || "bg-gray-100 text-gray-800"}>
                              {group.name}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {groupRoles.map((role) => (
                              <Badge key={role.id} variant="outline" className="text-xs">
                                {role.title}
                              </Badge>
                            ))}
                            {groupRoles.length === 0 && (
                              <span className="text-xs text-muted-foreground">No roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{totalStaff}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {enabledPermsCount} enabled
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenMassActionsDialog(group)}
                              title="Mass Actions"
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenGroupDialog(group)}
                              title="Edit Group"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteGroup(group.id)}
                              title="Delete Group"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Users</h2>
              <p className="text-muted-foreground">
                Manage users and assign roles and user groups.
              </p>
            </div>
            <Button onClick={handleOpenAddUserDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>User Groups</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No users found. Click "Add User" to create a new user.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const userRole = getUserRole(user.roleId);
                      const userGroups = getUserGroups(user.groupIds);
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>
                            {userRole ? (
                              <Badge variant="outline">{userRole.title}</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">No role</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userGroups.length > 0 ? (
                                userGroups.map((group) => (
                                  <Badge
                                    key={group.id}
                                    className={group.color || "bg-gray-100 text-gray-800"}
                                  >
                                    {group.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">No groups</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.status === "active" ? "default" : "secondary"}
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditUserDialog(user)}
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user)}
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <UserDialog
        user={null}
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        onSave={handleAddUser}
        allRoles={roles}
        allGroups={userGroups}
      />

      {/* Edit User Dialog */}
      <UserDialog
        user={editingUser}
        open={showEditUserDialog}
        onOpenChange={setShowEditUserDialog}
        onSave={handleUpdateUser}
        allRoles={roles}
        allGroups={userGroups}
      />

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user{" "}
              <span className="font-semibold">{userToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Group Dialog */}
      <UserGroupDialog
        group={editingGroup}
        open={showGroupDialog}
        onOpenChange={setShowGroupDialog}
        onSave={handleSaveGroup}
        allRoles={roles}
        allUsers={users}
        onUpdateUsers={handleUpdateUsersInGroup}
      />

      {/* Mass Actions Dialog */}
      <MassActionsDialog
        group={selectedGroupForMassActions}
        open={showMassActionsDialog}
        onOpenChange={setShowMassActionsDialog}
        users={users}
      />
    </div>
  );
}
import { useState } from "react";
import { Plus, Search, Filter, Calendar, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StaffCard } from "@/components/StaffCard";
import { AddStaffDialog } from "@/components/AddStaffDialog";
import { ScheduleManagement } from "@/components/ScheduleManagement";

// Mock data for demonstration
const mockStaff = [
  {
    id: "1",
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
    id: "2",
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
    id: "3",
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
    id: "4",
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

export default function Staff() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredStaff = mockStaff.filter((staff) => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || staff.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = [
    {
      title: "Total Staff",
      value: mockStaff.length,
      icon: Users,
      change: "+2 this month",
    },
    {
      title: "Active Staff",
      value: mockStaff.filter(s => s.status === "active").length,
      icon: UserCheck,
      change: "100% active",
    },
    {
      title: "Departments",
      value: new Set(mockStaff.map(s => s.department)).size,
      icon: Filter,
      change: "3 active",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage staff, roles, and scheduling
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
              <stat.icon className="h-8 w-8 text-primary" />
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Directory
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduling
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-input bg-background text-sm rounded-md"
            >
              <option value="all">All Roles</option>
              <option value="Senior Veterinarian">Senior Veterinarian</option>
              <option value="Veterinary Technician">Veterinary Technician</option>
              <option value="Practice Manager">Practice Manager</option>
              <option value="Receptionist">Receptionist</option>
            </select>
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((staff) => (
              <StaffCard key={staff.id} staff={staff} />
            ))}
          </div>

          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No staff members found</p>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleManagement staff={mockStaff} />
        </TabsContent>
      </Tabs>

      <AddStaffDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
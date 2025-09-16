import { useState } from "react";
import { Calendar, Clock, User, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Staff {
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

interface ScheduleManagementProps {
  staff: Staff[];
}

// Mock schedule data
const mockSchedules = [
  {
    id: "1",
    staffId: "1",
    staffName: "Dr. Sarah Johnson",
    date: "2024-01-15",
    startTime: "08:00",
    endTime: "18:00",
    shift: "Day Shift",
    status: "scheduled",
  },
  {
    id: "2", 
    staffId: "2",
    staffName: "Michael Chen",
    date: "2024-01-15",
    startTime: "09:00",
    endTime: "17:00",
    shift: "Day Shift",
    status: "scheduled",
  },
  {
    id: "3",
    staffId: "3",
    staffName: "Emma Rodriguez",
    date: "2024-01-15",
    startTime: "07:00",
    endTime: "16:00",
    shift: "Early Shift",
    status: "scheduled",
  },
  {
    id: "4",
    staffId: "4",
    staffName: "David Kim",
    date: "2024-01-15",
    startTime: "10:00",
    endTime: "18:00",
    shift: "Day Shift",
    status: "scheduled",
  },
];

const shiftTemplates = [
  { name: "Day Shift", start: "08:00", end: "17:00", hours: 9 },
  { name: "Early Shift", start: "07:00", end: "16:00", hours: 9 },
  { name: "Late Shift", start: "10:00", end: "19:00", hours: 9 },
  { name: "Evening Shift", start: "14:00", end: "23:00", hours: 9 },
  { name: "Night Shift", start: "23:00", end: "07:00", hours: 8 },
];

export function ScheduleManagement({ staff }: ScheduleManagementProps) {
  const [selectedWeek, setSelectedWeek] = useState("current");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [showAddSchedule, setShowAddSchedule] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "absent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "late":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Schedule Management</h2>
          <p className="text-muted-foreground">
            Manage staff schedules and shifts
          </p>
        </div>
        <Dialog open={showAddSchedule} onOpenChange={setShowAddSchedule}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Schedule</DialogTitle>
              <DialogDescription>
                Create a new schedule entry for a staff member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Staff Member</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Shift Template</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {shiftTemplates.map((template) => (
                        <SelectItem key={template.name} value={template.name}>
                          {template.name} ({template.start} - {template.end})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input type="time" />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddSchedule(false)}>
                  Cancel
                </Button>
                <Button>Create Schedule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Shift Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {shiftTemplates.map((template) => (
              <div 
                key={template.name} 
                className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {template.start} - {template.end}
                </p>
                <p className="text-xs text-muted-foreground">
                  {template.hours} hours
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Week</SelectItem>
            <SelectItem value="next">Next Week</SelectItem>
            <SelectItem value="previous">Previous Week</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Clinical">Clinical</SelectItem>
            <SelectItem value="Administration">Administration</SelectItem>
            <SelectItem value="Front Office">Front Office</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Week Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{schedule.staffName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(schedule.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{schedule.shift}</p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const start = new Date(`2000-01-01T${schedule.startTime}`);
                      const end = new Date(`2000-01-01T${schedule.endTime}`);
                      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                      return `${hours}h`;
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(schedule.status)}>
                      {schedule.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">156h</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Staff Scheduled</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                <p className="text-2xl font-bold">98%</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overtime</p>
                <p className="text-2xl font-bold">8h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState } from "react";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { Calendar, Clock, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiColumnCalendar, Appointment } from "@/components/MultiColumnCalendar";
import { AppointmentList } from "@/components/AppointmentList";
import { BookAppointmentDialog } from "@/components/BookAppointmentDialog";

// Mock resources (doctors, exam rooms, etc.)
const mockResources = [
  { id: "dr-johnson", name: "Dr. Sarah Johnson", type: "doctor" as const, color: "#3b82f6" },
  { id: "dr-smith", name: "Dr. Michael Smith", type: "doctor" as const, color: "#10b981" },
  { id: "dr-wilson", name: "Dr. Emily Wilson", type: "doctor" as const, color: "#8b5cf6" },
  { id: "exam-room-1", name: "Exam Room 1", type: "exam-room" as const, color: "#f59e0b" },
  { id: "exam-room-2", name: "Exam Room 2", type: "exam-room" as const, color: "#ef4444" },
  { id: "surgery-suite", name: "Surgery Suite", type: "resource" as const, color: "#ec4899" },
];

// Mock data for appointments
const mockAppointments: Appointment[] = [
  {
    id: "1",
    petName: "Buddy",
    ownerName: "John Smith",
    date: setMinutes(setHours(new Date(), 9), 0),
    time: "09:00",
    duration: 30,
    type: "Checkup",
    vet: "dr-johnson",
    status: "confirmed",
    examRoom: "exam-room-1",
    location: "Main Clinic"
  },
  {
    id: "2",
    petName: "Luna",
    ownerName: "Sarah Wilson",
    date: setMinutes(setHours(new Date(), 10), 30),
    time: "10:30",
    duration: 45,
    type: "Vaccination",
    vet: "dr-smith",
    status: "confirmed",
    examRoom: "exam-room-2",
    location: "Main Clinic"
  },
  {
    id: "3",
    petName: "Max",
    ownerName: "Mike Brown",
    date: setMinutes(setHours(new Date(), 11), 15),
    time: "11:15",
    duration: 60,
    type: "Surgery",
    vet: "dr-johnson",
    status: "confirmed",
    examRoom: "surgery-suite",
    location: "Main Clinic"
  },
  {
    id: "4",
    petName: "Charlie",
    ownerName: "Lisa Anderson",
    date: setMinutes(setHours(new Date(), 13), 0),
    time: "13:00",
    duration: 30,
    type: "Checkup",
    vet: "dr-wilson",
    status: "pending",
    examRoom: "exam-room-1",
    location: "Main Clinic"
  },
  {
    id: "5",
    petName: "Milo",
    ownerName: "David Lee",
    date: setMinutes(setHours(new Date(), 14), 0),
    time: "14:00",
    duration: 30,
    type: "Followup",
    vet: "dr-smith",
    status: "confirmed",
    examRoom: "exam-room-2",
    location: "Main Clinic"
  },
  {
    id: "6",
    petName: "Bella",
    ownerName: "Jennifer Martinez",
    date: setMinutes(setHours(new Date(), 15), 30),
    time: "15:30",
    duration: 45,
    type: "Emergency",
    vet: "dr-johnson",
    status: "confirmed",
    examRoom: "exam-room-1",
    location: "Main Clinic"
  },
  {
    id: "7",
    petName: "Rocky",
    ownerName: "Robert Taylor",
    date: setMinutes(setHours(new Date(), 16), 0),
    time: "16:00",
    duration: 30,
    type: "Vaccination",
    vet: "dr-wilson",
    status: "confirmed",
    examRoom: "exam-room-2",
    location: "Main Clinic"
  },
  // Tomorrow's appointments
  {
    id: "8",
    petName: "Daisy",
    ownerName: "Amanda White",
    date: setMinutes(setHours(addDays(new Date(), 1), 9), 0),
    time: "09:00",
    duration: 30,
    type: "Checkup",
    vet: "dr-smith",
    status: "confirmed",
    examRoom: "exam-room-1",
    location: "Main Clinic"
  },
  {
    id: "9",
    petName: "Zeus",
    ownerName: "Christopher Brown",
    date: setMinutes(setHours(addDays(new Date(), 1), 10), 30),
    time: "10:30",
    duration: 60,
    type: "Surgery",
    vet: "dr-johnson",
    status: "confirmed",
    examRoom: "surgery-suite",
    location: "Main Clinic"
  },
];

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  const todayAppointments = mockAppointments.filter(
    apt => format(apt.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const upcomingAppointments = mockAppointments.filter(
    apt => apt.date > new Date()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Appointment Scheduling</h1>
          <p className="text-muted-foreground">
            Manage appointments and schedules for your veterinary clinic
          </p>
        </div>
        <Button onClick={() => setIsBookingDialogOpen(true)} className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Badge variant="default" className="text-xs">Status</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAppointments.filter(apt => apt.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge variant="secondary" className="text-xs">Review</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAppointments.filter(apt => apt.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="today">Today's Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <MultiColumnCalendar
            appointments={mockAppointments}
            resources={mockResources}
            timeSlotInterval={30}
            startHour={8}
            endHour={18}
            onAppointmentClick={(appointment) => {
              console.log("Appointment clicked:", appointment);
              // You can open a dialog here to view/edit appointment
            }}
            onTimeSlotClick={(date, resourceId, time) => {
              console.log("Time slot clicked:", { date, resourceId, time });
              // You can open booking dialog here
              setIsBookingDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <AppointmentList 
            appointments={mockAppointments.map(apt => ({
              ...apt,
              vet: mockResources.find(r => r.id === apt.vet)?.name || apt.vet
            }))}
            searchTerm={searchTerm}
          />
        </TabsContent>

        <TabsContent value="today" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule - {format(new Date(), 'EEEE, MMMM d, yyyy')}</CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No appointments scheduled for today</p>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm font-medium">{appointment.time}</div>
                            <div>
                              <div className="font-medium">{appointment.petName}</div>
                              <div className="text-sm text-muted-foreground">{appointment.ownerName}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                              {appointment.status}
                            </Badge>
                            <div className="text-sm text-muted-foreground">{appointment.type}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <BookAppointmentDialog 
        isOpen={isBookingDialogOpen}
        onClose={() => setIsBookingDialogOpen(false)}
      />
    </div>
  );
}
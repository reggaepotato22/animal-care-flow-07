import { useState } from "react";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { Calendar, Clock, Plus, Search, Filter, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiColumnCalendar, Appointment } from "@/components/MultiColumnCalendar";
import { AppointmentList } from "@/components/AppointmentList";
import { BookAppointmentDialog } from "@/components/BookAppointmentDialog";
import { useNavigate } from "react-router-dom";
import { useEncounter } from "@/contexts/EncounterContext";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useToast } from "@/hooks/use-toast";

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
export const mockAppointments: Appointment[] = [
  {
    id: "1",
    petName: "Max",
    ownerName: "Sarah Johnson",
    date: setMinutes(setHours(new Date(), 9), 0),
    time: "09:00",
    duration: 30,
    type: "Checkup",
    vet: "dr-johnson",
    status: "CONFIRMED",
    examRoom: "exam-room-1",
    location: "Main Clinic",
    patientId: "1"
  },
  {
    id: "2",
    petName: "Whiskers",
    ownerName: "Michael Chen",
    date: setMinutes(setHours(new Date(), 10), 30),
    time: "10:30",
    duration: 45,
    type: "Vaccination",
    vet: "dr-smith",
    status: "CONFIRMED",
    examRoom: "exam-room-2",
    location: "Main Clinic",
    patientId: "2"
  },
  {
    id: "3",
    petName: "Luna",
    ownerName: "Emily Rodriguez",
    date: setMinutes(setHours(new Date(), 11), 15),
    time: "11:15",
    duration: 60,
    type: "Surgery",
    vet: "dr-johnson",
    status: "CONFIRMED",
    examRoom: "surgery-suite",
    location: "Main Clinic",
    patientId: "3"
  },
  {
    id: "4",
    petName: "Rocky",
    ownerName: "David Thompson",
    date: setMinutes(setHours(new Date(), 13), 0),
    time: "13:00",
    duration: 30,
    type: "Checkup",
    vet: "dr-wilson",
    status: "SCHEDULED",
    examRoom: "exam-room-1",
    location: "Main Clinic",
    patientId: "4"
  },
  {
    id: "5",
    petName: "Bella",
    ownerName: "Lisa Anderson",
    date: setMinutes(setHours(new Date(), 14), 30),
    time: "14:30",
    duration: 30,
    type: "Follow-up",
    vet: "dr-smith",
    status: "CONFIRMED",
    examRoom: "exam-room-2",
    location: "Main Clinic",
    patientId: "5"
  },
  {
    id: "6",
    petName: "Oliver",
    ownerName: "James Wilson",
    date: setMinutes(setHours(new Date(), 15), 45),
    time: "15:45",
    duration: 30,
    type: "Emergency",
    vet: "dr-wilson",
    status: "SCHEDULED",
    examRoom: "exam-room-1",
    location: "Main Clinic",
    patientId: "6"
  },
];

export default function Appointments() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const { createEncounter } = useEncounter();
  const wf = useWorkflow();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState(mockAppointments);

  const todayAppointments = appointments.filter(
    apt => format(apt.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const upcomingAppointments = appointments.filter(
    apt => apt.date > new Date()
  );

  const handleCheckIn = (appointment: Appointment) => {
    // Create encounter from appointment data
    const encounter = createEncounter(appointment.patientId || "1", {
      reason: appointment.type,
      chiefComplaint: appointment.reason || appointment.notes || "",
      veterinarian: appointment.vet,
    });

    // Update appointment status
    setAppointments(prev => prev.map(apt => 
      apt.id === appointment.id ? { ...apt, status: "CHECKED_IN" as const } : apt
    ));
    
    // Move workflow to triage
    wf.goTo("TRIAGE");
    
    toast({
      title: "Checked-in",
      description: `${appointment.petName} has been checked-in and moved to Triage.`,
    });
  };

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
              {appointments.filter(apt => apt.status === 'CONFIRMED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Badge variant="secondary" className="text-xs">Review</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter(apt => apt.status === 'SCHEDULED').length}
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
            appointments={appointments}
            resources={mockResources}
            timeSlotInterval={30}
            startHour={8}
            endHour={18}
            onAppointmentClick={(appointment) => {
              navigate(`/appointments/${appointment.id}`);
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
            appointments={appointments.map(apt => ({
              ...apt,
              vet: mockResources.find(r => r.id === apt.vet)?.name || apt.vet
            }))}
            searchTerm={searchTerm}
            onCheckIn={handleCheckIn}
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
                        <div 
                          key={appointment.id} 
                          className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/appointments/${appointment.id}`)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-sm font-medium">{appointment.time}</div>
                            <div>
                              <div className="font-medium">{appointment.petName}</div>
                              <div className="text-sm text-muted-foreground">{appointment.ownerName}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={appointment.status === 'CONFIRMED' ? 'default' : appointment.status === 'CHECKED_IN' ? 'outline' : 'secondary'}>
                              {appointment.status}
                            </Badge>
                            <div className="text-sm text-muted-foreground">{appointment.type}</div>
                            {appointment.status !== 'CHECKED_IN' && appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCheckIn(appointment);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Check-in
                              </Button>
                            )}
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
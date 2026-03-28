import { useState } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { Calendar, Clock, Plus, Search, Filter, CheckCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiColumnCalendar, Appointment } from "@/components/MultiColumnCalendar";
import { AppointmentList } from "@/components/AppointmentList";
import { BookAppointmentDialog } from "@/components/BookAppointmentDialog";
import { useNavigate, useLocation } from "react-router-dom";
import { useEncounter } from "@/contexts/EncounterContext";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { loadStoredAppointments, subscribeToAppointments, deleteAppointment, broadcastAppointmentUpdate, type StoredAppointment } from "@/lib/appointmentStore";

// Mock resources (doctors, exam rooms, etc.)
const mockResources = [
  { id: "dr-johnson", name: "Dr. Sarah Johnson", type: "doctor" as const, color: "#3b82f6" },
  { id: "dr-smith", name: "Dr. Michael Smith", type: "doctor" as const, color: "#10b981" },
  { id: "dr-wilson", name: "Dr. Emily Wilson", type: "doctor" as const, color: "#8b5cf6" },
  { id: "exam-room-1", name: "Exam Room 1", type: "exam-room" as const, color: "#f59e0b" },
  { id: "exam-room-2", name: "Exam Room 2", type: "exam-room" as const, color: "#ef4444" },
  { id: "surgery-suite", name: "Surgery Suite", type: "resource" as const, color: "#ec4899" },
];

const ENC_LABEL: Record<string, { label: string; cls: string; pulse?: boolean }> = {
  WAITING:         { label: "Awaiting Triage",  cls: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300" },
  IN_TRIAGE:       { label: "In Triage",         cls: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300", pulse: true },
  TRIAGED:         { label: "Triage Complete",   cls: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300" },
  IN_CONSULTATION: { label: "In Consultation",   cls: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300", pulse: true },
  IN_SURGERY:      { label: "In Surgery",        cls: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300", pulse: true },
  RECOVERY:        { label: "Recovery",          cls: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300" },
  DISCHARGED:      { label: "Discharged",        cls: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300" },
};

export default function Appointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const { createEncounter, encounters } = useEncounter();
  const { checkIn, clearPatientFromActive } = useWorkflowContext();
  const { toast } = useToast();

  // Auto-open booking dialog when returning from patient registration
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("bookNew") === "true") {
      setIsBookingDialogOpen(true);
      navigate("/appointments", { replace: true });
    }
  }, [location.search, navigate]);

  // Build patientId → live encounter status map (re-derives whenever encounters change)
  const liveStatuses = useMemo(() => {
    const map: Record<string, string> = {};
    encounters.forEach(enc => {
      if (enc.status !== "DISCHARGED") {
        map[enc.patientId] = enc.status;
      } else {
        map[enc.patientId] = "DISCHARGED";
      }
    });
    return map;
  }, [encounters]);

  // Merge mock + persisted appointments, refresh on every booking event
  const buildAppointments = useCallback(() => {
    const stored = loadStoredAppointments();
    const merged: Appointment[] = [];
    stored.forEach((s: StoredAppointment) => {
      if (!merged.find(m => m.id === s.id)) {
        merged.push({
          id:        s.id,
          petName:   s.petName,
          ownerName: s.ownerName,
          date:      new Date(s.date),
          time:      s.time,
          duration:  s.duration,
          type:      s.type,
          vet:       s.vet,
          status:    s.status,
          patientId: s.patientId,
          notes:     s.notes ?? "",
        } as Appointment);
      }
    });
    return merged;
  }, []);

  const [appointments, setAppointments] = useState<Appointment[]>(buildAppointments);

  // Subscribe to cross-tab + same-tab appointment updates
  useEffect(() => {
    const unsub = subscribeToAppointments(() => setAppointments(buildAppointments()));
    return unsub;
  }, [buildAppointments]);

  const todayAppointments = appointments.filter(
    apt => format(apt.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const upcomingAppointments = appointments.filter(
    apt => apt.date > new Date()
  );

  const handleCheckIn = (appointment: Appointment) => {
    const patientId = appointment.patientId || appointment.id;
    // Create encounter
    createEncounter(patientId, {
      reason: appointment.type,
      chiefComplaint: appointment.reason || appointment.notes || "",
      veterinarian: appointment.vet,
      petName: appointment.petName,
      ownerName: appointment.ownerName,
    } as Parameters<typeof createEncounter>[1]);

    // Register in workflow context so notifications carry the name
    checkIn(patientId, {
      name: appointment.petName,
      owner: appointment.ownerName,
      time: appointment.time,
      type: appointment.type,
      checkedInAt: new Date().toISOString(),
    });

    // Update appointment status
    setAppointments(prev => prev.map(apt =>
      apt.id === appointment.id ? { ...apt, status: "CHECKED_IN" as const } : apt
    ));

    toast({
      title: "Checked-in",
      description: `${appointment.petName} has been checked in → Triage queue.`,
    });
  };

  const handleCancel = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    // Remove from local state
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    // Persist the cancellation to store & broadcast so other tabs sync
    deleteAppointment(appointmentId);
    broadcastAppointmentUpdate();
    // Clear the patient from live workflow progress if checked-in
    if (apt?.patientId) {
      clearPatientFromActive(apt.patientId);
    }
    // Fire notification
    if (apt) {
      window.dispatchEvent(new CustomEvent("acf:notification", {
        detail: {
          type: "warning",
          message: `Appointment cancelled: ${apt.petName} on ${format(apt.date, "MMM d")}`,
          patientId: apt.patientId,
          patientName: apt.petName,
          targetRoles: ["SuperAdmin", "Receptionist", "Vet", "Attendant"],
        },
      }));
      toast({
        title: "Appointment Cancelled",
        description: `${apt.petName} appointment has been cancelled.`,
      });
    }
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
            onCancel={handleCancel}
            liveStatuses={liveStatuses}
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
                  <div className="space-y-3">
                    {todayAppointments
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((appointment) => {
                        const encStatus = appointment.patientId ? liveStatuses[appointment.patientId] : undefined;
                        const encCfg    = encStatus ? ENC_LABEL[encStatus] : undefined;
                        return (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigate(`/appointments/${appointment.id}`)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="text-sm font-semibold w-12 shrink-0">{appointment.time}</div>
                              <div>
                                <div className="font-medium">{appointment.petName}</div>
                                <div className="text-xs text-muted-foreground">{appointment.ownerName} · {appointment.type}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {encCfg && (
                                <span className={cn(
                                  "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
                                  encCfg.cls
                                )}>
                                  {encCfg.pulse && <Activity className="h-3 w-3 animate-pulse" />}
                                  {encCfg.label}
                                </span>
                              )}
                              <Badge variant={appointment.status === "CONFIRMED" ? "default" : appointment.status === "CHECKED_IN" ? "outline" : "secondary"}>
                                {appointment.status.replace("_", " ")}
                              </Badge>
                              {appointment.status !== "CHECKED_IN" && appointment.status !== "CANCELLED" && appointment.status !== "NO_SHOW" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleCheckIn(appointment); }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Check-in
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
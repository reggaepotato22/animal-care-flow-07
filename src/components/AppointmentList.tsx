import { format } from "date-fns";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Edit, Trash2, CheckCircle, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EditAppointmentDialog } from "@/components/EditAppointmentDialog";
import { deleteAppointment, broadcastAppointmentUpdate } from "@/lib/appointmentStore";

interface Appointment {
  id: string;
  petName: string;
  ownerName: string;
  date: Date;
  time: string;
  duration: number;
  type: string;
  vet: string;
  status: "SCHEDULED" | "CONFIRMED" | "CHECKED_IN" | "NO_SHOW" | "CANCELLED";
  patientId?: string;
  notes?: string;
  reason?: string;
}

type EncounterStatus =
  | "WAITING" | "IN_TRIAGE" | "TRIAGED"
  | "IN_CONSULTATION" | "IN_SURGERY" | "RECOVERY" | "DISCHARGED";

interface AppointmentListProps {
  appointments: Appointment[];
  searchTerm: string;
  onCheckIn?: (appointment: Appointment) => void;
  onCancel?: (appointmentId: string) => void;
  /** patientId → live encounter status string */
  liveStatuses?: Record<string, string>;
}

type UrgencyLevel = "emergency" | "sick" | "routine";

function getUrgencyLevel(type: string): UrgencyLevel {
  const t = type.toLowerCase();
  if (t.includes("emergency") || t.includes("critical") || t.includes("urgent")) return "emergency";
  if (t.includes("sick") || t.includes("illness") || t.includes("injury") || t.includes("pain") || t.includes("vomit") || t.includes("trauma")) return "sick";
  return "routine";
}

const URGENCY_META: Record<UrgencyLevel, { dot: string; label: string; border: string; badge: string }> = {
  emergency: {
    dot:    "bg-red-500",
    label:  "Emergency",
    border: "border-l-4 border-l-red-500",
    badge:  "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300",
  },
  sick: {
    dot:    "bg-orange-500",
    label:  "Sick Patient",
    border: "border-l-4 border-l-orange-400",
    badge:  "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300",
  },
  routine: {
    dot:    "bg-emerald-500",
    label:  "Routine",
    border: "border-l-4 border-l-emerald-400",
    badge:  "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
};

const ENC_LABEL: Record<EncounterStatus, { label: string; cls: string; pulse?: boolean }> = {
  WAITING:         { label: "Awaiting Triage",   cls: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300" },
  IN_TRIAGE:       { label: "In Triage",          cls: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300", pulse: true },
  TRIAGED:         { label: "Triage Complete",    cls: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300" },
  IN_CONSULTATION: { label: "In Consultation",    cls: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300", pulse: true },
  IN_SURGERY:      { label: "In Surgery",         cls: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300", pulse: true },
  RECOVERY:        { label: "Recovery",           cls: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300" },
  DISCHARGED:      { label: "Discharged",         cls: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300" },
};

export function AppointmentList({ appointments, searchTerm, onCheckIn, onCancel, liveStatuses = {} }: AppointmentListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const handleEdit = (appointment: Appointment) => {
    setEditingAppt(appointment);
    setIsEditOpen(true);
  };

  const handleCancel = (appointment: Appointment) => {
    const ok = window.confirm(`Cancel appointment for ${appointment.petName} on ${format(appointment.date, "MMM d")}?`);
    if (!ok) return;
    const success = deleteAppointment(appointment.id);
    if (success || onCancel) {
      // Call onCancel to remove from parent state (handles mock appointments)
      onCancel?.(appointment.id);
      broadcastAppointmentUpdate();
      window.dispatchEvent(new CustomEvent("acf:notification", {
        detail: {
          type: "warning",
          message: `Appointment cancelled: ${appointment.petName} on ${format(appointment.date, "MMM d")}`,
          patientId: appointment.patientId,
          patientName: appointment.petName,
          targetRoles: ["SuperAdmin", "Receptionist", "Vet", "Nurse"],
        },
      }));
      toast({ title: "Appointment Cancelled", description: `${appointment.petName} — ${format(appointment.date, "MMM d, yyyy")} at ${appointment.time}.` });
    } else {
      toast({ title: "Error", description: "Failed to cancel appointment.", variant: "destructive" });
    }
  };

  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.vet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (a.date.getTime() === b.date.getTime()) return a.time.localeCompare(b.time);
    return a.date.getTime() - b.date.getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          All Appointments ({filteredAppointments.length})
        </h2>
      </div>

      {sortedAppointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? "No appointments found matching your search." : "No appointments scheduled."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedAppointments.map((appointment) => {
            const encStatus = appointment.patientId ? liveStatuses[appointment.patientId] : undefined;
            const encCfg    = encStatus && ENC_LABEL[encStatus as EncounterStatus] ? ENC_LABEL[encStatus as EncounterStatus] : undefined;
            return (
              <Card
                key={appointment.id}
                className={cn("cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden", URGENCY_META[getUrgencyLevel(appointment.type)].border)}
                onClick={() => navigate(`/appointments/${appointment.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-lg">{appointment.petName}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const u = getUrgencyLevel(appointment.type);
                        const um = URGENCY_META[u];
                        return (
                          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border", um.badge)}>
                            <span className={cn("inline-block h-2 w-2 rounded-full", um.dot)} />
                            {um.label}
                          </span>
                        );
                      })()}
                      {encCfg && (
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
                          encCfg.cls
                        )}>
                          {encCfg.pulse && <Activity className="h-3 w-3 animate-pulse" />}
                          {encCfg.label}
                        </span>
                      )}
                      <Badge variant={
                        appointment.status === "CONFIRMED"  ? "default"   :
                        appointment.status === "CHECKED_IN" ? "outline"   : "secondary"
                      }>
                        {appointment.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Owner:</span>
                        <span>{appointment.ownerName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Date:</span>
                        <span>{format(appointment.date, "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Time:</span>
                        <span>{appointment.time}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Type:</span>
                        <span className="ml-2">{appointment.type}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Veterinarian:</span>
                        <span className="ml-2">{appointment.vet}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    {appointment.status !== "CHECKED_IN" && appointment.status !== "CANCELLED" && appointment.status !== "NO_SHOW" && (
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onCheckIn?.(appointment); }}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Check-in
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(appointment); }}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleCancel(appointment); }}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <EditAppointmentDialog
        appointment={editingAppt ? { ...editingAppt, ownerPhone: "", ownerEmail: "" } : null}
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingAppt(null); }}
        onSaved={() => { window.dispatchEvent(new CustomEvent("acf:notification")); }}
      />
    </div>
  );
}
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, MapPin, Stethoscope, FileText, Edit, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { useRole } from "@/contexts/RoleContext";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import { useEncounter } from "@/contexts/EncounterContext";
import { loadStoredAppointments, updateAppointmentStatus, broadcastAppointmentUpdate } from "@/lib/appointmentStore";

export default function AppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { has, role } = useRole();
  const { toast } = useToast();
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const appointment = useMemo(() => {
    if (!id) return null;
    const stored = loadStoredAppointments();
    return stored.find(a => a.id === id) || null;
  }, [id, refreshTrigger]);

  const wf = useWorkflow({ patientId: appointment?.patientId });
  const { createEncounter } = useEncounter();

  const handleCheckIn = () => {
    if (!appointment) return;
    // Create encounter from appointment data
    createEncounter(appointment.patientId, {
      reason: appointment.type,
      chiefComplaint: appointment.reason || appointment.notes || "",
      veterinarian: appointment.vet,
    });

    // Update appointment status
    updateAppointmentStatus(appointment.id, "CHECKED_IN");
    broadcastAppointmentUpdate();
    setRefreshTrigger(prev => prev + 1);
    
    // Move workflow to triage
    wf.goTo("TRIAGE");
    
    toast({
      title: "Checked-in",
      description: `${appointment.petName} has been checked-in and moved to Triage.`,
    });
  };

  const handleCancel = () => {
    if (!appointment) return;
    updateAppointmentStatus(appointment.id, "CANCELLED");
    broadcastAppointmentUpdate();
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Appointment Cancelled",
      description: `Appointment for ${appointment.petName} has been cancelled.`,
      variant: "destructive",
    });
  };

  const handleComplete = () => {
    if (!appointment) return;
    updateAppointmentStatus(appointment.id, "CONFIRMED"); // Or add a COMPLETED status if needed
    broadcastAppointmentUpdate();
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Appointment Completed",
      description: `Appointment for ${appointment.petName} has been marked as completed.`,
    });
  };

  if (!appointment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-muted-foreground">Appointment Not Found</h2>
          <Button onClick={() => navigate("/appointments")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  const appointmentDate = parseISO(appointment.date);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CHECKED_IN":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SCHEDULED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "NO_SHOW":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Checkup":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Vaccination":
        return "bg-green-100 text-green-800 border-green-200";
      case "Surgery":
        return "bg-red-100 text-red-800 border-red-200";
      case "Emergency":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Followup":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/appointments")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{appointment.petName} - Appointment</h1>
            <p className="text-muted-foreground flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(appointmentDate, "EEEE, MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {appointment.time} ({appointment.duration} min)
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {appointment.status !== "CHECKED_IN" && appointment.status !== "CANCELLED" && appointment.status !== "NO_SHOW" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckIn}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Check-in for Triage
            </Button>
          )}
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status}
          </Badge>
          <Badge className={getTypeColor(appointment.type)}>
            {appointment.type}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Appointment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date & Time</span>
                <span className="font-medium">
                  {format(appointmentDate, "MMM d, yyyy")} at {appointment.time}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-medium">{appointment.duration} minutes</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge className={getTypeColor(appointment.type)}>
                  {appointment.type}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reason</span>
                <span className="font-medium text-right">{appointment.reason || "N/A"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Veterinarian</span>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{appointment.vet}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Exam Room</span>
                <span className="font-medium">{appointment.examRoom || "N/A"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Location</span>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{appointment.location || "N/A"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient & Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient & Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Patient Name</span>
                <div className="mt-1">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-semibold text-base"
                    onClick={() => appointment.patientId && navigate(`/patients/${appointment.patientId}`)}
                  >
                    {appointment.petName}
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Owner Name</span>
                <div className="mt-1 font-medium">{appointment.ownerName}</div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Owner ID</span>
                <span className="font-mono text-sm">{appointment.ownerId}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </span>
                <a href={`tel:${appointment.ownerPhone}`} className="font-medium hover:underline">
                  {appointment.ownerPhone}
                </a>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </span>
                <a href={`mailto:${appointment.ownerEmail}`} className="font-medium hover:underline text-sm">
                  {appointment.ownerEmail}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {appointment.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {appointment.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {has("can_edit_medical_records") && (
              <Button variant="outline" onClick={() => navigate(`/patients/${appointment.patientId}/encounters/new?appointmentId=${appointment.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                Create Clinical Record
              </Button>
            )}
            <Button variant="outline" onClick={() => appointment.patientId && navigate(`/patients/${appointment.patientId}`)}>
              <User className="mr-2 h-4 w-4" />
              View Patient Profile
            </Button>
            {has("can_edit_patients") && (
              <Button 
                variant="outline"
                onClick={() => toast({ title: "Edit Appointment", description: "Opening appointment editor..." })}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Appointment
              </Button>
            )}
            {(appointment.status === "CONFIRMED" || appointment.status === "SCHEDULED") && (
              <Button 
                variant="outline" 
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={handleComplete}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Completed
              </Button>
            )}
            {appointment.status !== "CANCELLED" && appointment.status !== "CHECKED_IN" && (
              <Button 
                variant="outline" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleCancel}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Appointment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


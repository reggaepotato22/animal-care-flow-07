import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, MapPin, Stethoscope, FileText, Edit, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

// Mock appointment data - in a real app this would come from an API
const mockAppointments: Record<string, any> = {
  "1": {
    id: "1",
    petName: "Max",
    ownerName: "Sarah Johnson",
    ownerId: "C-2025-001",
    ownerPhone: "+1 (555) 123-4567",
    ownerEmail: "sarah.johnson@email.com",
    date: new Date(),
    time: "09:00",
    duration: 30,
    type: "Checkup",
    vet: "Dr. Sarah Johnson",
    vetId: "dr-johnson",
    status: "confirmed",
    examRoom: "Exam Room 1",
    location: "Main Clinic",
    notes: "Annual wellness checkup. Owner reports pet is healthy and active.",
    reason: "Annual wellness examination",
    patientId: "P-2025-10234",
  },
  "2": {
    id: "2",
    petName: "Whiskers",
    ownerName: "Michael Chen",
    ownerId: "C-2025-002",
    ownerPhone: "+1 (555) 234-5678",
    ownerEmail: "michael.chen@email.com",
    date: new Date(),
    time: "10:30",
    duration: 45,
    type: "Vaccination",
    vet: "Dr. Michael Smith",
    vetId: "dr-smith",
    status: "confirmed",
    examRoom: "Exam Room 2",
    location: "Main Clinic",
    notes: "Routine vaccination appointment. No special instructions.",
    reason: "Annual vaccination booster",
    patientId: "P-2025-10235",
  },
  "3": {
    id: "3",
    petName: "Luna",
    ownerName: "Emily Rodriguez",
    ownerId: "C-2025-003",
    ownerPhone: "+1 (555) 345-6789",
    ownerEmail: "emily.rodriguez@email.com",
    date: new Date(),
    time: "14:00",
    duration: 60,
    type: "Surgery",
    vet: "Dr. Sarah Johnson",
    vetId: "dr-johnson",
    status: "confirmed",
    examRoom: "Surgery Suite",
    location: "Main Clinic",
    notes: "Spay surgery scheduled. Patient should fast 12 hours before procedure.",
    reason: "Spay surgery",
    patientId: "P-2025-10236",
  },
};

export default function AppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const appointment = id ? mockAppointments[id] : null;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
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
                {format(appointment.date, "EEEE, MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {appointment.time} ({appointment.duration} min)
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                  {format(appointment.date, "MMM d, yyyy")} at {appointment.time}
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
            <Button variant="outline" onClick={() => navigate(`/records/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}`)}>
              <FileText className="mr-2 h-4 w-4" />
              Create Clinical Record
            </Button>
            <Button variant="outline" onClick={() => appointment.patientId && navigate(`/patients/${appointment.patientId}`)}>
              <User className="mr-2 h-4 w-4" />
              View Patient Profile
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Appointment
            </Button>
            {appointment.status === "confirmed" && (
              <Button variant="outline" className="text-green-600 hover:text-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Completed
              </Button>
            )}
            {appointment.status !== "cancelled" && (
              <Button variant="outline" className="text-red-600 hover:text-red-700">
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


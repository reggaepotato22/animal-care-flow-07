import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Heart, Stethoscope, CheckCircle, Plus, AlertTriangle } from "lucide-react";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEncounter } from "@/contexts/EncounterContext";
import { NewVisitDialog } from "@/components/NewVisitDialog";

interface Patient {
  id: string;
  patientId?: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  owner: string;
  phone: string;
  location: string;
  lastVisit: string;
  status: "healthy" | "treatment" | "critical";
  image?: string;
  allergies?: string[];
  microchip?: string;
  behavioralWarnings?: Array<{ text: string; level: "low" | "medium" | "high" }>;
}

interface PatientCardProps {
  patient: Patient;
  onViewDetails: (patient: Patient) => void;
  onTriage?: (patient: Patient) => void;
  hasAppointmentToday?: boolean;
  appointmentDetails?: { time: string; vet: string };
  isCheckedIn?: boolean;
}

export function PatientCard({ patient, onViewDetails, onTriage, hasAppointmentToday, appointmentDetails, isCheckedIn }: PatientCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-success text-success-foreground";
      case "treatment":
        return "bg-warning text-warning-foreground";
      case "critical":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const navigate = useNavigate();
  const { has } = useRole();
  const { toast } = useToast();
  const wf = useWorkflow({ patientId: patient.patientId || patient.id });
  const { createEncounter } = useEncounter();

  const handleCheckIn = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Create encounter for the patient
    createEncounter(patient.id, {
      reason: "General Visit",
      chiefComplaint: "",
    });

    wf.goTo("TRIAGE");
    toast({
      title: "Checked-in",
      description: `${patient.name} has been checked-in and moved to Triage.`,
    });
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewDetails(patient)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-veterinary-light rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-veterinary-teal" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-none">{patient.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {patient.species} • {patient.breed}
              </p>
              {patient.patientId && (
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {patient.patientId}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(patient.status)}>
              {patient.status}
            </Badge>
            {patient.allergies && patient.allergies.length > 0 && patient.allergies[0] !== "None known" && (
              <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                Allergies
              </Badge>
            )}
            {isCheckedIn && (
              <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 animate-pulse">
                In Clinic
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Behavioral warning pills */}
        {patient.behavioralWarnings && patient.behavioralWarnings.filter(w => w.text).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {patient.behavioralWarnings.filter(w => w.text).map((w, i) => (
              <div key={i} className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                w.level === "high" ? "bg-red-50 text-red-700 border-red-200"
                : w.level === "medium" ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                <AlertTriangle className="h-2.5 w-2.5" />
                {w.text}
              </div>
            ))}
          </div>
        )}

        {hasAppointmentToday && appointmentDetails && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-md p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-medium text-blue-900">Appointment Today</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-blue-900">{appointmentDetails.time}</div>
              <div className="text-[10px] text-blue-700/80">{appointmentDetails.vet}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted/30 p-2 rounded-md">
            <span className="text-muted-foreground block text-xs">Age</span>
            <span className="font-medium">{patient.age}</span>
          </div>
          <div className="bg-muted/30 p-2 rounded-md">
            <span className="text-muted-foreground block text-xs">Weight</span>
            <span className="font-medium">{patient.weight}</span>
          </div>
          {patient.microchip && patient.microchip !== "N/A" && (
            <div className="bg-muted/30 p-2 rounded-md col-span-2">
              <span className="text-muted-foreground block text-xs">Microchip</span>
              <span className="font-mono text-[11px]">{patient.microchip}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground bg-muted/20 p-2 rounded-md">
            <Phone className="h-3.5 w-3.5 mr-2" />
            <span className="truncate">{patient.owner} • {patient.phone}</span>
          </div>
          <div className="flex items-center text-muted-foreground bg-muted/20 p-2 rounded-md">
            <MapPin className="h-3.5 w-3.5 mr-2" />
            <span className="truncate">{patient.location}</span>
          </div>
        </div>

        <div className="pt-2">
          {has("can_triage") ? (
            onTriage && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriage(patient);
                }}
                className="w-full"
              >
                <Stethoscope className="h-4 w-4 mr-1.5" />
                Triage
              </Button>
            )
          ) : (
            has("can_register_patients") && (
              hasAppointmentToday ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { handleCheckIn(e); }}
                  className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Check-in
                </Button>
              ) : (
                <NewVisitDialog patientId={patient.id} patientName={patient.name}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Visit
                  </Button>
                </NewVisitDialog>
              )
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

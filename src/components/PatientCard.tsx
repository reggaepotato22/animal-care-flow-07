import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Heart, Stethoscope, CheckCircle, Plus } from "lucide-react";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { getStepRoute } from "@/config/workflow";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEncounter } from "@/contexts/EncounterContext";

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
}

interface PatientCardProps {
  patient: Patient;
  onViewDetails: (patient: Patient) => void;
  onTriage?: (patient: Patient) => void;
  hasAppointmentToday?: boolean;
  appointmentDetails?: { time: string; vet: string };
}

export function PatientCard({ patient, onViewDetails, onTriage, hasAppointmentToday, appointmentDetails }: PatientCardProps) {
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

  const handleNext = () => {
    if (!wf.hasNext) return;
    const nextStep = wf.steps[wf.currentIndex + 1];
    wf.next();
    if (nextStep) navigate(getStepRoute(nextStep.id));
  };
  const handlePrev = () => {
    if (!wf.hasPrev) return;
    const prevStep = wf.steps[wf.currentIndex - 1];
    wf.prev();
    if (prevStep) navigate(getStepRoute(prevStep.id));
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
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  handleCheckIn(e);
                }}
                className={cn(
                  "w-full transition-colors",
                  hasAppointmentToday 
                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                    : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                )}
              >
                {hasAppointmentToday ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Check-in
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Visit
                  </>
                )}
              </Button>
            )
          )}
          
          <div className="flex items-center gap-2 mt-4">
            <Button 
              variant="ghost" 
              size="sm"
              disabled={!wf.hasPrev}
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="flex-1 h-8 text-xs"
            >
              Previous
            </Button>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${wf.progress}%` }}
              />
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              disabled={!wf.hasNext}
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="flex-1 h-8 text-xs font-medium text-primary"
            >
              Next Step
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

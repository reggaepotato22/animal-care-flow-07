import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Heart, Stethoscope } from "lucide-react";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useNavigate } from "react-router-dom";
import { getStepRoute } from "@/config/workflow";

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
}

interface PatientCardProps {
  patient: Patient;
  onViewDetails: (patient: Patient) => void;
  onTriage?: (patient: Patient) => void;
}

export function PatientCard({ patient, onViewDetails, onTriage }: PatientCardProps) {
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
  const wf = useWorkflow({ patientId: patient.patientId || patient.id });
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
    <Card className="hover:shadow-md transition-shadow">
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
          <Badge className={getStatusColor(patient.status)}>
            {patient.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted/30 p-2 rounded-md">
            <span className="text-muted-foreground block text-xs">Age</span>
            <span className="font-medium">{patient.age}</span>
          </div>
          <div className="bg-muted/30 p-2 rounded-md">
            <span className="text-muted-foreground block text-xs">Weight</span>
            <span className="font-medium">{patient.weight}</span>
          </div>
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

        <div className="pt-2 grid grid-cols-2 gap-2">
          {onTriage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTriage(patient)}
              className="w-full"
            >
              <Stethoscope className="h-4 w-4 mr-1.5" />
              Triage
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewDetails(patient)}
            className="w-full"
          >
            View Details
          </Button>
          
          <div className="col-span-2 flex items-center gap-2 mt-1">
            <Button 
              variant="ghost" 
              size="sm"
              disabled={!wf.hasPrev}
              onClick={handlePrev}
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
              onClick={handleNext}
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

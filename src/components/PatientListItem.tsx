import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Phone, Heart } from "lucide-react";

interface Patient {
  id: string;
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

interface PatientListItemProps {
  patient: Patient;
  onViewDetails: (patient: Patient) => void;
}

export function PatientListItem({ patient, onViewDetails }: PatientListItemProps) {
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

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow bg-card">
      <div className="flex items-center space-x-4 flex-1">
        <div className="w-12 h-12 bg-veterinary-light rounded-full flex items-center justify-center">
          <Heart className="h-6 w-6 text-veterinary-teal" />
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h3 className="font-semibold text-lg">{patient.name}</h3>
            <p className="text-sm text-muted-foreground">
              {patient.species} • {patient.breed}
            </p>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Age:</span>
            <span className="ml-2 font-medium">{patient.age}</span>
            <br />
            <span className="text-muted-foreground">Weight:</span>
            <span className="ml-2 font-medium">{patient.weight}</span>
          </div>
          
          <div className="text-sm space-y-1">
            <div className="flex items-center text-muted-foreground">
              <Phone className="h-3 w-3 mr-1" />
              <span>{patient.owner}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{patient.location}</span>
            </div>
          </div>
          
          <div className="text-sm">
            <div className="flex items-center text-muted-foreground mb-2">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Last visit: {patient.lastVisit}</span>
            </div>
            <Badge className={getStatusColor(patient.status)}>
              {patient.status}
            </Badge>
          </div>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        onClick={() => onViewDetails(patient)}
        className="ml-4"
      >
        View Details
      </Button>
    </div>
  );
}
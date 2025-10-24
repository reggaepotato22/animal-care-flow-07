import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MapPin, Heart, ArrowLeft, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EditPatientDialog } from "@/components/EditPatientDialog";

interface PatientHeaderProps {
  name: string;
  species: string;
  breed: string;
  status: string;
  patientId: string;
  age: string;
  weight: string;
  sex: string;
  color: string;
  microchip: string;
  owner: { name: string; phone: string; email: string; address: string };
  patient: any; // Full patient object for EditPatientDialog
  onStatusChipClass: (status: string) => string;
}

export function PatientHeader({
  name,
  species,
  breed,
  status,
  patientId,
  age,
  weight,
  sex,
  color,
  microchip,
  owner,
  patient,
  onStatusChipClass
}: PatientHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border bg-card p-4 md:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
              <Badge className={onStatusChipClass(status)}>{status}</Badge>
            </div>
            <p className="text-muted-foreground">{species} • {breed}</p>
            <p className="text-xs font-mono text-primary mt-1">ID: {patientId}</p>
          </div>
        </div>
        <div className="hidden md:flex gap-2">
          <EditPatientDialog patient={patient}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Patient
            </Button>
          </EditPatientDialog>
        </div>
      </div>
      <Separator className="my-4" />
      
      {/* Patient Details */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Age</span>
          <p className="text-sm font-medium">{age}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Weight</span>
          <p className="text-sm font-medium">{weight}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Sex</span>
          <p className="text-sm font-medium">{sex}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Color</span>
          <p className="text-sm font-medium">{color}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Microchip</span>
          <p className="text-sm font-medium font-mono text-xs">{microchip}</p>
        </div>
      </div>

      <Separator className="my-4" />
      
      {/* Owner Contact Info */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {owner.phone}</div>
          <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {owner.email}</div>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {owner.address}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${owner.phone}`}><Phone className="mr-2 h-4 w-4" /> Call</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${owner.email}`}><Mail className="mr-2 h-4 w-4" /> Email</a>
          </Button>
        </div>
      </div>
    </div>
  );
}



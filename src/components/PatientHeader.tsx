import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MapPin, Heart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PatientHeaderProps {
  name: string;
  species: string;
  breed: string;
  status: string;
  patientId: string;
  owner: { name: string; phone: string; email: string; address: string };
  onStatusChipClass: (status: string) => string;
}

export function PatientHeader({
  name,
  species,
  breed,
  status,
  patientId,
  owner,
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
          <Button variant="outline" asChild>
            <a href={`tel:${owner.phone}`}><Phone className="mr-2 h-4 w-4" /> Call</a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`mailto:${owner.email}`}><Mail className="mr-2 h-4 w-4" /> Email</a>
          </Button>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {owner.phone}</div>
        <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {owner.email}</div>
        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {owner.address}</div>
      </div>
    </div>
  );
}



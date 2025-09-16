import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Stethoscope, MapPin, Edit } from "lucide-react";

interface HospitalizationRecord {
  id: string;
  patientName: string;
  petName: string;
  species: string;
  admissionDate: string;
  admissionTime: string;
  reason: string;
  attendingVet: string;
  ward: string;
  status: "admitted" | "discharged" | "critical";
  daysStay: number;
}

interface AdmissionDetailsProps {
  record: HospitalizationRecord;
}

export function AdmissionDetails({ record }: AdmissionDetailsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Pet Name</label>
              <p className="font-medium">{record.petName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Owner</label>
              <p>{record.patientName}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Species/Breed</label>
              <p>{record.species}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admission Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Admission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Admission Date</label>
              <p className="font-medium">{new Date(record.admissionDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Admission Time</label>
              <p className="font-medium">{record.admissionTime}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Days in Hospital</label>
              <p className="font-medium">{record.daysStay} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reason for Hospitalization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Reason for Hospitalization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{record.reason}</p>
          <div className="mt-4">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Reason
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Attending Veterinarian</label>
            <p className="font-medium">{record.attendingVet}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Ward/Room Assignment</label>
            <p className="font-medium">{record.ward}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Kennel Number</label>
            <p className="font-medium">K-{record.id.slice(-2)}</p>
          </div>
          <div className="pt-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Change Assignment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Current Status & Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={
                record.status === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
                record.status === "admitted" ? "bg-info/10 text-info border-info/20" :
                "bg-success/10 text-success border-success/20"
              }>
                {record.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </span>
            </div>
            <Button variant="outline">
              Update Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
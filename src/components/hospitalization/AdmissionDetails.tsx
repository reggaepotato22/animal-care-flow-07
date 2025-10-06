import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, Stethoscope, MapPin, Edit, Check, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [editedReason, setEditedReason] = useState(record.reason);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [editedAssignment, setEditedAssignment] = useState({
    attendingVet: record.attendingVet,
    ward: record.ward,
    kennelNumber: `K-${record.id.slice(-2)}`
  });
  const { toast } = useToast();

  const handleSaveReason = () => {
    // Here you would typically save to backend
    toast({
      title: "Reason updated",
      description: "The hospitalization reason has been updated successfully.",
    });
    setIsEditingReason(false);
  };

  const handleCancelEdit = () => {
    setEditedReason(record.reason);
    setIsEditingReason(false);
  };

  const handleSaveAssignment = () => {
    // Here you would typically save to backend
    toast({
      title: "Assignment updated",
      description: "The assignment details have been updated successfully.",
    });
    setIsEditingAssignment(false);
  };

  const handleCancelAssignmentEdit = () => {
    setEditedAssignment({
      attendingVet: record.attendingVet,
      ward: record.ward,
      kennelNumber: `K-${record.id.slice(-2)}`
    });
    setIsEditingAssignment(false);
  };

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
          {isEditingReason ? (
            <div className="space-y-4">
              <Textarea
                value={editedReason}
                onChange={(e) => setEditedReason(e.target.value)}
                className="min-h-[100px]"
                placeholder="Enter reason for hospitalization..."
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveReason} size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed">{editedReason}</p>
              <div className="mt-4">
                <Button onClick={() => setIsEditingReason(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Reason
                </Button>
              </div>
            </>
          )}
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
          {isEditingAssignment ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="attendingVet">Attending Veterinarian</Label>
                <Input
                  id="attendingVet"
                  value={editedAssignment.attendingVet}
                  onChange={(e) => setEditedAssignment({...editedAssignment, attendingVet: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="ward">Ward/Room Assignment</Label>
                <Input
                  id="ward"
                  value={editedAssignment.ward}
                  onChange={(e) => setEditedAssignment({...editedAssignment, ward: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="kennelNumber">Kennel Number</Label>
                <Input
                  id="kennelNumber"
                  value={editedAssignment.kennelNumber}
                  onChange={(e) => setEditedAssignment({...editedAssignment, kennelNumber: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveAssignment} size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancelAssignmentEdit} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Attending Veterinarian</label>
                <p className="font-medium">{editedAssignment.attendingVet}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ward/Room Assignment</label>
                <p className="font-medium">{editedAssignment.ward}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Kennel Number</label>
                <p className="font-medium">{editedAssignment.kennelNumber}</p>
              </div>
              <div className="pt-2">
                <Button onClick={() => setIsEditingAssignment(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Change Assignment
                </Button>
              </div>
            </>
          )}
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
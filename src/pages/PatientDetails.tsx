import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Phone, Heart, Edit, Trash2, FileText, Pill, Stethoscope, Activity, MoreVertical, FileSearch, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewVisitDialog } from "@/components/NewVisitDialog";
import { DischargeSummaryDialog } from "@/components/DischargeSummaryDialog";
import { PostMortemReportDialog } from "@/components/PostMortemReportDialog";
import { EditPatientDialog } from "@/components/EditPatientDialog";
import { useState } from "react";

// Mock data - in a real app this would come from an API
const mockPatients = {
  "1": {
    id: "1",
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    age: "3 years",
    weight: "28kg",
    sex: "Male",
    color: "Golden",
    microchip: "123456789012345",
    owner: "Sarah Johnson",
    phone: "+1 (555) 123-4567",
    email: "sarah.johnson@email.com",
    address: "123 Oak Street, Downtown",
    location: "Downtown Clinic",
    lastVisit: "2024-01-15",
    nextAppointment: "2024-02-15",
    status: "Active" as const,
    vaccinations: [
      { name: "Rabies", date: "2023-03-15", due: "2024-03-15" },
      { name: "DHPP", date: "2023-04-10", due: "2024-04-10" },
      { name: "Lyme Disease", date: "2023-05-01", due: "2024-05-01" }
    ],
    allergies: ["Beef", "Pollen"],
    medications: [
      { name: "Heartworm Prevention", dosage: "Monthly", prescribed: "2024-01-15" }
    ],
    vitals: [
      { date: "2024-01-15", temperature: "38.5°C", heartRate: "80 bpm", respiratoryRate: "20 rpm", weight: "28kg", bloodPressure: "Normal" },
      { date: "2023-11-20", temperature: "38.2°C", heartRate: "85 bpm", respiratoryRate: "18 rpm", weight: "27.8kg", bloodPressure: "Normal" },
      { date: "2023-08-10", temperature: "38.3°C", heartRate: "82 bpm", respiratoryRate: "19 rpm", weight: "27.5kg", bloodPressure: "Normal" }
    ],
    recentVisits: [
      { date: "2024-01-15", reason: "Annual Checkup", vet: "Dr. Smith", notes: "Healthy dog, all vitals normal" },
      { date: "2023-11-20", reason: "Vaccination", vet: "Dr. Johnson", notes: "Booster shots administered" },
      { date: "2023-08-10", reason: "Dental Cleaning", vet: "Dr. Smith", notes: "Routine dental cleaning completed" }
    ]
  },
  "2": {
    id: "2",
    name: "Whiskers",
    species: "Cat",
    breed: "Persian",
    age: "5 years",
    weight: "4.2kg",
    sex: "Female",
    color: "White",
    microchip: "987654321098765",
    owner: "Michael Chen",
    phone: "+1 (555) 987-6543",
    email: "michael.chen@email.com",
    address: "456 Pine Avenue, North District",
    location: "North Branch",
    lastVisit: "2024-01-18",
    nextAppointment: "2024-02-20",
    status: "Hospitalized" as const,
    vaccinations: [
      { name: "FVRCP", date: "2023-06-15", due: "2024-06-15" },
      { name: "Rabies", date: "2023-07-01", due: "2024-07-01" }
    ],
    allergies: ["Fish", "Dairy"],
    medications: [
      { name: "Antibiotics", dosage: "Twice daily", prescribed: "2024-01-18" },
      { name: "Pain Relief", dosage: "As needed", prescribed: "2024-01-18" }
    ],
    vitals: [
      { date: "2024-01-18", temperature: "39.1°C", heartRate: "95 bpm", respiratoryRate: "25 rpm", weight: "4.2kg", bloodPressure: "Slightly Elevated" },
      { date: "2023-12-05", temperature: "38.4°C", heartRate: "88 bpm", respiratoryRate: "22 rpm", weight: "4.3kg", bloodPressure: "Normal" }
    ],
    recentVisits: [
      { date: "2024-01-18", reason: "Upper Respiratory", vet: "Dr. Brown", notes: "Prescribed antibiotics, follow-up in 2 weeks" },
      { date: "2023-12-05", reason: "Grooming", vet: "Groomer Jane", notes: "Full grooming service" }
    ]
  },
  "3": {
    id: "3",
    name: "Luna",
    species: "Cat",
    breed: "Maine Coon",
    age: "2 years",
    weight: "5.1kg",
    sex: "Female",
    color: "Gray Tabby",
    microchip: "456789123456789",
    owner: "Emily Rodriguez",
    phone: "+1 (555) 456-7890",
    email: "emily.rodriguez@email.com",
    address: "789 Maple Drive, Central City",
    location: "Main Office",
    lastVisit: "2024-01-20",
    nextAppointment: "2024-03-01",
    status: "Active" as const,
    vaccinations: [
      { name: "FVRCP", date: "2023-08-15", due: "2024-08-15" },
      { name: "Rabies", date: "2023-09-01", due: "2024-09-01" }
    ],
    allergies: ["None known"],
    medications: [],
    vitals: [
      { date: "2024-01-20", temperature: "38.1°C", heartRate: "75 bpm", respiratoryRate: "16 rpm", weight: "5.1kg", bloodPressure: "Normal" }
    ],
    recentVisits: [
      { date: "2024-01-20", reason: "Wellness Check", vet: "Dr. Wilson", notes: "Excellent health, continue current diet" }
    ]
  },
  "4": {
    id: "4",
    name: "Rocky",
    species: "Dog",
    breed: "German Shepherd",
    age: "7 years",
    weight: "35kg",
    sex: "Male",
    color: "Black and Tan",
    microchip: "789012345678901",
    owner: "David Thompson",
    phone: "+1 (555) 321-0987",
    email: "david.thompson@email.com",
    address: "321 Elm Street, Emergency District",
    location: "Emergency Center",
    lastVisit: "2024-01-19",
    nextAppointment: "2024-01-25",
    status: "Hospitalized" as const,
    vaccinations: [
      { name: "Rabies", date: "2023-05-15", due: "2024-05-15" },
      { name: "DHPP", date: "2023-06-10", due: "2024-06-10" }
    ],
    allergies: ["Chicken", "Wheat"],
    medications: [
      { name: "Heart Medication", dosage: "Twice daily", prescribed: "2024-01-19" },
      { name: "Pain Management", dosage: "Three times daily", prescribed: "2024-01-19" }
    ],
    vitals: [
      { date: "2024-01-19", temperature: "39.2°C", heartRate: "120 bpm", respiratoryRate: "30 rpm", weight: "35kg", bloodPressure: "Elevated" },
      { date: "2024-01-10", temperature: "38.8°C", heartRate: "110 bpm", respiratoryRate: "28 rpm", weight: "35.2kg", bloodPressure: "High" }
    ],
    recentVisits: [
      { date: "2024-01-19", reason: "Emergency Visit", vet: "Dr. Emergency", notes: "Heart condition monitoring required, critical care" },
      { date: "2024-01-10", reason: "Follow-up", vet: "Dr. Emergency", notes: "Condition stabilizing" }
    ]
  }
};

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const patient = id ? mockPatients[id as keyof typeof mockPatients] : null;
  const [currentStatus, setCurrentStatus] = useState<string>(patient?.status || "Active");

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-muted-foreground">Patient Not Found</h2>
          <Button onClick={() => navigate("/patients")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "Hospitalized":
        return "bg-warning text-warning-foreground";
      case "Discharged":
        return "bg-muted text-muted-foreground";
      case "Referred":
        return "bg-secondary text-secondary-foreground";
      case "Deceased":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    // In a real app, this would make an API call to update the patient status
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/patients")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 bg-veterinary-light rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-veterinary-teal" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{patient.name}</h1>
              <p className="text-muted-foreground">
                {patient.species} • {patient.breed}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(currentStatus)}>
                {currentStatus}
              </Badge>
              <Select value={currentStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Hospitalized">Hospitalized</SelectItem>
                  <SelectItem value="Discharged">Discharged</SelectItem>
                  <SelectItem value="Referred">Referred</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="destructive" className="hover:bg-destructive/90">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions
                <MoreVertical className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                className="cursor-pointer"
                onSelect={(e) => e.preventDefault()}
              >
                <NewVisitDialog>
                  <div className="flex items-center w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    New Visit
                  </div>
                </NewVisitDialog>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onSelect={(e) => e.preventDefault()}
              >
                <DischargeSummaryDialog>
                  <div className="flex items-center w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Discharge Patient
                  </div>
                </DischargeSummaryDialog>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onSelect={(e) => e.preventDefault()}
              >
                <PostMortemReportDialog
                  patientData={{
                    id: patient.id,
                    name: patient.name,
                    species: patient.species,
                    breed: patient.breed
                  }}
                >
                  <div className="flex items-center w-full">
                    <FileSearch className="mr-2 h-4 w-4" />
                    Post Mortem Report
                  </div>
                </PostMortemReportDialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Patient Info Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Patient Information</CardTitle>
              <EditPatientDialog patient={patient}>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Patient
                </Button>
              </EditPatientDialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Age:</span>
              <span className="font-medium">{patient.age}</span>
              <span className="text-muted-foreground">Weight:</span>
              <span className="font-medium">{patient.weight}</span>
              <span className="text-muted-foreground">Sex:</span>
              <span className="font-medium">{patient.sex}</span>
              <span className="text-muted-foreground">Color:</span>
              <span className="font-medium">{patient.color}</span>
              <span className="text-muted-foreground">Microchip:</span>
              <span className="font-medium text-xs">{patient.microchip}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Owner Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="font-medium">{patient.owner}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{patient.address}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visit Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Last visit: {patient.lastVisit}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Next: {patient.nextAppointment}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{patient.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Information Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Visits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-veterinary-teal" />
              <span>Recent Visits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.recentVisits.map((visit, index) => (
              <Card key={index} className="border-l-4 border-l-veterinary-teal">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{visit.reason}</span>
                        <Badge variant="outline">{visit.date}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Attended by: {visit.vet}
                      </p>
                      <p className="text-sm">{visit.notes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Vitals Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-veterinary-teal" />
                <span>Vitals Overview</span>
              </CardTitle>
              <Button size="sm">
                <Activity className="mr-2 h-4 w-4" />
                Record New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.vitals && patient.vitals.length > 0 ? (
              <div className="grid gap-4">
                {patient.vitals.map((vital, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline">{vital.date}</Badge>
                        <Badge 
                          variant={
                            vital.bloodPressure === "Normal" ? "default" :
                            vital.bloodPressure === "Slightly Elevated" ? "secondary" : "destructive"
                          }
                        >
                          {vital.bloodPressure}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">Temperature</span>
                          <span className="font-medium">{vital.temperature}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">Heart Rate</span>
                          <span className="font-medium">{vital.heartRate}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">Respiratory</span>
                          <span className="font-medium">{vital.respiratoryRate}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">Weight</span>
                          <span className="font-medium">{vital.weight}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">BP Status</span>
                          <span className="font-medium">{vital.bloodPressure}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No vital signs recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vaccinations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Pill className="h-5 w-5 text-veterinary-teal" />
                <span>Vaccinations</span>
              </CardTitle>
              <Button size="sm">
                <Pill className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.vaccinations.map((vaccine, index) => (
              <Card key={index} className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{vaccine.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Last: {vaccine.date}
                      </p>
                    </div>
                    <Badge variant={new Date(vaccine.due) < new Date() ? "destructive" : "default"} className="text-xs">
                      Due: {vaccine.due}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Medications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Pill className="h-5 w-5 text-veterinary-teal" />
                <span>Medications</span>
              </CardTitle>
              <Button size="sm">
                <Pill className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.medications.length > 0 ? (
              patient.medications.map((medication, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="p-3">
                    <div>
                      <h4 className="font-semibold text-sm">{medication.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Dosage: {medication.dosage}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Prescribed: {medication.prescribed}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground text-sm py-4">
                No current medications
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allergies & Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-veterinary-teal" />
              <span>Allergies & Special Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Known Allergies</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(patient.allergies) ? (
                    patient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive">
                        {allergy}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">{patient.allergies}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
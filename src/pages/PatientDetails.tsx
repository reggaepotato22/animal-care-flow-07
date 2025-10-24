import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Phone, Heart, Edit, Trash2, FileText, Pill, Stethoscope, Activity, MoreVertical, FileSearch, ChevronDown, AlertTriangle, Clock, TestTube, Mail, MessageSquare, User, Building2, MapPinIcon, DollarSign, CheckCircle, Circle, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewVisitDialog } from "@/components/NewVisitDialog";
import { DischargeSummaryDialog } from "@/components/DischargeSummaryDialog";
import { PostMortemReportDialog } from "@/components/PostMortemReportDialog";
import { EditPatientDialog } from "@/components/EditPatientDialog";
import { useState, useMemo } from "react";
import { PatientHeader } from "@/components/PatientHeader";
import { VitalsSparkline } from "@/components/VitalsSparkline";

// Mock data - in a real app this would come from an API
const mockPatients = {
  "1": {
    id: "1",
    patientId: "P-2025-10234",
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    age: "3 years",
    weight: "28kg",
    sex: "Male",
    color: "Golden",
    microchip: "123456789012345",
    owner: "Sarah Johnson",
    ownerId: "C-2025-001",
    ownerType: "Individual",
    phone: "+1 (555) 123-4567",
    alternatePhone: "+1 (555) 123-4568",
    email: "sarah.johnson@email.com",
    preferredContact: "Phone",
    address: "123 Oak Street, Downtown",
    city: "Downtown",
    postalCode: "12345",
    billingAddress: "123 Oak Street, Downtown",
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
    ],
    medicalHistory: [
      {
        id: "MH-001",
        date: "2024-01-15",
        time: "10:30 AM",
        type: "Checkup",
        personnel: "Dr. Sarah Smith",
        role: "Veterinarian",
        description: "Annual wellness examination",
        quantity: 1,
        amount: 150.00,
        status: "Completed",
        notes: "Healthy dog, all vitals normal. Recommended continued exercise routine."
      },
      {
        id: "MH-002",
        date: "2023-12-20",
        time: "2:15 PM",
        type: "Vaccination",
        personnel: "Dr. Michael Johnson",
        role: "Veterinarian",
        description: "Rabies vaccination booster",
        quantity: 1,
        amount: 85.00,
        status: "Completed",
        notes: "Annual rabies booster administered. No adverse reactions observed."
      },
      {
        id: "MH-003",
        date: "2023-11-15",
        time: "9:00 AM",
        type: "Procedure",
        personnel: "Dr. Sarah Smith",
        role: "Veterinarian",
        description: "Dental cleaning and scaling",
        quantity: 1,
        amount: 320.00,
        status: "Completed",
        notes: "Full dental cleaning under anesthesia. Two teeth extracted due to decay."
      },
      {
        id: "MH-004",
        date: "2023-10-05",
        time: "3:45 PM",
        type: "Emergency",
        personnel: "Dr. Lisa Brown",
        role: "Emergency Veterinarian",
        description: "Emergency visit - suspected poisoning",
        quantity: 1,
        amount: 450.00,
        status: "Completed",
        notes: "Patient ingested chocolate. Induced vomiting, administered activated charcoal. Full recovery."
      },
      {
        id: "MH-005",
        date: "2023-09-10",
        time: "11:30 AM",
        type: "Follow-up",
        personnel: "Dr. Sarah Smith",
        role: "Veterinarian",
        description: "Post-surgery follow-up",
        quantity: 1,
        amount: 75.00,
        status: "Completed",
        notes: "Surgical site healing well. Suture removal scheduled for next week."
      },
      {
        id: "MH-006",
        date: "2023-08-15",
        time: "1:00 PM",
        type: "Surgery",
        personnel: "Dr. Robert Wilson",
        role: "Surgeon",
        description: "Spay surgery",
        quantity: 1,
        amount: 650.00,
        status: "Completed",
        notes: "Routine spay surgery completed successfully. Patient recovered well."
      },
      {
        id: "MH-007",
        date: "2023-07-20",
        time: "4:20 PM",
        type: "Vaccination",
        personnel: "Nurse Jennifer Davis",
        role: "Veterinary Nurse",
        description: "DHPP vaccination",
        quantity: 1,
        amount: 65.00,
        status: "Completed",
        notes: "Annual DHPP vaccination administered. Patient was calm and cooperative."
      },
      {
        id: "MH-008",
        date: "2024-02-01",
        time: "2:00 PM",
        type: "Follow-up",
        personnel: "Dr. Sarah Smith",
        role: "Veterinarian",
        description: "Weight management consultation",
        quantity: 1,
        amount: 90.00,
        status: "Pending",
        notes: "Scheduled follow-up to monitor weight loss progress. Diet plan review."
      }
    ]
  },
  "2": {
    id: "2",
    patientId: "P-2025-10235",
    name: "Whiskers",
    species: "Cat",
    breed: "Persian",
    age: "5 years",
    weight: "4.2kg",
    sex: "Female",
    color: "White",
    microchip: "987654321098765",
    owner: "Michael Chen",
    ownerId: "C-2025-002",
    ownerType: "Individual",
    phone: "+1 (555) 987-6543",
    alternatePhone: "",
    email: "michael.chen@email.com",
    preferredContact: "Email",
    address: "456 Pine Avenue, North District",
    city: "North District",
    postalCode: "67890",
    billingAddress: "456 Pine Avenue, North District",
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
    ],
    medicalHistory: [
      {
        id: "MH-009",
        date: "2024-01-18",
        time: "3:30 PM",
        type: "Emergency",
        personnel: "Dr. Emily Brown",
        role: "Veterinarian",
        description: "Upper respiratory infection treatment",
        quantity: 1,
        amount: 280.00,
        status: "Active",
        notes: "Prescribed antibiotics, follow-up in 2 weeks. Patient showing improvement."
      },
      {
        id: "MH-010",
        date: "2023-12-15",
        time: "10:00 AM",
        type: "Vaccination",
        personnel: "Dr. Emily Brown",
        role: "Veterinarian",
        description: "FVRCP vaccination",
        quantity: 1,
        amount: 75.00,
        status: "Completed",
        notes: "Annual FVRCP vaccination administered. No adverse reactions."
      },
      {
        id: "MH-011",
        date: "2023-11-20",
        time: "2:00 PM",
        type: "Procedure",
        personnel: "Dr. Michael Chen",
        role: "Veterinarian",
        description: "Dental examination and cleaning",
        quantity: 1,
        amount: 180.00,
        status: "Completed",
        notes: "Routine dental cleaning. No extractions needed."
      }
    ]
  },
  "3": {
    id: "3",
    patientId: "P-2025-10236",
    name: "Luna",
    species: "Cat",
    breed: "Maine Coon",
    age: "2 years",
    weight: "5.1kg",
    sex: "Female",
    color: "Gray Tabby",
    microchip: "456789123456789",
    owner: "Emily Rodriguez",
    ownerId: "C-2025-003",
    ownerType: "Individual",
    phone: "+1 (555) 456-7890",
    alternatePhone: "+1 (555) 456-7891",
    email: "emily.rodriguez@email.com",
    preferredContact: "SMS",
    address: "789 Maple Drive, Central City",
    city: "Central City",
    postalCode: "54321",
    billingAddress: "789 Maple Drive, Central City",
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
    ],
    medicalHistory: [
      {
        id: "MH-012",
        date: "2024-01-20",
        time: "11:00 AM",
        type: "Checkup",
        personnel: "Dr. James Wilson",
        role: "Veterinarian",
        description: "Annual wellness examination",
        quantity: 1,
        amount: 120.00,
        status: "Completed",
        notes: "Excellent health, continue current diet. All vitals within normal range."
      },
      {
        id: "MH-013",
        date: "2023-08-15",
        time: "2:30 PM",
        type: "Vaccination",
        personnel: "Dr. James Wilson",
        role: "Veterinarian",
        description: "FVRCP and Rabies vaccinations",
        quantity: 2,
        amount: 140.00,
        status: "Completed",
        notes: "Both vaccinations administered successfully. No adverse reactions observed."
      }
    ]
  },
  "4": {
    id: "4",
    patientId: "P-2025-10237",
    name: "Rocky",
    species: "Dog",
    breed: "German Shepherd",
    age: "7 years",
    weight: "35kg",
    sex: "Male",
    color: "Black and Tan",
    microchip: "789012345678901",
    owner: "David Thompson",
    ownerId: "C-2025-004",
    ownerType: "Organization",
    phone: "+1 (555) 321-0987",
    alternatePhone: "+1 (555) 321-0988",
    email: "david.thompson@email.com",
    preferredContact: "Phone",
    address: "321 Elm Street, Emergency District",
    city: "Emergency District",
    postalCode: "98765",
    billingAddress: "321 Elm Street, Emergency District",
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
    ],
    medicalHistory: [
      {
        id: "MH-014",
        date: "2024-01-19",
        time: "8:45 PM",
        type: "Emergency",
        personnel: "Dr. Amanda Emergency",
        role: "Emergency Veterinarian",
        description: "Emergency cardiac evaluation",
        quantity: 1,
        amount: 750.00,
        status: "Active",
        notes: "Heart condition monitoring required, critical care. Patient stabilized."
      },
      {
        id: "MH-015",
        date: "2024-01-10",
        time: "4:00 PM",
        type: "Follow-up",
        personnel: "Dr. Amanda Emergency",
        role: "Emergency Veterinarian",
        description: "Cardiac follow-up examination",
        quantity: 1,
        amount: 200.00,
        status: "Completed",
        notes: "Condition stabilizing. Medication adjustments made."
      },
      {
        id: "MH-016",
        date: "2023-12-01",
        time: "1:30 PM",
        type: "Surgery",
        personnel: "Dr. Robert Wilson",
        role: "Cardiac Surgeon",
        description: "Heart valve repair surgery",
        quantity: 1,
        amount: 2500.00,
        status: "Completed",
        notes: "Complex heart valve repair completed successfully. Patient recovering well."
      }
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

  const getEncounterStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEncounterStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-3 w-3" />;
      case "Active":
        return <Circle className="h-3 w-3" />;
      case "Pending":
        return <Clock className="h-3 w-3" />;
      case "Cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  const getEncounterTypeIcon = (type: string) => {
    switch (type) {
      case "Checkup":
        return <Stethoscope className="h-4 w-4" />;
      case "Vaccination":
        return <Pill className="h-4 w-4" />;
      case "Procedure":
        return <Activity className="h-4 w-4" />;
      case "Emergency":
        return <AlertTriangle className="h-4 w-4" />;
      case "Surgery":
        return <FileText className="h-4 w-4" />;
      case "Follow-up":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    // In a real app, this would make an API call to update the patient status
  };

  const weightTrend = useMemo(() => (patient.vitals || []).map(v => ({ date: v.date, value: Number((v.weight || "0").replace(/[^0-9.]/g, "")) })), [patient.vitals]);

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

      <PatientHeader
        name={patient.name}
        species={patient.species}
        breed={patient.breed}
        status={currentStatus}
        patientId={patient.patientId}
        age={patient.age}
        weight={patient.weight}
        sex={patient.sex}
        color={patient.color}
        microchip={patient.microchip}
        owner={{ name: patient.owner, phone: patient.phone, email: patient.email, address: patient.address }}
        patient={patient}
        onStatusChipClass={getStatusColor}
      />
      
      {/* Medical History Table */}
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-veterinary-teal" />
            <span>Medical History</span>
          </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date & Time</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[200px]">Personnel</TableHead>
                  <TableHead className="w-[250px]">Description</TableHead>
                  <TableHead className="w-[80px] text-center">Qty</TableHead>
                  <TableHead className="w-[100px] text-right">Amount</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[200px]">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.medicalHistory?.map((encounter) => (
                  <TableRow key={encounter.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="text-sm">{encounter.date}</div>
                        <div className="text-xs text-muted-foreground">{encounter.time}</div>
            </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getEncounterTypeIcon(encounter.type)}
                        <span className="text-sm font-medium">{encounter.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{encounter.personnel}</div>
                        <div className="text-xs text-muted-foreground">{encounter.role}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{encounter.description}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">{encounter.quantity}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{encounter.amount.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${getEncounterStatusColor(encounter.status)} flex items-center space-x-1 w-fit`}
                      >
                        {getEncounterStatusIcon(encounter.status)}
                        <span className="text-xs">{encounter.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={encounter.notes}>
                        {encounter.notes}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

      {/* Owner Information */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-veterinary-teal" />
              <span>Owner Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Owner Profile Section */}
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-veterinary-teal to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                {patient.owner.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">{patient.owner}</h3>
                  <Badge variant={patient.ownerType === "Organization" ? "secondary" : "default"}>
                    {patient.ownerType === "Organization" ? <Building2 className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                    {patient.ownerType}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span className="font-mono font-medium text-primary">ID: {patient.ownerId}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Details Section */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Contact Details
              </h4>
              <div className="space-y-3">
                {/* Primary Phone */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{patient.phone}</span>
                      <span className="text-xs text-muted-foreground ml-2">Primary</span>
              </div>
              </div>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${patient.phone}`}>
                        <Phone className="h-3 w-3" />
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`sms:${patient.phone}`}>
                        <MessageSquare className="h-3 w-3" />
                      </a>
                    </Button>
            </div>
                </div>

                {/* Alternate Phone */}
                {patient.alternatePhone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">{patient.alternatePhone}</span>
                        <span className="text-xs text-muted-foreground ml-2">Alternate</span>
              </div>
              </div>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${patient.alternatePhone}`}>
                          <Phone className="h-3 w-3" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`sms:${patient.alternatePhone}`}>
                          <MessageSquare className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{patient.email}</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${patient.email}`}>
                      <Mail className="h-3 w-3" />
                    </a>
                  </Button>
                </div>

                {/* Preferred Contact Method */}
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {patient.preferredContact === "Phone" && <Phone className="h-3 w-3 text-muted-foreground" />}
                    {patient.preferredContact === "Email" && <Mail className="h-3 w-3 text-muted-foreground" />}
                    {patient.preferredContact === "SMS" && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Preferred: <span className="font-medium">{patient.preferredContact}</span>
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Address Information Section */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2" />
                Address Information
              </h4>
              <div className="space-y-3">
                {/* Physical Address */}
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Physical Address</span>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">{patient.address}</div>
                      <div className="text-muted-foreground">{patient.city}, {patient.postalCode}</div>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Billing Address</span>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">{patient.billingAddress}</div>
                      <div className="text-muted-foreground">{patient.city}, {patient.postalCode}</div>
                    </div>
                  </div>
                </div>
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
                      <p className="text-xs text-muted-foreground">
                        Batch: {(vaccine as any).batchNumber ?? 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Administered by: {(vaccine as any).administeredBy ?? 'N/A'}
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

        {/* Reminders & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Reminders & Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Due/Overdue Vaccines */}
              <div>
                <h4 className="font-semibold mb-2 text-sm text-orange-600">Due/Overdue Vaccines</h4>
                <div className="space-y-2">
                  {patient.vaccinations
                    .filter(vaccine => new Date(vaccine.due) <= new Date())
                    .map((vaccine, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium">{vaccine.name}</span>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Due: {vaccine.due}
                        </Badge>
                      </div>
                    ))}
                  {patient.vaccinations.filter(vaccine => new Date(vaccine.due) <= new Date()).length === 0 && (
                    <p className="text-sm text-muted-foreground">No overdue vaccines</p>
                  )}
                </div>
              </div>

              {/* Follow-ups */}
              <div>
                <h4 className="font-semibold mb-2 text-sm text-blue-600">Follow-ups</h4>
                <div className="space-y-2">
                  {patient.recentVisits
                    .filter(visit => visit.notes.toLowerCase().includes('follow-up') || visit.notes.toLowerCase().includes('recheck'))
                    .map((visit, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">{visit.reason}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {visit.date}
                        </Badge>
                      </div>
                    ))}
                  {patient.recentVisits.filter(visit => visit.notes.toLowerCase().includes('follow-up') || visit.notes.toLowerCase().includes('recheck')).length === 0 && (
                    <p className="text-sm text-muted-foreground">No pending follow-ups</p>
                  )}
                </div>
              </div>

              {/* Lab Rechecks */}
              <div>
                <h4 className="font-semibold mb-2 text-sm text-purple-600">Lab Rechecks</h4>
                <div className="space-y-2">
                  {patient.recentVisits
                    .filter(visit => visit.notes.toLowerCase().includes('lab') || visit.notes.toLowerCase().includes('bloodwork'))
                    .map((visit, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <TestTube className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium">{visit.reason}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {visit.date}
                        </Badge>
                      </div>
                    ))}
                  {patient.recentVisits.filter(visit => visit.notes.toLowerCase().includes('lab') || visit.notes.toLowerCase().includes('bloodwork')).length === 0 && (
                    <p className="text-sm text-muted-foreground">No lab rechecks needed</p>
                  )}
                </div>
              </div>
            </div>
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
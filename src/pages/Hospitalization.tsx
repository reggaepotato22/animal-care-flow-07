import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Hospital, Calendar, Users, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdmissionDetails } from "@/components/hospitalization/AdmissionDetails";
import { ClinicalOrders } from "@/components/hospitalization/ClinicalOrders";
import { MonitoringSection } from "@/components/hospitalization/MonitoringSection";
import { ProgressNotes } from "@/components/hospitalization/ProgressNotes";

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

interface AwaitingAdmissionRecord {
  id: string;
  patientName: string;
  petName: string;
  species: string;
  scheduledDate: string;
  reason: string;
  attendingVet: string;
  priority: "routine" | "urgent" | "emergency";
  estimatedStay: number;
}

const mockRecords: HospitalizationRecord[] = [
  {
    id: "H001",
    patientName: "Sarah Johnson",
    petName: "Max",
    species: "Dog (Golden Retriever)",
    admissionDate: "2024-01-20",
    admissionTime: "14:30",
    reason: "Post-surgical monitoring",
    attendingVet: "Dr. Smith",
    ward: "Surgery Recovery",
    status: "admitted",
    daysStay: 2
  },
  {
    id: "H002",
    patientName: "Mike Wilson",
    petName: "Whiskers",
    species: "Cat (Persian)",
    admissionDate: "2024-01-19",
    admissionTime: "09:15",
    reason: "Severe dehydration",
    attendingVet: "Dr. Brown",
    ward: "ICU",
    status: "critical",
    daysStay: 3
  },
  {
    id: "H003",
    patientName: "Emily Davis",
    petName: "Bella",
    species: "Dog (Labrador)",
    admissionDate: "2024-01-15",
    admissionTime: "16:45",
    reason: "Observation post-trauma",
    attendingVet: "Dr. Johnson",
    ward: "General Ward",
    status: "discharged",
    daysStay: 4
  }
];

const mockAwaitingRecords: AwaitingAdmissionRecord[] = [
  {
    id: "A001",
    patientName: "John Smith",
    petName: "Luna",
    species: "Cat (Maine Coon)",
    scheduledDate: "2024-01-22",
    reason: "Spay surgery recovery",
    attendingVet: "Dr. Smith",
    priority: "routine",
    estimatedStay: 2
  },
  {
    id: "A002",
    patientName: "Lisa Brown",
    petName: "Rocky",
    species: "Dog (Bulldog)",
    scheduledDate: "2024-01-21",
    reason: "Respiratory distress monitoring",
    attendingVet: "Dr. Brown",
    priority: "urgent",
    estimatedStay: 3
  },
  {
    id: "A003",
    patientName: "David Wilson",
    petName: "Milo",
    species: "Dog (Beagle)",
    scheduledDate: "2024-01-21",
    reason: "Emergency toxin ingestion",
    attendingVet: "Dr. Johnson",
    priority: "emergency",
    estimatedStay: 1
  }
];

export default function Hospitalization() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<HospitalizationRecord[]>(mockRecords);
  const [awaitingRecords, setAwaitingRecords] = useState<AwaitingAdmissionRecord[]>(mockAwaitingRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<HospitalizationRecord | null>(null);
  const [activeTab, setActiveTab] = useState("hospitalized");

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredAwaitingRecords = awaitingRecords.filter(record => {
    const matchesSearch = 
      record.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "routine": return "bg-info/10 text-info border-info/20";
      case "urgent": return "bg-warning/10 text-warning border-warning/20";
      case "emergency": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const handleAdmitPatient = (awaitingRecord: AwaitingAdmissionRecord, ward: string) => {
    const newRecord: HospitalizationRecord = {
      id: `H${String(records.length + 1).padStart(3, '0')}`,
      patientName: awaitingRecord.patientName,
      petName: awaitingRecord.petName,
      species: awaitingRecord.species,
      admissionDate: new Date().toISOString().split('T')[0],
      admissionTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      reason: awaitingRecord.reason,
      attendingVet: awaitingRecord.attendingVet,
      ward: ward,
      status: "admitted",
      daysStay: 0
    };

    setRecords([...records, newRecord]);
    setAwaitingRecords(awaitingRecords.filter(record => record.id !== awaitingRecord.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "admitted": return "bg-info/10 text-info border-info/20";
      case "critical": return "bg-destructive/10 text-destructive border-destructive/20";
      case "discharged": return "bg-success/10 text-success border-success/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  if (selectedRecord) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <Button variant="ghost" onClick={() => setSelectedRecord(null)} className="mb-2 p-0 h-auto">
              ← Back to Records
            </Button>
            <h1 className="text-3xl font-bold">Hospitalization Record - {selectedRecord.petName}</h1>
            <p className="text-muted-foreground">
              {selectedRecord.patientName} • Admitted {new Date(selectedRecord.admissionDate).toLocaleDateString()}
            </p>
          </div>
          
          <Badge className={getStatusColor(selectedRecord.status)}>
            {selectedRecord.status}
          </Badge>
        </div>

        <Tabs defaultValue="admission" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="admission">Admission Details</TabsTrigger>
            <TabsTrigger value="orders">Clinical Orders</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="progress">Progress Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="admission">
            <AdmissionDetails record={selectedRecord} />
          </TabsContent>

          <TabsContent value="orders">
            <ClinicalOrders record={selectedRecord} />
          </TabsContent>

          <TabsContent value="monitoring">
            <MonitoringSection record={selectedRecord} />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressNotes record={selectedRecord} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Hospitalization Management</h1>
          <p className="text-muted-foreground">
            Manage admissions and hospitalized patients
          </p>
        </div>
        
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule Admission
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="awaiting" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Awaiting Admission ({awaitingRecords.length})
          </TabsTrigger>
          <TabsTrigger value="hospitalized" className="flex items-center gap-2">
            <Hospital className="h-4 w-4" />
            Currently Hospitalized ({records.filter(r => r.status !== 'discharged').length})
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, pet name, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {activeTab === "hospitalized" && (
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Records</SelectItem>
                    <SelectItem value="admitted">Admitted</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <TabsContent value="awaiting">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead className="w-32">Pet Name</TableHead>
                    <TableHead className="w-36">Owner</TableHead>
                    <TableHead className="w-40">Species</TableHead>
                    <TableHead className="w-32">Scheduled</TableHead>
                    <TableHead className="w-48">Reason</TableHead>
                    <TableHead className="w-32">Attending Vet</TableHead>
                    <TableHead className="w-24">Priority</TableHead>
                    <TableHead className="w-24">Est. Stay</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAwaitingRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell className="w-24 font-mono text-sm font-medium">
                        {record.id}
                      </TableCell>
                      <TableCell className="w-32 font-medium">
                        {record.petName}
                      </TableCell>
                      <TableCell className="w-36">
                        {record.patientName}
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="truncate">
                          {record.species}
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        {new Date(record.scheduledDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="truncate">
                          {record.reason}
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        <div className="truncate">
                          {record.attendingVet}
                        </div>
                      </TableCell>
                      <TableCell className="w-24">
                        <Badge className={getPriorityColor(record.priority)}>
                          {record.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-24 text-center">
                        {record.estimatedStay} days
                      </TableCell>
                      <TableCell className="w-32">
                        <Select onValueChange={(ward) => handleAdmitPatient(record, ward)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Admit to..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ICU">ICU</SelectItem>
                            <SelectItem value="Surgery Recovery">Surgery Recovery</SelectItem>
                            <SelectItem value="General Ward">General Ward</SelectItem>
                            <SelectItem value="Isolation">Isolation</SelectItem>
                            <SelectItem value="Emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {filteredAwaitingRecords.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No patients awaiting admission found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hospitalized">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Record ID</TableHead>
                    <TableHead className="w-32">Pet Name</TableHead>
                    <TableHead className="w-36">Owner</TableHead>
                    <TableHead className="w-40">Species</TableHead>
                    <TableHead className="w-32">Admission</TableHead>
                    <TableHead className="w-48">Reason</TableHead>
                    <TableHead className="w-32">Attending Vet</TableHead>
                    <TableHead className="w-32">Ward</TableHead>
                    <TableHead className="w-24">Days</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow 
                      key={record.id} 
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <TableCell className="w-24 font-mono text-sm font-medium">
                        {record.id}
                      </TableCell>
                      <TableCell className="w-32 font-medium">
                        {record.petName}
                      </TableCell>
                      <TableCell className="w-36">
                        {record.patientName}
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="truncate">
                          {record.species}
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        <div className="flex flex-col text-sm">
                          <span>{new Date(record.admissionDate).toLocaleDateString()}</span>
                          <span className="text-muted-foreground text-xs">{record.admissionTime}</span>
                        </div>
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="truncate">
                          {record.reason}
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        <div className="truncate">
                          {record.attendingVet}
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        <div className="truncate">
                          {record.ward}
                        </div>
                      </TableCell>
                      <TableCell className="w-24 text-center">
                        {record.daysStay}
                      </TableCell>
                      <TableCell className="w-28">
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {filteredRecords.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Hospital className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hospitalization records found matching your criteria.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Filter, Search, Grid3X3, List, Stethoscope, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatientCard } from "@/components/PatientCard";
import { useToast } from "@/hooks/use-toast";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPatients } from "@/data/patients";
import { useRole } from "@/contexts/RoleContext";
import { useEncounter } from "@/contexts/EncounterContext";
import { mockAppointments } from "@/pages/Appointments";
import { format } from "date-fns";

export default function Patients() {
  const navigate = useNavigate();
  const location = useLocation();
  const { has } = useRole();
  const { toast } = useToast();
  const { encounters } = useEncounter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Workflow context for check-in action
  const wf = useWorkflowContext();

  const { createEncounter } = useEncounter();

  const handleCheckIn = (patient: any) => {
    // Create encounter for the patient
    createEncounter(patient.id, {
      reason: "General Visit",
      chiefComplaint: "",
    });

    wf.setStep(patient.patientId || patient.id, "TRIAGE");
    toast({
      title: "Checked-in",
      description: `${patient.name} has been checked-in and moved to Triage.`,
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || params.get("search");
    if (q) setSearchTerm(q);
  }, [location.search]);

  const filteredPatients = mockPatients.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    const matchesSpecies = speciesFilter === "all" || patient.species.toLowerCase() === speciesFilter;
    
    return matchesSearch && matchesStatus && matchesSpecies;
  });

  const handleViewDetails = (patient: any) => {
    navigate(`/patients/${patient.id}`);
  };

  const handleSendToTriage = (patient: any) => {
    navigate("/triage", { state: { patient } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground">
            Manage your animal patients and their records
          </p>
        </div>
        {has("can_register_patients") && (
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => navigate("/patients/add")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search patients by name, owner, or breed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="treatment">Treatment</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            <SelectItem value="dog">Dogs</SelectItem>
            <SelectItem value="cat">Cats</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-md">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => {
            const hasActiveVisit = encounters.some(
              (enc) => enc.patientId === patient.id && ["WAITING", "IN_TRIAGE", "TRIAGED"].includes(enc.status)
            );
            
            const todayAppointment = mockAppointments.find(
              (apt) => apt.patientId === patient.id && format(apt.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            );
            const hasAppointmentToday = !!todayAppointment;
            
            return (
              <PatientCard
                key={patient.id}
                patient={patient}
                onViewDetails={handleViewDetails}
                onTriage={hasActiveVisit ? handleSendToTriage : undefined}
                hasAppointmentToday={hasAppointmentToday}
                appointmentDetails={todayAppointment ? { time: todayAppointment.time, vet: todayAppointment.vet } : undefined}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Species & Breed</TableHead>
                <TableHead>Age & Weight</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Appt Today</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => {
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

                const todayAppointment = mockAppointments.find(apt => apt.patientId === patient.id && format(apt.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));

                return (
                  <TableRow 
                    key={patient.id} 
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(patient)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{patient.patientId}</TableCell>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {patient.species}
                        <div className="text-muted-foreground">{patient.breed}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {patient.age}
                        <div className="text-muted-foreground">{patient.weight}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {patient.owner}
                        <div className="text-muted-foreground">{patient.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{patient.location}</TableCell>
                    <TableCell className="text-sm">{patient.lastVisit}</TableCell>
                    <TableCell>
                      {todayAppointment ? (
                        <div className="flex flex-col gap-0.5 min-w-[120px]">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            {todayAppointment.time}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex flex-col">
                            <span>{todayAppointment.vet}</span>
                            <Badge variant="outline" className="text-[9px] h-3.5 px-1 w-fit mt-0.5 border-blue-100 bg-blue-50/50 text-blue-700">
                              {todayAppointment.type}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No appointment</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(patient.status)}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Complete</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {has("can_triage") && encounters.some(enc => enc.patientId === patient.id && ["WAITING", "IN_TRIAGE", "TRIAGED"].includes(enc.status)) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendToTriage(patient);
                            }}
                          >
                            <Stethoscope className="h-3.5 w-3.5 mr-1" />
                            Triage
                          </Button>
                        ) : (
                          has("can_register_patients") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckIn(patient);
                              }}
                              disabled={!todayAppointment}
                              title={!todayAppointment ? "No appointment scheduled for today" : ""}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Check-in
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No patients found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}

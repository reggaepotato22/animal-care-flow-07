import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Filter, Search, Grid3X3, List, Stethoscope, CheckCircle, Users, CalendarClock, Activity, AlertTriangle, ArrowUpDown, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatientCard } from "@/components/PatientCard";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPatients } from "@/lib/patientStore";
import { useRole } from "@/contexts/RoleContext";
import { useEncounter } from "@/contexts/EncounterContext";
import { loadStoredAppointments } from "@/lib/appointmentStore";
import { format, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Workflow/visit status tag ──────────────────────────────────────────────
const VISIT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  WAITING:         { label: "Waiting",         cls: "bg-amber-100  text-amber-700  border-amber-300  dark:bg-amber-950/40  dark:text-amber-400" },
  IN_TRIAGE:       { label: "In Triage",       cls: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400" },
  TRIAGED:         { label: "Triaged",          cls: "bg-sky-100    text-sky-700    border-sky-300    dark:bg-sky-950/40    dark:text-sky-400" },
  IN_CONSULTATION: { label: "In Exam",         cls: "bg-blue-100   text-blue-700   border-blue-300   dark:bg-blue-950/40   dark:text-blue-400" },
  IN_SURGERY:      { label: "In Surgery",      cls: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400" },
  RECOVERY:        { label: "Recovery",         cls: "bg-teal-100  text-teal-700   border-teal-300   dark:bg-teal-950/40   dark:text-teal-400" },
  PHARMACY:        { label: "Ready for Pickup", cls: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950/40 dark:text-violet-400" },
  DISCHARGED:      { label: "Discharged",       cls: "bg-gray-100  text-gray-500   border-gray-200   dark:bg-gray-800      dark:text-gray-400" },
};

function VisitStatusBadge({ patientId, encounters, getStep }: {
  patientId: string;
  encounters: any[];
  getStep?: (id: string) => string;
}) {
  // Primary: encounter status
  const active = encounters.find(
    e => e.patientId === patientId && e.status !== "DISCHARGED"
  );
  if (active) {
    const cfg = VISIT_STATUS_MAP[active.status];
    if (cfg) return (
      <Badge variant="outline" className={cn("text-[10px] font-semibold px-1.5 py-0 border", cfg.cls)} style={{ height: "1.125rem" }}>
        {cfg.label}
      </Badge>
    );
  }
  // Fallback: workflow step
  const step = getStep?.(patientId);
  if (step && step !== "REGISTERED") {
    const stepMap: Record<string, { label: string; cls: string }> = {
      TRIAGE:       VISIT_STATUS_MAP.IN_TRIAGE,
      CONSULTATION: VISIT_STATUS_MAP.IN_CONSULTATION,
      PHARMACY:     VISIT_STATUS_MAP.PHARMACY,
      COMPLETED:    { label: "Completed", cls: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400" },
    };
    const cfg = stepMap[step];
    if (cfg) return (
      <Badge variant="outline" className={cn("text-[10px] font-semibold px-1.5 py-0 border", cfg.cls)} style={{ height: "1.125rem" }}>
        {cfg.label}
      </Badge>
    );
  }
  return null;
}

export default function Patients() {
  const navigate = useNavigate();
  const location = useLocation();
  const { has } = useRole();
  const { toast } = useToast();
  const { encounters } = useEncounter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const patients = getPatients();
  const appointments = loadStoredAppointments();

  // Workflow context for check-in + status
  const wf = useWorkflowContext();

  const { createEncounter } = useEncounter();

  const handleCheckIn = (patient: any) => {
    // Create encounter for the patient
    createEncounter(patient.id, {
      reason: "General Visit",
      chiefComplaint: "",
    });

    wf.setStep(patient.patientId || patient.id, "TRIAGE");
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: "success",
        message: `${patient.name} checked in — moved to Triage`,
        patientId: patient.id,
        patientName: patient.name,
        targetRoles: ["SuperAdmin", "Nurse", "Vet", "Receptionist"],
      },
    }));
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

  const filteredPatients = useMemo(() => {
    return patients
      .filter((patient) => {
        const matchesSearch = 
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.microchip.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
        const matchesSpecies = speciesFilter === "all" || patient.species.toLowerCase() === speciesFilter;
        
        return matchesSearch && matchesStatus && matchesSpecies;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "id") return a.patientId.localeCompare(b.patientId);
        if (sortBy === "lastVisit") return b.lastVisit.localeCompare(a.lastVisit);
        if (sortBy === "appointment") {
          const today = new Date();
          const aptA = appointments.find(apt => apt.patientId === a.id && isSameDay(new Date(apt.date), today));
          const aptB = appointments.find(apt => apt.patientId === b.id && isSameDay(new Date(apt.date), today));
          if (aptA && !aptB) return -1;
          if (!aptA && aptB) return 1;
          if (aptA && aptB) return aptA.time.localeCompare(aptB.time);
          return 0;
        }
        return 0;
      });
  }, [searchTerm, statusFilter, speciesFilter, sortBy, patients, appointments]);

  const stats = useMemo(() => {
    const today = new Date();
    return {
      total: patients.length,
      appointmentsToday: appointments.filter(apt => isSameDay(new Date(apt.date), today)).length,
      inTriage: encounters.filter(enc => ["WAITING", "IN_TRIAGE", "TRIAGED"].includes(enc.status)).length,
      critical: patients.filter(p => p.status === "critical").length
    };
  }, [encounters, patients, appointments]);

  const handleViewDetails = (patient: any) => {
    navigate(`/patients/${patient.id}`);
  };

  const handleSendToTriage = (patient: any) => {
    navigate("/triage", { state: { patient } });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registered Patients</h1>
          <p className="text-muted-foreground mt-1">
            Access records, manage daily clinical flow, and track patient statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {has("can_register_patients") && (
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => navigate("/patients/add")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Register Patient
            </Button>
          )}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-muted/30 border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Active in system</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Appts Today</CardTitle>
            <CalendarClock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.appointmentsToday}</div>
            <p className="text-xs text-blue-700/70 mt-1">Scheduled visits</p>
          </CardContent>
        </Card>
        <Card className="bg-teal-50/50 border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-900">In Triage</CardTitle>
            <Activity className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900">{stats.inTriage}</div>
            <p className="text-xs text-teal-700/70 mt-1">Waiting for care</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.critical}</div>
            <p className="text-xs text-orange-700/70 mt-1">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, owner, microchip, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 shadow-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 shadow-sm">
              <Filter className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="treatment">Treatment</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
            <SelectTrigger className="w-[130px] h-10 shadow-sm">
              <SelectValue placeholder="Species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Species</SelectItem>
              <SelectItem value="dog">Dogs</SelectItem>
              <SelectItem value="cat">Cats</SelectItem>
              <SelectItem value="rabbit">Rabbits</SelectItem>
              <SelectItem value="bird">Birds</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-10 shadow-sm">
              <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="id">Sort by ID</SelectItem>
              <SelectItem value="lastVisit">Last Visit</SelectItem>
              <SelectItem value="appointment">Appointment Time</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md shadow-sm">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-10 w-10 rounded-r-none ${viewMode === "grid" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-10 w-10 rounded-l-none ${viewMode === "list" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredPatients.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient) => {
              const hasActiveVisit = encounters.some(
                (enc) => enc.patientId === patient.id && ["WAITING", "IN_TRIAGE", "TRIAGED"].includes(enc.status)
              );
              
              const todayAppointment = appointments.find(
                (apt) => apt.patientId === patient.id && isSameDay(new Date(apt.date), new Date())
              );
              
              const visitBadge = <VisitStatusBadge patientId={patient.id} encounters={encounters} getStep={wf.getStep} />;
              return (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onViewDetails={handleViewDetails}
                  onTriage={hasActiveVisit ? handleSendToTriage : undefined}
                  hasAppointmentToday={!!todayAppointment}
                  appointmentDetails={todayAppointment ? { time: todayAppointment.time, vet: todayAppointment.vet } : undefined}
                  isCheckedIn={hasActiveVisit}
                  visitStatusBadge={visitBadge}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border shadow-sm overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Patient ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Species & Breed</TableHead>
                  <TableHead>Age & Weight</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Appt Today</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const getStatusColor = (status: string) => {
                    switch (status.toLowerCase()) {
                      case "healthy": return "bg-success/15 text-success hover:bg-success/20 border-success/20";
                      case "treatment": return "bg-warning/15 text-warning hover:bg-warning/20 border-warning/20";
                      case "critical": return "bg-destructive/15 text-destructive hover:bg-destructive/20 border-destructive/20";
                      default: return "bg-muted text-muted-foreground";
                    }
                  };

                  const todayAppointment = appointments.find(apt => apt.patientId === patient.id && isSameDay(new Date(apt.date), new Date()));

                  return (
                    <TableRow 
                      key={patient.id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => handleViewDetails(patient)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{patient.patientId}</TableCell>
                      <TableCell className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            {patient.name}
                            {patient.allergies && patient.allergies.length > 0 && patient.allergies[0] !== "None known" && (
                              <Badge variant="outline" className="h-4 px-1 text-[9px] bg-red-50 text-red-600 border-red-200">
                                <AlertTriangle className="h-2 w-2 mr-0.5" />
                                Allergies
                              </Badge>
                            )}
                            {encounters.some(enc => enc.patientId === patient.id && ["WAITING","IN_TRIAGE","TRIAGED","IN_CONSULTATION"].includes(enc.status)) && (
                              <Badge variant="outline" className="h-4 px-1 text-[9px] bg-teal-50 text-teal-700 border-teal-200 animate-pulse">In Clinic</Badge>
                            )}
                          </div>
                          {(patient as any).behavioralWarnings?.filter((w: any) => w.text).map((w: any, i: number) => (
                            <div key={i} className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1 py-0 rounded ${
                              w.level === "high" ? "bg-red-50 text-red-700" : w.level === "medium" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"
                            }`}>
                              <AlertTriangle className="h-2 w-2" />{w.text}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {patient.species}
                          <div className="text-[11px] text-muted-foreground leading-tight">{patient.breed}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {patient.age}
                          <div className="text-[11px] text-muted-foreground leading-tight">{patient.weight}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{patient.owner}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />
                            {patient.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {todayAppointment ? (
                          <div className="flex flex-col gap-0.5 min-w-[120px]">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                              {todayAppointment.time}
                            </div>
                            <div className="text-[10px] text-blue-700/70 flex flex-col">
                              <span>{todayAppointment.vet}</span>
                              <Badge variant="outline" className="text-[9px] h-3.5 px-1 w-fit mt-0.5 border-blue-200 bg-blue-50 text-blue-700">
                                {todayAppointment.type}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 italic font-medium">None scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {format(new Date(patient.lastVisit), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={cn(getStatusColor(patient.status), "capitalize text-[11px] font-semibold px-2 py-0 w-fit")}>
                            {patient.status}
                          </Badge>
                          <VisitStatusBadge patientId={patient.id} encounters={encounters} getStep={wf.getStep} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {has("can_triage") && encounters.some(enc => enc.patientId === patient.id && ["WAITING", "IN_TRIAGE", "TRIAGED"].includes(enc.status)) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800"
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
                              <div className="flex gap-1">
                                {todayAppointment ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCheckIn(patient);
                                    }}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Check-in
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCheckIn(patient); // Same logic for now, starts a visit
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    New Visit
                                  </Button>
                                )}
                              </div>
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
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No patients found</h3>
          <p className="text-muted-foreground mt-1 max-w-xs text-center">
            We couldn't find any patients matching your current search or filter criteria.
          </p>
          <div className="flex gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setSpeciesFilter("all");
              }}
              className="text-primary"
            >
              Clear all filters
            </Button>
            {has("can_register_patients") && (
              <Button 
                onClick={() => navigate("/patients/add")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Register New Patient
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

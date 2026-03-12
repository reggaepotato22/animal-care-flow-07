import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Stethoscope, AlertTriangle, ClipboardList, CheckCircle, ChevronRight, FileText } from "lucide-react";
import { logChange } from "@/lib/audit";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useToast } from "@/hooks/use-toast";
import { getStepRoute } from "@/config/workflow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type TriageStatus = "waiting" | "in-progress" | "ready";

type TriagePatient = {
  id: string;
  patientId: string;
  patientName: string;
  petName: string;
  species: string;
  ownerName: string;
  arrivalTime: string;
  status: TriageStatus;
};

type TriageIntake = {
  chiefComplaint: string;
  presentingHistory: string;
  triageLevel: string;
  painScore: string;
  temperature: string;
  heartRate: string;
  respiratoryRate: string;
  weight: string;
  mucousMembranes: string;
  capillaryRefillTime: string;
  hydrationStatus: string;
  mentation: string;
  riskFlags: string[];
  assignedVeterinarian: string;
};

const mockQueue: TriagePatient[] = [
  {
    id: "triage-1",
    patientId: "P-10231",
    patientName: "Sarah Johnson",
    petName: "Max",
    species: "Dog (Golden Retriever)",
    ownerName: "Sarah Johnson",
    arrivalTime: "09:10 AM",
    status: "waiting",
  },
  {
    id: "triage-2",
    patientId: "P-10232",
    patientName: "Mike Wilson",
    petName: "Whiskers",
    species: "Cat (Persian)",
    ownerName: "Mike Wilson",
    arrivalTime: "09:25 AM",
    status: "in-progress",
  },
  {
    id: "triage-3",
    patientId: "P-10233",
    patientName: "Emily Davis",
    petName: "Bella",
    species: "Dog (Labrador)",
    ownerName: "Emily Davis",
    arrivalTime: "09:40 AM",
    status: "ready",
  },
];

const defaultIntake: TriageIntake = {
  chiefComplaint: "",
  presentingHistory: "",
  triageLevel: "3",
  painScore: "",
  temperature: "",
  heartRate: "",
  respiratoryRate: "",
  weight: "",
  mucousMembranes: "",
  capillaryRefillTime: "",
  hydrationStatus: "",
  mentation: "",
  riskFlags: [],
  assignedVeterinarian: "",
};

const riskFlags = [
  "Respiratory distress",
  "Active bleeding",
  "Neurologic changes",
  "Known toxin exposure",
  "Pregnant/lactating",
];

export default function Triage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"all" | TriageStatus>("all");
  const [queue, setQueue] = useState<TriagePatient[]>(mockQueue);
  const [selectedId, setSelectedId] = useState<string>(() => {
    try {
      return localStorage.getItem("acf_triage_selected") || (mockQueue[0]?.id || "");
    } catch {
      return mockQueue[0]?.id || "";
    }
  });
  const [intakeById, setIntakeById] = useState<Record<string, TriageIntake>>(() => {
    try {
      const saved = localStorage.getItem("acf_triage_data");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("acf_triage_data", JSON.stringify(intakeById));
  }, [intakeById]);

  useEffect(() => {
    const incoming = (location.state as { patient?: any } | undefined)?.patient;
    if (!incoming) return;
    const newId = `triage-${Date.now()}`;
    setQueue((prev) => {
      if (prev.some((item) => item.patientId === incoming.patientId)) {
        return prev;
      }
      const entry: TriagePatient = {
        id: newId,
        patientId: incoming.patientId,
        patientName: incoming.owner,
        petName: incoming.name,
        species: `${incoming.species} (${incoming.breed})`,
        ownerName: incoming.owner,
        arrivalTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "waiting",
      };
      return [entry, ...prev];
    });
    setSelectedId(newId);
  }, [location.state]);

  useEffect(() => {
    try {
      localStorage.setItem("acf_triage_selected", selectedId);
    } catch {}
  }, [selectedId]);

  const selectedPatient = queue.find((item) => item.id === selectedId);
  const intake = intakeById[selectedId] || { ...defaultIntake };
  const patientWorkflow = useWorkflow({ patientId: selectedPatient?.patientId });

  const filteredQueue = useMemo(
    () => queue.filter((item) => (statusFilter === "all" ? true : item.status === statusFilter)),
    [queue, statusFilter],
  );

  const getStatusBadge = (status: TriageStatus) => {
    if (status === "ready") return "bg-success/10 text-success border-success/20";
    if (status === "in-progress") return "bg-warning/10 text-warning border-warning/20";
    return "bg-muted/10 text-muted-foreground border-muted/20";
  };

  const updateIntake = (partial: Partial<TriageIntake>) => {
    setIntakeById((prev) => ({
      ...prev,
      [selectedId]: { ...intake, ...partial },
    }));
  };

  const toggleRiskFlag = (flag: string) => {
    const hasFlag = intake.riskFlags.includes(flag);
    updateIntake({
      riskFlags: hasFlag ? intake.riskFlags.filter((f) => f !== flag) : [...intake.riskFlags, flag],
    });
  };

  const markStatus = (status: TriageStatus) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === selectedId ? { ...item, status } : item)),
    );
    
    // If marking as in-progress, ensure workflow reflects TRIAGE
    if (status === "in-progress" && selectedPatient?.patientId) {
      patientWorkflow.goTo("TRIAGE");
    }
  };

  const handleMarkAsReady = () => {
    if (!selectedPatient) return;
    
    markStatus("ready");
    
    // Transition workflow to CONSULTATION as it's "ready" for vet
    if (selectedPatient.patientId) {
      patientWorkflow.goTo("CONSULTATION");
      
      // Broadcast update for notifications
      const channel = new BroadcastChannel("acf_workflow_updates");
      channel.postMessage({
        type: "STEP_UPDATE",
        payload: {
          patientId: selectedPatient.patientId,
          step: "CONSULTATION",
          petName: selectedPatient.petName,
          ownerName: selectedPatient.ownerName,
          vetName: intake.assignedVeterinarian
        }
      });
      channel.close();
    }

    toast({
      title: "Triage Completed",
      description: `${selectedPatient.petName} is now ready for consultation.`,
    });
  };

  const startRecord = () => {
    if (!selectedPatient) return;
    
    // Ensure workflow status is CONSULTATION
    patientWorkflow.goTo("CONSULTATION");
    
    toast({
      title: "Creating Clinical Record",
      description: `Transitioning ${selectedPatient.petName} to consultation record.`,
    });

    navigate("/records/new", {
      state: {
        patientId: selectedPatient.patientId,
        veterinarian: intake.assignedVeterinarian,
        visitReason: "Triage/Intake",
        chiefComplaint: intake.chiefComplaint,
        vitals: {
          temp: intake.temperature,
          hr: intake.heartRate,
          rr: intake.respiratoryRate,
          weight: intake.weight
        },
        triageLevel: intake.triageLevel,
        history: intake.presentingHistory
      },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden">
      <div className="flex-none pb-4">
        {selectedPatient?.patientId && (
          <WorkflowProgress patientId={selectedPatient.patientId} />
        )}
        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="text-3xl font-bold">Triage & Intake</h1>
            <p className="text-muted-foreground">
              Capture intake details and move patients into the clinical workflow.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/records/new")}>
            Create Record Manually
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        <Card className="w-80 flex-none flex flex-col overflow-hidden">
          <CardHeader className="flex-none">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Triage Queue
            </CardTitle>
            <CardDescription>Patients awaiting intake</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="in-progress">In progress</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
              </SelectContent>
            </Select>

            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="space-y-2">
                {filteredQueue.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelectedId(patient.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedId === patient.id ? "bg-muted/60 border-primary/40 shadow-sm" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{patient.petName}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{patient.species}</p>
                      </div>
                      <Badge variant="outline" className={getStatusBadge(patient.status)}>{patient.status}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[120px]">{patient.ownerName}</span>
                      <span>{patient.arrivalTime}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className={`flex-1 overflow-hidden flex flex-col ${intake.triageLevel === "1" ? "ring-2 ring-destructive/60 shadow-[0_0_25px_rgba(220,38,38,0.25)]" : ""}`}>
          <CardHeader className="flex-none border-b bg-muted/20 py-3 px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[200px]">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Stethoscope className="h-5 w-5 text-veterinary-teal" />
                  Intake Details
                </CardTitle>
                <CardDescription className="font-medium text-veterinary-teal/80">
                  {selectedPatient
                    ? `${selectedPatient.petName} • ${selectedPatient.ownerName} (${selectedPatient.patientId})`
                    : "Select a patient to begin intake"}
                </CardDescription>
              </div>
              
              {selectedPatient && (
                <div className="flex flex-wrap items-center gap-3 bg-background/50 p-1.5 rounded-lg border shadow-sm">
                  <div className="flex items-center gap-2 px-2 border-r pr-4">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap tracking-tighter">Assigned Vet:</span>
                    <Select
                      value={intake.assignedVeterinarian}
                      onValueChange={(value) => updateIntake({ assignedVeterinarian: value })}
                    >
                      <SelectTrigger className="h-8 w-[180px] text-xs border-none bg-transparent hover:bg-muted/50 focus:ring-0">
                        <SelectValue placeholder="Select vet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr. Smith">Dr. Smith</SelectItem>
                        <SelectItem value="Dr. Brown">Dr. Brown</SelectItem>
                        <SelectItem value="Dr. Johnson">Dr. Johnson</SelectItem>
                        <SelectItem value="Dr. Wilson">Dr. Wilson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        markStatus("in-progress");
                        toast({ title: "In Progress", description: "Patient intake is now in progress." });
                      }}
                      className={`h-8 text-xs font-semibold ${selectedPatient.status === "in-progress" ? "bg-warning/20 text-warning hover:bg-warning/30" : "hover:bg-muted"}`}
                    >
                      Mark In Progress
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleMarkAsReady}
                      className={`h-8 text-xs font-semibold ${selectedPatient.status === "ready" ? "bg-success/20 text-success hover:bg-success/30" : "hover:bg-muted"}`}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Mark as Ready
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button 
                      size="sm"
                      onClick={startRecord}
                      disabled={selectedPatient.status !== "ready"}
                      className="h-8 px-4 text-xs font-bold shadow-md bg-veterinary-teal hover:bg-veterinary-teal/90"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Start Record
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Chief complaint</label>
                  <Input
                    value={intake.chiefComplaint}
                    onChange={(e) => updateIntake({ chiefComplaint: e.target.value })}
                    placeholder="e.g., limping, vomiting, lethargy"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Triage level</label>
                  <Select
                    value={intake.triageLevel}
                    onValueChange={(value) => {
                      logChange({
                        entityType: "Patient",
                        entityId: selectedPatient?.patientId || "unknown",
                        field: "Triage Level",
                        previousValue: intake.triageLevel,
                        newValue: value,
                        changedBy: "triage-nurse",
                        reason: "Updated during intake",
                      });
                      updateIntake({ triageLevel: value });
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select triage level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1" className="text-destructive font-bold">1 - Critical (Immediate)</SelectItem>
                      <SelectItem value="2" className="text-orange-600 font-semibold">2 - Emergent (15m)</SelectItem>
                      <SelectItem value="3" className="text-amber-600">3 - Urgent (30-60m)</SelectItem>
                      <SelectItem value="4" className="text-veterinary-teal">4 - Less urgent</SelectItem>
                      <SelectItem value="5" className="text-muted-foreground">5 - Non-urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Presenting history</label>
                <Textarea
                  value={intake.presentingHistory}
                  onChange={(e) => updateIntake({ presentingHistory: e.target.value })}
                  placeholder="Short history, onset, progression, exposures, etc."
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Temperature</label>
                    <Input
                      value={intake.temperature}
                      onChange={(e) => updateIntake({ temperature: e.target.value })}
                      placeholder="°F/°C"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Heart rate</label>
                    <Input
                      value={intake.heartRate}
                      onChange={(e) => updateIntake({ heartRate: e.target.value })}
                      placeholder="bpm"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Resp. rate</label>
                    <Input
                      value={intake.respiratoryRate}
                      onChange={(e) => updateIntake({ respiratoryRate: e.target.value })}
                      placeholder="rpm"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Weight</label>
                    <Input
                      value={intake.weight}
                      onChange={(e) => updateIntake({ weight: e.target.value })}
                      placeholder="kg"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Physical Exam</label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-medium">Mucous membranes</span>
                      <Input
                        value={intake.mucousMembranes}
                        onChange={(e) => updateIntake({ mucousMembranes: e.target.value })}
                        placeholder="pink, pale, etc."
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium">CRT</span>
                      <Input
                        value={intake.capillaryRefillTime}
                        onChange={(e) => updateIntake({ capillaryRefillTime: e.target.value })}
                        placeholder="sec"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hydration & Mentation</label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-medium">Hydration</span>
                      <Input
                        value={intake.hydrationStatus}
                        onChange={(e) => updateIntake({ hydrationStatus: e.target.value })}
                        placeholder="euhydrated, mild"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium">Mentation</span>
                      <Input
                        value={intake.mentation}
                        onChange={(e) => updateIntake({ mentation: e.target.value })}
                        placeholder="BAR, QAR, depressed"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pain Score</label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-medium">Pain score (0-10)</span>
                      <Input
                        value={intake.painScore}
                        onChange={(e) => updateIntake({ painScore: e.target.value })}
                        placeholder="0-10"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Risk flags</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {riskFlags.map((flag) => (
                    <label key={flag} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <Checkbox
                        checked={intake.riskFlags.includes(flag)}
                        onCheckedChange={() => toggleRiskFlag(flag)}
                        className="data-[state=checked]:bg-warning data-[state=checked]:border-warning"
                      />
                      <span className="text-sm group-data-[state=checked]:font-semibold">{flag}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Stethoscope, AlertTriangle, List as ClipboardList, Check as CheckCircle, ChevronRight, FileText } from "lucide-react";
import { EncounterHeader } from "@/components/EncounterHeader";
import { logChange } from "@/lib/audit";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useToast } from "@/hooks/use-toast";
import { getStepRoute } from "@/config/workflow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEncounter } from "@/contexts/EncounterContext";
import { getPatients, updatePatient } from "@/lib/patientStore";
import { EncounterStatus } from "@/lib/types";
import { getStaff } from "@/lib/staffStore";

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
  const { encounters, updateEncounterStatus } = useEncounter();
  const [statusFilter, setStatusFilter] = useState<EncounterStatus | "all">("all");

  // Get only patients who have active encounters in triage-relevant statuses
  const triageQueue = useMemo(() => {
    const patients = getPatients();
    return encounters
      .filter(enc => ["WAITING", "IN_TRIAGE", "TRIAGED"].includes(enc.status))
      .map(enc => {
        const patient = patients.find(p => p.id === enc.patientId || p.patientId === enc.patientId);
        return {
          id: enc.id,
          patientId: enc.patientId,
          // Use encounter's petName first (from check-in), fallback to patientStore
          petName: patient?.name || enc.petName || "Unknown Patient",
          species: patient ? `${patient.species} (${patient.breed})` : enc.appointmentType || "Unknown",
          ownerName: patient?.owner || enc.ownerName || "Unknown Owner",
          arrivalTime: new Date(enc.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: enc.status
        };
      });
  }, [encounters]);

  const [selectedId, setSelectedId] = useState<string>(() => {
    try {
      return localStorage.getItem("acf_triage_selected") || "";
    } catch {
      return "";
    }
  });

  // Set initial selected ID when queue becomes available
  useEffect(() => {
    if (!selectedId && triageQueue.length > 0) {
      setSelectedId(triageQueue[0].id);
    }
  }, [triageQueue, selectedId]);

  // Auto-select patient from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get("patientId");
    if (patientId) {
      // Find the encounter for this patient
      const encounter = encounters.find(e => e.patientId === patientId && ["WAITING", "IN_TRIAGE", "TRIAGED"].includes(e.status));
      if (encounter) {
        setSelectedId(encounter.id);
        // Also update status to IN_TRIAGE if currently waiting
        if (encounter.status === "WAITING") {
          updateEncounterStatus(encounter.id, "IN_TRIAGE");
        }
      }
    }
  }, [location.search, encounters]);

  const availableVets = (() => {
    return getStaff().filter(s =>
      s.status === "active" &&
      (s.role.toLowerCase().includes("veterinarian") || s.role.toLowerCase().includes("vet"))
    );
  })();

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
    try {
      localStorage.setItem("acf_triage_selected", selectedId);
    } catch {}
  }, [selectedId]);

  const selectedEncounter = encounters.find((item) => item.id === selectedId);
  const patientDetails = getPatients().find(p => p.id === selectedEncounter?.patientId || p.patientId === selectedEncounter?.patientId);

  const intake = intakeById[selectedId] || { ...defaultIntake };
  const patientWorkflow = useWorkflow({ patientId: selectedEncounter?.patientId });

  const filteredQueue = useMemo(
    () => triageQueue.filter((item) => (statusFilter === "all" ? true : item.status === statusFilter)),
    [triageQueue, statusFilter],
  );

  const getStatusBadge = (status: EncounterStatus) => {
    if (status === "TRIAGED") return "bg-success/10 text-success border-success/20";
    if (status === "IN_TRIAGE") return "bg-warning/10 text-warning border-warning/20";
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

  const markStatus = (status: EncounterStatus, encounterId?: string) => {
    const targetId = encounterId || selectedId;
    if (targetId) {
      updateEncounterStatus(targetId, status);
      // If marking as in-progress, ensure workflow reflects TRIAGE
      const targetEnc = encounters.find(e => e.id === targetId);
      if (status === "IN_TRIAGE" && targetEnc?.patientId) {
        patientWorkflow.goTo("TRIAGE");
      }
    }
  };

  const handleStartTriage = (encId: string, patientId: string) => {
    setSelectedId(encId);
    updateEncounterStatus(encId, "IN_TRIAGE");
    // Broadcast to other tabs (WorkflowContext.setStep also broadcasts)
    const channel = new BroadcastChannel("acf_workflow_updates");
    channel.postMessage({
      type: "STEP_UPDATE",
      payload: { patientId, step: "TRIAGE" },
    });
    channel.close();
    toast({ title: "Triage Started", description: "Patient intake is now in progress." });
  };

  const handleMarkAsReady = () => {
    if (!selectedEncounter) return;
    
    markStatus("TRIAGED");

    // Persist vitals to patient record
    if (selectedEncounter.patientId && (intake.temperature || intake.heartRate || intake.respiratoryRate || intake.weight)) {
      const patient = patientDetails;
      if (patient) {
        const newVital = {
          date: new Date().toISOString().split("T")[0],
          temperature: intake.temperature ? `${intake.temperature}°C` : "",
          heartRate: intake.heartRate ? `${intake.heartRate} bpm` : "",
          respiratoryRate: intake.respiratoryRate ? `${intake.respiratoryRate} rpm` : "",
          weight: intake.weight ? `${intake.weight}` : "",
          bloodPressure: "Normal",
        };
        const existingVitals = (patient.vitals || []) as any[];
        updatePatient(patient.id, { vitals: [newVital, ...existingVitals] });
      }
    }
    
    // Transition workflow to CONSULTATION as it's "ready" for vet
    if (selectedEncounter.patientId) {
      patientWorkflow.goTo("CONSULTATION");
      
      // Broadcast update for notifications
      const channel = new BroadcastChannel("acf_workflow_updates");
      channel.postMessage({
        type: "STEP_UPDATE",
        payload: {
          patientId: selectedEncounter.patientId,
          step: "CONSULTATION",
          petName: selectedEncounter.petName,
          ownerName: selectedEncounter.ownerName,
          vetName: intake.assignedVeterinarian
        }
      });
      channel.close();
    }

    toast({
      title: "Triage Completed",
      description: `${selectedEncounter.petName} is now ready for consultation.`,
    });
  };

  const startRecord = () => {
    if (!selectedEncounter) return;
    
    // Ensure workflow status is CONSULTATION
    patientWorkflow.goTo("CONSULTATION");
    
    // Update encounter status to IN_CONSULTATION
    if (selectedEncounter.status === "TRIAGED") {
      updateEncounterStatus(selectedEncounter.id, "IN_CONSULTATION");
    }
    
    toast({
      title: "Starting Consultation",
      description: `Opening clinical record for ${selectedEncounter.petName}.`,
    });

    navigate(`/patients/${selectedEncounter.patientId}/encounters/${selectedEncounter.id}`, {
      state: {
        encounterId: selectedEncounter.id,
        patientId: selectedEncounter.patientId,
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
      {selectedEncounter && (
        <div className="mb-4">
          <EncounterHeader 
            encounter={selectedEncounter}
            onStatusChange={(status) => markStatus(status)}
            onStartConsultation={startRecord}
            onStatusChipClass={(s) => 
              s === "WAITING" ? "bg-yellow-100 text-yellow-800" :
              s === "IN_TRIAGE" ? "bg-orange-100 text-orange-800" :
              s === "TRIAGED" ? "bg-green-100 text-green-800" :
              s === "IN_CONSULTATION" ? "bg-blue-100 text-blue-800" :
              s === "IN_SURGERY" ? "bg-red-100 text-red-800" :
              s === "RECOVERY" ? "bg-purple-100 text-purple-800" :
              s === "DISCHARGED" ? "bg-green-100 text-green-800" :
              "bg-gray-100 text-gray-800"
            }
          />
        </div>
      )}
      <div className="flex-none pb-4 pt-2">
        <div className="flex items-center justify-between">
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
                <SelectItem value="WAITING">Waiting</SelectItem>
                <SelectItem value="IN_TRIAGE">In progress</SelectItem>
                <SelectItem value="TRIAGED">Ready</SelectItem>
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
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{patient.petName}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{patient.species}</p>
                      </div>
                      <Badge variant="outline" className={getStatusBadge(patient.status)}>
                        {patient.status === "WAITING" ? "Waiting" : patient.status === "IN_TRIAGE" ? "In Progress" : "Ready"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[110px]">{patient.ownerName}</span>
                      <span>{patient.arrivalTime}</span>
                    </div>
                    {/* Start Triage button — visible for WAITING patients */}
                    {patient.status === "WAITING" && (
                      <div className="mt-2 pt-2 border-t border-border/40">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleStartTriage(patient.id, patient.patientId); }}
                          className="w-full text-center text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-md py-1 transition-colors"
                        >
                          ▶ Start Triage
                        </button>
                      </div>
                    )}
                    {patient.status === "IN_TRIAGE" && (
                      <div className="mt-2 pt-2 border-t border-border/40">
                        <span className="text-[10px] font-semibold text-warning">● Triage in progress</span>
                      </div>
                    )}
                    {patient.status === "TRIAGED" && (
                      <div className="mt-2 pt-2 border-t border-border/40">
                        <span className="text-[10px] font-semibold text-success">✓ Ready for consultation</span>
                      </div>
                    )}
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
                  {patientDetails
                    ? `${patientDetails.name} • ${patientDetails.owner} (${patientDetails.patientId})`
                    : "Select a patient to begin intake"}
                </CardDescription>
              </div>
              
              {selectedEncounter && (
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
                        {availableVets.length > 0 ? availableVets.map(v => (
                          <SelectItem key={v.id} value={v.name}>
                            <span className="flex items-center gap-2">
                              {v.name}
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                v.availability === "available" ? "bg-emerald-100 text-emerald-700" :
                                v.availability === "busy" ? "bg-amber-100 text-amber-700" :
                                "bg-gray-100 text-gray-500"
                              }`}>{v.availability || "active"}</span>
                            </span>
                          </SelectItem>
                        )) : (
                          <SelectItem value="__none__" disabled>No vets found — add staff first</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        markStatus("IN_TRIAGE");
                        toast({ title: "In Progress", description: "Patient intake is now in progress." });
                      }}
                      className={`h-8 text-xs font-semibold ${selectedEncounter.status === "IN_TRIAGE" ? "bg-warning/20 text-warning hover:bg-warning/30" : "hover:bg-muted"}`}
                    >
                      Mark In Progress
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleMarkAsReady}
                      className={`h-8 text-xs font-semibold ${selectedEncounter.status === "TRIAGED" ? "bg-success/20 text-success hover:bg-success/30" : "hover:bg-muted"}`}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Mark as Ready
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button 
                      size="sm"
                      onClick={startRecord}
                      disabled={selectedEncounter.status !== "TRIAGED"}
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
                        entityId: selectedEncounter?.patientId || "unknown",
                        field: "Triage Level",
                        previousValue: intake.triageLevel,
                        newValue: value,
                        changedBy: "triage-attendant",
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

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Stethoscope, AlertTriangle, ClipboardList } from "lucide-react";

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
  const [statusFilter, setStatusFilter] = useState<"all" | TriageStatus>("all");
  const [queue, setQueue] = useState<TriagePatient[]>(mockQueue);
  const [selectedId, setSelectedId] = useState<string>(mockQueue[0]?.id || "");
  const [intakeById, setIntakeById] = useState<Record<string, TriageIntake>>({});

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

  const selectedPatient = queue.find((item) => item.id === selectedId);
  const intake = intakeById[selectedId] || { ...defaultIntake };

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
  };

  const startRecord = () => {
    if (!selectedPatient) return;
    navigate("/records/new", {
      state: {
        patientId: selectedPatient.patientId,
        veterinarian: intake.assignedVeterinarian,
        visitReason: "Triage/Intake",
        chiefComplaint: intake.chiefComplaint,
      },
    });
  };

  return (
    <div className="space-y-6">
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

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Triage Queue
            </CardTitle>
            <CardDescription>Patients awaiting intake</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="space-y-2">
              {filteredQueue.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => setSelectedId(patient.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedId === patient.id ? "bg-muted/60 border-primary/40" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{patient.petName}</p>
                      <p className="text-xs text-muted-foreground">{patient.species}</p>
                    </div>
                    <Badge className={getStatusBadge(patient.status)}>{patient.status}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{patient.ownerName}</span>
                    <span>{patient.arrivalTime}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Intake Details
            </CardTitle>
            <CardDescription>
              {selectedPatient
                ? `Triage for ${selectedPatient.petName} • ${selectedPatient.ownerName}`
                : "Select a patient to begin intake"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chief complaint</label>
                <Input
                  value={intake.chiefComplaint}
                  onChange={(e) => updateIntake({ chiefComplaint: e.target.value })}
                  placeholder="e.g., limping, vomiting, lethargy"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Triage level</label>
                <Select
                  value={intake.triageLevel}
                  onValueChange={(value) => updateIntake({ triageLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select triage level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Critical</SelectItem>
                    <SelectItem value="2">2 - Emergent</SelectItem>
                    <SelectItem value="3">3 - Urgent</SelectItem>
                    <SelectItem value="4">4 - Less urgent</SelectItem>
                    <SelectItem value="5">5 - Non-urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Presenting history</label>
              <Textarea
                value={intake.presentingHistory}
                onChange={(e) => updateIntake({ presentingHistory: e.target.value })}
                placeholder="Short history, onset, progression, exposures, etc."
                className="min-h-[110px]"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature</label>
                <Input
                  value={intake.temperature}
                  onChange={(e) => updateIntake({ temperature: e.target.value })}
                  placeholder="°F"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Heart rate</label>
                <Input
                  value={intake.heartRate}
                  onChange={(e) => updateIntake({ heartRate: e.target.value })}
                  placeholder="bpm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Respiratory rate</label>
                <Input
                  value={intake.respiratoryRate}
                  onChange={(e) => updateIntake({ respiratoryRate: e.target.value })}
                  placeholder="rpm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Weight</label>
                <Input
                  value={intake.weight}
                  onChange={(e) => updateIntake({ weight: e.target.value })}
                  placeholder="kg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mucous membranes</label>
                <Input
                  value={intake.mucousMembranes}
                  onChange={(e) => updateIntake({ mucousMembranes: e.target.value })}
                  placeholder="pink, pale, etc."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CRT</label>
                <Input
                  value={intake.capillaryRefillTime}
                  onChange={(e) => updateIntake({ capillaryRefillTime: e.target.value })}
                  placeholder="sec"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hydration</label>
                <Input
                  value={intake.hydrationStatus}
                  onChange={(e) => updateIntake({ hydrationStatus: e.target.value })}
                  placeholder="euhydrated, mild"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mentation</label>
                <Input
                  value={intake.mentation}
                  onChange={(e) => updateIntake({ mentation: e.target.value })}
                  placeholder="BAR, QAR, depressed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pain score (0-10)</label>
                <Input
                  value={intake.painScore}
                  onChange={(e) => updateIntake({ painScore: e.target.value })}
                  placeholder="0-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <p className="text-sm font-medium">Risk flags</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {riskFlags.map((flag) => (
                  <label key={flag} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={intake.riskFlags.includes(flag)}
                      onCheckedChange={() => toggleRiskFlag(flag)}
                    />
                    {flag}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned veterinarian</label>
                <Select
                  value={intake.assignedVeterinarian}
                  onValueChange={(value) => updateIntake({ assignedVeterinarian: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select veterinarian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dr. Smith">Dr. Smith</SelectItem>
                    <SelectItem value="Dr. Brown">Dr. Brown</SelectItem>
                    <SelectItem value="Dr. Johnson">Dr. Johnson</SelectItem>
                    <SelectItem value="Dr. Wilson">Dr. Wilson</SelectItem>
                    <SelectItem value="Dr. Davis">Dr. Davis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={() => markStatus("in-progress")}>
                  Mark In Progress
                </Button>
                <Button variant="outline" onClick={() => markStatus("ready")}>
                  Mark Ready
                </Button>
                <Button onClick={startRecord}>
                  Start Record
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Intake Snapshot
          </CardTitle>
          <CardDescription>Quick view of the selected patient triage summary</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Chief Complaint</p>
            <p className="text-sm font-medium">{intake.chiefComplaint || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Triage Level</p>
            <p className="text-sm font-medium">{intake.triageLevel || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Risk Flags</p>
            <p className="text-sm font-medium">{intake.riskFlags.length > 0 ? intake.riskFlags.join(", ") : "None"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

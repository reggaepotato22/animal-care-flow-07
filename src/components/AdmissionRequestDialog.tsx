import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Bed } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import { useEncounter } from "@/contexts/EncounterContext";
import { saveHospRecord, getHospChannelName, type HospRecord } from "@/lib/hospitalizationStore";

interface AdmissionRequestDialogProps {
  children: React.ReactNode;
  patientData?: {
    patientId?: string;
    patientName?: string;
    petName?: string;
    species?: string;
    veterinarian?: string;
    diagnosis?: string;
  };
}

interface AdmissionRequest {
  scheduledDate: Date | undefined;
  reason: string;
  attendingVet: string;
  priority: "routine" | "urgent" | "emergency";
  estimatedStay: number;
  specialInstructions: string;
  preferredWard: string;
}

export function AdmissionRequestDialog({ children, patientData }: AdmissionRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { setPatientStatus, setStep } = useWorkflowContext();
  const { getActiveEncounterForPatient, updateEncounterStatus } = useEncounter();
  
  const [admissionRequest, setAdmissionRequest] = useState<AdmissionRequest>({
    scheduledDate: new Date(),
    reason: patientData?.diagnosis || "",
    attendingVet: patientData?.veterinarian || "",
    priority: "routine",
    estimatedStay: 1,
    specialInstructions: "",
    preferredWard: "General Ward"
  });

  const handleSubmit = () => {
    if (!admissionRequest.scheduledDate || !admissionRequest.reason || !admissionRequest.attendingVet) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    const pid = patientData?.patientId ?? `hosp-${Date.now()}`;

    // ── 1. Save to hospitalization store ─────────────────────────────────────
    const record: HospRecord = {
      id:            `HOSP-${Date.now()}`,
      patientId:     pid,
      patientName:   patientData?.patientName ?? "",
      petName:       patientData?.petName ?? "",
      species:       patientData?.species ?? "",
      admissionDate: now.toISOString().split("T")[0],
      admissionTime: now.toTimeString().slice(0, 5),
      reason:        admissionRequest.reason,
      attendingVet:  admissionRequest.attendingVet,
      ward:          admissionRequest.preferredWard,
      status:        admissionRequest.priority === "emergency" ? "critical" : "admitted",
      surgeryStage:  undefined,
      daysStay:      admissionRequest.estimatedStay,
      notes:         admissionRequest.specialInstructions,
      priority:      admissionRequest.priority,
      stageHistory:  [{ stage: "admitted", timestamp: now.toISOString(), by: admissionRequest.attendingVet }],
      feedingSchedule: [],
      createdAt:     now.toISOString(),
      updatedAt:     now.toISOString(),
    };
    saveHospRecord(record);

    // ── 2. Broadcast to all tabs ──────────────────────────────────────────────
    try {
      new BroadcastChannel(getHospChannelName()).postMessage({ type: "hosp_admitted", recordId: record.id, patientId: pid });
    } catch {}

    // ── 3. Update encounter status + workflow ─────────────────────────────────
    if (pid) {
      const enc = getActiveEncounterForPatient(pid);
      if (enc) updateEncounterStatus(enc.id, "IN_SURGERY");
      setPatientStatus(pid, "Hospitalized");
      setStep(pid, "CONSULTATION");
    }

    // ── 4. Notify same tab ────────────────────────────────────────────────────
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: "info",
        message: `${patientData?.petName || "Patient"} admitted to ${admissionRequest.preferredWard}`,
        targetRoles: ["SuperAdmin", "Vet", "Nurse"],
      },
    }));

    toast({
      title: "Patient Admitted",
      description: `${patientData?.petName || "Patient"} admitted to ${admissionRequest.preferredWard}.`
    });
    setOpen(false);
    setAdmissionRequest({
      scheduledDate: new Date(),
      reason: patientData?.diagnosis || "",
      attendingVet: patientData?.veterinarian || "",
      priority: "routine",
      estimatedStay: 1,
      specialInstructions: "",
      preferredWard: "General Ward",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5" />
            Create Admission Request
          </DialogTitle>
          <DialogDescription>
            Schedule hospitalization for {patientData?.petName || 'this patient'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Patient Information Summary */}
          {patientData && (
            <div className="rounded-lg border p-3 bg-muted/20">
              <h4 className="font-medium mb-2">Patient Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span><strong>Pet:</strong> {patientData.petName}</span>
                <span><strong>Owner:</strong> {patientData.patientName}</span>
                <span><strong>Species:</strong> {patientData.species}</span>
                <span><strong>Veterinarian:</strong> {patientData.veterinarian}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Scheduled Date */}
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Admission Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !admissionRequest.scheduledDate && "text-muted-foreground"
                    )}
                  >
                    {admissionRequest.scheduledDate ? (
                      format(admissionRequest.scheduledDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={admissionRequest.scheduledDate}
                    onSelect={(date) => setAdmissionRequest(prev => ({ ...prev, scheduledDate: date }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={admissionRequest.priority}
                onValueChange={(value: "routine" | "urgent" | "emergency") => 
                  setAdmissionRequest(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Attending Veterinarian */}
            <div className="space-y-2">
              <Label htmlFor="attendingVet">Attending Veterinarian *</Label>
              <Input
                id="attendingVet"
                value={admissionRequest.attendingVet}
                onChange={(e) => setAdmissionRequest(prev => ({ ...prev, attendingVet: e.target.value }))}
                placeholder="Dr. Smith"
              />
            </div>

            {/* Estimated Stay */}
            <div className="space-y-2">
              <Label htmlFor="estimatedStay">Estimated Stay (days)</Label>
              <Input
                id="estimatedStay"
                type="number"
                min="1"
                max="30"
                value={admissionRequest.estimatedStay}
                onChange={(e) => setAdmissionRequest(prev => ({ ...prev, estimatedStay: parseInt(e.target.value) || 1 }))}
              />
            </div>

            {/* Preferred Ward */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="preferredWard">Preferred Ward</Label>
              <Select
                value={admissionRequest.preferredWard}
                onValueChange={(value) => setAdmissionRequest(prev => ({ ...prev, preferredWard: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="Surgery Recovery">Surgery Recovery</SelectItem>
                  <SelectItem value="General Ward">General Ward</SelectItem>
                  <SelectItem value="Isolation">Isolation</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason for Hospitalization */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Hospitalization *</Label>
            <Textarea
              id="reason"
              value={admissionRequest.reason}
              onChange={(e) => setAdmissionRequest(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Post-surgical monitoring, treatment for..."
              className="min-h-[80px]"
            />
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Special Instructions / Notes</Label>
            <Textarea
              id="specialInstructions"
              value={admissionRequest.specialInstructions}
              onChange={(e) => setAdmissionRequest(prev => ({ ...prev, specialInstructions: e.target.value }))}
              placeholder="Special care requirements, dietary restrictions, medications..."
              className="min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Admission Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bed, AlertTriangle } from "lucide-react";
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

interface AdmissionForm {
  reason: string;
  attendingVet: string;
  priority: "routine" | "urgent" | "emergency";
  ward: string;
  notes: string;
  allergies: string;
  isAggressive: boolean;
}

export function AdmissionRequestDialog({ children, patientData }: AdmissionRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setPatientStatus, setStep } = useWorkflowContext();
  const { getActiveEncounterForPatient, updateEncounterStatus } = useEncounter();

  const [form, setForm] = useState<AdmissionForm>({
    reason: patientData?.diagnosis || "",
    attendingVet: patientData?.veterinarian || "",
    priority: "routine",
    ward: "General Ward",
    notes: "",
    allergies: "",
    isAggressive: false,
  });

  const handleSubmit = () => {
    if (!form.reason.trim() || !form.attendingVet.trim()) {
      toast({ title: "Missing Information", description: "Reason and attending vet are required.", variant: "destructive" });
      return;
    }

    const now = new Date();
    const pid = patientData?.patientId ?? `hosp-${Date.now()}`;
    const recordId = `HOSP-${Date.now()}`;

    // ── 1. Build & save record ────────────────────────────────────────────────
    const record: HospRecord = {
      id:            recordId,
      patientId:     pid,
      patientName:   patientData?.patientName ?? "",
      petName:       patientData?.petName ?? "",
      species:       patientData?.species ?? "",
      admissionDate: now.toISOString().split("T")[0],
      admissionTime: now.toTimeString().slice(0, 5),
      reason:        form.reason,
      attendingVet:  form.attendingVet,
      ward:          form.ward,
      status:        form.priority === "emergency" ? "critical" : "admitted",
      workspaceStatus: form.priority === "emergency" ? "CRITICAL" : "ADMITTED",
      surgeryStage:  undefined,
      daysStay:      0,
      notes:         form.notes,
      priority:      form.priority,
      allergies:     form.allergies ? form.allergies.split(",").map(s => s.trim()).filter(Boolean) : [],
      isAggressive:  form.isAggressive,
      stageHistory:  [{ stage: "admitted", timestamp: now.toISOString(), by: form.attendingVet }],
      eventLog: [{
        id: `evt-${Date.now()}`,
        hospId: recordId,
        timestamp: now.toISOString(),
        actor: form.attendingVet,
        type: "admission",
        title: `Admitted to ${form.ward}`,
        detail: form.reason,
      }],
      feedingSchedule: [],
      createdAt:     now.toISOString(),
      updatedAt:     now.toISOString(),
    };
    saveHospRecord(record);

    // ── 2. Broadcast ──────────────────────────────────────────────────────────
    try {
      new BroadcastChannel(getHospChannelName()).postMessage({ type: "hosp_admitted", recordId, patientId: pid });
    } catch {}

    // ── 3. Update encounter + workflow ────────────────────────────────────────
    if (pid) {
      const enc = getActiveEncounterForPatient(pid);
      if (enc) updateEncounterStatus(enc.id, "IN_HOSPITAL_ROUND");
      setPatientStatus(pid, "Hospitalized");
      setStep(pid, "CONSULTATION");
    }

    // ── 4. Notify ─────────────────────────────────────────────────────────────
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: { type: "info", message: `${record.petName || "Patient"} admitted to ${form.ward}`, targetRoles: ["SuperAdmin", "Vet", "Nurse"] },
    }));

    toast({ title: "Patient Admitted", description: `${record.petName || "Patient"} admitted to ${form.ward}.` });
    setOpen(false);
    setForm({ reason: patientData?.diagnosis || "", attendingVet: patientData?.veterinarian || "", priority: "routine", ward: "General Ward", notes: "", allergies: "", isAggressive: false });

    // ── 5. Open workspace ─────────────────────────────────────────────────────
    navigate(`/hospitalizations/${recordId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5 text-primary" />
            Admit Patient
          </DialogTitle>
          <DialogDescription>
            {patientData?.petName ? `Admitting ${patientData.petName} — this will open the Hospitalization Workspace immediately.` : "Complete the details below to admit a patient."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Patient summary */}
          {(patientData?.petName || patientData?.patientName) && (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {patientData.petName     && <div><span className="text-muted-foreground text-xs">Pet</span><p className="font-medium">{patientData.petName}</p></div>}
              {patientData.patientName && <div><span className="text-muted-foreground text-xs">Owner</span><p className="font-medium">{patientData.patientName}</p></div>}
              {patientData.species     && <div><span className="text-muted-foreground text-xs">Species</span><p>{patientData.species}</p></div>}
              {patientData.veterinarian && <div><span className="text-muted-foreground text-xs">Vet</span><p>{patientData.veterinarian}</p></div>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Priority *</Label>
              <Select value={form.priority} onValueChange={(v: AdmissionForm["priority"]) => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ward *</Label>
              <Select value={form.ward} onValueChange={v => setForm(p => ({ ...p, ward: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Ward">General Ward</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="Surgery Recovery">Surgery Recovery</SelectItem>
                  <SelectItem value="Isolation">Isolation</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Attending Veterinarian *</Label>
              <Input placeholder="Dr. Smith" value={form.attendingVet} onChange={e => setForm(p => ({ ...p, attendingVet: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reason for Admission *</Label>
            <Textarea placeholder="e.g. Post-surgical monitoring, IV fluid therapy, observation…" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="min-h-[70px] text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Known Allergies</Label>
              <Input placeholder="e.g. Penicillin, NSAIDs" value={form.allergies} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))} className="text-sm" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="aggressive" checked={form.isAggressive} onChange={e => setForm(p => ({ ...p, isAggressive: e.target.checked }))} className="h-4 w-4 rounded" />
              <Label htmlFor="aggressive" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Mark as Aggressive
              </Label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes / Special Instructions</Label>
            <Textarea placeholder="Dietary restrictions, medications, care notes…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="min-h-[55px] text-sm" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Bed className="h-4 w-4" /> Admit Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

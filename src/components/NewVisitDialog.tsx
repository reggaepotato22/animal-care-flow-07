import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import * as z from "zod";
import type { EncounterType } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Stethoscope, AlertTriangle, Scissors, HeartPulse, RefreshCw, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import { useEncounter } from "@/contexts/EncounterContext";
import { broadcastClinicalRecordUpdate, upsertClinicalRecord } from "@/lib/clinicalRecordStore";
import { getHospChannelName } from "@/lib/hospitalizationStore";
import { broadcastEmergencyAlert } from "@/lib/emergencyAlert";
import { getStaff } from "@/lib/staffStore";

const newVisitSchema = z.object({
  encounterType: z.string().min(1, "Encounter type is required") as z.ZodType<EncounterType>,
  reason: z.string().min(1, "Reason for visit is required"),
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  attendingVet: z.string().min(1, "Attending veterinarian is required"),
});

type NewVisitFormData = z.infer<typeof newVisitSchema>;

interface NewVisitDialogProps {
  children?: React.ReactNode;
  patientId?: string;
  patientName?: string;
}

const ENCOUNTER_TYPES: { value: EncounterType; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { value: "CONSULTATION",    label: "Consultation",     description: "Full clinical exam & treatment plan",  icon: Stethoscope,  color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "TRIAGE",          label: "Triage",           description: "Urgent intake & vitals assessment",     icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "PROCEDURE",       label: "Procedure",        description: "Minor procedure or intervention",       icon: Scissors,     color: "text-purple-600 bg-purple-50 border-purple-200" },
  { value: "SURGERY",         label: "Surgery",          description: "Surgical operation requiring theatre",  icon: HeartPulse,   color: "text-red-600 bg-red-50 border-red-200" },
  { value: "FOLLOW_UP",       label: "Follow-Up",        description: "Post-treatment check on progress",      icon: RefreshCw,    color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "HOSPITAL_ROUND",  label: "Hospital Round",   description: "Inpatient daily monitoring round",       icon: Building2,    color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
];

const REASON_OPTIONS = [
  "Annual Checkup",
  "Vaccination",
  "Emergency Visit",
  "Follow-up",
  "Dental Cleaning",
  "Surgery",
  "Wellness Check",
  "Grooming",
  "Upper Respiratory",
  "Other",
];

/** Map encounter type to its initial status when the visit is first created (still WAITING) */
function getInitialStatus(type: EncounterType) {
  return "WAITING" as const;
}


export function NewVisitDialog({ children, patientId: propPatientId, patientName }: NewVisitDialogProps) {
  const [open, setOpen] = useState(false);
  const [otherUrgency, setOtherUrgency] = useState<"emergency" | "routine" | null>(null);
  const { id: paramPatientId } = useParams();
  const navigate = useNavigate();
  const { setStep, setPatientStatus, checkIn } = useWorkflowContext();
  const { createEncounter, setActiveEncounter } = useEncounter();

  const effectivePatientId = propPatientId ?? paramPatientId;

  const vetOptions = useMemo(() => {
    const staff = getStaff().filter(s =>
      s.status === "active" &&
      (s.role.toLowerCase().includes("veterinarian") || s.role.toLowerCase().includes("vet"))
    );
    return staff.length > 0 ? staff.map(s => s.name) : ["Dr. Smith", "Dr. Johnson", "Dr. Emergency"];
  }, [open]);

  const form = useForm<NewVisitFormData>({
    resolver: zodResolver(newVisitSchema),
    defaultValues: { encounterType: "CONSULTATION", reason: "", chiefComplaint: "", attendingVet: "" },
  });

  const watchedReason = form.watch("reason");
  const watchedType = form.watch("encounterType");
  const isEmergencyReason = watchedReason === "Emergency Visit" ||
    (watchedReason === "Other" && otherUrgency === "emergency") ||
    watchedType === "TRIAGE";

  const onSubmit = (data: NewVisitFormData) => {
    if (!effectivePatientId) return;

    const isEmergency = data.encounterType === "TRIAGE" ||
      data.reason === "Emergency Visit" ||
      (data.reason === "Other" && otherUrgency === "emergency");

    const encStatus = isEmergency ? "IN_TRIAGE" : "WAITING";

    const encounter = createEncounter(effectivePatientId, {
      type: data.encounterType,
      reason: data.reason,
      chiefComplaint: data.chiefComplaint,
      veterinarian: data.attendingVet,
      status: encStatus,
    });

    setActiveEncounter(encounter);
    setPatientStatus(effectivePatientId, "Active");

    if (isEmergency) {
      // checkIn with silent=false so the workflow channel fires PATIENT_CHECKIN → Nurse badge
      checkIn(effectivePatientId, {
        name: patientName ?? effectivePatientId,
        owner: "",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "Emergency Visit",
        checkedInAt: new Date().toISOString(),
      }, false);

      // Play siren locally AND in every other open tab (Triage, Nurse station, etc.)
      broadcastEmergencyAlert({
        patientName: patientName ?? effectivePatientId,
        patientId: effectivePatientId,
        chiefComplaint: data.chiefComplaint,
      });

      // Critical notification to ALL roles so nobody misses it
      window.dispatchEvent(new CustomEvent("acf:notification", {
        detail: {
          type: "critical",
          message: `🚨 EMERGENCY: ${patientName ?? effectivePatientId} — immediate triage required (${data.chiefComplaint})`,
          patientId: effectivePatientId,
          patientName: patientName ?? effectivePatientId,
          step: "TRIAGE",
          targetRoles: ["SuperAdmin", "Nurse", "Vet", "Receptionist"],
        },
      }));

      // Also post to acf_workflow_updates so cross-tab Triage page sees it immediately
      try {
        new BroadcastChannel("acf_workflow_updates").postMessage({
          type: "EMERGENCY_VISIT",
          payload: {
            patientId: effectivePatientId,
            patientName: patientName ?? effectivePatientId,
            chiefComplaint: data.chiefComplaint,
            encounterId: encounter.id,
            timestamp: Date.now(),
          },
        });
      } catch {}

      toast.error(`🚨 EMERGENCY — ${patientName ?? effectivePatientId} routed to Triage`, {
        duration: 6000,
      });
    } else {
      // Normal: set step only — patient stays WAITING until receptionist clicks Check In
      setStep(effectivePatientId, "TRIAGE");
    }

    try {
      upsertClinicalRecord({
        encounterId: encounter.id,
        patientId: effectivePatientId,
        veterinarian: data.attendingVet,
        status: encStatus,
        savedAt: new Date().toISOString(),
        data: {
          type: "new_visit",
          encounterId: encounter.id,
          patientId: effectivePatientId,
          reason: data.reason,
          chiefComplaint: data.chiefComplaint,
          veterinarian: data.attendingVet,
          visitType: isEmergency ? "Emergency Intake" : "New Visit",
          status: encStatus,
          createdAt: new Date().toISOString(),
        },
      });
      broadcastClinicalRecordUpdate();
      new BroadcastChannel(getHospChannelName()).postMessage({
        type: "new_visit_created", encounterId: encounter.id, patientId: effectivePatientId,
      });
    } catch {}

    setOpen(false);
    form.reset();
    setOtherUrgency(null);

    // Always navigate to patient details — the "Start" CTA on the encounter card
    // is responsible for opening the workspace or /triage
    navigate(`/patients/${effectivePatientId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <FileText className="mr-2 h-4 w-4" />
            New Visit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            New Visit{patientName ? ` — ${patientName}` : ""}
          </DialogTitle>
        </DialogHeader>

        {isEmergencyReason && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 font-medium -mt-1">
            <span className="text-base">🚨</span>
            Emergency flagged — will route directly to Triage and alert staff
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Encounter Type */}
            <FormField
              control={form.control}
              name="encounterType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Encounter Type</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {ENCOUNTER_TYPES.map((et) => {
                      const Icon = et.icon;
                      const isSelected = field.value === et.value;
                      return (
                        <button
                          key={et.value}
                          type="button"
                          onClick={() => field.onChange(et.value)}
                          className={`flex items-start gap-2 rounded-lg border p-2.5 text-left text-sm transition-all ${
                            isSelected
                              ? `${et.color} ring-2 ring-offset-1 ring-current font-medium`
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isSelected ? "" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-medium leading-tight">{et.label}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{et.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Visit</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(v); setOtherUrgency(null); }} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={watchedReason === "Emergency Visit" ? "border-red-400 text-red-700" : ""}>
                        <SelectValue placeholder="Select reason for visit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REASON_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r} className={r === "Emergency Visit" ? "text-red-600 font-semibold" : ""}>
                          {r === "Emergency Visit" ? "🚨 Emergency Visit" : r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other urgency picker */}
            {watchedReason === "Other" && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Is this an emergency?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 text-sm font-semibold px-3 py-2 rounded-md border transition-all ${
                      otherUrgency === "emergency"
                        ? "bg-red-50 border-red-400 text-red-700 ring-2 ring-red-300"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => setOtherUrgency("emergency")}
                  >
                    🚨 Yes — Emergency
                  </button>
                  <button
                    type="button"
                    className={`flex-1 text-sm font-semibold px-3 py-2 rounded-md border transition-all ${
                      otherUrgency === "routine"
                        ? "bg-green-50 border-green-400 text-green-700 ring-2 ring-green-300"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => setOtherUrgency("routine")}
                  >
                    ✓ No — Routine
                  </button>
                </div>
              </div>
            )}

            {/* Chief Complaint */}
            <FormField
              control={form.control}
              name="chiefComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chief Complaint</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the primary concern or symptoms…"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attending Vet */}
            <FormField
              control={form.control}
              name="attendingVet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attending Veterinarian</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select attending veterinarian" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vetOptions.map((vet) => (
                        <SelectItem key={vet} value={vet}>{vet}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset(); setOtherUrgency(null); }}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={watchedReason === "Other" && otherUrgency === null}
                className={isEmergencyReason ? "bg-red-600 hover:bg-red-700 text-white" : ""}
              >
                {isEmergencyReason ? "🚨 Send to Emergency Triage" : "Create Visit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

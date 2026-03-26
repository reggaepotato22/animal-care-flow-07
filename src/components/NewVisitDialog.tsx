import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import { useEncounter } from "@/contexts/EncounterContext";
import type { WorkflowStepId } from "@/config/workflow";

const newVisitSchema = z.object({
  type: z.enum(["New Visit", "Start Consultation", "Start Surgery", "Emergency Intake"]),
  reason: z.string().min(1, "Reason for visit is required"),
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  attendingVet: z.string().min(1, "Attending veterinarian is required"),
});

type NewVisitFormData = z.infer<typeof newVisitSchema>;

interface NewVisitDialogProps {
  children?: React.ReactNode;
  defaultType?: "New Visit" | "Start Consultation" | "Start Surgery" | "Emergency Intake";
}

const typeOptions = ["New Visit", "Start Consultation", "Start Surgery", "Emergency Intake"];

const reasonOptions = [
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

const vetOptions = [
  "Dr. Smith",
  "Dr. Johnson", 
  "Dr. Brown",
  "Dr. Wilson",
  "Dr. Emergency",
  "Dr. Davis",
  "Dr. Thompson",
];

export function NewVisitDialog({ children, defaultType = "New Visit" }: NewVisitDialogProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { id: patientId } = useParams();
  const { setStep, setPatientStatus } = useWorkflowContext();
  const { createEncounter, setActiveEncounter } = useEncounter();

  const form = useForm<NewVisitFormData>({
    resolver: zodResolver(newVisitSchema),
    defaultValues: {
      type: defaultType,
      reason: "",
      chiefComplaint: "",
      attendingVet: "",
    },
  });

  const onSubmit = (data: NewVisitFormData) => {
    if (!patientId) return;

    const encStatusMap: Record<string, any> = {
      "New Visit": "WAITING",
      "Start Consultation": "IN_CONSULTATION",
      "Start Surgery": "IN_SURGERY",
      "Emergency Intake": "IN_TRIAGE",
    };

    const encounter = createEncounter(patientId, {
      reason: data.reason,
      chiefComplaint: data.chiefComplaint,
      veterinarian: data.attendingVet,
      status: encStatusMap[data.type] ?? "WAITING",
    });

    setActiveEncounter(encounter);
    setPatientStatus(patientId, "Active");
    const stepForType: Record<string, WorkflowStepId> = {
      "New Visit": "TRIAGE",
      "Start Consultation": "CONSULTATION",
      "Start Surgery": "PHARMACY",
      "Emergency Intake": "TRIAGE",
    };
    setStep(patientId, stepForType[data.type] ?? "TRIAGE");

    try {
      const stored: unknown[] = JSON.parse(localStorage.getItem("acf_clinical_records") ?? "[]");
      stored.unshift({
        type: "new_visit",
        encounterId: encounter.id,
        patientId,
        reason: data.reason,
        chiefComplaint: data.chiefComplaint,
        veterinarian: data.attendingVet,
        visitType: data.type,
        status: encStatusMap[data.type] ?? "WAITING",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("acf_clinical_records", JSON.stringify(stored));
      new BroadcastChannel("acf_hospitalization_channel").postMessage({
        type: "new_visit_created", encounterId: encounter.id, patientId,
      });
    } catch {}

    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: "success",
        message: `New visit started — ${data.reason}`,
        patientId,
        step: data.type === "Start Surgery" ? "CONSULTATION" : "TRIAGE",
      },
    }));

    setOpen(false);
    form.reset();

    navigate(`/records`);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Visit</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visit Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Visit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason for visit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reasonOptions.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chiefComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chief Complaint</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the primary concern or symptoms..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attendingVet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attending Veterinarian</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select attending veterinarian" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vetOptions.map((vet) => (
                        <SelectItem key={vet} value={vet}>
                          {vet}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Visit</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
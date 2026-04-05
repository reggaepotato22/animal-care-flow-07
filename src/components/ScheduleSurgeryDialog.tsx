import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSurgery } from "@/lib/surgeryStore";

interface ScheduleSurgeryDialogProps {
  children: React.ReactNode;
  patientData?: {
    patientId?: string;
    patientName?: string;
    petName?: string;
    species?: string;
    veterinarian?: string;
    allergies?: string[];
    isAggressive?: boolean;
    hospRecordId?: string;
    encounterId?: string;
  };
}

export function ScheduleSurgeryDialog({ children, patientData }: ScheduleSurgeryDialogProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    surgeryType:   "",
    surgeon:       patientData?.veterinarian ?? "",
    anesthetist:   "",
    assistant:     "",
    priority:      "elective" as "elective" | "urgent" | "emergency",
    operatingRoom: "",
    scheduledTime: "",
    notes:         "",
  });

  const handleSubmit = () => {
    if (!form.surgeryType.trim() || !form.surgeon.trim()) {
      toast({ title: "Missing Information", description: "Surgery type and surgeon are required.", variant: "destructive" });
      return;
    }

    const rec = createSurgery({
      patientId:    patientData?.patientId ?? `pt-${Date.now()}`,
      patientName:  patientData?.patientName ?? "",
      petName:      patientData?.petName ?? "",
      species:      patientData?.species ?? "",
      hospRecordId: patientData?.hospRecordId,
      encounterId:  patientData?.encounterId,
      surgeryType:  form.surgeryType.trim(),
      status:       "SCHEDULED",
      surgeon:      form.surgeon.trim(),
      anesthetist:  form.anesthetist.trim() || undefined,
      assistant:    form.assistant.trim() || undefined,
      priority:     form.priority,
      operatingRoom: form.operatingRoom.trim() || undefined,
      scheduledTime: form.scheduledTime || undefined,
      notes:        form.notes.trim() || undefined,
      allergies:    patientData?.allergies ?? [],
      isAggressive: patientData?.isAggressive ?? false,
    });

    toast({ title: "Surgery Scheduled", description: `${form.surgeryType} for ${patientData?.petName ?? "patient"}.` });
    setOpen(false);
    navigate(`/surgeries/${rec.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            Schedule Surgery
          </DialogTitle>
          <DialogDescription>
            {patientData?.petName
              ? `Scheduling surgery for ${patientData.petName}. Default tasks and checklist will be generated automatically.`
              : "Complete the details below to schedule a surgical procedure."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Patient summary */}
          {(patientData?.petName || patientData?.patientName) && (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {patientData.petName     && <div><span className="text-muted-foreground text-xs">Pet</span><p className="font-medium">{patientData.petName}</p></div>}
              {patientData.patientName && <div><span className="text-muted-foreground text-xs">Owner</span><p className="font-medium">{patientData.patientName}</p></div>}
              {patientData.species     && <div><span className="text-muted-foreground text-xs">Species</span><p>{patientData.species}</p></div>}
              {patientData.isAggressive && (
                <div className="col-span-2 flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" /><span className="text-xs font-medium">Aggressive patient</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Surgery / Procedure Type *</Label>
            <Input placeholder="e.g. Spay, Fracture Repair, Tumour Excision"
              value={form.surgeryType} onChange={e => setForm(p => ({ ...p, surgeryType: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Priority *</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v as typeof form.priority }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="elective">Elective</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Scheduled Time</Label>
              <Input type="datetime-local" value={form.scheduledTime}
                onChange={e => setForm(p => ({ ...p, scheduledTime: e.target.value }))} className="text-sm" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Lead Surgeon *</Label>
              <Input placeholder="Dr. Smith"
                value={form.surgeon} onChange={e => setForm(p => ({ ...p, surgeon: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Anesthetist</Label>
              <Input placeholder="Dr. Lee" value={form.anesthetist}
                onChange={e => setForm(p => ({ ...p, anesthetist: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Surgical Assistant</Label>
              <Input placeholder="Nurse Johnson" value={form.assistant}
                onChange={e => setForm(p => ({ ...p, assistant: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Operating Room</Label>
              <Input placeholder="e.g. OR-1, Theatre B" value={form.operatingRoom}
                onChange={e => setForm(p => ({ ...p, operatingRoom: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea placeholder="Special instructions, pre-op considerations…"
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="min-h-[60px] text-sm" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="gap-2"
            disabled={!form.surgeryType.trim() || !form.surgeon.trim()}>
            <Scissors className="h-4 w-4" /> Schedule &amp; Open Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

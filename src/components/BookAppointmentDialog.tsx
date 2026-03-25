import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Search, UserCheck, UserPlus, X, Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { saveAppointment, broadcastAppointmentUpdate } from "@/lib/appointmentStore";

// ── Existing patient registry (merged from mock appointments + localStorage) ──
interface KnownPatient {
  patientId: string;
  petName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  species?: string;
}

const SEED_PATIENTS: KnownPatient[] = [
  { patientId: "1", petName: "Max",      ownerName: "Sarah Johnson",   ownerPhone: "+254 712 000001", ownerEmail: "sarah.johnson@email.com" },
  { patientId: "2", petName: "Whiskers", ownerName: "Michael Chen",    ownerPhone: "+254 712 000002", ownerEmail: "michael.chen@email.com" },
  { patientId: "3", petName: "Luna",     ownerName: "Emily Rodriguez", ownerPhone: "+254 712 000003", ownerEmail: "emily.r@email.com" },
  { patientId: "4", petName: "Rocky",    ownerName: "David Thompson",  ownerPhone: "+254 712 000004", ownerEmail: "david.t@email.com" },
  { patientId: "5", petName: "Bella",    ownerName: "Lisa Anderson",   ownerPhone: "+254 712 000005", ownerEmail: "lisa.a@email.com" },
  { patientId: "6", petName: "Oliver",   ownerName: "James Wilson",    ownerPhone: "+254 712 000006", ownerEmail: "james.w@email.com" },
];

function loadKnownPatients(): KnownPatient[] {
  try {
    const merged = [...SEED_PATIENTS];

    // Merge patients registered via AddPatient page
    const rawReg = localStorage.getItem("acf_known_patients");
    if (rawReg) {
      const regList = JSON.parse(rawReg) as KnownPatient[];
      regList.forEach(p => {
        if (!merged.find(m => m.patientId === p.patientId)) merged.push(p);
      });
    }

    // Merge patients from saved clinical records
    const rawClin = localStorage.getItem("acf_clinical_records");
    if (rawClin) {
      const clinList = JSON.parse(rawClin) as Array<{
        patientId: string; petName?: string; ownerName?: string;
      }>;
      clinList.forEach(r => {
        if (!merged.find(m => m.patientId === r.patientId)) {
          merged.push({
            patientId: r.patientId,
            petName:   r.petName   ?? r.patientId,
            ownerName: r.ownerName ?? "Unknown Owner",
            ownerPhone: "",
            ownerEmail: "",
          });
        }
      });
    }

    return merged;
  } catch { return SEED_PATIENTS; }
}

// ── Form schema ───────────────────────────────────────────────────────────────

const formSchema = z.object({
  petName:    z.string().min(1, "Pet name is required"),
  ownerName:  z.string().min(1, "Owner name is required"),
  ownerPhone: z.string().min(1, "Phone number is required"),
  ownerEmail: z.string().email("Valid email is required"),
  date:       z.date({ required_error: "Appointment date is required" }),
  time:       z.string().min(1, "Time is required"),
  type:       z.string().min(1, "Appointment type is required"),
  vet:        z.string().min(1, "Veterinarian is required"),
  notes:      z.string().optional(),
});

interface BookAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const timeSlots = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00",
];
const appointmentTypes = ["Checkup","Vaccination","Surgery","Dental","Emergency","Consultation","Follow-up"];
const veterinarians    = ["Dr. Johnson","Dr. Smith","Dr. Williams","Dr. Brown","Dr. Davis"];

export function BookAppointmentDialog({ isOpen, onClose }: BookAppointmentDialogProps) {
  const navigate = useNavigate();
  // ── Patient mode: "new" | "existing" ────────────────────────────────────────
  const [patientMode, setPatientMode] = useState<"new" | "existing">("existing");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<KnownPatient | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const knownPatients = useMemo(() => loadKnownPatients(), [isOpen]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return knownPatients;
    const q = patientSearch.toLowerCase();
    return knownPatients.filter(
      p => p.petName.toLowerCase().includes(q) || p.ownerName.toLowerCase().includes(q)
    );
  }, [patientSearch, knownPatients]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { petName: "", ownerName: "", ownerPhone: "", ownerEmail: "", time: "", type: "", vet: "", notes: "" },
  });

  // Auto-fill form when a patient is selected
  const handleSelectPatient = (p: KnownPatient) => {
    setSelectedPatient(p);
    setPatientSearch(`${p.petName} — ${p.ownerName}`);
    setSearchOpen(false);
    form.setValue("petName",    p.petName,    { shouldValidate: true });
    form.setValue("ownerName",  p.ownerName,  { shouldValidate: true });
    form.setValue("ownerPhone", p.ownerPhone, { shouldValidate: true });
    form.setValue("ownerEmail", p.ownerEmail, { shouldValidate: true });
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPatientSearch("");
    form.setValue("petName",    "");
    form.setValue("ownerName",  "");
    form.setValue("ownerPhone", "");
    form.setValue("ownerEmail", "");
  };

  // Auto-select newly registered patient when returning from /patients/add
  useEffect(() => {
    if (!isOpen) return;
    const lastId = localStorage.getItem("acf_last_registered_patient");
    if (!lastId) return;
    localStorage.removeItem("acf_last_registered_patient");
    const fresh = loadKnownPatients();
    const patient = fresh.find(p => p.patientId === lastId);
    if (!patient) return;
    setPatientMode("existing");
    setSelectedPatient(patient);
    setPatientSearch(`${patient.petName} — ${patient.ownerName}`);
    setSearchOpen(false);
    form.setValue("petName",    patient.petName,    { shouldValidate: true });
    form.setValue("ownerName",  patient.ownerName,  { shouldValidate: true });
    form.setValue("ownerPhone", patient.ownerPhone, { shouldValidate: true });
    form.setValue("ownerEmail", patient.ownerEmail, { shouldValidate: true });
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeSwitch = (mode: "new" | "existing") => {
    setPatientMode(mode);
    handleClearPatient();
  };

  const handleRegisterNewPatient = () => {
    onClose();
    navigate("/patients/add?returnTo=appointments");
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const patientId = selectedPatient?.patientId ?? `appt-${Date.now()}`;
    saveAppointment({
      id:          `apt-${Date.now()}`,
      petName:     values.petName,
      ownerName:   values.ownerName,
      ownerPhone:  values.ownerPhone,
      ownerEmail:  values.ownerEmail,
      date:        values.date.toISOString(),
      time:        values.time,
      type:        values.type,
      vet:         values.vet,
      notes:       values.notes ?? "",
      status:      "CONFIRMED",
      patientId,
      duration:    30,
      createdAt:   new Date().toISOString(),
    });
    broadcastAppointmentUpdate();
    // Notify all role dashboards
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: "info",
        message: `New appointment booked: ${values.petName} (${values.type}) on ${format(values.date, "MMM d")} at ${values.time}`,
        patientId,
        patientName: values.petName,
        targetRoles: ["SuperAdmin", "Receptionist", "Vet", "Nurse", "Pharmacist"],
      },
    }));
    toast({
      title: "Appointment Booked",
      description: `${values.petName} — ${format(values.date, "MMM d, yyyy")} at ${values.time}.`,
    });
    form.reset();
    handleClearPatient();
    setPatientMode("existing");
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for your veterinary clinic.
          </DialogDescription>
        </DialogHeader>

        {/* ── Patient type toggle ─────────────────────────────────────────── */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
          <Button
            type="button"
            size="sm"
            variant={patientMode === "existing" ? "default" : "ghost"}
            className="gap-1.5 h-8 text-xs"
            onClick={() => handleModeSwitch("existing")}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Existing Patient
          </Button>
          <Button
            type="button"
            size="sm"
            variant={patientMode === "new" ? "default" : "ghost"}
            className="gap-1.5 h-8 text-xs"
            onClick={() => handleModeSwitch("new")}
          >
            <UserPlus className="h-3.5 w-3.5" />
            New Patient
          </Button>
        </div>

        {/* ── New patient: navigate to registration page ──────────────── */}
        {patientMode === "new" && (
          <div className="flex flex-col items-center justify-center gap-4 py-8 px-4 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/20">
            <UserPlus className="h-10 w-10 text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-semibold text-sm">Register a new patient first</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll be taken to the patient registration form. After saving,
                you'll be brought back here automatically to complete the booking.
              </p>
            </div>
            <Button
              type="button"
              className="gap-2"
              onClick={handleRegisterNewPatient}
            >
              Go to Patient Registration
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── Existing patient search ─────────────────────────────────────── */}
        {patientMode === "existing" && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Search Patient</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Type pet name or owner name…"
                value={patientSearch}
                className="pl-9 pr-9"
                onChange={e => {
                  setPatientSearch(e.target.value);
                  setSearchOpen(true);
                  if (!e.target.value) handleClearPatient();
                }}
                onFocus={() => setSearchOpen(true)}
              />
              {selectedPatient && (
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {searchOpen && patientSearch && !selectedPatient && (
              <div className="border rounded-lg shadow-md bg-popover z-50 max-h-52 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No matching patients found.
                  </p>
                ) : (
                  filteredPatients.map(p => (
                    <button
                      key={p.patientId}
                      type="button"
                      onClick={() => handleSelectPatient(p)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent text-left transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold">{p.petName}</p>
                        <p className="text-xs text-muted-foreground">{p.ownerName}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        #{p.patientId}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected patient pill */}
            {selectedPatient && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {selectedPatient.petName}
                    <span className="font-normal text-muted-foreground ml-2">
                      — {selectedPatient.ownerName}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedPatient.ownerPhone}</p>
                </div>
                <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">
                  Auto-filled
                </Badge>
              </div>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Pet and Owner Information — always visible, pre-filled when existing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="petName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter pet name"
                        {...field}
                        readOnly={patientMode === "existing" && !!selectedPatient}
                        className={cn(patientMode === "existing" && selectedPatient && "bg-muted/50")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter owner name"
                        {...field}
                        readOnly={patientMode === "existing" && !!selectedPatient}
                        className={cn(patientMode === "existing" && selectedPatient && "bg-muted/50")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter phone number"
                        {...field}
                        readOnly={patientMode === "existing" && !!selectedPatient}
                        className={cn(patientMode === "existing" && selectedPatient && "bg-muted/50")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter email address"
                        {...field}
                        readOnly={patientMode === "existing" && !!selectedPatient}
                        className={cn(patientMode === "existing" && selectedPatient && "bg-muted/50")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Appointment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appointment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {appointmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veterinarian</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select veterinarian" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {veterinarians.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes or special requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              {patientMode === "existing" && (
                <Button
                  type="submit"
                  disabled={!selectedPatient}
                >
                  Book Appointment
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
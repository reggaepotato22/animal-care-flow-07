import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Save, X } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { updateAppointment, broadcastAppointmentUpdate, type StoredAppointment } from "@/lib/appointmentStore";

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

type FormData = z.infer<typeof formSchema>;

interface AppointmentForEdit {
  id: string;
  petName: string;
  ownerName: string;
  date: Date;
  time: string;
  type: string;
  vet: string;
  notes?: string;
  ownerPhone?: string;
  ownerEmail?: string;
}

interface EditAppointmentDialogProps {
  appointment: AppointmentForEdit | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const timeSlots = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00",
];
const appointmentTypes = ["Checkup","Vaccination","Surgery","Dental","Emergency","Consultation","Follow-up"];
const veterinarians    = ["Dr. Johnson","Dr. Smith","Dr. Williams","Dr. Brown","Dr. Davis"];

export function EditAppointmentDialog({ appointment, isOpen, onClose, onSaved }: EditAppointmentDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      petName: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      time: "",
      type: "",
      vet: "",
      notes: "",
    },
  });

  // Populate form when appointment changes
  useEffect(() => {
    if (appointment) {
      form.reset({
        petName:    appointment.petName,
        ownerName:  appointment.ownerName,
        ownerPhone: appointment.ownerPhone || "",
        ownerEmail: appointment.ownerEmail || "",
        date:       appointment.date,
        time:       appointment.time,
        type:       appointment.type,
        vet:        appointment.vet,
        notes:      appointment.notes || "",
      });
    }
  }, [appointment, form]);

  const onSubmit = async (values: FormData) => {
    if (!appointment) return;
    setIsSaving(true);

    const updated = updateAppointment(appointment.id, {
      petName:     values.petName,
      ownerName:   values.ownerName,
      ownerPhone:  values.ownerPhone,
      ownerEmail:  values.ownerEmail,
      date:        values.date.toISOString(),
      time:        values.time,
      type:        values.type,
      vet:         values.vet,
      notes:       values.notes || "",
    });

    if (updated) {
      broadcastAppointmentUpdate();
      window.dispatchEvent(new CustomEvent("acf:notification", {
        detail: {
          type: "info",
          message: `Appointment updated: ${values.petName} on ${format(values.date, "MMM d")} at ${values.time}`,
          patientId: updated.patientId,
          patientName: values.petName,
          targetRoles: ["SuperAdmin", "Receptionist", "Vet", "Nurse"],
        },
      }));
      toast({
        title: "Appointment Updated",
        description: `${values.petName} — ${format(values.date, "MMM d, yyyy")} at ${values.time}.`,
      });
      onSaved?.();
      onClose();
    } else {
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Update the appointment details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Pet and Owner Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="petName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pet name" {...field} />
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
                      <Input placeholder="Enter owner name" {...field} />
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
                      <Input placeholder="Enter phone number" {...field} />
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
                      <Input placeholder="Enter email address" {...field} />
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
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { CalendarIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";

const dischargeSummarySchema = z.object({
  dischargeDate: z.date({
    required_error: "Discharge date is required.",
  }),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  treatmentSummary: z.string().min(1, "Treatment summary is required"),
  medications: z.string().optional(),
  followUpInstructions: z.string().min(1, "Follow-up instructions are required"),
  nextAppointment: z.string().optional(),
  veterinarian: z.string().min(1, "Veterinarian name is required"),
  additionalNotes: z.string().optional(),
});

type DischargeSummaryData = z.infer<typeof dischargeSummarySchema>;

interface DischargeSummaryDialogProps {
  children?: React.ReactNode;
}

export function DischargeSummaryDialog({ children }: DischargeSummaryDialogProps) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<DischargeSummaryData>({
    resolver: zodResolver(dischargeSummarySchema),
    defaultValues: {
      dischargeDate: new Date(),
      diagnosis: "",
      treatmentSummary: "",
      medications: "",
      followUpInstructions: "",
      nextAppointment: "",
      veterinarian: "",
      additionalNotes: "",
    },
  });

  const onSubmit = async (data: DischargeSummaryData) => {
    try {
      // In a real app, this would make an API call
      console.log("Discharge summary data:", data);
      
      toast({
        title: "Discharge Summary Created",
        description: "The discharge summary has been successfully generated.",
      });
      
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create discharge summary. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="bg-success text-success-foreground hover:bg-success/90">
            <FileText className="mr-2 h-4 w-4" />
            Discharge Patient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Discharge Summary</DialogTitle>
          <DialogDescription>
            Complete the discharge summary form for this patient.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dischargeDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Discharge Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="veterinarian"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veterinarian</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Diagnosis</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter primary diagnosis..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatmentSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the treatment provided during the stay..."
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
              name="medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medications Prescribed</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List medications, dosages, and duration..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="followUpInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide care instructions for the owner..."
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
              name="nextAppointment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Appointment (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Follow-up in 2 weeks" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes or observations..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Generate Discharge Summary</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
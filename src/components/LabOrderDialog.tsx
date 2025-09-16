import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";

const labOrderSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  veterinarian: z.string().min(1, "Veterinarian is required"),
  priority: z.enum(["routine", "urgent", "stat"]),
  tests: z.array(z.string()).min(1, "At least one test must be selected"),
  diagnosis: z.string().min(1, "Diagnosis/reason is required"),
  specialInstructions: z.string().optional(),
});

type LabOrderFormData = z.infer<typeof labOrderSchema>;

interface LabOrderDialogProps {
  children?: React.ReactNode;
  prefillData?: {
    patientId?: string;
    veterinarian?: string;
    diagnosis?: string;
  };
  onLabOrderCreated?: (orderData: LabOrderFormData & { orderId: string; testName: string }) => void;
}

const availableTests = [
  { id: "cbc", name: "Complete Blood Count (CBC)", category: "Hematology" },
  { id: "chemistry", name: "Chemistry Panel", category: "Clinical Chemistry" },
  { id: "urinalysis", name: "Urinalysis", category: "Urinalysis" },
  { id: "fecal", name: "Fecal Parasite Exam", category: "Parasitology" },
  { id: "thyroid", name: "Thyroid Panel (T4)", category: "Endocrinology" },
  { id: "felv-fiv", name: "FeLV/FIV Test", category: "Serology" },
  { id: "heartworm", name: "Heartworm Test", category: "Serology" },
  { id: "radiographs", name: "Radiographs", category: "Imaging" },
  { id: "cytology", name: "Cytology", category: "Pathology" },
  { id: "culture", name: "Bacterial Culture", category: "Microbiology" },
];

const testCategories = Array.from(new Set(availableTests.map(test => test.category)));

const patients = [
  { id: "P001", name: "Max", species: "Canine", breed: "Golden Retriever" },
  { id: "P002", name: "Luna", species: "Feline", breed: "Domestic Shorthair" },
  { id: "P003", name: "Rocky", species: "Canine", breed: "German Shepherd" },
  { id: "P004", name: "Whiskers", species: "Feline", breed: "Persian" },
];

const veterinarians = [
  "Dr. Smith",
  "Dr. Johnson", 
  "Dr. Brown",
  "Dr. Wilson",
  "Dr. Davis",
  "Dr. Thompson",
];

export function LabOrderDialog({ children, prefillData, onLabOrderCreated }: LabOrderDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<LabOrderFormData>({
    resolver: zodResolver(labOrderSchema),
    defaultValues: {
      patientId: prefillData?.patientId || "",
      veterinarian: prefillData?.veterinarian || "",
      priority: "routine",
      tests: [],
      diagnosis: prefillData?.diagnosis || "",
      specialInstructions: "",
    },
  });

  const selectedTests = form.watch("tests");

  const toggleTest = (testId: string) => {
    const currentTests = form.getValues("tests");
    if (currentTests.includes(testId)) {
      form.setValue("tests", currentTests.filter(id => id !== testId));
    } else {
      form.setValue("tests", [...currentTests, testId]);
    }
  };

  const removeTest = (testId: string) => {
    const currentTests = form.getValues("tests");
    form.setValue("tests", currentTests.filter(id => id !== testId));
  };

  const onSubmit = (data: LabOrderFormData) => {
    console.log("Lab order data:", data);
    
    // Generate lab order ID
    const orderId = `LAB${Date.now().toString().slice(-6)}`;
    
    // Get the test names for better display
    const selectedTests = availableTests.filter(test => data.tests.includes(test.id));
    const testNames = selectedTests.map(test => test.name).join(", ");
    
    // Call the callback if provided
    if (onLabOrderCreated) {
      onLabOrderCreated({
        ...data,
        orderId,
        testName: testNames,
      });
    }
    
    toast.success(`Lab order ${orderId} created successfully!`);
    setOpen(false);
    form.reset();
  };

  const selectedPatient = patients.find(p => p.id === form.watch("patientId"));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Lab Order</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            <div className="flex flex-col">
                              <span>{patient.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {patient.species} • {patient.breed}
                              </span>
                            </div>
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
                name="veterinarian"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requesting Veterinarian</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select veterinarian" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {veterinarians.map((vet) => (
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
            </div>

            {selectedPatient && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Patient Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Species: {selectedPatient.species}</div>
                  <div>Breed: {selectedPatient.breed}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="stat">STAT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis/Reason for Testing</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter diagnosis or reason" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tests"
              render={() => (
                <FormItem>
                  <FormLabel>Tests Requested</FormLabel>
                  <div className="space-y-4">
                    {/* Selected tests */}
                    {selectedTests.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Selected Tests:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTests.map((testId) => {
                            const test = availableTests.find(t => t.id === testId);
                            return (
                              <Badge key={testId} variant="default" className="flex items-center gap-1">
                                {test?.name}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => removeTest(testId)}
                                />
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Available tests by category */}
                    {testCategories.map((category) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {availableTests
                            .filter(test => test.category === category)
                            .map((test) => (
                              <div key={test.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={test.id}
                                  checked={selectedTests.includes(test.id)}
                                  onCheckedChange={() => toggleTest(test.id)}
                                />
                                <label
                                  htmlFor={test.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {test.name}
                                </label>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Fasting required, sample handling instructions, etc."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
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
              <Button type="submit">Create Lab Order</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
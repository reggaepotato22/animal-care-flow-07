import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Download, Send, Copy, Check, CheckCircle, Building2, Home, Link, Mail, ExternalLink, AlertTriangle, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import {
  saveLabOrder, generateLabUploadToken, generateLabUploadEmailTemplate,
  type LabOrder, type LabDestination,
} from "@/lib/attachmentStore";

const labOrderSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  veterinarian: z.string().min(1, "Veterinarian is required"),
  priority: z.enum(["routine", "urgent", "stat"]),
  tests: z.array(z.string()).min(1, "At least one test must be selected"),
  diagnosis: z.string().min(1, "Diagnosis/reason is required"),
  specialInstructions: z.string().optional(),
  labDestination: z.enum(["internal", "external"]).default("external"),
  labName: z.string().optional(),
  labEmail: z.string().email().optional().or(z.literal("")),
});

type LabOrderFormData = z.infer<typeof labOrderSchema>;

interface LabOrderDialogProps {
  children?: React.ReactNode;
  patientName?: string;
  prefillData?: {
    patientId?: string;
    veterinarian?: string;
    diagnosis?: string;
  };
  onLabOrderCreated?: (orderData: LabOrderFormData & { orderId: string; testName: string }) => void;
}

const availableTests = [
  // Bloodwork
  { id: "cbc", name: "Complete Blood Count (CBC)", category: "Bloodwork", isCommon: true },
  { id: "chemistry", name: "Chemistry Panel", category: "Bloodwork", isCommon: true },
  { id: "thyroid", name: "Thyroid Panel (T4)", category: "Bloodwork", isCommon: false },
  { id: "felv-fiv", name: "FeLV/FIV Test", category: "Bloodwork", isCommon: true },
  { id: "heartworm", name: "Heartworm Test", category: "Bloodwork", isCommon: true },
  { id: "electrolytes", name: "Electrolyte Panel", category: "Bloodwork", isCommon: false },
  { id: "coagulation", name: "Coagulation Profile", category: "Bloodwork", isCommon: false },
  
  // Urinalysis
  { id: "urinalysis", name: "Complete Urinalysis", category: "Urinalysis", isCommon: true },
  { id: "urine-culture", name: "Urine Culture & Sensitivity", category: "Urinalysis", isCommon: false },
  { id: "urine-protein", name: "Urine Protein/Creatinine Ratio", category: "Urinalysis", isCommon: false },
  
  // Imaging
  { id: "radiographs", name: "Radiographs (X-rays)", category: "Imaging", isCommon: true },
  { id: "ultrasound", name: "Abdominal Ultrasound", category: "Imaging", isCommon: false },
  { id: "echocardiogram", name: "Echocardiogram", category: "Imaging", isCommon: false },
  { id: "ct-scan", name: "CT Scan", category: "Imaging", isCommon: false },
  
  // Pathology
  { id: "cytology", name: "Cytology", category: "Pathology", isCommon: true },
  { id: "biopsy", name: "Histopathology (Biopsy)", category: "Pathology", isCommon: false },
  { id: "fecal", name: "Fecal Parasite Exam", category: "Pathology", isCommon: true },
  { id: "culture", name: "Bacterial Culture & Sensitivity", category: "Pathology", isCommon: false },
  { id: "necropsy", name: "Necropsy", category: "Pathology", isCommon: false },
];

// Get commonly ordered tests
const commonTests = availableTests.filter(test => test.isCommon);

// Define test categories in preferred order
const testCategories = ["Bloodwork", "Urinalysis", "Imaging", "Pathology"];

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

export function LabOrderDialog({ children, patientName, prefillData, onLabOrderCreated }: LabOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "email">("form");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [emailPreview, setEmailPreview] = useState<{ subject: string; html: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState("");

  const form = useForm<LabOrderFormData>({
    resolver: zodResolver(labOrderSchema),
    defaultValues: {
      patientId: prefillData?.patientId || "",
      veterinarian: prefillData?.veterinarian || "",
      priority: "routine",
      tests: [],
      diagnosis: prefillData?.diagnosis || "",
      specialInstructions: "",
      labDestination: "external",
      labName: "",
      labEmail: "",
    },
  });

  const selectedTests = form.watch("tests");
  const labDestination = form.watch("labDestination");

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

  const generatePDFLabRequest = (data: LabOrderFormData) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    
    // Clinic Header
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('Sunshine Veterinary Clinic', pageWidth / 2, 25, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text('123 Main Street, Anytown, ST 12345', pageWidth / 2, 35, { align: 'center' });
    pdf.text('Phone: (555) 123-4567 | Fax: (555) 123-4568', pageWidth / 2, 42, { align: 'center' });
    pdf.text('Email: info@sunshinevetclinic.com', pageWidth / 2, 49, { align: 'center' });
    
    // Add line separator
    pdf.line(20, 55, pageWidth - 20, 55);
    
    // Title
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('EXTERNAL LABORATORY REQUEST FORM', pageWidth / 2, 70, { align: 'center' });
    
    // Order details
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    
    const selectedPatient = patients.find(p => p.id === data.patientId);
    const selectedTests = availableTests.filter(test => data.tests.includes(test.id));
    
    let yPos = 85;
    
    // Patient Information
    pdf.setFont(undefined, 'bold');
    pdf.text('PATIENT INFORMATION:', 20, yPos);
    yPos += 10;
    
    pdf.setFont(undefined, 'normal');
    if (selectedPatient) {
      pdf.text(`Patient Name: ${selectedPatient.name}`, 25, yPos);
      yPos += 7;
      pdf.text(`Species: ${selectedPatient.species}`, 25, yPos);
      yPos += 7;
      pdf.text(`Breed: ${selectedPatient.breed}`, 25, yPos);
      yPos += 7;
    }
    
    yPos += 5;
    
    // Veterinarian Information
    pdf.setFont(undefined, 'bold');
    pdf.text('REQUESTING VETERINARIAN:', 20, yPos);
    yPos += 10;
    
    pdf.setFont(undefined, 'normal');
    pdf.text(`Doctor: ${data.veterinarian}`, 25, yPos);
    yPos += 7;
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 25, yPos);
    yPos += 7;
    pdf.text(`Priority: ${data.priority.toUpperCase()}`, 25, yPos);
    yPos += 10;
    
    // Tests Requested
    pdf.setFont(undefined, 'bold');
    pdf.text('TESTS REQUESTED:', 20, yPos);
    yPos += 10;
    
    pdf.setFont(undefined, 'normal');
    selectedTests.forEach((test) => {
      pdf.text(`☐ ${test.name} (${test.category})`, 25, yPos);
      yPos += 7;
    });
    
    yPos += 5;
    
    // Diagnosis/Reason
    pdf.setFont(undefined, 'bold');
    pdf.text('DIAGNOSIS/REASON FOR TESTING:', 20, yPos);
    yPos += 10;
    
    pdf.setFont(undefined, 'normal');
    const diagnosisLines = pdf.splitTextToSize(data.diagnosis, pageWidth - 50);
    pdf.text(diagnosisLines, 25, yPos);
    yPos += diagnosisLines.length * 7 + 5;
    
    // Special Instructions
    if (data.specialInstructions) {
      pdf.setFont(undefined, 'bold');
      pdf.text('SPECIAL INSTRUCTIONS:', 20, yPos);
      yPos += 10;
      
      pdf.setFont(undefined, 'normal');
      const instructionsLines = pdf.splitTextToSize(data.specialInstructions, pageWidth - 50);
      pdf.text(instructionsLines, 25, yPos);
      yPos += instructionsLines.length * 7 + 10;
    }
    
    // Signature section
    yPos = Math.max(yPos + 20, pageHeight - 80);
    
    pdf.setFont(undefined, 'bold');
    pdf.text('VETERINARIAN SIGNATURE:', 20, yPos);
    yPos += 20;
    
    // Signature line
    pdf.line(20, yPos, 120, yPos);
    yPos += 10;
    pdf.setFont(undefined, 'normal');
    pdf.text(`${data.veterinarian}, DVM`, 20, yPos);
    
    // Date line
    pdf.setFont(undefined, 'bold');
    pdf.text('DATE:', 140, yPos - 20);
    pdf.line(155, yPos - 10, pageWidth - 20, yPos - 10);
    
    // License number
    yPos += 10;
    pdf.text('License #: _______________', 20, yPos);
    
    // Footer
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'italic');
    pdf.text('Please return results to the above clinic. Thank you for your services.', pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    // Generate filename and save
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Lab_Request_${selectedPatient?.name || 'Patient'}_${timestamp}.pdf`;
    
    pdf.save(filename);
    toast.success('PDF lab request generated successfully!');
  };

  const generateCaseId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `VET-${year}-${random}`;
  };

  const onSubmit = (data: LabOrderFormData) => {
    // Generate lab order ID
    const orderId = `LAB${Date.now().toString().slice(-6)}`;
    
    // Get the test names for better display
    const selectedTestItems = availableTests.filter(test => data.tests.includes(test.id));
    const testNames = selectedTestItems.map(test => test.name).join(", ");
    const selectedPatientObj = patients.find(p => p.id === data.patientId);
    const displayPatientName = patientName || selectedPatientObj?.name || "Patient";
    
    // Save lab order to store
    const labOrder: LabOrder = {
      id: orderId,
      patientId: data.patientId,
      patientName: displayPatientName,
      testName: testNames,
      testType: selectedTestItems[0]?.category.toLowerCase() as any || "other",
      orderedBy: data.veterinarian,
      orderedAt: new Date().toISOString(),
      status: "pending",
      urgency: data.priority,
      labName: data.labName || "",
      labDestination: data.labDestination as LabDestination,
      labEmail: data.labEmail || "",
      notes: [data.diagnosis, data.specialInstructions].filter(Boolean).join("\n"),
      species: selectedPatientObj?.species || "Unknown",
      caseId: generateCaseId(),
    };
    saveLabOrder(labOrder);
    
    // Auto-generate PDF
    generatePDFLabRequest(data);
    
    // Generate upload link
    const { token } = generateLabUploadToken(orderId);
    const uploadUrl = `${window.location.origin}/external-upload?token=${token}`;
    setGeneratedUrl(uploadUrl);
    
    // Generate email template
    const emailTemplate = generateLabUploadEmailTemplate(labOrder, uploadUrl, "Veti-Vision Animal Care", data.veterinarian);
    setEmailPreview(emailTemplate);
    setEmailTo(data.labEmail || "");
    
    // Call the callback if provided
    if (onLabOrderCreated) {
      onLabOrderCreated({
        ...data,
        orderId,
        testName: testNames,
      });
    }
    
    // Dispatch notification
    const urgencyPrefix = data.priority === "stat" ? "[STAT] " : data.priority === "urgent" ? "[URGENT] " : "";
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: data.priority === "stat" ? "critical" : data.priority === "urgent" ? "warning" : "info",
        message: `${urgencyPrefix}Lab Request Created: ${testNames} for ${displayPatientName} (${data.labDestination === "internal" ? "Internal" : "External"})`,
        patientId: data.patientId,
        patientName: displayPatientName,
        targetRoles: ["SuperAdmin", "Vet", "Nurse"],
      }
    }));
    
    toast.success(`Lab order ${orderId} created and PDF generated!`);
    
    // Transition to email step
    setStep("email");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    toast.success("Upload link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const openEmailClient = () => {
    if (generatedUrl && emailPreview) {
      const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(emailPreview.subject)}&body=${encodeURIComponent(emailPreview.body)}`;
      window.open(mailtoUrl, "_blank");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep("form");
    setGeneratedUrl("");
    setEmailPreview(null);
    setCopied(false);
    setEmailTo("");
    form.reset();
  };

  const selectedPatient = patients.find(p => p.id === form.watch("patientId"));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Lab Request</DialogTitle>
              <DialogDescription>Fill out the lab request, generate a PDF, and send it via email</DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Lab Destination */}
                <FormField
                  control={form.control}
                  name="labDestination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lab Destination</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange("internal")}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                            field.value === "internal"
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          <Home className={`h-5 w-5 ${field.value === "internal" ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="text-left">
                            <p className="font-medium text-sm">Internal Lab</p>
                            <p className="text-xs text-muted-foreground">In-house laboratory</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("external")}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                            field.value === "external"
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          <Building2 className={`h-5 w-5 ${field.value === "external" ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="text-left">
                            <p className="font-medium text-sm">External Lab</p>
                            <p className="text-xs text-muted-foreground">Third-party laboratory</p>
                          </div>
                        </button>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Lab Name and Email (shown for external) */}
                {labDestination === "external" && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="labName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lab Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., IDEXX, Antech" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="labEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lab Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="lab@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <Separator />

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
                            <SelectItem value="routine"><span className="flex items-center gap-2"><Clock className="h-3 w-3" /> Routine</span></SelectItem>
                            <SelectItem value="urgent"><span className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-orange-500" /> Urgent</span></SelectItem>
                            <SelectItem value="stat"><span className="flex items-center gap-2"><Zap className="h-3 w-3 text-red-500" /> STAT</span></SelectItem>
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
                        <div className="space-y-4">
                          {/* Commonly Ordered Tests */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-primary">Commonly Ordered Tests</h4>
                            <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
                              {commonTests.map((test) => (
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

                          {/* Tests by Category */}
                          {testCategories.map((category) => (
                            <div key={category} className="space-y-2">
                              <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {availableTests
                                  .filter(test => test.category === category)
                                  .map((test) => (
                                    <div key={test.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`cat-${test.id}`}
                                        checked={selectedTests.includes(test.id)}
                                        onCheckedChange={() => toggleTest(test.id)}
                                      />
                                      <label
                                        htmlFor={`cat-${test.id}`}
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
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Lab Request
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          /* Email Step - shown after form submission */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Lab Request Created
              </DialogTitle>
              <DialogDescription>
                PDF generated and upload link ready. Send the link to the lab via email.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Upload Link */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Secure Upload Link</Label>
                <div className="flex gap-2">
                  <Input 
                    value={generatedUrl} 
                    readOnly 
                    className="font-mono text-xs bg-muted"
                  />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">This link expires in 24 hours and can only be used once.</p>
              </div>

              <Separator />

              {/* Email Configuration */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  Email Configuration
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">To</Label>
                    <Input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="recipient@lab.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subject</Label>
                    <Input
                      value={emailPreview?.subject || ""}
                      readOnly
                      className="bg-muted text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Email Preview */}
              {emailPreview && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Preview</Label>
                  <ScrollArea className="h-[250px] border rounded-lg">
                    <div 
                      className="p-3"
                      dangerouslySetInnerHTML={{ __html: emailPreview.html }} 
                    />
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              <Button variant="outline" onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button onClick={openEmailClient} disabled={!emailTo}>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
import { useState, useMemo, useEffect } from "react";
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
import { getPatients } from "@/lib/patientStore";
import { getStaff } from "@/lib/staffStore";

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
    chiefComplaint?: string;
    tentativeFindings?: string[];
    suggestedTests?: string[];
  };
  onLabOrderCreated?: (orderData: LabOrderFormData & { orderId: string; testName: string }) => void;
}

// Map finding text / diagnosis keywords to test IDs
function mapFindingsToTests(findings: string[]): string[] {
  const text = findings.join(" ").toLowerCase();
  const matched: string[] = [];
  const push = (id: string) => { if (!matched.includes(id)) matched.push(id); };
  if (/\bcbc\b|blood count|haematol|hematol/.test(text))             push("cbc");
  if (/chemistry|metabolic|liver|renal|kidney|panel/.test(text))      push("chemistry");
  if (/thyroid|t4|hyperthyroid|hypothyroid/.test(text))               push("thyroid");
  if (/felv|fiv|feline leuk|immunodefic/.test(text))                  push("felv-fiv");
  if (/heartworm|dirofilaria/.test(text))                             push("heartworm");
  if (/electrolyte|sodium|potassium|chloride/.test(text))             push("electrolytes");
  if (/coagulat|clotting|bleeding|prothrombin/.test(text))            push("coagulation");
  if (/urine culture|uti|cystitis/.test(text))                        push("urine-culture");
  if (/urine protein|proteinuria/.test(text))                         push("urine-protein");
  if (/urinalysis|urine|urinary/.test(text))                          push("urinalysis");
  if (/x.?ray|radiograph|chest|skeletal|bone/.test(text))            push("radiographs");
  if (/ultrasound|abdominal scan|echograph/.test(text))               push("ultrasound");
  if (/echocardiogram|cardiac echo|heart scan/.test(text))            push("echocardiogram");
  if (/ct scan|computed tomography/.test(text))                       push("ct-scan");
  if (/cytology|mass|lump|swelling|node/.test(text))                  push("cytology");
  if (/biopsy|histopath|tissue|tumou?r/.test(text))                   push("biopsy");
  if (/fecal|faecal|parasite|worm|giardia|coccidia/.test(text))       push("fecal");
  if (/culture|sensitivity|bacterial|infection/.test(text))           push("culture");
  return matched;
}

// Load patients from both patientStore and legacy acf_known_patients, deduplicated
function loadAllPatients(): Array<{ patientId: string; petName: string; ownerName: string; species?: string; breed?: string }> {
  const seen = new Set<string>();
  const result: Array<{ patientId: string; petName: string; ownerName: string; species?: string; breed?: string }> = [];
  // Primary source: account-scoped patientStore
  try {
    getPatients().forEach(p => {
      const id = p.patientId || p.id;
      if (!id || seen.has(id)) return;
      seen.add(id);
      result.push({ patientId: id, petName: (p as any).name || p.patientId, ownerName: (p as any).owner || "", species: (p as any).species, breed: (p as any).breed });
    });
  } catch {}
  // Fallback: legacy known patients
  try {
    const raw = localStorage.getItem("acf_known_patients");
    const legacy: any[] = raw ? JSON.parse(raw) : [];
    legacy.forEach(p => {
      const id = p.patientId;
      if (!id || seen.has(id)) return;
      seen.add(id);
      result.push({ patientId: id, petName: p.petName || p.name || id, ownerName: p.ownerName || "", species: p.species, breed: p.breed });
    });
  } catch {}
  return result;
}

// Load vets from staffStore, falling back to hardcoded list
function loadVeterinarians(): string[] {
  try {
    const staff = getStaff().filter(s => s.role === "Vet" || s.role === "SuperAdmin");
    if (staff.length > 0) return staff.map(s => s.name);
  } catch {}
  return ["Dr. Smith", "Dr. Johnson", "Dr. Brown", "Dr. Wilson", "Dr. Davis", "Dr. Thompson"];
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


export function LabOrderDialog({ children, patientName, prefillData, onLabOrderCreated }: LabOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "email">("form");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [emailPreview, setEmailPreview] = useState<{ subject: string; html: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState("");

  // Load real patients from both stores
  const patients = useMemo(() => loadAllPatients().map(p => ({
    id: p.patientId,
    name: p.petName,
    species: p.species || "Unknown",
    breed: p.breed || "Unknown",
    ownerName: p.ownerName,
  })), []);

  // Load real vets from staffStore
  const veterinarians = useMemo(() => loadVeterinarians(), []);

  const form = useForm<LabOrderFormData>({
    resolver: zodResolver(labOrderSchema),
    defaultValues: {
      patientId: "",
      veterinarian: "",
      priority: "routine",
      tests: [],
      diagnosis: "",
      specialInstructions: "",
      labDestination: "external",
      labName: "",
      labEmail: "",
    },
  });

  // Re-populate form every time the dialog opens with fresh prefill data
  useEffect(() => {
    if (!open) return;
    const autoTests = [
      ...(prefillData?.suggestedTests ?? []),
      ...mapFindingsToTests(prefillData?.tentativeFindings ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i);
    const diagnosis = prefillData?.diagnosis || prefillData?.chiefComplaint || "";
    form.reset({
      patientId: prefillData?.patientId || "",
      veterinarian: prefillData?.veterinarian || "",
      priority: "routine",
      tests: autoTests,
      diagnosis,
      specialInstructions: "",
      labDestination: "external",
      labName: "",
      labEmail: "",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {selectedPatient.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-semibold truncate">{selectedPatient.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(selectedPatient as any).ownerName ? `${(selectedPatient as any).ownerName} · ` : ""}{selectedPatient.species}{selectedPatient.breed && selectedPatient.breed !== "Unknown" ? ` · ${selectedPatient.breed}` : ""}
                      </p>
                    </div>
                    {prefillData?.tentativeFindings && prefillData.tentativeFindings.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">
                        <AlertTriangle className="h-3 w-3" />
                        {prefillData.tentativeFindings.length} tentative finding{prefillData.tentativeFindings.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <FormLabel className="flex items-center gap-1.5">
                          Diagnosis/Reason for Testing
                          {prefillData?.chiefComplaint && <span className="text-[9px] font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">auto-filled</span>}
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter diagnosis or reason" className="min-h-[60px] resize-none" {...field} />
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
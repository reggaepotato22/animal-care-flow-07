import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar as CalendarIcon, User, Stethoscope, Pill, Download, X, ArrowLeft, Plus, Paperclip, Upload, History, AlertTriangle, Syringe, Scissors, Heart, MoreVertical, Bed, TestTube } from "lucide-react";
import { LabOrderDialog } from "@/components/LabOrderDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EncounterSidebar } from "@/components/EncounterSidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from 'jspdf';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PreviousVisit {
  id: string;
  date: string;
  veterinarian: string;
  complaint: string;
  diagnosis: string;
  treatment: string;
}

interface Surgery {
  id: string;
  date: string;
  procedure: string;
  veterinarian: string;
  outcome: string;
}

interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe";
}

interface CurrentMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  prescribedBy: string;
}

interface Vaccination {
  id: string;
  vaccine: string;
  date: string;
  nextDue: string;
  veterinarian: string;
}

interface MedicalHistory {
  previousVisits: PreviousVisit[];
  surgeries: Surgery[];
  allergies: Allergy[];
  currentMedications: CurrentMedication[];
  vaccinations: Vaccination[];
}

const examinationTemplates = {
  "Wellness Examination": {
    category: "exams",
    subjective: "Annual wellness examination requested by owner. No specific concerns reported.",
    objective: "Physical examination findings:\n- Weight: [weight] kg\n- Temperature: [temp]°F\n- Heart rate: [HR] bpm\n- Respiratory rate: [RR] rpm\n- Body condition score: [BCS]/9\n- General appearance: Alert and responsive\n- Eyes, ears, nose: Normal\n- Oral examination: [findings]\n- Cardiovascular: [findings]\n- Respiratory: [findings]\n- Abdomen: [findings]\n- Musculoskeletal: [findings]\n- Skin and coat: [findings]",
    assessment: "Overall healthy patient. Routine wellness examination completed.",
    plan: "- Continue current diet and exercise routine\n- Maintain current vaccination schedule\n- Annual follow-up recommended\n- Dental cleaning recommended in [timeframe]\n- [Additional recommendations]"
  },
  "Vaccination": {
    category: "exams",
    subjective: "Patient presented for routine vaccination appointment. Owner reports no current health concerns.",
    objective: "Pre-vaccination examination:\n- Temperature: [temp]°F\n- Weight: [weight] kg\n- General appearance: Bright, alert, responsive\n- Physical examination: Normal\n- No contraindications to vaccination identified",
    assessment: "Healthy patient suitable for vaccination.",
    plan: "Vaccinations administered:\n- [Vaccine 1]\n- [Vaccine 2]\n- [Vaccine 3]\n\nPost-vaccination monitoring:\n- Observe for 15 minutes post-vaccination\n- Next vaccination due: [date]\n- Contact clinic if any adverse reactions"
  },
  "Dental Cleaning": {
    category: "exams",
    subjective: "Patient scheduled for dental prophylaxis. Owner reports [halitosis/tartar buildup/dental concerns].",
    objective: "Pre-anesthetic examination:\n- Weight: [weight] kg\n- Physical examination: [findings]\n- Oral examination: [tartar grade], [gingivitis grade]\n- Pre-anesthetic bloodwork: [results]\n- Anesthetic protocol: [medications and doses]",
    assessment: "Grade [X] dental disease. Patient stable for dental procedure under anesthesia.",
    plan: "Dental prophylaxis performed:\n- Supragingival scaling completed\n- Subgingival scaling completed\n- Polishing completed\n- [Number] extractions performed: [teeth]\n- Post-operative care instructions provided\n- Pain management: [medications]\n- Recheck in [timeframe]"
  },
  "Spay/Neuter": {
    category: "exams",
    subjective: "Patient presented for elective spay/neuter procedure.",
    objective: "Pre-surgical examination:\n- Weight: [weight] kg\n- Physical examination: Normal\n- Pre-anesthetic bloodwork: [results]\n- Anesthetic protocol: [medications]\n- Surgical site prepared and draped",
    assessment: "Healthy patient suitable for elective surgery.",
    plan: "Surgical procedure completed:\n- [Ovariohysterectomy/Castration] performed\n- No complications noted\n- Recovery uneventful\n- Post-operative care:\n  - Pain management: [medications]\n  - Activity restriction for 10-14 days\n  - E-collar until suture removal\n  - Suture removal in [date]\n  - Monitor incision site daily"
  },
  "Post-Surgical Follow-up": {
    category: "follow-ups",
    subjective: "Patient returning for post-surgical examination. Owner reports [recovery progress/concerns].",
    objective: "Post-surgical examination:\n- Incision site: [appearance]\n- Swelling: [assessment]\n- Discharge: [present/absent]\n- Pain level: [assessment]\n- Activity level: [assessment]\n- Appetite: [normal/decreased]\n- Weight: [weight] kg",
    assessment: "Post-surgical healing [progressing normally/complications noted].",
    plan: "Continue post-operative care:\n- [Medication adjustments]\n- [Activity modifications]\n- [Next recheck date]\n- [Suture removal if indicated]\n- Owner education reinforced"
  },
  "Recheck Examination": {
    category: "follow-ups",
    subjective: "Patient returning for recheck of [previous condition]. Owner reports [current status/changes].",
    objective: "Follow-up examination:\n- Previous findings: [comparison]\n- Current condition: [assessment]\n- Response to treatment: [evaluation]\n- Vital signs: T=[temp] HR=[rate] RR=[rate]\n- Focused examination: [relevant areas]",
    assessment: "Response to treatment: [improved/stable/declined]. [Condition] showing [progress description].",
    plan: "Treatment plan adjustment:\n- [Continue/modify/discontinue] current medications\n- [Additional diagnostics if needed]\n- [Next follow-up timing]\n- [Home care modifications]"
  },
  "Medication Recheck": {
    category: "follow-ups",
    subjective: "Patient returning to assess response to [medication]. Owner reports [observed effects/side effects].",
    objective: "Medication assessment:\n- Clinical response: [improvement/no change/decline]\n- Side effects: [present/absent]\n- Compliance: [good/poor]\n- Physical examination: [relevant findings]\n- [Laboratory values if applicable]",
    assessment: "Response to [medication]: [assessment]. [Side effects status].",
    plan: "Medication management:\n- [Continue/adjust/change] current dose\n- [Monitor for specific parameters]\n- [Laboratory monitoring if needed]\n- [Next recheck interval]"
  },
  "Skin Condition": {
    category: "common-diagnoses",
    subjective: "Owner reports [itching/scratching/hair loss/skin lesions] for [duration]. [Additional history]",
    objective: "Dermatological examination:\n- Distribution of lesions: [areas affected]\n- Type of lesions: [primary/secondary lesions]\n- Skin scraping: [results]\n- Cytology: [results]\n- Overall skin condition: [findings]",
    assessment: "Clinical signs consistent with [condition]. Differential diagnoses include [list].",
    plan: "Treatment plan:\n- Topical therapy: [medications]\n- Systemic therapy: [medications]\n- Dietary recommendations: [if applicable]\n- Follow-up in [timeframe]\n- Monitor response to treatment\n- [Additional diagnostics if needed]"
  },
  "Digestive Issues": {
    category: "common-diagnoses",
    subjective: "Owner reports [vomiting/diarrhea/appetite changes/weight loss] for [duration]. [Diet history and additional details]",
    objective: "Physical examination:\n- Hydration status: [assessment]\n- Abdominal palpation: [findings]\n- Body condition: [BCS]/9\n- Temperature: [temp]°F\n- Mucous membranes: [color and CRT]",
    assessment: "Clinical signs consistent with [condition]. Rule out [differential diagnoses].",
    plan: "Treatment approach:\n- Dietary management: [recommendations]\n- Medications: [prescribed]\n- Diagnostic testing: [if indicated]\n- Monitoring parameters: [what to watch]\n- Follow-up: [timeframe]\n- Emergency instructions provided"
  },
  "Respiratory Infection": {
    category: "common-diagnoses",
    subjective: "Owner reports [coughing/sneezing/nasal discharge/difficulty breathing] for [duration]. [Exposure history]",
    objective: "Respiratory examination:\n- Respiratory rate: [RR] rpm\n- Respiratory effort: [assessment]\n- Lung auscultation: [findings]\n- Nasal examination: [discharge type/amount]\n- Throat examination: [findings]\n- Temperature: [temp]°F",
    assessment: "Clinical signs consistent with [upper/lower] respiratory tract infection.",
    plan: "Treatment protocol:\n- Antimicrobial therapy: [medications]\n- Supportive care: [humidification/rest]\n- Symptomatic treatment: [cough suppressants/etc]\n- Isolation recommendations: [if applicable]\n- Monitor for: [warning signs]\n- Recheck in [timeframe]"
  },
  "Injury/Trauma": {
    category: "common-diagnoses",
    subjective: "Owner reports [mechanism of injury] occurring [when]. Patient showing [symptoms observed].",
    objective: "Trauma assessment:\n- Primary survey: [ABC assessment]\n- Vital signs: T=[temp] HR=[rate] RR=[rate]\n- Neurological status: [findings]\n- Musculoskeletal examination: [findings]\n- [Affected area] examination: [detailed findings]\n- Pain assessment: [scale/behavior]",
    assessment: "[Injury description] with [severity assessment]. [Complications if any].",
    plan: "Treatment plan:\n- Pain management: [medications and doses]\n- [Surgical/Medical] intervention: [details]\n- Diagnostic imaging: [if performed]\n- Monitoring: [parameters and frequency]\n- Home care instructions: [restrictions/medications]\n- Follow-up: [schedule]"
  }
};

const templateCategories = {
  exams: "Examinations",
  "follow-ups": "Follow-ups", 
  "common-diagnoses": "Common Diagnoses"
};

const getTemplatesByCategory = (searchQuery: string = "") => {
  const filtered = Object.entries(examinationTemplates).filter(([name]) => 
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return Object.keys(templateCategories).reduce((acc, category) => {
    acc[category] = filtered.filter(([, template]) => template.category === category);
    return acc;
  }, {} as Record<string, [string, any][]>);
};

// Mock medical history data
const mockMedicalHistory: MedicalHistory = {
  previousVisits: [
    {
      id: "1",
      date: "2024-01-15",
      veterinarian: "Dr. Smith",
      complaint: "Annual wellness exam",
      diagnosis: "Healthy, minor dental tartar",
      treatment: "Vaccination updates, dental cleaning recommended"
    },
    {
      id: "2", 
      date: "2023-11-20",
      veterinarian: "Dr. Johnson",
      complaint: "Limping on right hind leg",
      diagnosis: "Minor muscle strain",
      treatment: "Rest, anti-inflammatory medication"
    },
    {
      id: "3",
      date: "2023-08-10",
      veterinarian: "Dr. Brown",
      complaint: "Ear infection symptoms",
      diagnosis: "Bacterial otitis externa",
      treatment: "Antibiotic ear drops, follow-up in 2 weeks"
    }
  ],
  surgeries: [
    {
      id: "1",
      date: "2023-03-15",
      procedure: "Spay (Ovariohysterectomy)",
      veterinarian: "Dr. Wilson",
      outcome: "Successful, no complications"
    },
    {
      id: "2",
      date: "2022-09-20",
      procedure: "Dental cleaning with extraction",
      veterinarian: "Dr. Smith",
      outcome: "2 premolars extracted, routine recovery"
    }
  ],
  allergies: [
    {
      id: "1",
      allergen: "Chicken protein",
      reaction: "Skin irritation, itching",
      severity: "moderate"
    },
    {
      id: "2",
      allergen: "Penicillin",
      reaction: "Gastrointestinal upset",
      severity: "mild"
    }
  ],
  currentMedications: [
    {
      id: "1",
      name: "Apoquel 16mg",
      dosage: "1 tablet",
      frequency: "Twice daily",
      startDate: "2024-01-20",
      prescribedBy: "Dr. Smith"
    },
    {
      id: "2",
      name: "Omega-3 supplement",
      dosage: "1 capsule",
      frequency: "Daily with food",
      startDate: "2024-01-15",
      prescribedBy: "Dr. Smith"
    }
  ],
  vaccinations: [
    {
      id: "1",
      vaccine: "DHPP",
      date: "2024-01-15",
      nextDue: "2025-01-15",
      veterinarian: "Dr. Smith"
    },
    {
      id: "2",
      vaccine: "Rabies",
      date: "2024-01-15",
      nextDue: "2027-01-15",
      veterinarian: "Dr. Smith"
    },
    {
      id: "3",
      vaccine: "Bordetella",
      date: "2024-01-15",
      nextDue: "2025-01-15",
      veterinarian: "Dr. Smith"
    }
  ]
};

// Mock patient data for demonstration
const mockPatientData = {
  id: "P001",
  name: "Max",
  species: "Canine",
  breed: "Golden Retriever",
  sex: "Male (Neutered)",
  age: "5 years 3 months",
  weight: "32.5 kg",
  microchipId: "985112345678901",
  owner: {
    name: "Sarah Johnson",
    phone: "(555) 123-4567",
    email: "sarah.johnson@email.com",
    address: "123 Oak Street, Springfield, IL 62701"
  },
  emergencyContact: {
    name: "Mike Johnson",
    phone: "(555) 987-6543",
    relationship: "Spouse"
  }
};

export default function NewRecord() {
  const navigate = useNavigate();
  const location = useLocation();
  const [templateSearch, setTemplateSearch] = useState("");
  
  // Extract pre-filled data from navigation state
  const visitData = location.state as {
    patientId?: string;
    veterinarian?: string;
    visitReason?: string;
    chiefComplaint?: string;
  } | null;
  
  // Patient and veterinarian state
  const [selectedPatient, setSelectedPatient] = useState(visitData?.patientId || "");
  const [selectedVeterinarian, setSelectedVeterinarian] = useState(visitData?.veterinarian || "");
  
  // Form state for SOAP notes
  const [formData, setFormData] = useState({
    subjective: visitData?.chiefComplaint ? `Patient presented for ${visitData.visitReason}. Chief complaint: ${visitData.chiefComplaint}` : "",
    objective: "",
    assessment: "",
    plan: "",
    // Individual vital fields
    temperature: "",
    heartRate: "",
    respiratoryRate: "",
    weight: "",
    bloodPressure: "",
    bodyConditionScore: "",
    otherObservations: "",
    // Assessment fields
    primaryDiagnosis: "",
    differentialDiagnoses: [] as string[],
    clinicalSummary: "[Patient name], a [age]-year-old [species/breed], presents with [symptoms]. Findings suggest [suspected condition], supported by [lab/imaging findings].",
    prognosis: "",
    prognosisReason: "",
    riskFactors: [] as string[],
    notes: ""
  });

  // Medications state
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
  });

  // State for assessment form
  
  // Encounter items state
  const [encounterItems, setEncounterItems] = useState<any[]>([]);
  
  // Add item to encounter when lab order is created
  const handleLabOrderCreated = (orderData: any) => {
    const newItem = {
      id: Date.now().toString(),
      type: "lab",
      title: orderData.testName || "Lab Test",
      status: "pending",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: {
        priority: orderData.priority,
        estimatedTime: orderData.priority === "stat" ? "30 minutes" : orderData.priority === "urgent" ? "1 hour" : "2-3 hours"
      }
    };
    setEncounterItems(prev => [...prev, newItem]);
  };

// Vaccine schedule mapping in days
const vaccineScheduleDays: Record<string, number> = {
  Rabies: 365,
  DHLPP: 365,
  Bordetella: 365,
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const recalcNextDue = (name: string, administeredOn: Date) => {
  const interval = vaccineScheduleDays[name] ?? 365;
  return addDays(administeredOn, interval);
};

// Vaccination state
const [vaccination, setVaccination] = useState({
  vaccineName: "Rabies",
  dateAdministered: new Date(),
  dosage: "",
  lotNumber: "",
  manufacturer: "",
  route: "subcutaneous",
  injectionSite: "",
  administeredBy: "",
  nextDueDate: recalcNextDue("Rabies", new Date()),
  adverseReactions: "",
});

// Attachments state
const [attachments, setAttachments] = useState<File[]>([]);

const [newDifferentialDiagnosis, setNewDifferentialDiagnosis] = useState("");
  const [newRiskFactor, setNewRiskFactor] = useState("");

  const applyTemplate = (templateName: string) => {
    const template = examinationTemplates[templateName as keyof typeof examinationTemplates];
    if (template) {
      setFormData(prev => ({
        ...prev,
        subjective: template.subjective,
        objective: template.objective,
        assessment: template.assessment,
        plan: template.plan
      }));
    }
  };

  const addDifferentialDiagnosis = () => {
    if (newDifferentialDiagnosis.trim()) {
      setFormData(prev => ({
        ...prev,
        differentialDiagnoses: [...prev.differentialDiagnoses, newDifferentialDiagnosis.trim()]
      }));
      setNewDifferentialDiagnosis("");
    }
  };

  const removeDifferentialDiagnosis = (index: number) => {
    setFormData(prev => ({
      ...prev,
      differentialDiagnoses: prev.differentialDiagnoses.filter((_, i) => i !== index)
    }));
  };

  const toggleRiskFactor = (factor: string) => {
    setFormData(prev => ({
      ...prev,
      riskFactors: prev.riskFactors.includes(factor)
        ? prev.riskFactors.filter(f => f !== factor)
        : [...prev.riskFactors, factor]
    }));
  };

  const addCustomRiskFactor = () => {
    if (newRiskFactor.trim()) {
      setFormData(prev => ({
        ...prev,
        riskFactors: [...prev.riskFactors, newRiskFactor.trim()]
      }));
      setNewRiskFactor("");
    }
  };

  const addMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      const medication: Medication = {
        id: Date.now().toString(),
        ...newMedication
      };
      setMedications([...medications, medication]);
      setNewMedication({
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: ""
      });
    }
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const generatePrescriptionPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('VETERINARY PRESCRIPTION', 105, 20, { align: 'center' });
    
    // Clinic info
    doc.setFontSize(12);
    doc.text('VetCare Clinic', 20, 40);
    doc.text('123 Animal Street, Pet City, PC 12345', 20, 50);
    doc.text('Phone: (555) 123-4567', 20, 60);
    
    // Date
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 40);
    
    // Patient info
    doc.setFontSize(14);
    doc.text('Patient Information:', 20, 80);
    doc.setFontSize(12);
    doc.text('Pet Name: [Selected Patient]', 20, 95);
    doc.text('Owner: [Selected Owner]', 20, 105);
    doc.text('Species: [Selected Species]', 20, 115);
    
    // Veterinarian info
    doc.text('Prescribing Veterinarian: [Selected Vet]', 20, 130);
    
    // Medications
    doc.setFontSize(14);
    doc.text('Prescribed Medications:', 20, 150);
    
    let yPosition = 165;
    medications.forEach((med, index) => {
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${med.name}`, 25, yPosition);
      doc.text(`   Dosage: ${med.dosage}`, 25, yPosition + 10);
      doc.text(`   Frequency: ${med.frequency}`, 25, yPosition + 20);
      doc.text(`   Duration: ${med.duration}`, 25, yPosition + 30);
      if (med.instructions) {
        doc.text(`   Instructions: ${med.instructions}`, 25, yPosition + 40);
        yPosition += 60;
      } else {
        yPosition += 50;
      }
    });
    
    // Signature area
    yPosition += 20;
    doc.text('Veterinarian Signature: ________________________', 20, yPosition);
    doc.text('Date: ________________________', 20, yPosition + 15);
    
    // Footer
    doc.setFontSize(10);
    doc.text('This prescription is valid for 6 months from the date of issue.', 20, 280);
    
    // Save the PDF
    doc.save(`prescription-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecord = () => {
    // Here you would typically save the record to your backend
    console.log("Saving record:", { formData, medications, vaccination, attachments });
    navigate("/records");
  };

  const templatesByCategory = getTemplatesByCategory(templateSearch);

  return (
    <div className="relative min-h-screen">
      {/* Main Content Area */}
      <div className="mr-80 space-y-6"> {/* Add right margin for sidebar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/records")}
              className="h-8 w-8 p-0"
            >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">New Clinical Record</h1>
            <p className="text-muted-foreground">Create a comprehensive SOAP note for patient examination</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Bed className="mr-2 h-4 w-4" />
              Hospitalized
            </DropdownMenuItem>
            <LabOrderDialog 
              prefillData={{
                patientId: selectedPatient,
                veterinarian: selectedVeterinarian,
                diagnosis: formData.primaryDiagnosis || formData.assessment
              }}
              onLabOrderCreated={handleLabOrderCreated}
            >
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <TestTube className="mr-2 h-4 w-4" />
                Lab Request
              </DropdownMenuItem>
            </LabOrderDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Patient Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Patient Summary
              </CardTitle>
              <CardDescription>Basic patient information and visit overview</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Patient Photo and Basic Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-veterinary-light rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-veterinary-teal" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{mockPatientData.name}</h3>
                <p className="text-muted-foreground">{mockPatientData.species} • {mockPatientData.breed}</p>
              </div>
            </div>
            
            {/* Patient Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-sm font-medium">Sex</p>
                <p className="text-muted-foreground">{mockPatientData.sex}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Age</p>
                <p className="text-muted-foreground">{mockPatientData.age}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Weight</p>
                <p className="text-muted-foreground">{mockPatientData.weight}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Microchip</p>
                <p className="text-muted-foreground text-xs">{mockPatientData.microchipId}</p>
              </div>
            </div>
            
            {/* Owner Button */}
            <div className="flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {/* Handle owner details view */}}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {mockPatientData.owner.name}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
        {/* Left Panel - Quick Templates and Medical History */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="h-full p-6 space-y-6 overflow-y-auto">
            {/* Quick Templates Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quick Templates
                </CardTitle>
                <CardDescription>
                  Select a template to pre-fill common examination types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search templates..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {Object.entries(templatesByCategory).map(([category, templates]) => (
                    templates.length > 0 && (
                      <div key={category} className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          {templateCategories[category as keyof typeof templateCategories]}
                        </h4>
                        <div className="space-y-1">
                          {templates.map(([templateName]) => (
                            <Button
                              key={templateName}
                              variant="ghost"
                              size="sm"
                              onClick={() => applyTemplate(templateName)}
                              className="w-full justify-start text-left h-auto p-2 whitespace-normal"
                            >
                              {templateName}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Patient Medical History Section */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Patient Medical History
              </CardTitle>
              <CardDescription>
                Review patient's medical history before creating new record
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Medical History Content */}
              <div className="space-y-4">
                {/* Previous Visits */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Previous Visits</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {mockMedicalHistory.previousVisits.map((visit) => (
                      <div key={visit.id} className="p-3 border rounded bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{new Date(visit.date).toLocaleDateString()}</span>
                          <span className="text-sm text-muted-foreground">• {visit.veterinarian}</span>
                        </div>
                        <p className="text-sm font-medium mb-1">{visit.complaint}</p>
                        <p className="text-sm text-muted-foreground">{visit.diagnosis}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Known Allergies</h4>
                  <div className="space-y-2">
                    {mockMedicalHistory.allergies.map((allergy) => (
                      <div key={allergy.id} className="p-3 border rounded bg-muted/20">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-sm font-medium">{allergy.allergen}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              allergy.severity === 'severe' ? 'border-destructive text-destructive' :
                              allergy.severity === 'moderate' ? 'border-warning text-warning' :
                              'border-muted-foreground text-muted-foreground'
                            }`}
                          >
                            {allergy.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{allergy.reaction}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Medications */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Current Medications</h4>
                  <div className="space-y-2">
                    {mockMedicalHistory.currentMedications.map((med) => (
                      <div key={med.id} className="p-3 border rounded bg-muted/20">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{med.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{med.dosage} - {med.frequency}</p>
                        <p className="text-xs text-muted-foreground">Prescribed by {med.prescribedBy} on {new Date(med.startDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - SOAP Notes */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="h-full p-6 overflow-y-auto">
            {/* Main Form */}
            <Tabs defaultValue="soap" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="soap">SOAP Notes</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
              <TabsTrigger value="vaccination">Vaccination</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>

            {/* SOAP Notes Tab */}
            <TabsContent value="soap" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SOAP Notes</CardTitle>
                  <CardDescription>Document the clinical examination using the SOAP format</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient">Patient</Label>
                      <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Max (Golden Retriever) - Sarah Johnson</SelectItem>
                          <SelectItem value="2">Whiskers (Persian Cat) - Mike Wilson</SelectItem>
                          <SelectItem value="3">Bella (Labrador) - Emily Davis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="veterinarian">Veterinarian</Label>
                      <Select value={selectedVeterinarian} onValueChange={setSelectedVeterinarian}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select veterinarian" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dr. Smith">Dr. Smith</SelectItem>
                          <SelectItem value="Dr. Brown">Dr. Brown</SelectItem>
                          <SelectItem value="Dr. Johnson">Dr. Johnson</SelectItem>
                          <SelectItem value="Dr. Wilson">Dr. Wilson</SelectItem>
                          <SelectItem value="Dr. Emergency">Dr. Emergency</SelectItem>
                          <SelectItem value="Dr. Davis">Dr. Davis</SelectItem>
                          <SelectItem value="Dr. Thompson">Dr. Thompson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subjective">Subjective (Chief Complaint)</Label>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Limping/Lameness",
                            "Vomiting",
                            "Diarrhea", 
                            "Not eating",
                            "Lethargy",
                            "Coughing",
                            "Sneezing",
                            "Itching/Scratching",
                            "Weight loss",
                            "Seizures",
                            "Difficulty breathing",
                            "Excessive drinking/urination",
                            "Eye discharge",
                            "Ear infection",
                            "Annual wellness exam",
                            "Vaccination",
                            "Dental cleaning",
                            "Spay/Neuter consult"
                          ].map((preset) => (
                            <Button
                              key={preset}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentValue = formData.subjective;
                                const newValue = currentValue ? `${currentValue}, ${preset}` : preset;
                                setFormData(prev => ({ ...prev, subjective: newValue }));
                              }}
                              className="text-xs h-7"
                            >
                              {preset}
                            </Button>
                          ))}
                        </div>
                        <Textarea 
                          id="subjective"
                          value={formData.subjective}
                          onChange={(e) => setFormData(prev => ({ ...prev, subjective: e.target.value }))}
                          placeholder="What is the owner's concern? What symptoms have they observed?"
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Objective (Physical Examination)</Label>
                      
                      {/* Vital Signs Grid */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-muted-foreground">Vital Signs</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="temperature" className="text-sm">Temperature</Label>
                            <div className="relative">
                              <Input
                                id="temperature"
                                value={formData.temperature}
                                onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                                placeholder="101.5"
                                className="pr-8"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">°F</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="heartRate" className="text-sm">Heart Rate</Label>
                            <div className="relative">
                              <Input
                                id="heartRate"
                                value={formData.heartRate}
                                onChange={(e) => setFormData(prev => ({ ...prev, heartRate: e.target.value }))}
                                placeholder="80"
                                className="pr-12"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">bpm</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="respiratoryRate" className="text-sm">Respiratory Rate</Label>
                            <div className="relative">
                              <Input
                                id="respiratoryRate"
                                value={formData.respiratoryRate}
                                onChange={(e) => setFormData(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                                placeholder="20"
                                className="pr-12"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">rpm</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="weight" className="text-sm">Weight</Label>
                            <div className="relative">
                              <Input
                                id="weight"
                                value={formData.weight}
                                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                                placeholder="25.5"
                                className="pr-8"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">kg</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="bloodPressure" className="text-sm">Blood Pressure</Label>
                            <div className="relative">
                              <Input
                                id="bloodPressure"
                                value={formData.bloodPressure}
                                onChange={(e) => setFormData(prev => ({ ...prev, bloodPressure: e.target.value }))}
                                placeholder="120/80"
                                className="pr-16"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">mmHg</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="bodyConditionScore" className="text-sm">Body Condition Score</Label>
                            <div className="relative">
                              <Input
                                id="bodyConditionScore"
                                value={formData.bodyConditionScore}
                                onChange={(e) => setFormData(prev => ({ ...prev, bodyConditionScore: e.target.value }))}
                                placeholder="5"
                                className="pr-8"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">/9</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Other Observations */}
                      <div className="space-y-2">
                        <Label htmlFor="otherObservations" className="text-sm font-medium text-muted-foreground">Other Observations & Findings</Label>
                        <Textarea 
                          id="otherObservations"
                          value={formData.otherObservations}
                          onChange={(e) => setFormData(prev => ({ ...prev, otherObservations: e.target.value }))}
                          placeholder="Physical examination findings, mucous membrane color, hydration status, lymph nodes, etc..."
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Assessment</h3>
                        
                        {/* Primary Diagnosis */}
                        <div className="space-y-2">
                          <Label htmlFor="primaryDiagnosis" className="text-sm font-medium text-muted-foreground">Primary Diagnosis</Label>
                          <Select onValueChange={(value) => setFormData(prev => ({ ...prev, primaryDiagnosis: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary diagnosis" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="canine-parvovirus">Canine parvovirus infection</SelectItem>
                              <SelectItem value="upper-respiratory">Upper respiratory infection</SelectItem>
                              <SelectItem value="gastroenteritis">Gastroenteritis</SelectItem>
                              <SelectItem value="skin-allergy">Skin allergy</SelectItem>
                              <SelectItem value="dental-disease">Dental disease</SelectItem>
                              <SelectItem value="arthritis">Arthritis</SelectItem>
                              <SelectItem value="urinary-infection">Urinary tract infection</SelectItem>
                              <SelectItem value="ear-infection">Ear infection</SelectItem>
                              <SelectItem value="foreign-body">Foreign body ingestion</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Differential Diagnoses */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Differential Diagnoses</Label>
                          <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/5">
                            {formData.differentialDiagnoses.map((diagnosis, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {diagnosis}
                                <X 
                                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                                  onClick={() => removeDifferentialDiagnosis(index)}
                                />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={newDifferentialDiagnosis}
                              onChange={(e) => setNewDifferentialDiagnosis(e.target.value)}
                              placeholder="Add differential diagnosis"
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDifferentialDiagnosis())}
                            />
                            <Button type="button" onClick={addDifferentialDiagnosis} variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-1" />
                              Add diagnosis
                            </Button>
                          </div>
                        </div>

                        {/* Clinical Summary */}
                        <div className="space-y-2">
                          <Label htmlFor="clinicalSummary" className="text-sm font-medium text-muted-foreground">Clinical Summary / Interpretation</Label>
                          <Textarea
                            id="clinicalSummary"
                            value={formData.clinicalSummary}
                            onChange={(e) => setFormData(prev => ({ ...prev, clinicalSummary: e.target.value }))}
                            className="min-h-[80px]"
                            placeholder="[Patient name], a [age]-year-old [species/breed], presents with [symptoms]. Findings suggest [suspected condition], supported by [lab/imaging findings]."
                          />
                        </div>

                        {/* Prognosis */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Prognosis</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, prognosis: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select prognosis" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="excellent">Excellent</SelectItem>
                                  <SelectItem value="good">Good</SelectItem>
                                  <SelectItem value="fair">Fair</SelectItem>
                                  <SelectItem value="guarded">Guarded</SelectItem>
                                  <SelectItem value="poor">Poor</SelectItem>
                                  <SelectItem value="grave">Grave</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Input
                                value={formData.prognosisReason}
                                onChange={(e) => setFormData(prev => ({ ...prev, prognosisReason: e.target.value }))}
                                placeholder="Reason for prognosis"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Risk Factors / Potential Complications */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Risk Factors / Potential Complications</Label>
                          <div className="space-y-3 p-3 border rounded-md bg-muted/5">
                            <div className="grid grid-cols-2 gap-2">
                              {['Dehydration', 'Organ failure', 'Secondary infection', 'Anesthetic complications', 'Chronic pain', 'Medication side effects'].map((factor) => (
                                <div key={factor} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={factor}
                                    checked={formData.riskFactors.includes(factor)}
                                    onCheckedChange={() => toggleRiskFactor(factor)}
                                  />
                                  <Label htmlFor={factor} className="text-sm">{factor}</Label>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-2 border-t">
                              <Input
                                value={newRiskFactor}
                                onChange={(e) => setNewRiskFactor(e.target.value)}
                                placeholder="Add custom risk factor"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRiskFactor())}
                              />
                              <Button type="button" onClick={addCustomRiskFactor} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Notes / Additional Considerations */}
                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">Notes / Additional Considerations</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="min-h-[80px]"
                            placeholder="Additional clinical notes, special considerations, follow-up recommendations..."
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="plan">Plan (Treatment)</Label>
                      <Textarea 
                        id="plan"
                        value={formData.plan}
                        onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                        placeholder="Treatment plan, medications, follow-up instructions..."
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vitals Tab */}
            <TabsContent value="vitals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Vital Signs & Physical Parameters
                  </CardTitle>
                  <CardDescription>Record detailed vital signs and measurements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vital Signs */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Vital Signs</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="temperature">Temperature (°F)</Label>
                          <Input
                            id="temperature"
                            value={formData.temperature}
                            onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                            placeholder="101.5"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                          <Input
                            id="heartRate"
                            value={formData.heartRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, heartRate: e.target.value }))}
                            placeholder="120"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="respiratoryRate">Respiratory Rate (rpm)</Label>
                          <Input
                            id="respiratoryRate"
                            value={formData.respiratoryRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                            placeholder="20"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            value={formData.weight}
                            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                            placeholder="25.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Parameters */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Additional Parameters</h4>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="bloodPressure">Blood Pressure (mmHg)</Label>
                          <Input
                            id="bloodPressure"
                            value={formData.bloodPressure}
                            onChange={(e) => setFormData(prev => ({ ...prev, bloodPressure: e.target.value }))}
                            placeholder="120/80"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bodyConditionScore">Body Condition Score (/9)</Label>
                          <Select onValueChange={(value) => setFormData(prev => ({ ...prev, bodyConditionScore: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select BCS" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4,5,6,7,8,9].map(score => (
                                <SelectItem key={score} value={score.toString()}>
                                  {score}/9 - {score <= 3 ? 'Underweight' : score <= 6 ? 'Ideal' : 'Overweight'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other Observations */}
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="otherObservations" className="text-sm font-medium text-muted-foreground">Other Observations</Label>
                    <Textarea
                      id="otherObservations"
                      value={formData.otherObservations}
                      onChange={(e) => setFormData(prev => ({ ...prev, otherObservations: e.target.value }))}
                      placeholder="Additional physical examination findings, behavior observations, etc."
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessment Tab */}
            <TabsContent value="assessment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Assessment</CardTitle>
                  <CardDescription>Detailed clinical interpretation and diagnostic assessment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Primary Diagnosis */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryDiagnosis" className="text-sm font-medium text-muted-foreground">Primary Diagnosis</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, primaryDiagnosis: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary diagnosis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="respiratory-infection">Upper Respiratory Infection</SelectItem>
                        <SelectItem value="gastroenteritis">Gastroenteritis</SelectItem>
                        <SelectItem value="dermatitis">Allergic Dermatitis</SelectItem>
                        <SelectItem value="dental-disease">Dental Disease</SelectItem>
                        <SelectItem value="arthritis">Arthritis</SelectItem>
                        <SelectItem value="healthy">Healthy - Routine Examination</SelectItem>
                        <SelectItem value="other">Other (specify in notes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Differential Diagnoses */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Differential Diagnoses</Label>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/5">
                      {formData.differentialDiagnoses.map((diagnosis, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {diagnosis}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeDifferentialDiagnosis(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newDifferentialDiagnosis}
                        onChange={(e) => setNewDifferentialDiagnosis(e.target.value)}
                        placeholder="Add differential diagnosis"
                        onKeyPress={(e) => e.key === 'Enter' && addDifferentialDiagnosis()}
                      />
                      <Button 
                        onClick={addDifferentialDiagnosis}
                        variant="outline"
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Clinical Summary */}
                  <div className="space-y-2">
                    <Label htmlFor="clinicalSummary" className="text-sm font-medium text-muted-foreground">Clinical Summary / Interpretation</Label>
                    <Textarea
                      id="clinicalSummary"
                      value={formData.clinicalSummary}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinicalSummary: e.target.value }))}
                      placeholder="Comprehensive clinical interpretation of findings"
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Prognosis */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Prognosis</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Select onValueChange={(value) => setFormData(prev => ({ ...prev, prognosis: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select prognosis" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="guarded">Guarded</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={formData.prognosisReason}
                          onChange={(e) => setFormData(prev => ({ ...prev, prognosisReason: e.target.value }))}
                          placeholder="Reasoning (optional)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors / Potential Complications */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Risk Factors / Potential Complications</Label>
                    <div className="space-y-3 p-3 border rounded-md bg-muted/5">
                      <div className="grid grid-cols-2 gap-2">
                        {['Dehydration', 'Organ failure', 'Secondary infection', 'Anesthetic complications', 'Chronic pain', 'Medication side effects'].map((factor) => (
                          <div key={factor} className="flex items-center space-x-2">
                            <Checkbox
                              id={factor}
                              checked={formData.riskFactors.includes(factor)}
                              onCheckedChange={() => toggleRiskFactor(factor)}
                            />
                            <Label htmlFor={factor} className="text-sm">{factor}</Label>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Input
                          value={newRiskFactor}
                          onChange={(e) => setNewRiskFactor(e.target.value)}
                          placeholder="Add custom risk factor"
                          onKeyPress={(e) => e.key === 'Enter' && addCustomRiskFactor()}
                        />
                        <Button 
                          onClick={addCustomRiskFactor}
                          variant="outline"
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Additional Considerations */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">Notes / Additional Considerations</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes, follow-up instructions, or special considerations"
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Treatment Plan Tab */}
            <TabsContent value="treatment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Treatment Plan</CardTitle>
                  <CardDescription>Comprehensive treatment strategy and recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Treatment Goals */}
                  <div className="space-y-2">
                    <Label htmlFor="treatmentGoals" className="text-sm font-medium text-muted-foreground">Treatment Goals</Label>
                    <Textarea
                      id="treatmentGoals"
                      placeholder="Primary and secondary treatment objectives..."
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Immediate Treatment */}
                  <div className="space-y-2">
                    <Label htmlFor="immediateTreatment" className="text-sm font-medium text-muted-foreground">Immediate Treatment</Label>
                    <Textarea
                      id="immediateTreatment"
                      placeholder="Emergency care, stabilization measures, immediate interventions..."
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Long-term Management */}
                  <div className="space-y-2">
                    <Label htmlFor="longTermManagement" className="text-sm font-medium text-muted-foreground">Long-term Management</Label>
                    <Textarea
                      id="longTermManagement"
                      placeholder="Ongoing care plan, maintenance therapy, lifestyle modifications..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monitoring Parameters */}
                    <div className="space-y-2">
                      <Label htmlFor="monitoringParameters" className="text-sm font-medium text-muted-foreground">Monitoring Parameters</Label>
                      <Textarea
                        id="monitoringParameters"
                        placeholder="What to monitor, frequency, warning signs..."
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Follow-up Schedule */}
                    <div className="space-y-2">
                      <Label htmlFor="followUpSchedule" className="text-sm font-medium text-muted-foreground">Follow-up Schedule</Label>
                      <Textarea
                        id="followUpSchedule"
                        placeholder="Recheck appointments, timeline, next steps..."
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  {/* Owner Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="ownerInstructions" className="text-sm font-medium text-muted-foreground">Owner Instructions</Label>
                    <Textarea
                      id="ownerInstructions"
                      placeholder="Home care instructions, activity restrictions, when to call..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Expected Outcome */}
                  <div className="space-y-2">
                    <Label htmlFor="expectedOutcome" className="text-sm font-medium text-muted-foreground">Expected Outcome & Prognosis</Label>
                    <Textarea
                      id="expectedOutcome"
                      placeholder="Anticipated response to treatment, timeline for improvement, prognosis..."
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vaccination Tab */}
            <TabsContent value="vaccination" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vaccination</CardTitle>
                  <CardDescription>Capture vaccine administration details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vaccine name</Label>
                      <Select
                        value={vaccination.vaccineName}
                        onValueChange={(value) =>
                          setVaccination((prev) => ({
                            ...prev,
                            vaccineName: value,
                            nextDueDate: recalcNextDue(value, prev.dateAdministered || new Date()),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vaccine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Rabies">Rabies</SelectItem>
                          <SelectItem value="DHLPP">DHLPP</SelectItem>
                          <SelectItem value="Bordetella">Bordetella</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date administered</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "justify-start text-left font-normal",
                              !vaccination.dateAdministered && "text-muted-foreground"
                            )}
                          >
                            {vaccination.dateAdministered ? (
                              format(vaccination.dateAdministered, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={vaccination.dateAdministered ?? undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              setVaccination((prev) => ({
                                ...prev,
                                dateAdministered: date,
                                nextDueDate: recalcNextDue(prev.vaccineName, date),
                              }));
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Dosage & units</Label>
                      <Input
                        value={vaccination.dosage}
                        onChange={(e) =>
                          setVaccination((prev) => ({ ...prev, dosage: e.target.value }))
                        }
                        placeholder="e.g., 1 ml"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Batch/Lot number</Label>
                      <Input
                        value={vaccination.lotNumber}
                        onChange={(e) =>
                          setVaccination((prev) => ({ ...prev, lotNumber: e.target.value }))
                        }
                        placeholder="e.g., ABC12345"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Manufacturer</Label>
                      <Input
                        value={vaccination.manufacturer}
                        onChange={(e) =>
                          setVaccination((prev) => ({ ...prev, manufacturer: e.target.value }))
                        }
                        placeholder="e.g., Manufacturer name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Route</Label>
                      <Select
                        value={vaccination.route}
                        onValueChange={(value) =>
                          setVaccination((prev) => ({ ...prev, route: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select route" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subcutaneous">Subcutaneous</SelectItem>
                          <SelectItem value="intramuscular">Intramuscular</SelectItem>
                          <SelectItem value="oral">Oral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Injection site</Label>
                      <Select
                        value={vaccination.injectionSite}
                        onValueChange={(value) =>
                          setVaccination((prev) => ({ ...prev, injectionSite: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left-front-leg">Left front leg</SelectItem>
                          <SelectItem value="right-front-leg">Right front leg</SelectItem>
                          <SelectItem value="left-hind-leg">Left hind leg</SelectItem>
                          <SelectItem value="right-hind-leg">Right hind leg</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Administered by</Label>
                      <Input
                        value={vaccination.administeredBy}
                        onChange={(e) =>
                          setVaccination((prev) => ({ ...prev, administeredBy: e.target.value }))
                        }
                        placeholder="e.g., Dr. Smith or Technician Jane"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Next due date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "justify-start text-left font-normal",
                              !vaccination.nextDueDate && "text-muted-foreground"
                            )}
                          >
                            {vaccination.nextDueDate ? (
                              format(vaccination.nextDueDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={vaccination.nextDueDate ?? undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              setVaccination((prev) => ({ ...prev, nextDueDate: date }));
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Adverse reactions (optional)</Label>
                    <Textarea
                      value={vaccination.adverseReactions}
                      onChange={(e) =>
                        setVaccination((prev) => ({ ...prev, adverseReactions: e.target.value }))
                      }
                      placeholder="Any reactions observed post-vaccination"
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Medications Tab */}
            <TabsContent value="medications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Medications & Prescriptions
                  </CardTitle>
                  <CardDescription>Manage prescribed medications and generate prescriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Medication */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/5">
                    <div className="space-y-2">
                      <Label htmlFor="medName">Medication Name</Label>
                      <Input
                        id="medName"
                        value={newMedication.name}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Amoxicillin"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="medDosage">Dosage</Label>
                      <Input
                        id="medDosage"
                        value={newMedication.dosage}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                        placeholder="e.g., 250mg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="medFrequency">Frequency</Label>
                      <Input
                        id="medFrequency"
                        value={newMedication.frequency}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                        placeholder="e.g., Twice daily"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="medDuration">Duration</Label>
                      <Input
                        id="medDuration"
                        value={newMedication.duration}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g., 7 days"
                      />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="medInstructions">Special Instructions</Label>
                      <Input
                        id="medInstructions"
                        value={newMedication.instructions}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                        placeholder="e.g., Give with food"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Button onClick={addMedication} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medication
                      </Button>
                    </div>
                  </div>

                  {/* Medications List */}
                  {medications.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold">Prescribed Medications</h4>
                        <Button onClick={generatePrescriptionPDF} variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Generate Prescription PDF
                        </Button>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Medication</TableHead>
                            <TableHead>Dosage</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Instructions</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {medications.map((medication) => (
                            <TableRow key={medication.id}>
                              <TableCell className="font-medium">{medication.name}</TableCell>
                              <TableCell>{medication.dosage}</TableCell>
                              <TableCell>{medication.frequency}</TableCell>
                              <TableCell>{medication.duration}</TableCell>
                              <TableCell>{medication.instructions || "-"}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMedication(medication.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Attachments
                  </CardTitle>
                  <CardDescription>
                    Upload lab results, X-rays, photos, or other diagnostic files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Upload diagnostic files</h3>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports: PDF, JPG, PNG, TIFF, DICOM (Max 10MB per file)
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.tiff,.dcm"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  {/* Uploaded Files List */}
                  {attachments.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Uploaded Files</h4>
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded bg-muted">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File Type Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Lab Results</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Blood chemistry panels</li>
                        <li>• Complete blood counts</li>
                        <li>• Urinalysis reports</li>
                        <li>• Cytology results</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Imaging</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• X-rays (radiographs)</li>
                        <li>• Ultrasound images</li>
                        <li>• CT/MRI scans</li>
                        <li>• DICOM files</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Clinical Photos</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Lesion documentation</li>
                        <li>• Surgical site photos</li>
                        <li>• Dental condition images</li>
                        <li>• Progress photos</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/records")}
                >
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline">
                    Save as Draft
                  </Button>
                  <Button onClick={handleSaveRecord}>
                    Save Record
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      </div> {/* End main content area */}
      
      {/* Right Sidebar */}
      <EncounterSidebar 
        encounterItems={encounterItems}
        onItemClick={(item) => {
          console.log("Clicked item:", item);
          // Handle item click - could open details dialog, etc.
        }}
      />
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, User, Stethoscope, Paperclip, FileText, Pill, Heart, FlaskConical, TestTube, Clock, Image, FileImage, FileScan, Syringe, ChevronDown, ChevronUp, Shield, DollarSign } from "lucide-react";
import { LabOrderDialog } from "@/components/LabOrderDialog";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NOTE_TYPES = [
  { value: "soap", label: "SOAP" },
  { value: "procedure", label: "Procedure" },
  { value: "anesthesia", label: "Anesthesia" },
  { value: "discharge", label: "Discharge" },
  { value: "follow-up", label: "Follow-up" },
  { value: "progress", label: "Progress" },
  { value: "general", label: "General" },
] as const;

type NoteType = typeof NOTE_TYPES[number]["value"];

interface SoapData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  temperature: string;
  heartRate: string;
  respiratoryRate: string;
  weight: string;
  bloodPressure: string;
  bodyConditionScore: string;
  otherObservations: string;
  primaryDiagnosis: string;
  differentialDiagnoses: string[];
  clinicalSummary: string;
  prognosis: string;
  prognosisReason: string;
  riskFactors: string[];
  notes: string;
}

interface ProcedureData {
  surgeonName: string;
  assistants: string[];
  procedureDate: string;
  procedureTime: string;
  noteWrittenDate: string;
  noteWrittenTime: string;
  indication: string;
  preProcedureDiagnosis: string;
  postProcedureDiagnosis: string;
  procedureType: string;
  anesthesiaUsed: string;
  techniques: string;
  positioning: string;
  findings: string;
  estimatedBloodLoss: string;
  materials: string[];
  implants: string[];
  grafts: string[];
  instruments: string[];
  specimens: string[];
  complications: string;
  informedConsent: string;
  risksDiscussed: boolean;
  benefitsDiscussed: boolean;
  alternativesDiscussed: boolean;
  medications: string;
  instructions: string;
  followUp: string;
  disposition: string;
}

interface AnesthesiaData {
  anesthetistName: string;
  supervisingVeterinarian: string;
  anesthesiaDate: string;
  anesthesiaStartTime: string;
  anesthesiaEndTime: string;
  duration: string;
  noteWrittenDate: string;
  noteWrittenTime: string;
  asaStatus: string;
  preAnesthesiaAssessment: string;
  riskFactors: string[];
  allergies: string[];
  currentMedications: string[];
  premedication: string;
  inductionAgent: string;
  inductionDose: string;
  maintenanceAgent: string;
  maintenanceMethod: string;
  reversalAgent: string;
  reversalDose: string;
  airwayType: string;
  airwaySize: string;
  intubationDifficulty: string;
  monitoringEquipment: string[];
  baselineHeartRate: string;
  baselineRespiratoryRate: string;
  baselineBloodPressure: string;
  baselineTemperature: string;
  baselineSpO2: string;
  intraopHeartRate: string;
  intraopRespiratoryRate: string;
  intraopBloodPressure: string;
  intraopTemperature: string;
  intraopSpO2: string;
  fluidsAdministered: string;
  fluidType: string;
  fluidRate: string;
  complications: string;
  adverseEvents: string[];
  recoveryTime: string;
  recoveryQuality: string;
  recoveryMonitoring: string;
  extubationTime: string;
  postAnesthesiaVitalSigns: string;
  postAnesthesiaInstructions: string;
  monitoringRequirements: string;
  followUp: string;
  additionalNotes: string;
}

interface DischargeData {
  dischargingVeterinarian: string;
  patientName: string;
  ownerName: string;
  dischargeDate: string;
  dischargeTime: string;
  admissionDate: string;
  admissionTime: string;
  lengthOfStay: string;
  reasonForVisit: string;
  chiefComplaint: string;
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  treatmentSummary: string;
  proceduresPerformed: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  homeCareInstructions: string;
  activityRestrictions: string;
  dietInstructions: string;
  followUpAppointments: string;
  followUpInstructions: string;
  recheckDate: string;
  warningSigns: string[];
  whenToSeekEmergencyCare: string;
  dischargeCondition: string;
  dischargeStatus: string;
  ownerEducation: string;
  questionsAnswered: boolean;
  instructionsUnderstood: boolean;
  additionalNotes: string;
}

interface FollowUpData {
  veterinarianName: string;
  patientName: string;
  ownerName: string;
  followUpDate: string;
  followUpTime: string;
  originalVisitDate: string;
  daysSinceLastVisit: string;
  visitType: string;
  reasonForFollowUp: string;
  chiefComplaint: string;
  previousDiagnosis: string;
  previousTreatment: string;
  currentStatus: string;
  improvement: string;
  currentSymptoms: string[];
  physicalExamFindings: string;
  vitalSigns: {
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
    weight: string;
    bodyConditionScore: string;
  };
  currentAssessment: string;
  diagnosis: string;
  differentialDiagnoses: string[];
  treatmentPlan: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  recommendations: string;
  activityRestrictions: string;
  dietRecommendations: string;
  nextFollowUpDate: string;
  nextFollowUpInstructions: string;
  followUpInterval: string;
  ownerConcerns: string;
  ownerQuestions: string;
  ownerEducation: string;
  additionalNotes: string;
}

interface ProgressData {
  veterinarianName: string;
  patientName: string;
  ownerName: string;
  progressDate: string;
  progressTime: string;
  admissionDate: string;
  daysSinceAdmission: string;
  visitType: string;
  reasonForNote: string;
  clinicalStatus: string;
  overallProgress: string;
  ownerReport: string;
  patientBehavior: string;
  appetite: string;
  urination: string;
  defecation: string;
  physicalExamFindings: string;
  vitalSigns: {
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
    bloodPressure: string;
    weight: string;
    bodyConditionScore: string;
  };
  diagnosticResults: string;
  labResults: string;
  imagingResults: string;
  assessment: string;
  currentDiagnosis: string;
  progressNotes: string;
  complications: string[];
  plan: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    changes: string;
  }>;
  treatments: string[];
  procedures: string[];
  monitoringPlan: string;
  parametersToWatch: string[];
  dischargeReadiness: string;
  dischargeCriteria: string[];
  estimatedDischargeDate: string;
  ownerCommunication: string;
  ownerUpdates: string;
  additionalNotes: string;
}

interface ClinicalNote {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  createdAt: string;
  author?: string;
  soapData?: SoapData;
  procedureData?: ProcedureData;
  anesthesiaData?: AnesthesiaData;
  dischargeData?: DischargeData;
  followUpData?: FollowUpData;
  progressData?: ProgressData;
}

// Mock data - in a real app this would come from an API
const mockRecord = {
  id: "1",
  patientId: "P-2025-10234",
  patientName: "Sarah Johnson",
  petName: "Max",
  species: "Dog (Golden Retriever)",
  age: "3 years",
  weight: "28 kg",
  date: "2024-01-20",
  veterinarian: "Dr. Smith",
  complaint: "Limping on left front leg",
  diagnosis: "Mild sprain in left forelimb",
  treatment: "Rest, anti-inflammatory medication",
  status: "ongoing" as const,
  attachments: [
    {
      id: "1",
      name: "Left_Forelimb_Lateral.jpg",
      type: "X-rays",
      uploadDate: "2024-01-20",
      size: "2.4 MB"
    },
    {
      id: "2",
      name: "Left_Forelimb_AP.jpg",
      type: "X-rays",
      uploadDate: "2024-01-20",
      size: "2.1 MB"
    },
    {
      id: "3",
      name: "Complete_Blood_Count.pdf",
      type: "Lab Reports",
      uploadDate: "2024-01-20",
      size: "156 KB"
    },
    {
      id: "4",
      name: "Inflammation_Markers.pdf",
      type: "Lab Reports",
      uploadDate: "2024-01-20",
      size: "98 KB"
    },
    {
      id: "5",
      name: "Max_Playing_Before_Injury.jpg",
      type: "Photos",
      uploadDate: "2024-01-19",
      size: "1.8 MB"
    },
    {
      id: "6",
      name: "Affected_Limb_Photo.jpg",
      type: "Photos",
      uploadDate: "2024-01-20",
      size: "2.2 MB"
    }
  ],
  clinicalNotes: [
    {
      id: "note-1",
      type: "soap" as NoteType,
      title: "Initial Examination",
      content: "",
      createdAt: "2024-01-20T10:00:00Z",
      author: "Dr. Smith",
      soapData: {
        subjective: "Owner reports that Max has been limping on his left front leg for the past 2 days. The limping is more pronounced after exercise and seems to improve with rest. No visible wounds or swelling noticed by owner. Max is still eating and drinking normally, with good energy levels overall.",
        objective: "Physical examination reveals mild lameness in left forelimb. Palpation shows slight tenderness in the carpal joint area. No swelling or heat detected. Range of motion is slightly reduced compared to right limb. Temperature: 38.5°C, Heart rate: 90 bpm, Respiratory rate: 24 breaths/min. All other systems appear normal.",
        assessment: "Based on clinical examination and history, diagnosis is mild sprain/strain of the left carpal joint, likely due to overexertion during play or exercise. No evidence of fracture or severe ligament damage.",
        plan: "1. Rest and restricted activity for 7-10 days\n2. Carprofen 25mg twice daily for 5 days (anti-inflammatory)\n3. Cold compress 10-15 minutes twice daily for first 48 hours\n4. Recheck appointment in 1 week\n5. If no improvement or worsening, consider radiographs",
        temperature: "38.5°C",
        heartRate: "90 bpm",
        respiratoryRate: "24 breaths/min",
        weight: "28 kg",
        bloodPressure: "",
        bodyConditionScore: "5/9",
        otherObservations: "Mild lameness, slight tenderness in carpal joint",
        primaryDiagnosis: "Mild sprain/strain of left carpal joint",
        differentialDiagnoses: ["Fracture", "Ligament injury"],
        clinicalSummary: "Max, a 3-year-old Golden Retriever, presents with left forelimb lameness. Findings suggest mild sprain/strain.",
        prognosis: "Good",
        prognosisReason: "Mild injury, no complications expected",
        riskFactors: [],
        notes: ""
      }
    },
    {
      id: "note-2",
      type: "follow-up" as NoteType,
      title: "Follow-up Visit",
      content: "",
      createdAt: "2024-01-27T14:00:00Z",
      author: "Dr. Smith",
      followUpData: {
        veterinarianName: "Dr. Smith",
        patientName: "Max",
        ownerName: "Sarah Johnson",
        followUpDate: "2024-01-27",
        followUpTime: "14:00",
        originalVisitDate: "2024-01-20",
        daysSinceLastVisit: "7",
        visitType: "Recheck",
        reasonForFollowUp: "Post-treatment recheck",
        chiefComplaint: "Limping on left front leg",
        previousDiagnosis: "Mild sprain/strain of left carpal joint",
        previousTreatment: "Rest, Carprofen 25mg BID",
        currentStatus: "Owner reports significant improvement. Max is no longer limping at rest, but slight lameness still noted after exercise.",
        improvement: "Improved",
        currentSymptoms: ["Slight lameness after exercise"],
        physicalExamFindings: "Physical examination shows improved range of motion. No tenderness on palpation. Lameness only evident after exercise.",
        vitalSigns: {
          temperature: "38.3°C",
          heartRate: "88 bpm",
          respiratoryRate: "22 breaths/min",
          weight: "28 kg",
          bodyConditionScore: "5/9"
        },
        currentAssessment: "Significant improvement noted. Patient responding well to treatment.",
        diagnosis: "Healing sprain/strain",
        differentialDiagnoses: [],
        treatmentPlan: "Continue rest for additional 3-5 days. Gradually increase activity. Discontinue Carprofen.",
        medications: [],
        recommendations: "Gradual return to normal activity",
        activityRestrictions: "Continue restricted activity for 3-5 more days",
        dietRecommendations: "Normal diet",
        nextFollowUpDate: "",
        nextFollowUpInstructions: "Return if lameness persists or worsens",
        followUpInterval: "",
        ownerConcerns: "None",
        ownerQuestions: "",
        ownerEducation: "Gradual return to activity discussed",
        additionalNotes: ""
      }
    }
  ] as ClinicalNote[],
  medications: [
    {
      name: "Carprofen",
      dosage: "25mg",
      frequency: "Twice daily",
      duration: "5 days",
      status: "completed",
      startDate: "2024-01-20",
      endDate: "2024-01-25",
      prescribedBy: "Dr. Smith",
      instructions: "Give with food. Monitor for GI upset."
    },
    {
      name: "Gabapentin",
      dosage: "100mg",
      frequency: "Every 8 hours",
      duration: "7 days",
      status: "active",
      startDate: "2024-01-20",
      endDate: "2024-01-27",
      prescribedBy: "Dr. Smith",
      instructions: "May cause mild sedation."
    },
    {
      name: "Rest",
      dosage: "Complete",
      frequency: "Continuous",
      duration: "7-10 days",
      status: "active",
      startDate: "2024-01-20",
      endDate: "2024-01-30",
      prescribedBy: "Dr. Smith",
      instructions: "Leash walks only; no running or jumping."
    }
  ],
  vitals: {
    temperature: "38.5°C",
    heartRate: "90 bpm",
    respiratoryRate: "24 breaths/min",
    weight: "28 kg"
  },
  labRequests: [
    {
      id: "LAB-001",
      orderDate: "2024-01-20",
      tests: ["Complete Blood Count", "Inflammation Markers"],
      priority: "Normal",
      status: "completed",
      results: "Normal values within range"
    },
    {
      id: "LAB-002", 
      orderDate: "2024-01-20",
      tests: ["Joint X-Ray Left Forelimb"],
      priority: "Urgent",
      status: "pending",
      results: null
    }
  ],
  encounterItems: [
    {
      id: "1",
      treatmentCode: "EXAM-001",
      title: "Physical Examination",
      category: "examinations",
      quantity: 1,
      price: 75.00,
      discount: 0,
      total: 75.00,
      status: "completed"
    },
    {
      id: "2",
      treatmentCode: "MED-001",
      title: "Carprofen 25mg",
      category: "medications",
      quantity: 10,
      price: 2.50,
      discount: 0,
      total: 25.00,
      status: "completed"
    },
    {
      id: "3",
      treatmentCode: "LAB-001",
      title: "Complete Blood Count",
      category: "lab-tests",
      quantity: 1,
      price: 45.00,
      discount: 0,
      total: 45.00,
      status: "completed"
    },
    {
      id: "4",
      treatmentCode: "XRAY-001",
      title: "Left Forelimb X-Ray",
      category: "imaging",
      quantity: 2,
      price: 85.00,
      discount: 0,
      total: 170.00,
      status: "pending"
    }
  ] as any[],
  billingNotes: "Patient to follow up in 1 week. Payment received at time of service.",
  vaccinations: [
    {
      id: "vax-1",
      vaccineName: "Rabies",
      dateAdministered: new Date("2024-01-20"),
      dosage: "1 ml",
      lotNumber: "RAB-2024-001",
      manufacturer: "VetVax Inc.",
      route: "subcutaneous",
      injectionSite: "right-hind-leg",
      administeredBy: "Dr. Smith",
      nextDueDate: new Date("2025-01-20"),
      adverseReactions: "None observed"
    },
    {
      id: "vax-2",
      vaccineName: "DHLPP",
      dateAdministered: new Date("2024-01-20"),
      dosage: "1 ml",
      lotNumber: "DHLPP-7782",
      manufacturer: "CanineBio",
      route: "subcutaneous",
      injectionSite: "left-hind-leg",
      administeredBy: "Dr. Smith",
      nextDueDate: new Date("2025-01-20"),
      adverseReactions: "Mild soreness at injection site"
    },
    {
      id: "vax-3",
      vaccineName: "Bordetella",
      dateAdministered: new Date("2023-12-15"),
      dosage: "0.5 ml",
      lotNumber: "BORD-5521",
      manufacturer: "VetShield",
      route: "intranasal",
      injectionSite: "nares",
      administeredBy: "Dr. Johnson",
      nextDueDate: new Date("2024-12-15"),
      adverseReactions: "None observed"
    }
  ]
};

export default function ClinicalRecordDetails() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("soap");
  const [collapsedNotes, setCollapsedNotes] = useState<Set<string>>(new Set());
  const [noteSearch, setNoteSearch] = useState("");
  const [noteSort, setNoteSort] = useState<"newest" | "oldest" | "type" | "author">("newest");
  const [noteTypeFilters, setNoteTypeFilters] = useState<Set<NoteType>>(new Set());
  const [treatmentStatusFilter, setTreatmentStatusFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");
  const [treatmentCategoryFilter, setTreatmentCategoryFilter] = useState<string>("all");
  const [treatmentSort, setTreatmentSort] = useState<"recent" | "category" | "status">("recent");
  const [collapsedVaccinations, setCollapsedVaccinations] = useState<Set<string>>(
    () => new Set(mockRecord.vaccinations.map(v => v.id))
  );

  const toggleNoteCollapse = (noteId: string) => {
    setCollapsedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing": return "bg-warning/10 text-warning border-warning/20";
      case "completed": return "bg-success/10 text-success border-success/20";
      case "follow-up": return "bg-info/10 text-info border-info/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const toggleNoteTypeFilter = (type: NoteType) => {
    setNoteTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleVaccinationCollapse = (vaccinationId: string) => {
    setCollapsedVaccinations(prev => {
      const next = new Set(prev);
      if (next.has(vaccinationId)) {
        next.delete(vaccinationId);
      } else {
        next.add(vaccinationId);
      }
      return next;
    });
  };

  const getNoteTypeAccent = (type: NoteType) => {
    switch (type) {
      case "soap":
        return "border-l-4 border-blue-500";
      case "procedure":
        return "border-l-4 border-purple-500";
      case "anesthesia":
        return "border-l-4 border-indigo-500";
      case "discharge":
        return "border-l-4 border-emerald-500";
      case "follow-up":
        return "border-l-4 border-amber-500";
      case "progress":
        return "border-l-4 border-cyan-500";
      case "general":
        return "border-l-4 border-slate-400";
      default:
        return "border-l-4 border-muted";
    }
  };

  const getNoteSearchText = (note: ClinicalNote) => {
    const parts: string[] = [
      note.title,
      note.author || "",
      note.content || ""
    ];
    if (note.soapData) {
      parts.push(
        note.soapData.subjective,
        note.soapData.objective,
        note.soapData.assessment,
        note.soapData.plan,
        note.soapData.primaryDiagnosis
      );
    }
    if (note.procedureData) {
      parts.push(
        note.procedureData.procedureType,
        note.procedureData.findings,
        note.procedureData.indication
      );
    }
    if (note.anesthesiaData) {
      parts.push(
        note.anesthesiaData.preAnesthesiaAssessment,
        note.anesthesiaData.maintenanceAgent,
        note.anesthesiaData.inductionAgent
      );
    }
    if (note.dischargeData) {
      parts.push(
        note.dischargeData.primaryDiagnosis,
        note.dischargeData.treatmentSummary,
        note.dischargeData.followUpAppointments
      );
    }
    if (note.followUpData) {
      parts.push(
        note.followUpData.currentAssessment,
        note.followUpData.treatmentPlan,
        note.followUpData.previousDiagnosis
      );
    }
    if (note.progressData) {
      parts.push(
        note.progressData.assessment,
        note.progressData.plan,
        note.progressData.overallProgress
      );
    }
    return parts.filter(Boolean).join(" ").toLowerCase();
  };

  const getNoteSummary = (note: ClinicalNote) => {
    if (note.soapData) {
      const diagnosis = note.soapData.primaryDiagnosis || note.soapData.assessment;
      const plan = note.soapData.plan?.split("\n")[0];
      return [diagnosis, plan].filter(Boolean).join(" • ");
    }
    if (note.procedureData) {
      return [note.procedureData.procedureType, note.procedureData.findings].filter(Boolean).join(" • ");
    }
    if (note.anesthesiaData) {
      return [note.anesthesiaData.asaStatus, note.anesthesiaData.maintenanceAgent].filter(Boolean).join(" • ");
    }
    if (note.dischargeData) {
      return [note.dischargeData.primaryDiagnosis, note.dischargeData.followUpAppointments].filter(Boolean).join(" • ");
    }
    if (note.followUpData) {
      return [note.followUpData.improvement, note.followUpData.currentAssessment].filter(Boolean).join(" • ");
    }
    if (note.progressData) {
      return [note.progressData.clinicalStatus, note.progressData.overallProgress].filter(Boolean).join(" • ");
    }
    return note.content?.slice(0, 120) || "";
  };

  const renderNoteContent = (note: ClinicalNote) => {
    if (note.type === "soap" && note.soapData) {
      return (
        <div className="space-y-6">
          <div className="grid gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Subjective</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{note.soapData.subjective || "No subjective information recorded."}</p>
            </div>
            {note.soapData.temperature && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className="text-sm font-medium">{note.soapData.temperature}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Heart Rate</p>
                  <p className="text-sm font-medium">{note.soapData.heartRate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Respiratory Rate</p>
                  <p className="text-sm font-medium">{note.soapData.respiratoryRate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="text-sm font-medium">{note.soapData.weight}</p>
                </div>
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold mb-2">Objective</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{note.soapData.objective || "No objective findings recorded."}</p>
              {note.soapData.otherObservations && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Other Observations:</p>
                  <p className="text-sm text-muted-foreground">{note.soapData.otherObservations}</p>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Assessment</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{note.soapData.assessment || "No assessment recorded."}</p>
              {note.soapData.primaryDiagnosis && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Primary Diagnosis:</p>
                  <p className="text-sm font-medium">{note.soapData.primaryDiagnosis}</p>
                </div>
              )}
              {note.soapData.differentialDiagnoses && note.soapData.differentialDiagnoses.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Differential Diagnoses:</p>
                  <div className="flex flex-wrap gap-1">
                    {note.soapData.differentialDiagnoses.map((dx, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{dx}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Plan</h4>
              <pre className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">{note.soapData.plan || "No plan recorded."}</pre>
            </div>
          </div>
        </div>
      );
    }

    if (note.type === "procedure" && note.procedureData) {
      const pd = note.procedureData;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Surgeon</p>
              <p className="text-sm font-medium">{pd.surgeonName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Procedure Date</p>
              <p className="text-sm font-medium">{pd.procedureDate} {pd.procedureTime}</p>
            </div>
          </div>
          {pd.indication && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Indication</p>
              <p className="text-sm">{pd.indication}</p>
            </div>
          )}
          {pd.procedureType && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Procedure Type</p>
              <p className="text-sm font-medium">{pd.procedureType}</p>
            </div>
          )}
          {pd.findings && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Findings</p>
              <p className="text-sm">{pd.findings}</p>
            </div>
          )}
          {pd.complications && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Complications</p>
              <p className="text-sm">{pd.complications}</p>
            </div>
          )}
          {pd.instructions && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Post-Procedure Instructions</p>
              <p className="text-sm whitespace-pre-wrap">{pd.instructions}</p>
            </div>
          )}
        </div>
      );
    }

    if (note.type === "anesthesia" && note.anesthesiaData) {
      const ad = note.anesthesiaData;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Anesthetist</p>
              <p className="text-sm font-medium">{ad.anesthetistName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date & Time</p>
              <p className="text-sm font-medium">{ad.anesthesiaDate} {ad.anesthesiaStartTime} - {ad.anesthesiaEndTime}</p>
            </div>
          </div>
          {ad.asaStatus && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">ASA Status</p>
              <p className="text-sm font-medium">{ad.asaStatus}</p>
            </div>
          )}
          {ad.preAnesthesiaAssessment && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pre-Anesthesia Assessment</p>
              <p className="text-sm">{ad.preAnesthesiaAssessment}</p>
            </div>
          )}
          {ad.inductionAgent && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Induction</p>
              <p className="text-sm">{ad.inductionAgent} {ad.inductionDose}</p>
            </div>
          )}
          {ad.maintenanceAgent && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Maintenance</p>
              <p className="text-sm">{ad.maintenanceAgent} - {ad.maintenanceMethod}</p>
            </div>
          )}
          {ad.complications && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Complications</p>
              <p className="text-sm">{ad.complications}</p>
            </div>
          )}
          {ad.recoveryQuality && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recovery</p>
              <p className="text-sm">{ad.recoveryQuality} - {ad.recoveryMonitoring}</p>
            </div>
          )}
        </div>
      );
    }

    if (note.type === "discharge" && note.dischargeData) {
      const dd = note.dischargeData;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Discharging Veterinarian</p>
              <p className="text-sm font-medium">{dd.dischargingVeterinarian}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Discharge Date</p>
              <p className="text-sm font-medium">{dd.dischargeDate} {dd.dischargeTime}</p>
            </div>
          </div>
          {dd.primaryDiagnosis && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Primary Diagnosis</p>
              <p className="text-sm font-medium">{dd.primaryDiagnosis}</p>
            </div>
          )}
          {dd.treatmentSummary && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Treatment Summary</p>
              <p className="text-sm whitespace-pre-wrap">{dd.treatmentSummary}</p>
            </div>
          )}
          {dd.medications && dd.medications.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Medications</p>
              <div className="space-y-2">
                {dd.medications.map((med, idx) => (
                  <div key={idx} className="p-2 border rounded">
                    <p className="text-sm font-medium">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.dosage} - {med.frequency} - {med.duration}</p>
                    {med.instructions && <p className="text-xs text-muted-foreground mt-1">{med.instructions}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {dd.homeCareInstructions && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Home Care Instructions</p>
              <p className="text-sm whitespace-pre-wrap">{dd.homeCareInstructions}</p>
            </div>
          )}
          {dd.followUpAppointments && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Follow-up</p>
              <p className="text-sm">{dd.followUpAppointments}</p>
            </div>
          )}
        </div>
      );
    }

    if (note.type === "follow-up" && note.followUpData) {
      const fd = note.followUpData;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Visit Type</p>
              <p className="text-sm font-medium">{fd.visitType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Follow-up Date</p>
              <p className="text-sm font-medium">{fd.followUpDate}</p>
            </div>
          </div>
          {fd.previousDiagnosis && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Previous Diagnosis</p>
              <p className="text-sm">{fd.previousDiagnosis}</p>
            </div>
          )}
          {fd.currentStatus && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Status</p>
              <p className="text-sm">{fd.currentStatus}</p>
            </div>
          )}
          {fd.improvement && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Improvement</p>
              <Badge variant={fd.improvement === "Improved" ? "default" : "secondary"}>{fd.improvement}</Badge>
            </div>
          )}
          {fd.physicalExamFindings && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Physical Exam Findings</p>
              <p className="text-sm whitespace-pre-wrap">{fd.physicalExamFindings}</p>
            </div>
          )}
          {fd.currentAssessment && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assessment</p>
              <p className="text-sm">{fd.currentAssessment}</p>
            </div>
          )}
          {fd.treatmentPlan && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Treatment Plan</p>
              <p className="text-sm whitespace-pre-wrap">{fd.treatmentPlan}</p>
            </div>
          )}
        </div>
      );
    }

    if (note.type === "progress" && note.progressData) {
      const pd = note.progressData;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Visit Type</p>
              <p className="text-sm font-medium">{pd.visitType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Progress Date</p>
              <p className="text-sm font-medium">{pd.progressDate}</p>
            </div>
          </div>
          {pd.clinicalStatus && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Clinical Status</p>
              <Badge variant="secondary">{pd.clinicalStatus}</Badge>
            </div>
          )}
          {pd.overallProgress && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Overall Progress</p>
              <p className="text-sm">{pd.overallProgress}</p>
            </div>
          )}
          {pd.physicalExamFindings && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Physical Exam Findings</p>
              <p className="text-sm whitespace-pre-wrap">{pd.physicalExamFindings}</p>
            </div>
          )}
          {pd.assessment && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assessment</p>
              <p className="text-sm">{pd.assessment}</p>
            </div>
          )}
          {pd.plan && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Plan</p>
              <p className="text-sm whitespace-pre-wrap">{pd.plan}</p>
            </div>
          )}
        </div>
      );
    }

    if (note.type === "general") {
      return (
        <div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content || "No content recorded."}</p>
        </div>
      );
    }

    return null;
  };

  const filteredNotes = mockRecord.clinicalNotes
    .filter(note => noteTypeFilters.size === 0 || noteTypeFilters.has(note.type))
    .filter(note => {
      const query = noteSearch.trim().toLowerCase();
      if (!query) return true;
      return getNoteSearchText(note).includes(query);
    })
    .sort((a, b) => {
      if (noteSort === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (noteSort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (noteSort === "type") {
        return a.type.localeCompare(b.type);
      }
      if (noteSort === "author") {
        return (a.author || "").localeCompare(b.author || "");
      }
      return 0;
    });

  const treatmentItems = mockRecord.encounterItems || [];
  const filteredTreatments = treatmentItems
    .filter(item => treatmentStatusFilter === "all" || item.status === treatmentStatusFilter)
    .filter(item => treatmentCategoryFilter === "all" || item.category === treatmentCategoryFilter)
    .sort((a, b) => {
      if (treatmentSort === "category") {
        return a.category.localeCompare(b.category);
      }
      if (treatmentSort === "status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  const treatmentCategories = Array.from(new Set(treatmentItems.map(item => item.category)));
  const treatmentStats = {
    total: treatmentItems.length,
    completed: treatmentItems.filter(item => item.status === "completed").length,
    pending: treatmentItems.filter(item => item.status === "pending").length,
    cancelled: treatmentItems.filter(item => item.status === "cancelled").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/records")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Records
        </Button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{mockRecord.petName} - Clinical Record</h1>
          <p className="text-muted-foreground flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {mockRecord.patientName}
            </span>
            <span>{mockRecord.species}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(mockRecord.date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Stethoscope className="h-4 w-4" />
              {mockRecord.veterinarian}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LabOrderDialog 
            prefillData={{
              patientId: mockRecord.id,
              veterinarian: mockRecord.veterinarian,
              diagnosis: mockRecord.diagnosis
            }}
          >
            <Button variant="default" size="sm" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Lab Request
            </Button>
          </LabOrderDialog>
          
          <Badge className={getStatusColor(mockRecord.status)}>
            {mockRecord.status}
          </Badge>
        </div>
      </div>

      {/* Patient Summary Card */}
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
          <div className="mb-4 pb-4 border-b">
            <p className="text-sm font-medium">Patient ID</p>
            <p className="text-lg font-mono font-semibold text-primary">{mockRecord.patientId}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Age</p>
              <p className="text-muted-foreground">{mockRecord.age}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Weight</p>
              <p className="text-muted-foreground">{mockRecord.weight}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Chief Complaint</p>
              <p className="text-muted-foreground">{mockRecord.complaint}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Diagnosis</p>
              <p className="text-muted-foreground">{mockRecord.diagnosis}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="soap">Clinical Notes</TabsTrigger>
          <TabsTrigger value="treatment">Treatments</TabsTrigger>
          <TabsTrigger value="vaccination">Vaccination</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="labs">Lab Requests</TabsTrigger>
          <TabsTrigger value="summary">Summary & Billing</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        {/* Clinical Notes Tab */}
        <TabsContent value="soap" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Clinical Notes
              </CardTitle>
              <CardDescription>
                SOAP notes, procedure notes, anesthesia records, discharge instructions, and other clinical notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={noteSearch}
                      onChange={(e) => setNoteSearch(e.target.value)}
                      placeholder="Search notes, diagnosis, plan, or author..."
                      className="max-w-md"
                    />
                    <Select value={noteSort} onValueChange={(value) => setNoteSort(value as typeof noteSort)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCollapsedNotes(new Set(filteredNotes.map(n => n.id)))}
                    >
                      Collapse all
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCollapsedNotes(new Set())}
                    >
                      Expand all
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {NOTE_TYPES.map((type) => {
                    const isActive = noteTypeFilters.has(type.value);
                    return (
                      <Button
                        key={type.value}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleNoteTypeFilter(type.value)}
                      >
                        {type.label}
                      </Button>
                    );
                  })}
                  {noteTypeFilters.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNoteTypeFilters(new Set())}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>

              {filteredNotes.length > 0 ? (
                <div className="space-y-3">
                  {filteredNotes.map((note) => {
                    const isCollapsed = collapsedNotes.has(note.id);
                    return (
                      <Card key={note.id} className={cn("border", getNoteTypeAccent(note.type))}>
                        <CardHeader 
                          className={cn(
                            "pb-2 cursor-pointer hover:bg-muted/50 transition-colors",
                            isCollapsed && "border-b"
                          )}
                          onClick={() => toggleNoteCollapse(note.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                {isCollapsed ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform flex-shrink-0" />
                                ) : (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform flex-shrink-0" />
                                )}
                                <Badge variant="secondary">
                                  {NOTE_TYPES.find((t) => t.value === note.type)?.label ?? note.type}
                                </Badge>
                                <span className="text-sm font-medium">{note.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Added by {note.author || "Unknown"} on {format(new Date(note.createdAt), "PPp")}
                              </p>
                              {isCollapsed && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {getNoteSummary(note) || "No summary available."}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {!isCollapsed && (
                          <CardContent className="pt-4">
                            {renderNoteContent(note)}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No clinical notes recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatment" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5" />
                Treatments
              </CardTitle>
              <CardDescription>Services and procedures performed during this encounter</CardDescription>
            </CardHeader>
            <CardContent>
              {treatmentItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">{treatmentStats.total}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-lg font-semibold">{treatmentStats.completed}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-lg font-semibold">{treatmentStats.pending}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Cancelled</p>
                      <p className="text-lg font-semibold">{treatmentStats.cancelled}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Select value={treatmentStatusFilter} onValueChange={(value) => setTreatmentStatusFilter(value as any)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={treatmentCategoryFilter} onValueChange={setTreatmentCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {treatmentCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Select value={treatmentSort} onValueChange={(value) => setTreatmentSort(value as any)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Recent</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredTreatments.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Code</TableHead>
                            <TableHead>Treatment/Service</TableHead>
                            <TableHead className="w-[150px]">Category</TableHead>
                            <TableHead className="w-[80px] text-center">Qty</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTreatments.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono text-xs">{item.treatmentCode}</TableCell>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell>
                                <Badge
                                  className={`text-xs ${
                                    item.status === "completed"
                                      ? "bg-success/10 text-success border-success/20"
                                      : item.status === "pending"
                                      ? "bg-warning/10 text-warning border-warning/20"
                                      : "bg-muted/10 text-muted-foreground border-muted/20"
                                  }`}
                                >
                                  {item.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No treatments match the selected filters.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No treatments recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vaccination Tab */}
        <TabsContent value="vaccination" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Vaccination
              </CardTitle>
              <CardDescription>Vaccine administration details</CardDescription>
            </CardHeader>
            <CardContent>
              {mockRecord.vaccinations.length > 0 ? (
                <div className="space-y-6">
                  {mockRecord.vaccinations.map((vaccination) => {
                    const isCollapsed = collapsedVaccinations.has(vaccination.id);
                    return (
                      <div key={vaccination.id} className="border rounded-lg">
                        <div
                          className={cn(
                            "flex items-start justify-between gap-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                            isCollapsed && "border-b"
                          )}
                          onClick={() => toggleVaccinationCollapse(vaccination.id)}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {isCollapsed ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <p className="text-sm font-medium">{vaccination.vaccineName}</p>
                              <Badge variant="outline" className="text-xs">
                                Next due {format(vaccination.nextDueDate, "PPP")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Administered {format(vaccination.dateAdministered, "PPP")} • {vaccination.administeredBy}
                            </p>
                            {isCollapsed && (
                              <p className="text-xs text-muted-foreground">
                                {vaccination.dosage} • {vaccination.route} • {vaccination.injectionSite.replace(/-/g, " ")}
                              </p>
                            )}
                          </div>
                        </div>
                        {!isCollapsed && (
                          <div className="p-4 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Dosage</p>
                                  <p className="text-sm font-medium">{vaccination.dosage}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Batch/Lot Number</p>
                                  <p className="text-sm font-medium">{vaccination.lotNumber}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Manufacturer</p>
                                  <p className="text-sm font-medium">{vaccination.manufacturer}</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Route</p>
                                  <p className="text-sm font-medium capitalize">{vaccination.route}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Injection Site</p>
                                  <p className="text-sm font-medium capitalize">
                                    {vaccination.injectionSite.replace(/-/g, " ")}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Administered By</p>
                                  <p className="text-sm font-medium">{vaccination.administeredBy}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Adverse Reactions</p>
                                  <p className="text-sm font-medium">{vaccination.adverseReactions || "None reported"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No vaccinations recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medications & Treatment
              </CardTitle>
              <CardDescription>Current medications and treatment instructions</CardDescription>
            </CardHeader>
            <CardContent>
              {mockRecord.medications.length > 0 ? (
                <div className="space-y-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medication</TableHead>
                          <TableHead className="w-[140px]">Dosage</TableHead>
                          <TableHead className="w-[140px]">Frequency</TableHead>
                          <TableHead className="w-[120px]">Duration</TableHead>
                          <TableHead className="w-[110px]">Status</TableHead>
                          <TableHead className="w-[160px]">Prescriber</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockRecord.medications.map((med, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div className="space-y-1">
                                <span>{med.name}</span>
                                {med.instructions && (
                                  <p className="text-xs text-muted-foreground">{med.instructions}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{med.dosage}</TableCell>
                            <TableCell>{med.frequency}</TableCell>
                            <TableCell>{med.duration}</TableCell>
                            <TableCell>
                              <Badge
                                className={`text-xs ${
                                  med.status === "active"
                                    ? "bg-success/10 text-success border-success/20"
                                    : med.status === "completed"
                                    ? "bg-muted/10 text-muted-foreground border-muted/20"
                                    : "bg-warning/10 text-warning border-warning/20"
                                }`}
                              >
                                {med.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{med.prescribedBy || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Active Medications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {mockRecord.medications.filter(m => m.status === "active").map((med, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{med.name}</span>
                              <Badge variant="outline" className="text-xs">{med.duration}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Completed Medications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {mockRecord.medications.filter(m => m.status === "completed").map((med, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{med.name}</span>
                              <Badge variant="outline" className="text-xs">{med.duration}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No medications recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lab Requests Tab */}
        <TabsContent value="labs" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Lab Requests & Reports
              </CardTitle>
              <CardDescription>Laboratory tests and diagnostic reports requested during this encounter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecord.labRequests.map((labRequest) => (
                  <div key={labRequest.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{labRequest.id}</span>
                        <Badge 
                          variant={labRequest.priority === "Urgent" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {labRequest.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(labRequest.orderDate).toLocaleDateString()}
                        </span>
                        <Badge 
                          className={`text-xs ${
                            labRequest.status === "completed" 
                              ? "bg-success/10 text-success border-success/20"
                              : labRequest.status === "pending"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-muted/10 text-muted-foreground border-muted/20"
                          }`}
                        >
                          {labRequest.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Tests Ordered:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {labRequest.tests.map((test, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {test}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {labRequest.results && (
                        <div>
                          <p className="text-sm font-medium">Results:</p>
                          <p className="text-sm text-muted-foreground mt-1">{labRequest.results}</p>
                        </div>
                      )}
                      
                      {labRequest.status === "pending" && (
                        <div className="pt-2">
                          <p className="text-sm text-muted-foreground italic">Results pending...</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary & Billing Tab */}
        <TabsContent value="summary" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Encounter Summary & Billing
              </CardTitle>
              <CardDescription>
                Complete overview of all treatments, procedures, and charges for this encounter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockRecord.encounterItems && mockRecord.encounterItems.length > 0 ? (
                <div className="space-y-4">
                  {/* Encounter Items Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Code</TableHead>
                          <TableHead className="w-[250px]">Treatment/Service</TableHead>
                          <TableHead className="w-[150px]">Category</TableHead>
                          <TableHead className="w-[80px] text-center">Qty</TableHead>
                          <TableHead className="w-[100px] text-right">Unit Price</TableHead>
                          <TableHead className="w-[100px] text-right">Total</TableHead>
                          <TableHead className="w-[120px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockRecord.encounterItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">{item.treatmentCode}</TableCell>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{item.price.toFixed(2)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                <span className="font-semibold">{item.total.toFixed(2)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={`text-xs ${
                                  item.status === "completed" 
                                    ? "bg-success/10 text-success border-success/20"
                                    : item.status === "pending"
                                    ? "bg-warning/10 text-warning border-warning/20"
                                    : "bg-muted/10 text-muted-foreground border-muted/20"
                                }`}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Totals Row */}
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell colSpan={5} className="text-right">Subtotal:</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{mockRecord.encounterItems.reduce((sum: number, item: any) => sum + item.total, 0).toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={5} className="text-right font-medium">Tax (0%):</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">0.00</span>
                            </div>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow className="bg-primary/10 font-bold text-lg">
                          <TableCell colSpan={5} className="text-right">Total:</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{mockRecord.encounterItems.reduce((sum: number, item: any) => sum + item.total, 0).toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Billing Notes */}
                  {mockRecord.billingNotes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Billing Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{mockRecord.billingNotes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Treatments Added</p>
                  <p className="text-sm">
                    No treatments or services have been added to this encounter.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments & Documents
              </CardTitle>
              <CardDescription>Related files, images, and diagnostic results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  mockRecord.attachments.reduce((acc, attachment) => {
                    if (!acc[attachment.type]) {
                      acc[attachment.type] = [];
                    }
                    acc[attachment.type].push(attachment);
                    return acc;
                  }, {} as Record<string, typeof mockRecord.attachments>)
                ).map(([type, files]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      {type === "X-rays" && <FileScan className="h-4 w-4 text-primary" />}
                      {type === "Lab Reports" && <FileText className="h-4 w-4 text-primary" />}
                      {type === "Photos" && <Image className="h-4 w-4 text-primary" />}
                      <h3 className="font-semibold text-sm">{type}</h3>
                      <Badge variant="secondary" className="text-xs">{files.length}</Badge>
                    </div>
                    <div className="space-y-2 pl-6">
                      {files.map((file) => (
                        <div 
                          key={file.id} 
                          className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          {type === "X-rays" && <FileImage className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                          {type === "Lab Reports" && <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                          {type === "Photos" && <Image className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(file.uploadDate).toLocaleDateString()} • {file.size}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" className="text-xs">View</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

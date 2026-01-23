import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar as CalendarIcon, User, Pill, Download, X, ArrowLeft, Plus, Paperclip, Upload, History, AlertTriangle, Syringe, Heart, MoreVertical, Bed, TestTube, ChevronLeft, ChevronRight, DollarSign, Trash2, ChevronDown } from "lucide-react";
import { LabOrderDialog } from "@/components/LabOrderDialog";
import { AdmissionRequestDialog } from "@/components/AdmissionRequestDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EncounterSidebar } from "@/components/EncounterSidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { TreatmentSelector, EncounterItem } from "@/components/TreatmentSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from 'jspdf';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  // Patient & Provider Info
  surgeonName: string;
  assistants: string[];
  // Date & Time
  procedureDate: string;
  procedureTime: string;
  noteWrittenDate: string;
  noteWrittenTime: string;
  // Diagnosis
  indication: string;
  preProcedureDiagnosis: string;
  postProcedureDiagnosis: string;
  // Procedure Details
  procedureType: string;
  anesthesiaUsed: string;
  techniques: string;
  positioning: string;
  findings: string;
  estimatedBloodLoss: string;
  // Materials
  materials: string[];
  implants: string[];
  grafts: string[];
  instruments: string[];
  // Specimens
  specimens: string[];
  // Complications
  complications: string;
  // Informed Consent
  informedConsent: string;
  risksDiscussed: boolean;
  benefitsDiscussed: boolean;
  alternativesDiscussed: boolean;
  // Post-Procedure Plan
  medications: string;
  instructions: string;
  followUp: string;
  disposition: string;
}

interface AnesthesiaData {
  // Anesthetist & Provider Info
  anesthetistName: string;
  supervisingVeterinarian: string;
  // Date & Time
  anesthesiaDate: string;
  anesthesiaStartTime: string;
  anesthesiaEndTime: string;
  duration: string;
  noteWrittenDate: string;
  noteWrittenTime: string;
  // Pre-Anesthesia Assessment
  asaStatus: string; // ASA Physical Status Classification
  preAnesthesiaAssessment: string;
  riskFactors: string[];
  allergies: string[];
  currentMedications: string[];
  // Anesthesia Protocol
  premedication: string;
  inductionAgent: string;
  inductionDose: string;
  maintenanceAgent: string;
  maintenanceMethod: string; // e.g., "Isoflurane via endotracheal tube"
  reversalAgent: string;
  reversalDose: string;
  // Airway Management
  airwayType: string; // e.g., "Endotracheal tube", "Laryngeal mask", "Face mask"
  airwaySize: string;
  intubationDifficulty: string;
  // Monitoring
  monitoringEquipment: string[];
  // Vital Signs (Baseline)
  baselineHeartRate: string;
  baselineRespiratoryRate: string;
  baselineBloodPressure: string;
  baselineTemperature: string;
  baselineSpO2: string;
  // Vital Signs (During Procedure)
  intraopHeartRate: string;
  intraopRespiratoryRate: string;
  intraopBloodPressure: string;
  intraopTemperature: string;
  intraopSpO2: string;
  // Fluid Management
  fluidsAdministered: string;
  fluidType: string;
  fluidRate: string;
  // Complications & Adverse Events
  complications: string;
  adverseEvents: string[];
  // Recovery
  recoveryTime: string;
  recoveryQuality: string; // e.g., "Smooth", "Prolonged", "Agitated"
  recoveryMonitoring: string;
  extubationTime: string;
  postAnesthesiaVitalSigns: string;
  // Post-Anesthesia Plan
  postAnesthesiaInstructions: string;
  monitoringRequirements: string;
  followUp: string;
  // Notes
  additionalNotes: string;
}

interface DischargeData {
  // Provider & Patient Info
  dischargingVeterinarian: string;
  patientName: string;
  ownerName: string;
  // Date & Time
  dischargeDate: string;
  dischargeTime: string;
  admissionDate: string;
  admissionTime: string;
  lengthOfStay: string;
  // Visit/Admission Information
  reasonForVisit: string;
  chiefComplaint: string;
  // Diagnosis
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  // Treatment Summary
  treatmentSummary: string;
  proceduresPerformed: string[];
  // Medications Prescribed
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  // Instructions for Owner
  homeCareInstructions: string;
  activityRestrictions: string;
  dietInstructions: string;
  // Follow-up Care
  followUpAppointments: string;
  followUpInstructions: string;
  recheckDate: string;
  // Warning Signs
  warningSigns: string[];
  whenToSeekEmergencyCare: string;
  // Discharge Condition
  dischargeCondition: string; // e.g., "Stable", "Improved", "Guarded"
  dischargeStatus: string; // e.g., "Discharged to owner", "Transferred", etc.
  // Owner Education
  ownerEducation: string;
  questionsAnswered: boolean;
  instructionsUnderstood: boolean;
  // Additional Information
  additionalNotes: string;
}

interface FollowUpData {
  // Provider & Patient Info
  veterinarianName: string;
  patientName: string;
  ownerName: string;
  // Date & Time
  followUpDate: string;
  followUpTime: string;
  originalVisitDate: string;
  daysSinceLastVisit: string;
  // Visit Information
  visitType: string; // e.g., "Recheck", "Progress check", "Post-operative", "Routine follow-up"
  reasonForFollowUp: string;
  chiefComplaint: string;
  // Previous Visit Summary
  previousDiagnosis: string;
  previousTreatment: string;
  // Current Assessment
  currentStatus: string;
  improvement: string; // e.g., "Improved", "No change", "Worse", "Resolved"
  currentSymptoms: string[];
  // Physical Examination
  physicalExamFindings: string;
  vitalSigns: {
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
    weight: string;
    bodyConditionScore: string;
  };
  // Assessment
  currentAssessment: string;
  diagnosis: string;
  differentialDiagnoses: string[];
  // Treatment Plan
  treatmentPlan: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  // Recommendations
  recommendations: string;
  activityRestrictions: string;
  dietRecommendations: string;
  // Follow-up Plan
  nextFollowUpDate: string;
  nextFollowUpInstructions: string;
  followUpInterval: string;
  // Owner Communication
  ownerConcerns: string;
  ownerQuestions: string;
  ownerEducation: string;
  // Additional Notes
  additionalNotes: string;
}

interface ProgressData {
  // Provider & Patient Info
  veterinarianName: string;
  patientName: string;
  ownerName: string;
  // Date & Time
  progressDate: string;
  progressTime: string;
  admissionDate: string;
  daysSinceAdmission: string;
  // Visit Information
  visitType: string; // e.g., "Daily progress", "Post-operative day X", "Hospitalization day X"
  reasonForNote: string;
  // Clinical Status
  clinicalStatus: string; // e.g., "Stable", "Improving", "Deteriorating", "Critical"
  overallProgress: string; // e.g., "Significant improvement", "No change", "Worsening"
  // Subjective
  ownerReport: string;
  patientBehavior: string;
  appetite: string;
  urination: string;
  defecation: string;
  // Objective
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
  // Assessment
  assessment: string;
  currentDiagnosis: string;
  progressNotes: string;
  complications: string[];
  // Plan
  plan: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    changes: string; // e.g., "Increased", "Decreased", "Discontinued", "New"
  }>;
  treatments: string[];
  procedures: string[];
  // Monitoring
  monitoringPlan: string;
  parametersToWatch: string[];
  // Discharge Planning
  dischargeReadiness: string; // e.g., "Ready", "Not ready", "Pending"
  dischargeCriteria: string[];
  estimatedDischargeDate: string;
  // Communication
  ownerCommunication: string;
  ownerUpdates: string;
  // Additional Notes
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

const examinationTemplates: Record<string, {
  noteType: NoteType;
  category: string;
  [key: string]: any;
}> = {
  // SOAP Note Templates
  "Wellness Examination": {
    noteType: "soap",
    category: "exams",
    subjective: "Annual wellness examination requested by owner. No specific concerns reported.",
    objective: "Physical examination findings:\n- Weight: [weight] kg\n- Temperature: [temp]°F\n- Heart rate: [HR] bpm\n- Respiratory rate: [RR] rpm\n- Body condition score: [BCS]/9\n- General appearance: Alert and responsive\n- Eyes, ears, nose: Normal\n- Oral examination: [findings]\n- Cardiovascular: [findings]\n- Respiratory: [findings]\n- Abdomen: [findings]\n- Musculoskeletal: [findings]\n- Skin and coat: [findings]",
    assessment: "Overall healthy patient. Routine wellness examination completed.",
    plan: "- Continue current diet and exercise routine\n- Maintain current vaccination schedule\n- Annual follow-up recommended\n- Dental cleaning recommended in [timeframe]\n- [Additional recommendations]"
  },
  "Vaccination": {
    noteType: "soap",
    category: "exams",
    subjective: "Patient presented for routine vaccination appointment. Owner reports no current health concerns.",
    objective: "Pre-vaccination examination:\n- Temperature: [temp]°F\n- Weight: [weight] kg\n- General appearance: Bright, alert, responsive\n- Physical examination: Normal\n- No contraindications to vaccination identified",
    assessment: "Healthy patient suitable for vaccination.",
    plan: "Vaccinations administered:\n- [Vaccine 1]\n- [Vaccine 2]\n- [Vaccine 3]\n\nPost-vaccination monitoring:\n- Observe for 15 minutes post-vaccination\n- Next vaccination due: [date]\n- Contact clinic if any adverse reactions"
  },
  "Dental Cleaning": {
    noteType: "soap",
    category: "exams",
    subjective: "Patient scheduled for dental prophylaxis. Owner reports [halitosis/tartar buildup/dental concerns].",
    objective: "Pre-anesthetic examination:\n- Weight: [weight] kg\n- Physical examination: [findings]\n- Oral examination: [tartar grade], [gingivitis grade]\n- Pre-anesthetic bloodwork: [results]\n- Anesthetic protocol: [medications and doses]",
    assessment: "Grade [X] dental disease. Patient stable for dental procedure under anesthesia.",
    plan: "Dental prophylaxis performed:\n- Supragingival scaling completed\n- Subgingival scaling completed\n- Polishing completed\n- [Number] extractions performed: [teeth]\n- Post-operative care instructions provided\n- Pain management: [medications]\n- Recheck in [timeframe]"
  },
  "Spay/Neuter": {
    noteType: "soap",
    category: "exams",
    subjective: "Patient presented for elective spay/neuter procedure.",
    objective: "Pre-surgical examination:\n- Weight: [weight] kg\n- Physical examination: Normal\n- Pre-anesthetic bloodwork: [results]\n- Anesthetic protocol: [medications]\n- Surgical site prepared and draped",
    assessment: "Healthy patient suitable for elective surgery.",
    plan: "Surgical procedure completed:\n- [Ovariohysterectomy/Castration] performed\n- No complications noted\n- Recovery uneventful\n- Post-operative care:\n  - Pain management: [medications]\n  - Activity restriction for 10-14 days\n  - E-collar until suture removal\n  - Suture removal in [date]\n  - Monitor incision site daily"
  },
  "Post-Surgical Follow-up": {
    noteType: "follow-up",
    category: "follow-ups",
    reasonForFollowUp: "Post-surgical recheck examination",
    previousDiagnosis: "[Previous surgical diagnosis]",
    previousTreatment: "[Previous surgical procedure and post-op care]",
    currentStatus: "Owner reports [recovery progress/concerns]. Patient showing [behavioral observations].",
    improvement: "[Improved/Stable/Worse]",
    physicalExamFindings: "Post-surgical examination:\n- Incision site: [appearance]\n- Swelling: [assessment]\n- Discharge: [present/absent]\n- Pain level: [assessment]\n- Activity level: [assessment]\n- Appetite: [normal/decreased]\n- Weight: [weight] kg",
    currentAssessment: "Post-surgical healing [progressing normally/complications noted].",
    treatmentPlan: "Continue post-operative care:\n- [Medication adjustments]\n- [Activity modifications]\n- [Next recheck date]\n- [Suture removal if indicated]\n- Owner education reinforced"
  },
  "Recheck Examination": {
    noteType: "follow-up",
    category: "follow-ups",
    reasonForFollowUp: "Recheck of [previous condition]",
    previousDiagnosis: "[Previous diagnosis]",
    previousTreatment: "[Previous treatment plan]",
    currentStatus: "Owner reports [current status/changes]. Patient showing [symptoms/behavior].",
    improvement: "[Improved/Stable/Worse/Resolved]",
    physicalExamFindings: "Follow-up examination:\n- Previous findings: [comparison]\n- Current condition: [assessment]\n- Response to treatment: [evaluation]\n- Vital signs: T=[temp] HR=[rate] RR=[rate]\n- Focused examination: [relevant areas]",
    currentAssessment: "Response to treatment: [improved/stable/declined]. [Condition] showing [progress description].",
    treatmentPlan: "Treatment plan adjustment:\n- [Continue/modify/discontinue] current medications\n- [Additional diagnostics if needed]\n- [Next follow-up timing]\n- [Home care modifications]"
  },
  "Medication Recheck": {
    noteType: "follow-up",
    category: "follow-ups",
    reasonForFollowUp: "Medication response assessment",
    previousDiagnosis: "[Condition being treated]",
    previousTreatment: "[Medication name and dosage]",
    currentStatus: "Owner reports [observed effects/side effects]. Patient showing [clinical response].",
    improvement: "[Improved/Stable/Worse]",
    physicalExamFindings: "Medication assessment:\n- Clinical response: [improvement/no change/decline]\n- Side effects: [present/absent]\n- Compliance: [good/poor]\n- Physical examination: [relevant findings]\n- [Laboratory values if applicable]",
    currentAssessment: "Response to [medication]: [assessment]. [Side effects status].",
    treatmentPlan: "Medication management:\n- [Continue/adjust/change] current dose\n- [Monitor for specific parameters]\n- [Laboratory monitoring if needed]\n- [Next recheck interval]"
  },
  "Skin Condition": {
    noteType: "soap",
    category: "common-diagnoses",
    subjective: "Owner reports [itching/scratching/hair loss/skin lesions] for [duration]. [Additional history]",
    objective: "Dermatological examination:\n- Distribution of lesions: [areas affected]\n- Type of lesions: [primary/secondary lesions]\n- Skin scraping: [results]\n- Cytology: [results]\n- Overall skin condition: [findings]",
    assessment: "Clinical signs consistent with [condition]. Differential diagnoses include [list].",
    plan: "Treatment plan:\n- Topical therapy: [medications]\n- Systemic therapy: [medications]\n- Dietary recommendations: [if applicable]\n- Follow-up in [timeframe]\n- Monitor response to treatment\n- [Additional diagnostics if needed]"
  },
  "Digestive Issues": {
    noteType: "soap",
    category: "common-diagnoses",
    subjective: "Owner reports [vomiting/diarrhea/appetite changes/weight loss] for [duration]. [Diet history and additional details]",
    objective: "Physical examination:\n- Hydration status: [assessment]\n- Abdominal palpation: [findings]\n- Body condition: [BCS]/9\n- Temperature: [temp]°F\n- Mucous membranes: [color and CRT]",
    assessment: "Clinical signs consistent with [condition]. Rule out [differential diagnoses].",
    plan: "Treatment approach:\n- Dietary management: [recommendations]\n- Medications: [prescribed]\n- Diagnostic testing: [if indicated]\n- Monitoring parameters: [what to watch]\n- Follow-up: [timeframe]\n- Emergency instructions provided"
  },
  "Respiratory Infection": {
    noteType: "soap",
    category: "common-diagnoses",
    subjective: "Owner reports [coughing/sneezing/nasal discharge/difficulty breathing] for [duration]. [Exposure history]",
    objective: "Respiratory examination:\n- Respiratory rate: [RR] rpm\n- Respiratory effort: [assessment]\n- Lung auscultation: [findings]\n- Nasal examination: [discharge type/amount]\n- Throat examination: [findings]\n- Temperature: [temp]°F",
    assessment: "Clinical signs consistent with [upper/lower] respiratory tract infection.",
    plan: "Treatment protocol:\n- Antimicrobial therapy: [medications]\n- Supportive care: [humidification/rest]\n- Symptomatic treatment: [cough suppressants/etc]\n- Isolation recommendations: [if applicable]\n- Monitor for: [warning signs]\n- Recheck in [timeframe]"
  },
  "Injury/Trauma": {
    noteType: "soap",
    category: "common-diagnoses",
    subjective: "Owner reports [mechanism of injury] occurring [when]. Patient showing [symptoms observed].",
    objective: "Trauma assessment:\n- Primary survey: [ABC assessment]\n- Vital signs: T=[temp] HR=[rate] RR=[rate]\n- Neurological status: [findings]\n- Musculoskeletal examination: [findings]\n- [Affected area] examination: [detailed findings]\n- Pain assessment: [scale/behavior]",
    assessment: "[Injury description] with [severity assessment]. [Complications if any].",
    plan: "Treatment plan:\n- Pain management: [medications and doses]\n- [Surgical/Medical] intervention: [details]\n- Diagnostic imaging: [if performed]\n- Monitoring: [parameters and frequency]\n- Home care instructions: [restrictions/medications]\n- Follow-up: [schedule]"
  },
  // Procedure Note Templates
  "Spay Procedure": {
    noteType: "procedure",
    category: "procedures",
    indication: "Elective sterilization",
    preProcedureDiagnosis: "Healthy patient for elective spay",
    postProcedureDiagnosis: "Ovariohysterectomy completed successfully",
    procedureType: "Ovariohysterectomy",
    anesthesiaUsed: "[Anesthetic protocol]",
    techniques: "Standard midline celiotomy approach. Ovaries and uterus identified and removed. Ligatures placed on ovarian pedicles and uterine body.",
    positioning: "Dorsal recumbency",
    findings: "Normal reproductive tract. No abnormalities noted.",
    estimatedBloodLoss: "Minimal",
    complications: "None",
    medications: "Post-operative pain management: [medications and doses]",
    instructions: "Activity restriction for 10-14 days. E-collar until suture removal. Monitor incision site daily.",
    followUp: "Suture removal in [date]. Recheck if any concerns.",
    disposition: "Recovery uneventful. Discharged to owner."
  },
  "Neuter Procedure": {
    noteType: "procedure",
    category: "procedures",
    indication: "Elective sterilization",
    preProcedureDiagnosis: "Healthy patient for elective neuter",
    postProcedureDiagnosis: "Castration completed successfully",
    procedureType: "Castration",
    anesthesiaUsed: "[Anesthetic protocol]",
    techniques: "Standard prescrotal approach. Testicles removed via closed technique. Ligatures placed on spermatic cords.",
    positioning: "Dorsal recumbency",
    findings: "Normal testicles. No abnormalities noted.",
    estimatedBloodLoss: "Minimal",
    complications: "None",
    medications: "Post-operative pain management: [medications and doses]",
    instructions: "Activity restriction for 10-14 days. E-collar until suture removal. Monitor incision site daily.",
    followUp: "Suture removal in [date]. Recheck if any concerns.",
    disposition: "Recovery uneventful. Discharged to owner."
  },
  "Dental Procedure": {
    noteType: "procedure",
    category: "procedures",
    indication: "Dental prophylaxis and treatment",
    preProcedureDiagnosis: "Grade [X] dental disease",
    postProcedureDiagnosis: "Dental prophylaxis completed. [Number] extractions performed.",
    procedureType: "Dental prophylaxis with extractions",
    anesthesiaUsed: "[Anesthetic protocol]",
    techniques: "Supragingival and subgingival scaling. Polishing. Extractions performed as indicated.",
    positioning: "Dorsal recumbency with head elevated",
    findings: "Tartar grade: [grade]. Gingivitis grade: [grade]. [Number] teeth extracted: [teeth numbers].",
    estimatedBloodLoss: "Minimal",
    complications: "None",
    medications: "Post-operative pain management: [medications and doses]",
    instructions: "Soft food for [duration]. Monitor for bleeding or discomfort.",
    followUp: "Recheck in [timeframe] to assess healing.",
    disposition: "Recovery uneventful. Discharged to owner."
  },
  // Anesthesia Note Templates
  "Routine Anesthesia": {
    noteType: "anesthesia",
    category: "anesthesia",
    asaStatus: "ASA I or II",
    preAnesthesiaAssessment: "Healthy patient. No significant risk factors identified. Pre-anesthetic bloodwork: [results]",
    riskFactors: [],
    premedication: "[Premedication agent and dose]",
    inductionAgent: "[Induction agent]",
    inductionDose: "[Dose]",
    maintenanceAgent: "[Maintenance agent]",
    maintenanceMethod: "Isoflurane via endotracheal tube",
    airwayType: "Endotracheal tube",
    airwaySize: "[Size]",
    monitoringEquipment: ["ECG", "Pulse oximetry", "Blood pressure", "Temperature probe"],
    complications: "None",
    recoveryQuality: "Smooth",
    recoveryMonitoring: "Standard post-anesthetic monitoring. Patient recovered uneventfully.",
    postAnesthesiaInstructions: "Monitor for normal recovery. Contact clinic if any concerns.",
    monitoringRequirements: "Standard post-anesthetic monitoring"
  },
  "High-Risk Anesthesia": {
    noteType: "anesthesia",
    category: "anesthesia",
    asaStatus: "ASA III or IV",
    preAnesthesiaAssessment: "Patient with [risk factors]. Pre-anesthetic assessment completed. Additional monitoring required.",
    riskFactors: ["[Risk factor 1]", "[Risk factor 2]"],
    premedication: "[Premedication agent and dose]",
    inductionAgent: "[Induction agent]",
    inductionDose: "[Dose]",
    maintenanceAgent: "[Maintenance agent]",
    maintenanceMethod: "Isoflurane via endotracheal tube with additional monitoring",
    airwayType: "Endotracheal tube",
    airwaySize: "[Size]",
    monitoringEquipment: ["ECG", "Pulse oximetry", "Blood pressure", "Temperature probe", "Capnography", "Arterial line"],
    complications: "[Any complications or none]",
    recoveryQuality: "[Smooth/Prolonged/Agitated]",
    recoveryMonitoring: "Extended monitoring period. [Specific monitoring requirements]",
    postAnesthesiaInstructions: "Extended monitoring required. [Specific instructions]",
    monitoringRequirements: "Extended monitoring for [duration]. Watch for [specific parameters]"
  },
  // Discharge Note Templates
  "Routine Discharge": {
    noteType: "discharge",
    category: "discharge",
    reasonForVisit: "[Visit reason]",
    primaryDiagnosis: "[Primary diagnosis]",
    treatmentSummary: "[Summary of treatments provided]",
    homeCareInstructions: "[Specific home care instructions]",
    activityRestrictions: "[Activity restrictions if any]",
    dietInstructions: "[Diet recommendations]",
    followUpAppointments: "Recheck in [timeframe]",
    warningSigns: ["[Warning sign 1]", "[Warning sign 2]"],
    whenToSeekEmergencyCare: "[When to seek emergency care]",
    dischargeCondition: "Stable",
    ownerEducation: "[Owner education provided]"
  },
  "Post-Surgical Discharge": {
    noteType: "discharge",
    category: "discharge",
    reasonForVisit: "Post-surgical care",
    primaryDiagnosis: "[Surgical diagnosis]",
    proceduresPerformed: ["[Procedure performed]"],
    treatmentSummary: "[Summary of surgical procedure and post-op care]",
    homeCareInstructions: "Monitor incision site daily. Keep clean and dry. E-collar to prevent licking.",
    activityRestrictions: "Strict rest for [duration]. No running, jumping, or strenuous activity.",
    dietInstructions: "[Diet recommendations]",
    followUpAppointments: "Suture removal in [date]. Recheck if any concerns.",
    warningSigns: ["Excessive swelling", "Discharge from incision", "Redness or heat", "Lethargy", "Loss of appetite"],
    whenToSeekEmergencyCare: "If incision opens, excessive bleeding, or signs of infection",
    dischargeCondition: "Stable",
    ownerEducation: "Post-surgical care instructions reviewed. Activity restrictions and medication schedule discussed."
  },
  // Progress Note Templates
  "Daily Progress": {
    noteType: "progress",
    category: "progress",
    visitType: "Daily progress note",
    reasonForNote: "Routine daily assessment",
    clinicalStatus: "[Stable/Improving/Deteriorating]",
    overallProgress: "[Progress description]",
    ownerReport: "[Owner updates if any]",
    patientBehavior: "[Patient behavior observations]",
    appetite: "[Appetite status]",
    urination: "[Urination status]",
    defecation: "[Defecation status]",
    physicalExamFindings: "[Current physical examination findings]",
    assessment: "[Current assessment]",
    plan: "[Plan for next 24 hours]",
    monitoringPlan: "[Monitoring requirements]"
  },
  "Post-Operative Progress": {
    noteType: "progress",
    category: "progress",
    visitType: "Post-operative progress note",
    reasonForNote: "Post-surgical monitoring",
    clinicalStatus: "[Stable/Improving]",
    overallProgress: "[Recovery progress]",
    patientBehavior: "[Patient behavior and comfort level]",
    appetite: "[Appetite status]",
    physicalExamFindings: "Incision site: [appearance]. Pain assessment: [level]. Vital signs: [status].",
    assessment: "Post-operative recovery [progressing normally/complications noted]",
    plan: "[Post-operative care plan]",
    monitoringPlan: "Monitor incision site, pain level, and vital signs. [Specific parameters]"
  },
  // General Note Templates
  "General Consultation": {
    noteType: "general",
    category: "general",
    content: "Consultation regarding [topic].\n\nOwner concerns: [concerns]\n\nDiscussion: [discussion points]\n\nRecommendations: [recommendations]\n\nFollow-up: [follow-up plan]"
  },
  "Owner Communication": {
    noteType: "general",
    category: "general",
    content: "Owner communication note:\n\nDate: [date]\n\nTopic: [topic]\n\nDiscussion: [discussion]\n\nOwner questions: [questions]\n\nResponse: [response]\n\nAction items: [action items]"
  }
};

const templateCategories = {
  exams: "Examinations",
  "follow-ups": "Follow-ups", 
  "common-diagnoses": "Common Diagnoses",
  procedures: "Procedures",
  anesthesia: "Anesthesia",
  discharge: "Discharge",
  progress: "Progress",
  general: "General"
};

const getTemplatesByCategory = (searchQuery: string = "", noteType?: NoteType) => {
  const filtered = Object.entries(examinationTemplates).filter(([name, template]) => {
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNoteType = !noteType || template.noteType === noteType;
    return matchesSearch && matchesNoteType;
  });
  
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
  const [activeTab, setActiveTab] = useState("soap");
  // Bottom panel state
  const [isBottomOpen, setIsBottomOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<'history' | 'labs' | 'notes'>('history');
  const [bottomHeight, setBottomHeight] = useState<number>(Math.round(window.innerHeight * 0.3));
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const resizeStateRef = useRef<{ startY: number; startHeight: number } | null>(null);
  // Right content bounds for bottom panel width alignment
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [bottomPanelRect, setBottomPanelRect] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  // History filters
  const [historyType, setHistoryType] = useState<'all' | 'visit' | 'vaccination' | 'surgery'>('all');
  const [historyClinician, setHistoryClinician] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  type HistoryRow = {
    id: string;
    date: string; // ISO or YYYY-MM-DD
    type: 'Visit' | 'Vaccination' | 'Surgery';
    clinician: string;
    title: string;
    subtitle?: string;
    notes?: string;
  };

  const historyRows = React.useMemo<HistoryRow[]>(() => {
    const visits = mockMedicalHistory.previousVisits.map(v => ({
      id: `visit-${v.id}`,
      date: v.date,
      type: 'Visit' as const,
      clinician: v.veterinarian,
      title: v.complaint,
      subtitle: v.diagnosis,
      notes: v.treatment,
    }));
    const vax = mockMedicalHistory.vaccinations.map(v => ({
      id: `vax-${v.id}`,
      date: v.date,
      type: 'Vaccination' as const,
      clinician: v.veterinarian,
      title: v.vaccine,
      subtitle: `Next due: ${new Date(v.nextDue).toLocaleDateString()}`,
      notes: '—',
    }));
    const surgeries = mockMedicalHistory.surgeries.map(s => ({
      id: `sx-${s.id}`,
      date: s.date,
      type: 'Surgery' as const,
      clinician: s.veterinarian,
      title: s.procedure,
      subtitle: undefined,
      notes: s.outcome,
    }));
    return [...visits, ...vax, ...surgeries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Bottom panel resize handlers
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizingBottom || !resizeStateRef.current) return;
      const { startY, startHeight } = resizeStateRef.current;
      const delta = startY - e.clientY; // dragging up increases height
      const next = Math.max(160, Math.min(window.innerHeight * 0.9, startHeight + delta));
      setBottomHeight(next);
    };
    const onMouseUp = () => {
      if (isResizingBottom) {
        setIsResizingBottom(false);
        resizeStateRef.current = null;
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizingBottom]);

  const filteredHistory = React.useMemo(() => {
    return historyRows.filter(r => {
      if (historyType !== 'all') {
        if (historyType === 'visit' && r.type !== 'Visit') return false;
        if (historyType === 'vaccination' && r.type !== 'Vaccination') return false;
        if (historyType === 'surgery' && r.type !== 'Surgery') return false;
      }
      if (historyClinician.trim()) {
        const q = historyClinician.toLowerCase();
        if (!r.clinician.toLowerCase().includes(q)) return false;
      }
      if (historyFrom) {
        if (new Date(r.date).getTime() < new Date(historyFrom).getTime()) return false;
      }
      if (historyTo) {
        if (new Date(r.date).getTime() > new Date(historyTo).getTime()) return false;
      }
      return true;
    });
  }, [historyRows, historyType, historyClinician, historyFrom, historyTo]);

  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistory.length / historyPageSize));
  const paginatedHistory = React.useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return filteredHistory.slice(start, start + historyPageSize);
  }, [filteredHistory, historyPage, historyPageSize]);

  const exportHistoryCsv = () => {
    const headers = ['Date','Type','Clinician','Title','Subtitle','Notes'];
    const rows = filteredHistory.map(r => [
      new Date(r.date).toLocaleDateString(),
      r.type,
      r.clinician,
      r.title,
      r.subtitle || '',
      r.notes || ''
    ]);
    const csv = [headers, ...rows]
      .map(cols => cols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportHistoryPdf = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const marginX = 40;
    const marginY = 50;
    const lineHeight = 16;
    const rowGap = 6;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - marginX * 2;

    // Header
    doc.setFontSize(16);
    doc.text('Medical History', marginX, marginY);
    doc.setFontSize(10);
    doc.text(`Exported: ${new Date().toLocaleString()}`, marginX, marginY + 14);

    // Column headers
    const headers = ['Date', 'Type', 'Clinician', 'Description', 'Notes'];
    const colWidths = [70, 80, 120, 220, usableWidth - (70 + 80 + 120 + 220)];
    let y = marginY + 36;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    let x = marginX;
    headers.forEach((h, i) => {
      doc.text(h, x, y);
      x += colWidths[i];
    });
    doc.setLineWidth(0.5);
    doc.line(marginX, y + 4, marginX + usableWidth, y + 4);
    y += 14;
    doc.setFont(undefined, 'normal');

    const addPageIfNeeded = (heightNeeded: number) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (y + heightNeeded > pageHeight - marginY) {
        doc.addPage();
        y = marginY;
      }
    };

    // Rows
    filteredHistory.forEach((r) => {
      const dateStr = new Date(r.date).toLocaleDateString();
      const cells = [
        dateStr,
        r.type,
        r.clinician,
        r.title + (r.subtitle ? `\n${r.subtitle}` : ''),
        r.notes || '—',
      ];

      // Calculate wrapped text for Description and Notes
      const wrap = (text: string, width: number) => doc.splitTextToSize(text, width);
      const wrappedCells = cells.map((c, i) => {
        const width = colWidths[i];
        return i >= 3 ? wrap(String(c), width) : [String(c)];
      });
      const rowHeight = Math.max(
        ...wrappedCells.map(lines => lines.length * lineHeight)
      );

      addPageIfNeeded(rowHeight + rowGap);

      // Draw text
      let cx = marginX;
      wrappedCells.forEach((lines, i) => {
        let cy = y;
        lines.forEach((line) => {
          doc.text(String(line), cx, cy);
          cy += lineHeight;
        });
        cx += colWidths[i];
      });

      // Row divider
      doc.setDrawColor(230);
      doc.line(marginX, y + rowHeight + 2, marginX + usableWidth, y + rowHeight + 2);
      y += rowHeight + rowGap;
    });

    doc.save(`medical-history-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  useEffect(() => {
    const updateBounds = () => {
      // Align to the ResizablePanelGroup width
      if (groupRef.current) {
        const rect = groupRef.current.getBoundingClientRect();
        setBottomPanelRect({ left: rect.left, width: rect.width });
        return;
      }
      // Fallback: align to the right content panel
      const el = rightPanelRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setBottomPanelRect({ left: rect.left, width: rect.width });
      }
    };

    updateBounds();

    const ro = new ResizeObserver(updateBounds);
    if (groupRef.current) ro.observe(groupRef.current);
    if (rightPanelRef.current) ro.observe(rightPanelRef.current);
    window.addEventListener("resize", updateBounds);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateBounds);
    };
  }, []);
  
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
  
  // Scrollable tabs state
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (!tabsScrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll tabs left/right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsScrollRef.current) return;
    
    const scrollAmount = 200;
    const newScrollLeft = direction === 'left' 
      ? tabsScrollRef.current.scrollLeft - scrollAmount
      : tabsScrollRef.current.scrollLeft + scrollAmount;
    
    tabsScrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Initialize scroll check
  useEffect(() => {
    checkScrollPosition();
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    if (tabsScrollRef.current) {
      resizeObserver.observe(tabsScrollRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);
  
  

  // Structured and unstructured clinical notes (e.g., procedure, discharge)
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [noteDraft, setNoteDraft] = useState<{ type: NoteType; title: string; content: string }>({
    type: "soap",
    title: "",
    content: ""
  });
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  
  // Collapsed notes state - tracks which notes are collapsed
  // When a note is expanded, all others are automatically collapsed
  const [collapsedNotes, setCollapsedNotes] = useState<Set<string>>(new Set());
  
  // Toggle note collapse - accordion behavior: only one note expanded at a time
  const toggleNoteCollapse = (noteId: string) => {
    setCollapsedNotes(prev => {
      const isCurrentlyCollapsed = prev.has(noteId);
      
      if (isCurrentlyCollapsed) {
        // Expanding this note - collapse all others
        const allNoteIds = new Set(clinicalNotes.map(n => n.id));
        allNoteIds.delete(noteId); // Remove the note being expanded
        return allNoteIds; // All other notes are now collapsed
      } else {
        // Collapsing this note - add it to collapsed set
        // All notes should be collapsed now
        return new Set(clinicalNotes.map(n => n.id));
      }
    });
  };
  
  // Get note preview text
  const getNotePreview = (note: ClinicalNote): string => {
    if (note.type === "soap" && note.soapData) {
      const parts = [
        note.soapData.subjective?.trim() && `Subjective: ${note.soapData.subjective.trim().substring(0, 60)}${note.soapData.subjective.length > 60 ? '...' : ''}`,
        note.soapData.objective?.trim() && `Objective: ${note.soapData.objective.trim().substring(0, 60)}${note.soapData.objective.length > 60 ? '...' : ''}`,
        note.soapData.assessment?.trim() && `Assessment: ${note.soapData.assessment.trim().substring(0, 60)}${note.soapData.assessment.length > 60 ? '...' : ''}`,
        note.soapData.plan?.trim() && `Plan: ${note.soapData.plan.trim().substring(0, 60)}${note.soapData.plan.length > 60 ? '...' : ''}`
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(" • ") : "SOAP note (no content yet)";
    }
    if (note.type === "procedure" && note.procedureData) {
      const parts = [
        note.procedureData.procedureType?.trim() && `Procedure: ${note.procedureData.procedureType.trim()}`,
        note.procedureData.indication?.trim() && `Indication: ${note.procedureData.indication.trim().substring(0, 50)}${note.procedureData.indication.length > 50 ? '...' : ''}`,
        note.procedureData.findings?.trim() && `Findings: ${note.procedureData.findings.trim().substring(0, 50)}${note.procedureData.findings.length > 50 ? '...' : ''}`
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(" • ") : "Procedure note (no content yet)";
    }
    if (note.type === "anesthesia" && note.anesthesiaData) {
      const parts = [
        note.anesthesiaData.inductionAgent?.trim() && `Induction: ${note.anesthesiaData.inductionAgent.trim()}`,
        note.anesthesiaData.maintenanceAgent?.trim() && `Maintenance: ${note.anesthesiaData.maintenanceAgent.trim()}`,
        note.anesthesiaData.asaStatus?.trim() && `ASA: ${note.anesthesiaData.asaStatus.trim()}`,
        note.anesthesiaData.duration?.trim() && `Duration: ${note.anesthesiaData.duration.trim()}`
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(" • ") : "Anesthesia note (no content yet)";
    }
    if (note.type === "discharge" && note.dischargeData) {
      const parts = [
        note.dischargeData.primaryDiagnosis?.trim() && `Diagnosis: ${note.dischargeData.primaryDiagnosis.trim()}`,
        note.dischargeData.dischargeCondition?.trim() && `Condition: ${note.dischargeData.dischargeCondition.trim()}`,
        note.dischargeData.recheckDate?.trim() && `Recheck: ${note.dischargeData.recheckDate.trim()}`,
        note.dischargeData.medications.length > 0 && `${note.dischargeData.medications.length} medication(s)`
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(" • ") : "Discharge note (no content yet)";
    }
    if (note.type === "follow-up" && note.followUpData) {
      const parts = [
        note.followUpData.visitType?.trim() && `Type: ${note.followUpData.visitType.trim()}`,
        note.followUpData.improvement?.trim() && `Status: ${note.followUpData.improvement.trim()}`,
        note.followUpData.diagnosis?.trim() && `Diagnosis: ${note.followUpData.diagnosis.trim()}`,
        note.followUpData.nextFollowUpDate?.trim() && `Next: ${note.followUpData.nextFollowUpDate.trim()}`
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(" • ") : "Follow-up note (no content yet)";
    }
    if (note.type === "progress" && note.progressData) {
      const parts = [
        note.progressData.visitType?.trim() && `Type: ${note.progressData.visitType.trim()}`,
        note.progressData.clinicalStatus?.trim() && `Status: ${note.progressData.clinicalStatus.trim()}`,
        note.progressData.overallProgress?.trim() && `Progress: ${note.progressData.overallProgress.trim()}`,
        note.progressData.daysSinceAdmission?.trim() && `Day ${note.progressData.daysSinceAdmission.trim()}`
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(" • ") : "Progress note (no content yet)";
    }
    return note.content?.trim() ? (note.content.trim().substring(0, 150) + (note.content.length > 150 ? '...' : '')) : "Empty note";
  };

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
  
  // Encounter items state (treatments linked to SOAP notes)
  const [encounterItems, setEncounterItems] = useState<EncounterItem[]>([]);
  
  // Add item to encounter when lab order is created
  const handleLabOrderCreated = (orderData: any) => {
    const newItem: EncounterItem = {
      id: Date.now().toString(),
      type: "lab",
      title: orderData.testName || "Lab Test",
      category: "lab-tests",
      price: 0,
      cost: 0,
      quantity: 1,
      discount: 0,
      total: 0,
      status: "pending",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: undefined,
      performedBy: selectedVeterinarian,
      linkedToSection: 'objective',
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

const applyTemplate = (templateName: string, noteId?: string) => {
    const template = examinationTemplates[templateName as keyof typeof examinationTemplates];
    if (!template) return;
    
    const noteType = template.noteType;
    let targetNoteId = noteId;
    
    // If no noteId provided, find or create a note of the template's type
    if (!targetNoteId) {
      const mostRecentNote = clinicalNotes
        .filter(n => n.type === noteType)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (mostRecentNote) {
        targetNoteId = mostRecentNote.id;
      } else {
        // Create a new note of the appropriate type
        handleAddClinicalNoteDirectly(noteType);
        // Wait for state update and then apply template
        setTimeout(() => {
          const latestNote = clinicalNotes
            .filter(n => n.type === noteType)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          if (latestNote) {
            applyTemplateToNote(latestNote.id, template);
          }
        }, 100);
        return;
      }
    }
    
    // Apply template to the note
    applyTemplateToNote(targetNoteId, template);
  };

  const applyTemplateToNote = (noteId: string, template: any) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (!note) return;
    
    const noteType = template.noteType;
    
    // Apply template based on note type
    if (noteType === "soap" && note.soapData) {
      handleUpdateSoapData(noteId, {
        ...note.soapData,
        ...(template.subjective && { subjective: template.subjective }),
        ...(template.objective && { objective: template.objective }),
        ...(template.assessment && { assessment: template.assessment }),
        ...(template.plan && { plan: template.plan })
      });
    } else if (noteType === "procedure" && note.procedureData) {
      handleUpdateProcedureData(noteId, {
        ...note.procedureData,
        ...(template.indication && { indication: template.indication }),
        ...(template.preProcedureDiagnosis && { preProcedureDiagnosis: template.preProcedureDiagnosis }),
        ...(template.postProcedureDiagnosis && { postProcedureDiagnosis: template.postProcedureDiagnosis }),
        ...(template.procedureType && { procedureType: template.procedureType }),
        ...(template.anesthesiaUsed && { anesthesiaUsed: template.anesthesiaUsed }),
        ...(template.techniques && { techniques: template.techniques }),
        ...(template.positioning && { positioning: template.positioning }),
        ...(template.findings && { findings: template.findings }),
        ...(template.estimatedBloodLoss && { estimatedBloodLoss: template.estimatedBloodLoss }),
        ...(template.complications && { complications: template.complications }),
        ...(template.medications && { medications: template.medications }),
        ...(template.instructions && { instructions: template.instructions }),
        ...(template.followUp && { followUp: template.followUp }),
        ...(template.disposition && { disposition: template.disposition })
      });
    } else if (noteType === "anesthesia" && note.anesthesiaData) {
      handleUpdateAnesthesiaData(noteId, {
        ...note.anesthesiaData,
        ...(template.asaStatus && { asaStatus: template.asaStatus }),
        ...(template.preAnesthesiaAssessment && { preAnesthesiaAssessment: template.preAnesthesiaAssessment }),
        ...(template.riskFactors && { riskFactors: template.riskFactors }),
        ...(template.premedication && { premedication: template.premedication }),
        ...(template.inductionAgent && { inductionAgent: template.inductionAgent }),
        ...(template.inductionDose && { inductionDose: template.inductionDose }),
        ...(template.maintenanceAgent && { maintenanceAgent: template.maintenanceAgent }),
        ...(template.maintenanceMethod && { maintenanceMethod: template.maintenanceMethod }),
        ...(template.airwayType && { airwayType: template.airwayType }),
        ...(template.airwaySize && { airwaySize: template.airwaySize }),
        ...(template.monitoringEquipment && { monitoringEquipment: template.monitoringEquipment }),
        ...(template.complications && { complications: template.complications }),
        ...(template.recoveryQuality && { recoveryQuality: template.recoveryQuality }),
        ...(template.recoveryMonitoring && { recoveryMonitoring: template.recoveryMonitoring }),
        ...(template.postAnesthesiaInstructions && { postAnesthesiaInstructions: template.postAnesthesiaInstructions }),
        ...(template.monitoringRequirements && { monitoringRequirements: template.monitoringRequirements })
      });
    } else if (noteType === "discharge" && note.dischargeData) {
      handleUpdateDischargeData(noteId, {
        ...note.dischargeData,
        ...(template.reasonForVisit && { reasonForVisit: template.reasonForVisit }),
        ...(template.primaryDiagnosis && { primaryDiagnosis: template.primaryDiagnosis }),
        ...(template.treatmentSummary && { treatmentSummary: template.treatmentSummary }),
        ...(template.proceduresPerformed && { proceduresPerformed: template.proceduresPerformed }),
        ...(template.homeCareInstructions && { homeCareInstructions: template.homeCareInstructions }),
        ...(template.activityRestrictions && { activityRestrictions: template.activityRestrictions }),
        ...(template.dietInstructions && { dietInstructions: template.dietInstructions }),
        ...(template.followUpAppointments && { followUpAppointments: template.followUpAppointments }),
        ...(template.warningSigns && { warningSigns: template.warningSigns }),
        ...(template.whenToSeekEmergencyCare && { whenToSeekEmergencyCare: template.whenToSeekEmergencyCare }),
        ...(template.dischargeCondition && { dischargeCondition: template.dischargeCondition }),
        ...(template.ownerEducation && { ownerEducation: template.ownerEducation })
      });
    } else if (noteType === "follow-up" && note.followUpData) {
      handleUpdateFollowUpData(noteId, {
        ...note.followUpData,
        ...(template.reasonForFollowUp && { reasonForFollowUp: template.reasonForFollowUp }),
        ...(template.previousDiagnosis && { previousDiagnosis: template.previousDiagnosis }),
        ...(template.previousTreatment && { previousTreatment: template.previousTreatment }),
        ...(template.currentStatus && { currentStatus: template.currentStatus }),
        ...(template.improvement && { improvement: template.improvement }),
        ...(template.physicalExamFindings && { physicalExamFindings: template.physicalExamFindings }),
        ...(template.currentAssessment && { currentAssessment: template.currentAssessment }),
        ...(template.treatmentPlan && { treatmentPlan: template.treatmentPlan })
      });
    } else if (noteType === "progress" && note.progressData) {
      handleUpdateProgressData(noteId, {
        ...note.progressData,
        ...(template.visitType && { visitType: template.visitType }),
        ...(template.reasonForNote && { reasonForNote: template.reasonForNote }),
        ...(template.clinicalStatus && { clinicalStatus: template.clinicalStatus }),
        ...(template.overallProgress && { overallProgress: template.overallProgress }),
        ...(template.ownerReport && { ownerReport: template.ownerReport }),
        ...(template.patientBehavior && { patientBehavior: template.patientBehavior }),
        ...(template.appetite && { appetite: template.appetite }),
        ...(template.urination && { urination: template.urination }),
        ...(template.defecation && { defecation: template.defecation }),
        ...(template.physicalExamFindings && { physicalExamFindings: template.physicalExamFindings }),
        ...(template.assessment && { assessment: template.assessment }),
        ...(template.plan && { plan: template.plan }),
        ...(template.monitoringPlan && { monitoringPlan: template.monitoringPlan })
      });
    } else if (noteType === "general") {
      handleUpdateClinicalNote(noteId, template.content || "");
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
    console.log("Saving record:", { medications, vaccination, attachments, clinicalNotes });
    navigate("/records");
  };

  const handleAddClinicalNote = () => {
    if (!noteDraft.content.trim()) return;
    const typeLabel = NOTE_TYPES.find((t) => t.value === noteDraft.type)?.label ?? "Note";
    const title = noteDraft.title.trim() || `${typeLabel} Note`;
    const newNote: ClinicalNote = {
      id: `note-${Date.now()}`,
      type: noteDraft.type,
      title,
      content: noteDraft.content.trim(),
      createdAt: new Date().toISOString(),
      author: selectedVeterinarian || "Unassigned"
    };
    setClinicalNotes((prev) => {
      const updated = [...prev, newNote];
      // Auto-expand the new note and collapse all others
      setCollapsedNotes(new Set(prev.map(n => n.id)));
      return updated;
    });
    setNoteDraft((prev) => ({ ...prev, title: "", content: "" }));
    setIsAddNoteOpen(false);
  };

  const handleAddClinicalNoteDirectly = (type: NoteType) => {
    const typeLabel = NOTE_TYPES.find((t) => t.value === type)?.label ?? "Note";
    const now = new Date();
    const newNote: ClinicalNote = {
      id: `note-${Date.now()}`,
      type,
      title: `${typeLabel} Note`,
      content: "",
      createdAt: now.toISOString(),
      author: selectedVeterinarian || "Unassigned",
      // Initialize SOAP data structure if it's a SOAP note
      ...(type === "soap" ? {
        soapData: {
          subjective: visitData?.chiefComplaint ? `Patient presented for ${visitData.visitReason}. Chief complaint: ${visitData.chiefComplaint}` : "",
          objective: "",
          assessment: "",
          plan: "",
          temperature: "",
          heartRate: "",
          respiratoryRate: "",
          weight: "",
          bloodPressure: "",
          bodyConditionScore: "",
          otherObservations: "",
          primaryDiagnosis: "",
          differentialDiagnoses: [],
          clinicalSummary: "[Patient name], a [age]-year-old [species/breed], presents with [symptoms]. Findings suggest [suspected condition], supported by [lab/imaging findings].",
          prognosis: "",
          prognosisReason: "",
          riskFactors: [],
          notes: ""
        }
      } : {}),
      // Initialize Procedure data structure if it's a procedure note
      ...(type === "procedure" ? {
        procedureData: {
          surgeonName: selectedVeterinarian || "",
          assistants: [],
          procedureDate: now.toISOString().split('T')[0],
          procedureTime: now.toTimeString().slice(0, 5),
          noteWrittenDate: now.toISOString().split('T')[0],
          noteWrittenTime: now.toTimeString().slice(0, 5),
          indication: "",
          preProcedureDiagnosis: "",
          postProcedureDiagnosis: "",
          procedureType: "",
          anesthesiaUsed: "",
          techniques: "",
          positioning: "",
          findings: "",
          estimatedBloodLoss: "",
          materials: [],
          implants: [],
          grafts: [],
          instruments: [],
          specimens: [],
          complications: "",
          informedConsent: "",
          risksDiscussed: false,
          benefitsDiscussed: false,
          alternativesDiscussed: false,
          medications: "",
          instructions: "",
          followUp: "",
          disposition: ""
        }
      } : {}),
      // Initialize Anesthesia data structure if it's an anesthesia note
      ...(type === "anesthesia" ? {
        anesthesiaData: {
          anesthetistName: selectedVeterinarian || "",
          supervisingVeterinarian: "",
          anesthesiaDate: now.toISOString().split('T')[0],
          anesthesiaStartTime: now.toTimeString().slice(0, 5),
          anesthesiaEndTime: "",
          duration: "",
          noteWrittenDate: now.toISOString().split('T')[0],
          noteWrittenTime: now.toTimeString().slice(0, 5),
          asaStatus: "",
          preAnesthesiaAssessment: "",
          riskFactors: [],
          allergies: [],
          currentMedications: [],
          premedication: "",
          inductionAgent: "",
          inductionDose: "",
          maintenanceAgent: "",
          maintenanceMethod: "",
          reversalAgent: "",
          reversalDose: "",
          airwayType: "",
          airwaySize: "",
          intubationDifficulty: "",
          monitoringEquipment: [],
          baselineHeartRate: "",
          baselineRespiratoryRate: "",
          baselineBloodPressure: "",
          baselineTemperature: "",
          baselineSpO2: "",
          intraopHeartRate: "",
          intraopRespiratoryRate: "",
          intraopBloodPressure: "",
          intraopTemperature: "",
          intraopSpO2: "",
          fluidsAdministered: "",
          fluidType: "",
          fluidRate: "",
          complications: "",
          adverseEvents: [],
          recoveryTime: "",
          recoveryQuality: "",
          recoveryMonitoring: "",
          extubationTime: "",
          postAnesthesiaVitalSigns: "",
          postAnesthesiaInstructions: "",
          monitoringRequirements: "",
          followUp: "",
          additionalNotes: ""
        }
      } : {}),
      // Initialize Discharge data structure if it's a discharge note
      ...(type === "discharge" ? {
        dischargeData: {
          dischargingVeterinarian: selectedVeterinarian || "",
          patientName: mockPatientData?.name || "",
          ownerName: mockPatientData?.owner?.name || "",
          dischargeDate: now.toISOString().split('T')[0],
          dischargeTime: now.toTimeString().slice(0, 5),
          admissionDate: "",
          admissionTime: "",
          lengthOfStay: "",
          reasonForVisit: visitData?.visitReason || "",
          chiefComplaint: visitData?.chiefComplaint || "",
          primaryDiagnosis: "",
          secondaryDiagnoses: [],
          treatmentSummary: "",
          proceduresPerformed: [],
          medications: [],
          homeCareInstructions: "",
          activityRestrictions: "",
          dietInstructions: "",
          followUpAppointments: "",
          followUpInstructions: "",
          recheckDate: "",
          warningSigns: [],
          whenToSeekEmergencyCare: "",
          dischargeCondition: "",
          dischargeStatus: "",
          ownerEducation: "",
          questionsAnswered: false,
          instructionsUnderstood: false,
          additionalNotes: ""
        }
      } : {}),
      // Initialize Follow-up data structure if it's a follow-up note
      ...(type === "follow-up" ? {
        followUpData: {
          veterinarianName: selectedVeterinarian || "",
          patientName: mockPatientData?.name || "",
          ownerName: mockPatientData?.owner?.name || "",
          followUpDate: now.toISOString().split('T')[0],
          followUpTime: now.toTimeString().slice(0, 5),
          originalVisitDate: "",
          daysSinceLastVisit: "",
          visitType: "",
          reasonForFollowUp: "",
          chiefComplaint: visitData?.chiefComplaint || "",
          previousDiagnosis: "",
          previousTreatment: "",
          currentStatus: "",
          improvement: "",
          currentSymptoms: [],
          physicalExamFindings: "",
          vitalSigns: {
            temperature: "",
            heartRate: "",
            respiratoryRate: "",
            weight: "",
            bodyConditionScore: ""
          },
          currentAssessment: "",
          diagnosis: "",
          differentialDiagnoses: [],
          treatmentPlan: "",
          medications: [],
          recommendations: "",
          activityRestrictions: "",
          dietRecommendations: "",
          nextFollowUpDate: "",
          nextFollowUpInstructions: "",
          followUpInterval: "",
          ownerConcerns: "",
          ownerQuestions: "",
          ownerEducation: "",
          additionalNotes: ""
        }
      } : {}),
      // Initialize Progress data structure if it's a progress note
      ...(type === "progress" ? {
        progressData: {
          veterinarianName: selectedVeterinarian || "",
          patientName: mockPatientData?.name || "",
          ownerName: mockPatientData?.owner?.name || "",
          progressDate: now.toISOString().split('T')[0],
          progressTime: now.toTimeString().slice(0, 5),
          admissionDate: "",
          daysSinceAdmission: "",
          visitType: "",
          reasonForNote: "",
          clinicalStatus: "",
          overallProgress: "",
          ownerReport: "",
          patientBehavior: "",
          appetite: "",
          urination: "",
          defecation: "",
          physicalExamFindings: "",
          vitalSigns: {
            temperature: "",
            heartRate: "",
            respiratoryRate: "",
            bloodPressure: "",
            weight: "",
            bodyConditionScore: ""
          },
          diagnosticResults: "",
          labResults: "",
          imagingResults: "",
          assessment: "",
          currentDiagnosis: "",
          progressNotes: "",
          complications: [],
          plan: "",
          medications: [],
          treatments: [],
          procedures: [],
          monitoringPlan: "",
          parametersToWatch: [],
          dischargeReadiness: "",
          dischargeCriteria: [],
          estimatedDischargeDate: "",
          ownerCommunication: "",
          ownerUpdates: "",
          additionalNotes: ""
        }
      } : {})
    };
    setClinicalNotes((prev) => {
      const updated = [...prev, newNote];
      // Auto-expand the new note and collapse all others
      setCollapsedNotes(new Set(prev.map(n => n.id)));
      return updated;
    });
  };

  const handleUpdateClinicalNote = (id: string, content: string) => {
    setClinicalNotes((prev) => prev.map((note) => (note.id === id ? { ...note, content } : note)));
  };

  const handleUpdateClinicalNoteTitle = (id: string, title: string) => {
    setClinicalNotes((prev) => prev.map((note) => (note.id === id ? { ...note, title } : note)));
  };

  const handleUpdateSoapData = (id: string, soapData: SoapData) => {
    setClinicalNotes((prev) => prev.map((note) => (note.id === id ? { ...note, soapData } : note)));
  };

  const handleUpdateSoapField = (id: string, field: keyof SoapData, value: string | string[]) => {
    setClinicalNotes((prev) => prev.map((note) => {
      if (note.id === id && note.soapData) {
        return { ...note, soapData: { ...note.soapData, [field]: value } };
      }
      return note;
    }));
  };

  const handleAddDifferentialDiagnosisToNote = (noteId: string, diagnosis: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.soapData) {
      const updatedDiagnoses = [...note.soapData.differentialDiagnoses, diagnosis.trim()];
      handleUpdateSoapField(noteId, "differentialDiagnoses", updatedDiagnoses);
    }
  };

  const handleRemoveDifferentialDiagnosisFromNote = (noteId: string, index: number) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.soapData) {
      const updatedDiagnoses = note.soapData.differentialDiagnoses.filter((_, i) => i !== index);
      handleUpdateSoapField(noteId, "differentialDiagnoses", updatedDiagnoses);
    }
  };

  const handleToggleRiskFactorInNote = (noteId: string, factor: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.soapData) {
      const updatedRiskFactors = note.soapData.riskFactors.includes(factor)
        ? note.soapData.riskFactors.filter(f => f !== factor)
        : [...note.soapData.riskFactors, factor];
      handleUpdateSoapField(noteId, "riskFactors", updatedRiskFactors);
    }
  };

  const handleAddCustomRiskFactorToNote = (noteId: string, factor: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.soapData) {
      const updatedRiskFactors = [...note.soapData.riskFactors, factor.trim()];
      handleUpdateSoapField(noteId, "riskFactors", updatedRiskFactors);
    }
  };

  const handleUpdateProcedureData = (id: string, procedureData: ProcedureData) => {
    setClinicalNotes((prev) => prev.map((note) => (note.id === id ? { ...note, procedureData } : note)));
  };

  const handleUpdateProcedureField = (id: string, field: keyof ProcedureData, value: string | string[] | boolean) => {
    setClinicalNotes((prev) => prev.map((note) => {
      if (note.id === id && note.procedureData) {
        return { ...note, procedureData: { ...note.procedureData, [field]: value } };
      }
      return note;
    }));
  };

  const handleAddAssistantToNote = (noteId: string, assistant: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.procedureData) {
      const updatedAssistants = [...note.procedureData.assistants, assistant.trim()];
      handleUpdateProcedureField(noteId, "assistants", updatedAssistants);
    }
  };

  const handleRemoveAssistantFromNote = (noteId: string, index: number) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.procedureData) {
      const updatedAssistants = note.procedureData.assistants.filter((_, i) => i !== index);
      handleUpdateProcedureField(noteId, "assistants", updatedAssistants);
    }
  };

  const handleAddItemToProcedureList = (noteId: string, listField: "materials" | "implants" | "grafts" | "instruments" | "specimens", item: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.procedureData) {
      const currentList = note.procedureData[listField];
      const updatedList = [...currentList, item.trim()];
      handleUpdateProcedureField(noteId, listField, updatedList);
    }
  };

  const handleRemoveItemFromProcedureList = (noteId: string, listField: "materials" | "implants" | "grafts" | "instruments" | "specimens", index: number) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.procedureData) {
      const currentList = note.procedureData[listField];
      const updatedList = currentList.filter((_, i) => i !== index);
      handleUpdateProcedureField(noteId, listField, updatedList);
    }
  };

  const handleUpdateAnesthesiaData = (id: string, anesthesiaData: AnesthesiaData) => {
    setClinicalNotes((prev) => prev.map((note) => (note.id === id ? { ...note, anesthesiaData } : note)));
  };

  const handleUpdateAnesthesiaField = (id: string, field: keyof AnesthesiaData, value: string | string[] | boolean) => {
    setClinicalNotes((prev) => prev.map((note) => {
      if (note.id === id && note.anesthesiaData) {
        return { ...note, anesthesiaData: { ...note.anesthesiaData, [field]: value } };
      }
      return note;
    }));
  };

  const handleAddItemToAnesthesiaList = (noteId: string, listField: "riskFactors" | "allergies" | "currentMedications" | "monitoringEquipment" | "adverseEvents", item: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.anesthesiaData) {
      const currentList = note.anesthesiaData[listField];
      const updatedList = [...currentList, item.trim()];
      handleUpdateAnesthesiaField(noteId, listField, updatedList);
    }
  };

  const handleRemoveItemFromAnesthesiaList = (noteId: string, listField: "riskFactors" | "allergies" | "currentMedications" | "monitoringEquipment" | "adverseEvents", index: number) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.anesthesiaData) {
      const currentList = note.anesthesiaData[listField];
      const updatedList = currentList.filter((_, i) => i !== index);
      handleUpdateAnesthesiaField(noteId, listField, updatedList);
    }
  };

  const handleUpdateDischargeData = (id: string, dischargeData: DischargeData) => {
    setClinicalNotes((prev) => prev.map((note) => (note.id === id ? { ...note, dischargeData } : note)));
  };

  const handleUpdateDischargeField = (id: string, field: keyof DischargeData, value: string | string[] | boolean | Array<{name: string; dosage: string; frequency: string; duration: string; instructions: string}>) => {
    setClinicalNotes((prev) => prev.map((note) => {
      if (note.id === id && note.dischargeData) {
        return { ...note, dischargeData: { ...note.dischargeData, [field]: value } };
      }
      return note;
    }));
  };

  const handleAddItemToDischargeList = (noteId: string, listField: "secondaryDiagnoses" | "proceduresPerformed" | "warningSigns", item: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.dischargeData) {
      const currentList = note.dischargeData[listField];
      const updatedList = [...currentList, item.trim()];
      handleUpdateDischargeField(noteId, listField, updatedList);
    }
  };

  const handleRemoveItemFromDischargeList = (noteId: string, listField: "secondaryDiagnoses" | "proceduresPerformed" | "warningSigns", index: number) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.dischargeData) {
      const currentList = note.dischargeData[listField];
      const updatedList = currentList.filter((_, i) => i !== index);
      handleUpdateDischargeField(noteId, listField, updatedList);
    }
  };

  const handleAddDischargeMedication = (noteId: string, medication: {name: string; dosage: string; frequency: string; duration: string; instructions: string}) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.dischargeData) {
      const updatedMedications = [...note.dischargeData.medications, medication];
      handleUpdateDischargeField(noteId, "medications", updatedMedications);
    }
  };

  const handleRemoveDischargeMedication = (noteId: string, index: number) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.dischargeData) {
      const updatedMedications = note.dischargeData.medications.filter((_, i) => i !== index);
      handleUpdateDischargeField(noteId, "medications", updatedMedications);
    }
  };

  const handleUpdateDischargeMedication = (noteId: string, index: number, field: keyof {name: string; dosage: string; frequency: string; duration: string; instructions: string}, value: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.dischargeData) {
      const updatedMedications = note.dischargeData.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      );
      handleUpdateDischargeField(noteId, "medications", updatedMedications);
    }
  };

  const handleUpdateFollowUpData = (id: string, followUpData: FollowUpData) => {
    setClinicalNotes((prev) => prev.map((note) => (note.id === id ? { ...note, followUpData } : note)));
  };

  const handleUpdateFollowUpField = (id: string, field: keyof FollowUpData, value: string | string[] | Array<{name: string; dosage: string; frequency: string; duration: string; instructions: string}> | {temperature: string; heartRate: string; respiratoryRate: string; weight: string; bodyConditionScore: string}) => {
    setClinicalNotes((prev) => prev.map((note) => {
      if (note.id === id && note.followUpData) {
        return { ...note, followUpData: { ...note.followUpData, [field]: value } };
      }
      return note;
    }));
  };

  const handleUpdateFollowUpVitalSign = (id: string, vitalSign: keyof {temperature: string; heartRate: string; respiratoryRate: string; weight: string; bodyConditionScore: string}, value: string) => {
    setClinicalNotes((prev) => prev.map((note) => {
      if (note.id === id && note.followUpData) {
        return { 
          ...note, 
          followUpData: { 
            ...note.followUpData, 
            vitalSigns: { 
              ...note.followUpData.vitalSigns, 
              [vitalSign]: value 
            } 
          } 
        };
      }
      return note;
    }));
  };

  const handleAddItemToFollowUpList = (noteId: string, listField: "currentSymptoms" | "differentialDiagnoses", item: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.followUpData) {
      const currentList = note.followUpData[listField];
      const updatedList = [...currentList, item.trim()];
      handleUpdateFollowUpField(noteId, listField, updatedList);
    }
  };

  const handleRemoveItemFromFollowUpList = (noteId: string, listField: "currentSymptoms" | "differentialDiagnoses", index: number) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.followUpData) {
      const currentList = note.followUpData[listField];
      const updatedList = currentList.filter((_, i) => i !== index);
      handleUpdateFollowUpField(noteId, listField, updatedList);
    }
  };

  const handleAddFollowUpMedication = (noteId: string, medication: {name: string; dosage: string; frequency: string; duration: string; instructions: string}) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.followUpData) {
      const updatedMedications = [...note.followUpData.medications, medication];
      handleUpdateFollowUpField(noteId, "medications", updatedMedications);
    }
  };

  const handleRemoveFollowUpMedication = (noteId: string, index: number) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.followUpData) {
      const updatedMedications = note.followUpData.medications.filter((_, i) => i !== index);
      handleUpdateFollowUpField(noteId, "medications", updatedMedications);
    }
  };

  const handleUpdateFollowUpMedication = (noteId: string, index: number, field: keyof {name: string; dosage: string; frequency: string; duration: string; instructions: string}, value: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.followUpData) {
      const updatedMedications = note.followUpData.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      );
      handleUpdateFollowUpField(noteId, "medications", updatedMedications);
    }
  };

  const handleUpdateProgressData = (id: string, progressData: ProgressData) => {
    setClinicalNotes((prev) => prev.map((note) => (note.id === id ? { ...note, progressData } : note)));
  };

  const handleUpdateProgressField = (id: string, field: keyof ProgressData, value: string | string[] | Array<{name: string; dosage: string; frequency: string; duration: string; instructions: string; changes: string}> | {temperature: string; heartRate: string; respiratoryRate: string; bloodPressure: string; weight: string; bodyConditionScore: string}) => {
    setClinicalNotes((prev) => prev.map((note) => {
      if (note.id === id && note.progressData) {
        return { ...note, progressData: { ...note.progressData, [field]: value } };
      }
      return note;
    }));
  };

  const handleUpdateProgressVitalSign = (id: string, vitalSign: keyof {temperature: string; heartRate: string; respiratoryRate: string; bloodPressure: string; weight: string; bodyConditionScore: string}, value: string) => {
    setClinicalNotes((prev) => prev.map((note) => {
      if (note.id === id && note.progressData) {
        return { 
          ...note, 
          progressData: { 
            ...note.progressData, 
            vitalSigns: { 
              ...note.progressData.vitalSigns, 
              [vitalSign]: value 
            } 
          } 
        };
      }
      return note;
    }));
  };

  const handleAddItemToProgressList = (noteId: string, listField: "complications" | "treatments" | "procedures" | "parametersToWatch" | "dischargeCriteria", item: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.progressData) {
      const currentList = note.progressData[listField];
      const updatedList = [...currentList, item.trim()];
      handleUpdateProgressField(noteId, listField, updatedList);
    }
  };

  const handleRemoveItemFromProgressList = (noteId: string, listField: "complications" | "treatments" | "procedures" | "parametersToWatch" | "dischargeCriteria", index: number) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.progressData) {
      const currentList = note.progressData[listField];
      const updatedList = currentList.filter((_, i) => i !== index);
      handleUpdateProgressField(noteId, listField, updatedList);
    }
  };

  const handleAddProgressMedication = (noteId: string, medication: {name: string; dosage: string; frequency: string; duration: string; instructions: string; changes: string}) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.progressData) {
      const updatedMedications = [...note.progressData.medications, medication];
      handleUpdateProgressField(noteId, "medications", updatedMedications);
    }
  };

  const handleRemoveProgressMedication = (noteId: string, index: number) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.progressData) {
      const updatedMedications = note.progressData.medications.filter((_, i) => i !== index);
      handleUpdateProgressField(noteId, "medications", updatedMedications);
    }
  };

  const handleUpdateProgressMedication = (noteId: string, index: number, field: keyof {name: string; dosage: string; frequency: string; duration: string; instructions: string; changes: string}, value: string) => {
    const note = clinicalNotes.find(n => n.id === noteId);
    if (note && note.progressData) {
      const updatedMedications = note.progressData.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      );
      handleUpdateProgressField(noteId, "medications", updatedMedications);
    }
  };

  const handleDeleteClinicalNote = (id: string) => {
    setClinicalNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const templatesByCategory = getTemplatesByCategory(templateSearch); // Show all templates, not filtered by note type

  return (
    <div className="relative min-h-screen">
      {/* Main Content Area */}
      <div> {/* Removed right margin for sidebar */}
        <div className="max-w-5xl mx-auto space-y-6 px-6"> {/* Fixed-width container */}
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
            <AdmissionRequestDialog
              patientData={{
                patientId: selectedPatient,
                patientName: mockPatientData.owner.name,
                petName: mockPatientData.name,
                species: mockPatientData.species + " (" + mockPatientData.breed + ")",
                veterinarian: selectedVeterinarian,
                diagnosis: (() => {
                  const soapNote = clinicalNotes.find(n => n.type === "soap" && n.soapData);
                  return soapNote?.soapData?.primaryDiagnosis || soapNote?.soapData?.assessment || "";
                })()
              }}
            >
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Bed className="mr-2 h-4 w-4" />
                Request Hospitalization
              </DropdownMenuItem>
            </AdmissionRequestDialog>
            <LabOrderDialog 
              prefillData={{
                patientId: selectedPatient,
                veterinarian: selectedVeterinarian,
                diagnosis: (() => {
                  const soapNote = clinicalNotes.find(n => n.type === "soap" && n.soapData);
                  return soapNote?.soapData?.primaryDiagnosis || soapNote?.soapData?.assessment || "";
                })()
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

      {/* Global tabs menu bar spanning full width */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-border/50"
              onClick={() => scrollTabs('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {/* Right Arrow */}
          {showRightArrow && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-border/50"
              onClick={() => scrollTabs('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {/* Scrollable TabsList */}
          <div 
            ref={tabsScrollRef}
            className="overflow-x-auto scrollbar-hide px-8"
            onScroll={checkScrollPosition}
          >
            <TabsList className="flex w-full h-11 items-center justify-start gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <TabsTrigger 
                value="soap"
                className="h-11 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground hover:bg-muted/50"
              >
                Notes
              </TabsTrigger>
              <TabsTrigger 
                value="treatment"
                className="h-11 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground hover:bg-muted/50"
              >
                Treatments
              </TabsTrigger>
              <TabsTrigger 
                value="vaccination"
                className="h-11 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground hover:bg-muted/50"
              >
                Vaccination
              </TabsTrigger>
              <TabsTrigger 
                value="medications"
                className="h-11 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground hover:bg-muted/50"
              >
                Medications
              </TabsTrigger>
              <TabsTrigger 
                value="summary"
                className="h-11 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground hover:bg-muted/50"
              >
                Summary & Billing
              </TabsTrigger>
              <TabsTrigger 
                value="attachments"
                className="h-11 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground hover:bg-muted/50"
              >
                Attachments
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

      <div ref={groupRef}>
      <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border mt-4">
        {/* Left Panel - Quick Templates and Medical History */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="h-full p-6 space-y-6 overflow-y-auto">
            {/* Quick Templates Section - visible on SOAP Notes tab where clinical notes are managed */}
            <TabsContent value="soap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quick Templates
                </CardTitle>
                <CardDescription>
                  Select a template to pre-fill notes. Templates work for SOAP, Procedure, Anesthesia, Discharge, Follow-up, Progress, and General notes.
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
                          {templates.map(([templateName, template]) => {
                            const noteTypeLabel = NOTE_TYPES.find(t => t.value === template.noteType)?.label || template.noteType;
                            return (
                              <Button
                                key={templateName}
                                variant="ghost"
                                size="sm"
                                onClick={() => applyTemplate(templateName)}
                                className="w-full justify-start text-left h-auto p-2 whitespace-normal"
                              >
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span className="flex-1 text-left">{templateName}</span>
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {noteTypeLabel}
                                  </Badge>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
            </TabsContent>
            
          {/* Add Treatment - visible only on Treatments tab */}
          <TabsContent value="treatment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5" />
                  Add Treatment
                </CardTitle>
                <CardDescription>Select services and procedures from the catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <TreatmentSelector
                  onTreatmentAdded={(treatment) => {
                    const normalized: EncounterItem = {
                      ...treatment,
                      status: treatment.status || 'pending',
                      quantity: treatment.quantity ?? 1,
                      discount: treatment.discount ?? 0,
                      total: (treatment.price ?? 0) * (treatment.quantity ?? 1) - (treatment.discount ?? 0),
                      linkedToSection: 'plan',
                      performedBy: selectedVeterinarian,
                    } as EncounterItem;
                    setEncounterItems([...encounterItems, normalized]);
                  }}
                  linkedSection="plan"
                  performedBy={selectedVeterinarian}
                />
              </CardContent>
            </Card>
          </TabsContent>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Notes */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <div ref={rightPanelRef} className="h-full p-6 overflow-y-auto">
            {/* SOAP Notes Tab */}
            <TabsContent value="soap" className="space-y-6">
              {/* Additional Clinical Notes (dynamic) */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Clinical Notes
                    </CardTitle>
                    <CardDescription>
                      Add SOAP notes, procedure notes, anesthesia records, discharge instructions, or other clinical notes.
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Note
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {NOTE_TYPES.map((type) => (
                        <DropdownMenuItem
                          key={type.value}
                          onSelect={() => {
                            handleAddClinicalNoteDirectly(type.value as NoteType);
                          }}
                        >
                          {type.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clinicalNotes.length > 0 ? (
                    <div className="space-y-3">
                      {clinicalNotes.map((note) => {
                        const isSoapNote = note.type === "soap" && note.soapData;
                        const isProcedureNote = note.type === "procedure" && note.procedureData;
                        const isAnesthesiaNote = note.type === "anesthesia" && note.anesthesiaData;
                        const isDischargeNote = note.type === "discharge" && note.dischargeData;
                        const isFollowUpNote = note.type === "follow-up" && note.followUpData;
                        const isProgressNote = note.type === "progress" && note.progressData;
                        const isCollapsed = collapsedNotes.has(note.id);
                        return (
                          <Card key={note.id} className="border-dashed">
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
                                    <ChevronDown 
                                      className={cn(
                                        "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                                        isCollapsed ? "-rotate-90" : "rotate-0"
                                      )} 
                                    />
                                    <Badge variant="secondary">
                                      {NOTE_TYPES.find((t) => t.value === note.type)?.label ?? note.type}
                                    </Badge>
                                    <Input
                                      value={note.title}
                                      onChange={(e) => handleUpdateClinicalNoteTitle(note.id, e.target.value)}
                                      onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking input
                                      onFocus={(e) => e.stopPropagation()} // Prevent collapse when focusing input
                                      className="h-7 text-sm font-medium border-none shadow-none px-0 focus-visible:ring-0"
                                      placeholder="Note title"
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Added by {note.author || "Unknown"} on {format(new Date(note.createdAt), "PPp")}
                                  </p>
                                  {/* Show preview when collapsed */}
                                  {isCollapsed && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2 pl-6">
                                      {getNotePreview(note)}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent collapse when clicking delete
                                    handleDeleteClinicalNote(note.id);
                                  }}
                                  title="Remove note"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            {!isCollapsed && (
                            <CardContent>
                              {isSoapNote ? (
                                // Render SOAP form
                                <div className="space-y-8">
                                  {/* Patient and Veterinarian Selection */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor={`patient-${note.id}`}>Patient</Label>
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
                                      <Label htmlFor={`veterinarian-${note.id}`}>Veterinarian</Label>
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

                                  {/* Subjective Section */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Subjective</h3>
                                      <p className="text-sm text-muted-foreground mb-4">Chief complaint and owner's observations</p>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`subjective-${note.id}`}>Subjective (Chief Complaint)</Label>
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
                                                  const currentValue = note.soapData?.subjective || "";
                                                  const newValue = currentValue ? `${currentValue}, ${preset}` : preset;
                                                  handleUpdateSoapField(note.id, "subjective", newValue);
                                                }}
                                                className="text-xs h-7"
                                              >
                                                {preset}
                                              </Button>
                                            ))}
                                          </div>
                                          <Textarea 
                                            id={`subjective-${note.id}`}
                                            value={note.soapData.subjective}
                                            onChange={(e) => handleUpdateSoapField(note.id, "subjective", e.target.value)}
                                            placeholder="Owner's concerns, history, and observations..."
                                            className="min-h-[100px]"
                                          />
                                        </div>
                                      </div>

                                      {/* Vital Signs */}
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`temperature-${note.id}`}>Temperature</Label>
                                          <Input 
                                            id={`temperature-${note.id}`}
                                            placeholder="°F" 
                                            value={note.soapData.temperature}
                                            onChange={(e) => handleUpdateSoapField(note.id, "temperature", e.target.value)}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`heartRate-${note.id}`}>Heart Rate</Label>
                                          <Input 
                                            id={`heartRate-${note.id}`}
                                            placeholder="bpm" 
                                            value={note.soapData.heartRate}
                                            onChange={(e) => handleUpdateSoapField(note.id, "heartRate", e.target.value)}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`respiratoryRate-${note.id}`}>Respiratory Rate</Label>
                                          <Input 
                                            id={`respiratoryRate-${note.id}`}
                                            placeholder="rpm" 
                                            value={note.soapData.respiratoryRate}
                                            onChange={(e) => handleUpdateSoapField(note.id, "respiratoryRate", e.target.value)}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`weight-${note.id}`}>Weight</Label>
                                          <Input 
                                            id={`weight-${note.id}`}
                                            placeholder="kg" 
                                            value={note.soapData.weight}
                                            onChange={(e) => handleUpdateSoapField(note.id, "weight", e.target.value)}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`bodyConditionScore-${note.id}`}>Body Condition Score</Label>
                                          <Input 
                                            id={`bodyConditionScore-${note.id}`}
                                            placeholder="1-9" 
                                            value={note.soapData.bodyConditionScore}
                                            onChange={(e) => handleUpdateSoapField(note.id, "bodyConditionScore", e.target.value)}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`bloodPressure-${note.id}`}>Blood Pressure</Label>
                                          <Input 
                                            id={`bloodPressure-${note.id}`}
                                            placeholder="mmHg" 
                                            value={note.soapData.bloodPressure}
                                            onChange={(e) => handleUpdateSoapField(note.id, "bloodPressure", e.target.value)}
                                          />
                                        </div>
                                      </div>

                                      {/* Other Observations */}
                                      <div className="space-y-2">
                                        <Label htmlFor={`otherObservations-${note.id}`}>Other Observations / Physical Exam Findings</Label>
                                        <Textarea
                                          id={`otherObservations-${note.id}`}
                                          value={note.soapData.otherObservations}
                                          onChange={(e) => handleUpdateSoapField(note.id, "otherObservations", e.target.value)}
                                          placeholder="Physical exam findings, abnormalities, imaging results, lab data..."
                                          className="min-h-[120px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Objective Section */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Objective</h3>
                                      <p className="text-sm text-muted-foreground mb-4">Physical examination and diagnostic findings</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`objective-${note.id}`}>Objective Findings</Label>
                                      <Textarea
                                        id={`objective-${note.id}`}
                                        value={note.soapData.objective}
                                        onChange={(e) => handleUpdateSoapField(note.id, "objective", e.target.value)}
                                        placeholder="Physical examination findings, diagnostic test results, imaging findings..."
                                        className="min-h-[120px]"
                                      />
                                    </div>
                                  </div>

                                  {/* Assessment Section */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Assessment</h3>
                                      <p className="text-sm text-muted-foreground mb-4">Clinical interpretation and differential diagnoses</p>
                                    </div>
                                    <div className="space-y-6">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Primary Diagnosis</Label>
                                        <Input
                                          value={note.soapData.primaryDiagnosis}
                                          onChange={(e) => handleUpdateSoapField(note.id, "primaryDiagnosis", e.target.value)}
                                          placeholder="e.g., Canine Osteoarthritis"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Differential Diagnoses</Label>
                                        <div className="flex flex-wrap gap-2">
                                          {note.soapData.differentialDiagnoses.map((diagnosis, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {diagnosis}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveDifferentialDiagnosisFromNote(note.id, index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add differential diagnosis"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddDifferentialDiagnosisToNote(note.id, (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddDifferentialDiagnosisToNote(note.id, input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Clinical Summary */}
                                      <div className="space-y-2">
                                        <Label htmlFor={`clinicalSummary-${note.id}`} className="text-sm font-medium text-muted-foreground">Clinical Summary / Interpretation</Label>
                                        <Textarea
                                          id={`clinicalSummary-${note.id}`}
                                          value={note.soapData.clinicalSummary}
                                          onChange={(e) => handleUpdateSoapField(note.id, "clinicalSummary", e.target.value)}
                                          placeholder="Comprehensive clinical interpretation of findings"
                                          className="min-h-[100px]"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor={`assessment-${note.id}`}>Assessment</Label>
                                        <Textarea
                                          id={`assessment-${note.id}`}
                                          value={note.soapData.assessment}
                                          onChange={(e) => handleUpdateSoapField(note.id, "assessment", e.target.value)}
                                          placeholder="Clinical interpretation, diagnosis, and evaluation..."
                                          className="min-h-[120px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Plan Section */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Plan</h3>
                                      <p className="text-sm text-muted-foreground mb-4">Treatment plan and recommendations</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`plan-${note.id}`}>Treatment Plan</Label>
                                      <Textarea
                                        id={`plan-${note.id}`}
                                        value={note.soapData.plan}
                                        onChange={(e) => handleUpdateSoapField(note.id, "plan", e.target.value)}
                                        placeholder="Describe the treatment plan, medications, follow-up care, and owner instructions"
                                        className="min-h-[120px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : isProcedureNote ? (
                                // Render Procedure form
                                <div className="space-y-8">
                                  {/* Patient & Provider Info */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Patient & Provider Information</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`surgeon-${note.id}`}>Surgeon/Provider Name</Label>
                                        <Input
                                          id={`surgeon-${note.id}`}
                                          value={note.procedureData!.surgeonName}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "surgeonName", e.target.value)}
                                          placeholder="Enter surgeon/provider name"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`assistants-${note.id}`}>Assistants</Label>
                                        <div className="space-y-2">
                                          <div className="flex flex-wrap gap-2">
                                            {note.procedureData!.assistants.map((assistant, index) => (
                                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                {assistant}
                                                <X 
                                                  className="h-3 w-3 cursor-pointer" 
                                                  onClick={() => handleRemoveAssistantFromNote(note.id, index)}
                                                />
                                              </Badge>
                                            ))}
                                          </div>
                                          <div className="flex gap-2">
                                            <Input
                                              placeholder="Add assistant name"
                                              onKeyPress={(e) => {
                                                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                  handleAddAssistantToNote(note.id, (e.target as HTMLInputElement).value);
                                                  (e.target as HTMLInputElement).value = "";
                                                }
                                              }}
                                            />
                                            <Button 
                                              onClick={(e) => {
                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                if (input?.value.trim()) {
                                                  handleAddAssistantToNote(note.id, input.value);
                                                  input.value = "";
                                                }
                                              }}
                                              variant="outline"
                                              size="sm"
                                            >
                                              Add
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Date & Time */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Date & Time</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`procedureDate-${note.id}`}>Procedure Date</Label>
                                        <Input
                                          id={`procedureDate-${note.id}`}
                                          type="date"
                                          value={note.procedureData!.procedureDate}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "procedureDate", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`procedureTime-${note.id}`}>Procedure Time</Label>
                                        <Input
                                          id={`procedureTime-${note.id}`}
                                          type="time"
                                          value={note.procedureData!.procedureTime}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "procedureTime", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`noteWrittenDate-${note.id}`}>Note Written Date</Label>
                                        <Input
                                          id={`noteWrittenDate-${note.id}`}
                                          type="date"
                                          value={note.procedureData!.noteWrittenDate}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "noteWrittenDate", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`noteWrittenTime-${note.id}`}>Note Written Time</Label>
                                        <Input
                                          id={`noteWrittenTime-${note.id}`}
                                          type="time"
                                          value={note.procedureData!.noteWrittenTime}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "noteWrittenTime", e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Indication & Diagnosis */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Indication & Diagnosis</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`indication-${note.id}`}>Indication (Reason for Procedure)</Label>
                                        <Textarea
                                          id={`indication-${note.id}`}
                                          value={note.procedureData!.indication}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "indication", e.target.value)}
                                          placeholder="Reason for performing the procedure"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`preProcedureDiagnosis-${note.id}`}>Pre-Procedure Diagnosis</Label>
                                        <Input
                                          id={`preProcedureDiagnosis-${note.id}`}
                                          value={note.procedureData!.preProcedureDiagnosis}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "preProcedureDiagnosis", e.target.value)}
                                          placeholder="Diagnosis before the procedure"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`postProcedureDiagnosis-${note.id}`}>Post-Procedure Diagnosis</Label>
                                        <Input
                                          id={`postProcedureDiagnosis-${note.id}`}
                                          value={note.procedureData!.postProcedureDiagnosis}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "postProcedureDiagnosis", e.target.value)}
                                          placeholder="Final diagnosis after the procedure"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Procedure Details */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Procedure Details</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`procedureType-${note.id}`}>Procedure Type</Label>
                                        <Input
                                          id={`procedureType-${note.id}`}
                                          value={note.procedureData!.procedureType}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "procedureType", e.target.value)}
                                          placeholder="e.g., Spay, Neuter, Dental Extraction"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`anesthesiaUsed-${note.id}`}>Anesthesia Used</Label>
                                        <Textarea
                                          id={`anesthesiaUsed-${note.id}`}
                                          value={note.procedureData!.anesthesiaUsed}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "anesthesiaUsed", e.target.value)}
                                          placeholder="Type and dosage of anesthesia"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`techniques-${note.id}`}>Techniques</Label>
                                        <Textarea
                                          id={`techniques-${note.id}`}
                                          value={note.procedureData!.techniques}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "techniques", e.target.value)}
                                          placeholder="Surgical techniques and approach used"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`positioning-${note.id}`}>Positioning</Label>
                                        <Input
                                          id={`positioning-${note.id}`}
                                          value={note.procedureData!.positioning}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "positioning", e.target.value)}
                                          placeholder="Patient positioning during procedure"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`findings-${note.id}`}>Findings</Label>
                                        <Textarea
                                          id={`findings-${note.id}`}
                                          value={note.procedureData!.findings}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "findings", e.target.value)}
                                          placeholder="Intraoperative findings and observations"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`estimatedBloodLoss-${note.id}`}>Estimated Blood Loss (EBL)</Label>
                                        <Input
                                          id={`estimatedBloodLoss-${note.id}`}
                                          value={note.procedureData!.estimatedBloodLoss}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "estimatedBloodLoss", e.target.value)}
                                          placeholder="e.g., Minimal, 5ml, etc."
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Materials */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Materials</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label>Materials Used</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.procedureData!.materials.map((material, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {material}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromProcedureList(note.id, "materials", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add material"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToProcedureList(note.id, "materials", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToProcedureList(note.id, "materials", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Implants</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.procedureData!.implants.map((implant, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {implant}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromProcedureList(note.id, "implants", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add implant (with tracking sticker if applicable)"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToProcedureList(note.id, "implants", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToProcedureList(note.id, "implants", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Grafts</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.procedureData!.grafts.map((graft, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {graft}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromProcedureList(note.id, "grafts", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add graft"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToProcedureList(note.id, "grafts", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToProcedureList(note.id, "grafts", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Instruments</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.procedureData!.instruments.map((instrument, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {instrument}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromProcedureList(note.id, "instruments", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add instrument"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToProcedureList(note.id, "instruments", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToProcedureList(note.id, "instruments", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Specimens */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Specimens</h3>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Specimens Sent to Pathology</Label>
                                      <div className="flex flex-wrap gap-2 mb-2">
                                        {note.procedureData!.specimens.map((specimen, index) => (
                                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                            {specimen}
                                            <X 
                                              className="h-3 w-3 cursor-pointer" 
                                              onClick={() => handleRemoveItemFromProcedureList(note.id, "specimens", index)}
                                            />
                                          </Badge>
                                        ))}
                                      </div>
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder="Add specimen"
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                              handleAddItemToProcedureList(note.id, "specimens", (e.target as HTMLInputElement).value);
                                              (e.target as HTMLInputElement).value = "";
                                            }
                                          }}
                                        />
                                        <Button 
                                          onClick={(e) => {
                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                            if (input?.value.trim()) {
                                              handleAddItemToProcedureList(note.id, "specimens", input.value);
                                              input.value = "";
                                            }
                                          }}
                                          variant="outline"
                                          size="sm"
                                        >
                                          Add
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Complications */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Complications</h3>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`complications-${note.id}`}>Complications Encountered</Label>
                                      <Textarea
                                        id={`complications-${note.id}`}
                                        value={note.procedureData!.complications}
                                        onChange={(e) => handleUpdateProcedureField(note.id, "complications", e.target.value)}
                                        placeholder="Document any complications or issues encountered during the procedure"
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                  </div>

                                  {/* Informed Consent */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Informed Consent</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`informedConsent-${note.id}`}>Informed Consent Documentation</Label>
                                        <Textarea
                                          id={`informedConsent-${note.id}`}
                                          value={note.procedureData!.informedConsent}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "informedConsent", e.target.value)}
                                          placeholder="Documentation of informed consent discussion"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`risksDiscussed-${note.id}`}
                                            checked={note.procedureData!.risksDiscussed}
                                            onChange={(e) => handleUpdateProcedureField(note.id, "risksDiscussed", e.target.checked)}
                                            className="rounded border-gray-300"
                                          />
                                          <Label htmlFor={`risksDiscussed-${note.id}`} className="font-normal cursor-pointer">
                                            Risks discussed with owner
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`benefitsDiscussed-${note.id}`}
                                            checked={note.procedureData!.benefitsDiscussed}
                                            onChange={(e) => handleUpdateProcedureField(note.id, "benefitsDiscussed", e.target.checked)}
                                            className="rounded border-gray-300"
                                          />
                                          <Label htmlFor={`benefitsDiscussed-${note.id}`} className="font-normal cursor-pointer">
                                            Benefits discussed with owner
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`alternativesDiscussed-${note.id}`}
                                            checked={note.procedureData!.alternativesDiscussed}
                                            onChange={(e) => handleUpdateProcedureField(note.id, "alternativesDiscussed", e.target.checked)}
                                            className="rounded border-gray-300"
                                          />
                                          <Label htmlFor={`alternativesDiscussed-${note.id}`} className="font-normal cursor-pointer">
                                            Alternatives discussed with owner
                                          </Label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Post-Procedure Plan */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Post-Procedure Plan</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`medications-${note.id}`}>Medications</Label>
                                        <Textarea
                                          id={`medications-${note.id}`}
                                          value={note.procedureData!.medications}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "medications", e.target.value)}
                                          placeholder="Post-procedure medications prescribed"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`instructions-${note.id}`}>Instructions</Label>
                                        <Textarea
                                          id={`instructions-${note.id}`}
                                          value={note.procedureData!.instructions}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "instructions", e.target.value)}
                                          placeholder="Post-procedure care instructions for owner"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`followUp-${note.id}`}>Follow-Up</Label>
                                        <Textarea
                                          id={`followUp-${note.id}`}
                                          value={note.procedureData!.followUp}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "followUp", e.target.value)}
                                          placeholder="Follow-up appointments and monitoring requirements"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`disposition-${note.id}`}>Disposition</Label>
                                        <Input
                                          id={`disposition-${note.id}`}
                                          value={note.procedureData!.disposition}
                                          onChange={(e) => handleUpdateProcedureField(note.id, "disposition", e.target.value)}
                                          placeholder="Patient's condition and disposition (e.g., Stable, Recovering, etc.)"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : isAnesthesiaNote ? (
                                // Render Anesthesia form
                                <div className="space-y-8">
                                  {/* Anesthetist & Provider Info */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Anesthetist & Provider Information</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`anesthetist-${note.id}`}>Anesthetist Name</Label>
                                        <Input
                                          id={`anesthetist-${note.id}`}
                                          value={note.anesthesiaData!.anesthetistName}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "anesthetistName", e.target.value)}
                                          placeholder="Enter anesthetist name"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`supervisingVet-${note.id}`}>Supervising Veterinarian</Label>
                                        <Input
                                          id={`supervisingVet-${note.id}`}
                                          value={note.anesthesiaData!.supervisingVeterinarian}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "supervisingVeterinarian", e.target.value)}
                                          placeholder="Enter supervising veterinarian"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Date & Time */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Date & Time</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`anesthesiaDate-${note.id}`}>Anesthesia Date</Label>
                                        <Input
                                          id={`anesthesiaDate-${note.id}`}
                                          type="date"
                                          value={note.anesthesiaData!.anesthesiaDate}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "anesthesiaDate", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`anesthesiaStartTime-${note.id}`}>Start Time</Label>
                                        <Input
                                          id={`anesthesiaStartTime-${note.id}`}
                                          type="time"
                                          value={note.anesthesiaData!.anesthesiaStartTime}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "anesthesiaStartTime", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`anesthesiaEndTime-${note.id}`}>End Time</Label>
                                        <Input
                                          id={`anesthesiaEndTime-${note.id}`}
                                          type="time"
                                          value={note.anesthesiaData!.anesthesiaEndTime}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "anesthesiaEndTime", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`duration-${note.id}`}>Duration</Label>
                                        <Input
                                          id={`duration-${note.id}`}
                                          value={note.anesthesiaData!.duration}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "duration", e.target.value)}
                                          placeholder="e.g., 45 minutes"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Pre-Anesthesia Assessment */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Pre-Anesthesia Assessment</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`asaStatus-${note.id}`}>ASA Physical Status</Label>
                                        <Select
                                          value={note.anesthesiaData!.asaStatus}
                                          onValueChange={(value) => handleUpdateAnesthesiaField(note.id, "asaStatus", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select ASA status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="ASA I">ASA I - Normal healthy patient</SelectItem>
                                            <SelectItem value="ASA II">ASA II - Mild systemic disease</SelectItem>
                                            <SelectItem value="ASA III">ASA III - Severe systemic disease</SelectItem>
                                            <SelectItem value="ASA IV">ASA IV - Severe systemic disease that is a constant threat to life</SelectItem>
                                            <SelectItem value="ASA V">ASA V - Moribund patient not expected to survive</SelectItem>
                                            <SelectItem value="ASA E">ASA E - Emergency procedure</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`preAnesthesiaAssessment-${note.id}`}>Pre-Anesthesia Assessment</Label>
                                        <Textarea
                                          id={`preAnesthesiaAssessment-${note.id}`}
                                          value={note.anesthesiaData!.preAnesthesiaAssessment}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "preAnesthesiaAssessment", e.target.value)}
                                          placeholder="Physical examination findings, patient status, and risk assessment"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Risk Factors</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.anesthesiaData!.riskFactors.map((factor, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {factor}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromAnesthesiaList(note.id, "riskFactors", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add risk factor"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToAnesthesiaList(note.id, "riskFactors", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToAnesthesiaList(note.id, "riskFactors", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Allergies</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.anesthesiaData!.allergies.map((allergy, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {allergy}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromAnesthesiaList(note.id, "allergies", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add allergy"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToAnesthesiaList(note.id, "allergies", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToAnesthesiaList(note.id, "allergies", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Current Medications</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.anesthesiaData!.currentMedications.map((med, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {med}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromAnesthesiaList(note.id, "currentMedications", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add medication"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToAnesthesiaList(note.id, "currentMedications", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToAnesthesiaList(note.id, "currentMedications", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Anesthesia Protocol */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Anesthesia Protocol</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`premedication-${note.id}`}>Premedication</Label>
                                        <Input
                                          id={`premedication-${note.id}`}
                                          value={note.anesthesiaData!.premedication}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "premedication", e.target.value)}
                                          placeholder="e.g., Acepromazine 0.05 mg/kg IM"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`inductionAgent-${note.id}`}>Induction Agent</Label>
                                          <Input
                                            id={`inductionAgent-${note.id}`}
                                            value={note.anesthesiaData!.inductionAgent}
                                            onChange={(e) => handleUpdateAnesthesiaField(note.id, "inductionAgent", e.target.value)}
                                            placeholder="e.g., Propofol"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`inductionDose-${note.id}`}>Induction Dose</Label>
                                          <Input
                                            id={`inductionDose-${note.id}`}
                                            value={note.anesthesiaData!.inductionDose}
                                            onChange={(e) => handleUpdateAnesthesiaField(note.id, "inductionDose", e.target.value)}
                                            placeholder="e.g., 4 mg/kg IV"
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`maintenanceAgent-${note.id}`}>Maintenance Agent</Label>
                                          <Input
                                            id={`maintenanceAgent-${note.id}`}
                                            value={note.anesthesiaData!.maintenanceAgent}
                                            onChange={(e) => handleUpdateAnesthesiaField(note.id, "maintenanceAgent", e.target.value)}
                                            placeholder="e.g., Isoflurane"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`maintenanceMethod-${note.id}`}>Maintenance Method</Label>
                                          <Input
                                            id={`maintenanceMethod-${note.id}`}
                                            value={note.anesthesiaData!.maintenanceMethod}
                                            onChange={(e) => handleUpdateAnesthesiaField(note.id, "maintenanceMethod", e.target.value)}
                                            placeholder="e.g., Isoflurane 1.5% via endotracheal tube"
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`reversalAgent-${note.id}`}>Reversal Agent</Label>
                                          <Input
                                            id={`reversalAgent-${note.id}`}
                                            value={note.anesthesiaData!.reversalAgent}
                                            onChange={(e) => handleUpdateAnesthesiaField(note.id, "reversalAgent", e.target.value)}
                                            placeholder="e.g., Atipamezole"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`reversalDose-${note.id}`}>Reversal Dose</Label>
                                          <Input
                                            id={`reversalDose-${note.id}`}
                                            value={note.anesthesiaData!.reversalDose}
                                            onChange={(e) => handleUpdateAnesthesiaField(note.id, "reversalDose", e.target.value)}
                                            placeholder="e.g., 0.1 mg/kg IM"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Airway Management */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Airway Management</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`airwayType-${note.id}`}>Airway Type</Label>
                                        <Select
                                          value={note.anesthesiaData!.airwayType}
                                          onValueChange={(value) => handleUpdateAnesthesiaField(note.id, "airwayType", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select airway type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Endotracheal tube">Endotracheal tube</SelectItem>
                                            <SelectItem value="Laryngeal mask">Laryngeal mask</SelectItem>
                                            <SelectItem value="Face mask">Face mask</SelectItem>
                                            <SelectItem value="Nasal cannula">Nasal cannula</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`airwaySize-${note.id}`}>Airway Size</Label>
                                        <Input
                                          id={`airwaySize-${note.id}`}
                                          value={note.anesthesiaData!.airwaySize}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "airwaySize", e.target.value)}
                                          placeholder="e.g., 6.0 mm"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`intubationDifficulty-${note.id}`}>Intubation Difficulty</Label>
                                        <Select
                                          value={note.anesthesiaData!.intubationDifficulty}
                                          onValueChange={(value) => handleUpdateAnesthesiaField(note.id, "intubationDifficulty", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select difficulty" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Easy">Easy</SelectItem>
                                            <SelectItem value="Moderate">Moderate</SelectItem>
                                            <SelectItem value="Difficult">Difficult</SelectItem>
                                            <SelectItem value="Very Difficult">Very Difficult</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Monitoring */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Monitoring</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label>Monitoring Equipment</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.anesthesiaData!.monitoringEquipment.map((equipment, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {equipment}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromAnesthesiaList(note.id, "monitoringEquipment", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add equipment (e.g., ECG, Pulse oximeter, Capnography)"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToAnesthesiaList(note.id, "monitoringEquipment", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToAnesthesiaList(note.id, "monitoringEquipment", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                          <h4 className="text-sm font-medium">Baseline Vital Signs</h4>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                              <Label htmlFor={`baselineHR-${note.id}`} className="text-xs">Heart Rate (bpm)</Label>
                                              <Input
                                                id={`baselineHR-${note.id}`}
                                                value={note.anesthesiaData!.baselineHeartRate}
                                                onChange={(e) => handleUpdateAnesthesiaField(note.id, "baselineHeartRate", e.target.value)}
                                                placeholder="bpm"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label htmlFor={`baselineRR-${note.id}`} className="text-xs">Respiratory Rate (rpm)</Label>
                                              <Input
                                                id={`baselineRR-${note.id}`}
                                                value={note.anesthesiaData!.baselineRespiratoryRate}
                                                onChange={(e) => handleUpdateAnesthesiaField(note.id, "baselineRespiratoryRate", e.target.value)}
                                                placeholder="rpm"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label htmlFor={`baselineBP-${note.id}`} className="text-xs">Blood Pressure (mmHg)</Label>
                                              <Input
                                                id={`baselineBP-${note.id}`}
                                                value={note.anesthesiaData!.baselineBloodPressure}
                                                onChange={(e) => handleUpdateAnesthesiaField(note.id, "baselineBloodPressure", e.target.value)}
                                                placeholder="mmHg"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label htmlFor={`baselineTemp-${note.id}`} className="text-xs">Temperature (°F)</Label>
                                              <Input
                                                id={`baselineTemp-${note.id}`}
                                                value={note.anesthesiaData!.baselineTemperature}
                                                onChange={(e) => handleUpdateAnesthesiaField(note.id, "baselineTemperature", e.target.value)}
                                                placeholder="°F"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label htmlFor={`baselineSpO2-${note.id}`} className="text-xs">SpO2 (%)</Label>
                                              <Input
                                                id={`baselineSpO2-${note.id}`}
                                                value={note.anesthesiaData!.baselineSpO2}
                                                onChange={(e) => handleUpdateAnesthesiaField(note.id, "baselineSpO2", e.target.value)}
                                                placeholder="%"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <div className="space-y-3">
                                          <h4 className="text-sm font-medium">Intraoperative Vital Signs</h4>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                              <Label htmlFor={`intraopHR-${note.id}`} className="text-xs">Heart Rate (bpm)</Label>
                                              <Input
                                                id={`intraopHR-${note.id}`}
                                                value={note.anesthesiaData!.intraopHeartRate}
                                                onChange={(e) => handleUpdateAnesthesiaField(note.id, "intraopHeartRate", e.target.value)}
                                                placeholder="bpm"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label htmlFor={`intraopRR-${note.id}`} className="text-xs">Respiratory Rate (rpm)</Label>
                                              <Input
                                                id={`intraopRR-${note.id}`}
                                                value={note.anesthesiaData!.intraopRespiratoryRate}
                                                onChange={(e) => handleUpdateAnesthesiaField(note.id, "intraopRespiratoryRate", e.target.value)}
                                                placeholder="rpm"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label htmlFor={`intraopBP-${note.id}`} className="text-xs">Blood Pressure (mmHg)</Label>
                                              <Input
                                                id={`intraopBP-${note.id}`}
                                                value={note.anesthesiaData!.intraopBloodPressure}
                                                onChange={(e) => handleUpdateAnesthesiaField(note.id, "intraopBloodPressure", e.target.value)}
                                                placeholder="mmHg"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label htmlFor={`intraopTemp-${note.id}`} className="text-xs">Temperature (°F)</Label>
                                              <Input
                                                id={`intraopTemp-${note.id}`}
                                                value={note.anesthesiaData!.intraopTemperature}
                                                onChange={(e) => handleUpdateAnesthesiaField(note.id, "intraopTemperature", e.target.value)}
                                                placeholder="°F"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label htmlFor={`intraopSpO2-${note.id}`} className="text-xs">SpO2 (%)</Label>
                                              <Input
                                                id={`intraopSpO2-${note.id}`}
                                                value={note.anesthesiaData!.intraopSpO2}
                                                onChange={(e) => handleUpdateAnesthesiaField(note.id, "intraopSpO2", e.target.value)}
                                                placeholder="%"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Fluid Management */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Fluid Management</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`fluidsAdministered-${note.id}`}>Fluids Administered</Label>
                                        <Input
                                          id={`fluidsAdministered-${note.id}`}
                                          value={note.anesthesiaData!.fluidsAdministered}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "fluidsAdministered", e.target.value)}
                                          placeholder="e.g., 250 ml"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`fluidType-${note.id}`}>Fluid Type</Label>
                                        <Input
                                          id={`fluidType-${note.id}`}
                                          value={note.anesthesiaData!.fluidType}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "fluidType", e.target.value)}
                                          placeholder="e.g., Lactated Ringer's"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`fluidRate-${note.id}`}>Fluid Rate</Label>
                                        <Input
                                          id={`fluidRate-${note.id}`}
                                          value={note.anesthesiaData!.fluidRate}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "fluidRate", e.target.value)}
                                          placeholder="e.g., 10 ml/kg/hr"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Complications & Adverse Events */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Complications & Adverse Events</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`complications-${note.id}`}>Complications</Label>
                                        <Textarea
                                          id={`complications-${note.id}`}
                                          value={note.anesthesiaData!.complications}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "complications", e.target.value)}
                                          placeholder="Document any complications encountered during anesthesia"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Adverse Events</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.anesthesiaData!.adverseEvents.map((event, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {event}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromAnesthesiaList(note.id, "adverseEvents", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add adverse event"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToAnesthesiaList(note.id, "adverseEvents", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToAnesthesiaList(note.id, "adverseEvents", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Recovery */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Recovery</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`recoveryTime-${note.id}`}>Recovery Time</Label>
                                          <Input
                                            id={`recoveryTime-${note.id}`}
                                            value={note.anesthesiaData!.recoveryTime}
                                            onChange={(e) => handleUpdateAnesthesiaField(note.id, "recoveryTime", e.target.value)}
                                            placeholder="e.g., 15 minutes"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`recoveryQuality-${note.id}`}>Recovery Quality</Label>
                                          <Select
                                            value={note.anesthesiaData!.recoveryQuality}
                                            onValueChange={(value) => handleUpdateAnesthesiaField(note.id, "recoveryQuality", value)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select recovery quality" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Smooth">Smooth</SelectItem>
                                              <SelectItem value="Prolonged">Prolonged</SelectItem>
                                              <SelectItem value="Agitated">Agitated</SelectItem>
                                              <SelectItem value="Delayed">Delayed</SelectItem>
                                              <SelectItem value="Eventful">Eventful</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`extubationTime-${note.id}`}>Extubation Time</Label>
                                        <Input
                                          id={`extubationTime-${note.id}`}
                                          type="time"
                                          value={note.anesthesiaData!.extubationTime}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "extubationTime", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`recoveryMonitoring-${note.id}`}>Recovery Monitoring</Label>
                                        <Textarea
                                          id={`recoveryMonitoring-${note.id}`}
                                          value={note.anesthesiaData!.recoveryMonitoring}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "recoveryMonitoring", e.target.value)}
                                          placeholder="Monitoring performed during recovery period"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`postAnesthesiaVitalSigns-${note.id}`}>Post-Anesthesia Vital Signs</Label>
                                        <Textarea
                                          id={`postAnesthesiaVitalSigns-${note.id}`}
                                          value={note.anesthesiaData!.postAnesthesiaVitalSigns}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "postAnesthesiaVitalSigns", e.target.value)}
                                          placeholder="Vital signs after recovery"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Post-Anesthesia Plan */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Post-Anesthesia Plan</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`postAnesthesiaInstructions-${note.id}`}>Post-Anesthesia Instructions</Label>
                                        <Textarea
                                          id={`postAnesthesiaInstructions-${note.id}`}
                                          value={note.anesthesiaData!.postAnesthesiaInstructions}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "postAnesthesiaInstructions", e.target.value)}
                                          placeholder="Instructions for post-anesthesia care"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`monitoringRequirements-${note.id}`}>Monitoring Requirements</Label>
                                        <Textarea
                                          id={`monitoringRequirements-${note.id}`}
                                          value={note.anesthesiaData!.monitoringRequirements}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "monitoringRequirements", e.target.value)}
                                          placeholder="Ongoing monitoring requirements"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`followUp-${note.id}`}>Follow-Up</Label>
                                        <Textarea
                                          id={`followUp-${note.id}`}
                                          value={note.anesthesiaData!.followUp}
                                          onChange={(e) => handleUpdateAnesthesiaField(note.id, "followUp", e.target.value)}
                                          placeholder="Follow-up appointments or monitoring"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Additional Notes */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`additionalNotes-${note.id}`}>Additional Notes</Label>
                                      <Textarea
                                        id={`additionalNotes-${note.id}`}
                                        value={note.anesthesiaData!.additionalNotes}
                                        onChange={(e) => handleUpdateAnesthesiaField(note.id, "additionalNotes", e.target.value)}
                                        placeholder="Any additional relevant information"
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : isDischargeNote ? (
                                // Render Discharge form
                                <div className="space-y-8">
                                  {/* Provider & Patient Info */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Provider & Patient Information</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`dischargingVet-${note.id}`}>Discharging Veterinarian</Label>
                                        <Input
                                          id={`dischargingVet-${note.id}`}
                                          value={note.dischargeData!.dischargingVeterinarian}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "dischargingVeterinarian", e.target.value)}
                                          placeholder="Enter discharging veterinarian name"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`patientName-${note.id}`}>Patient Name</Label>
                                        <Input
                                          id={`patientName-${note.id}`}
                                          value={note.dischargeData!.patientName}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "patientName", e.target.value)}
                                          placeholder="Patient name"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`ownerName-${note.id}`}>Owner Name</Label>
                                        <Input
                                          id={`ownerName-${note.id}`}
                                          value={note.dischargeData!.ownerName}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "ownerName", e.target.value)}
                                          placeholder="Owner name"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Date & Time */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Date & Time</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`dischargeDate-${note.id}`}>Discharge Date</Label>
                                        <Input
                                          id={`dischargeDate-${note.id}`}
                                          type="date"
                                          value={note.dischargeData!.dischargeDate}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "dischargeDate", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`dischargeTime-${note.id}`}>Discharge Time</Label>
                                        <Input
                                          id={`dischargeTime-${note.id}`}
                                          type="time"
                                          value={note.dischargeData!.dischargeTime}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "dischargeTime", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`admissionDate-${note.id}`}>Admission Date</Label>
                                        <Input
                                          id={`admissionDate-${note.id}`}
                                          type="date"
                                          value={note.dischargeData!.admissionDate}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "admissionDate", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`admissionTime-${note.id}`}>Admission Time</Label>
                                        <Input
                                          id={`admissionTime-${note.id}`}
                                          type="time"
                                          value={note.dischargeData!.admissionTime}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "admissionTime", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`lengthOfStay-${note.id}`}>Length of Stay</Label>
                                        <Input
                                          id={`lengthOfStay-${note.id}`}
                                          value={note.dischargeData!.lengthOfStay}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "lengthOfStay", e.target.value)}
                                          placeholder="e.g., 2 days, 3 hours"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Visit/Admission Information */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Visit/Admission Information</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`reasonForVisit-${note.id}`}>Reason for Visit</Label>
                                        <Input
                                          id={`reasonForVisit-${note.id}`}
                                          value={note.dischargeData!.reasonForVisit}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "reasonForVisit", e.target.value)}
                                          placeholder="Reason for visit/admission"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`chiefComplaint-${note.id}`}>Chief Complaint</Label>
                                        <Textarea
                                          id={`chiefComplaint-${note.id}`}
                                          value={note.dischargeData!.chiefComplaint}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "chiefComplaint", e.target.value)}
                                          placeholder="Chief complaint at presentation"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Diagnosis */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Diagnosis</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`primaryDiagnosis-${note.id}`}>Primary Diagnosis</Label>
                                        <Input
                                          id={`primaryDiagnosis-${note.id}`}
                                          value={note.dischargeData!.primaryDiagnosis}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "primaryDiagnosis", e.target.value)}
                                          placeholder="Primary diagnosis"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Secondary Diagnoses</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.dischargeData!.secondaryDiagnoses.map((diagnosis, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {diagnosis}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromDischargeList(note.id, "secondaryDiagnoses", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add secondary diagnosis"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToDischargeList(note.id, "secondaryDiagnoses", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToDischargeList(note.id, "secondaryDiagnoses", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Treatment Summary */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Treatment Summary</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`treatmentSummary-${note.id}`}>Treatment Summary</Label>
                                        <Textarea
                                          id={`treatmentSummary-${note.id}`}
                                          value={note.dischargeData!.treatmentSummary}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "treatmentSummary", e.target.value)}
                                          placeholder="Summary of treatments provided during visit/admission"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Procedures Performed</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.dischargeData!.proceduresPerformed.map((procedure, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {procedure}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromDischargeList(note.id, "proceduresPerformed", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add procedure"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToDischargeList(note.id, "proceduresPerformed", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToDischargeList(note.id, "proceduresPerformed", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Medications Prescribed */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Medications Prescribed</h3>
                                    </div>
                                    <div className="space-y-3">
                                      {note.dischargeData!.medications.map((med, index) => (
                                        <Card key={index} className="p-4">
                                          <div className="flex items-start justify-between mb-3">
                                            <h4 className="font-medium">Medication {index + 1}</h4>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => handleRemoveDischargeMedication(note.id, index)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                              <Label className="text-xs">Medication Name</Label>
                                              <Input
                                                value={med.name}
                                                onChange={(e) => handleUpdateDischargeMedication(note.id, index, "name", e.target.value)}
                                                placeholder="Medication name"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-xs">Dosage</Label>
                                              <Input
                                                value={med.dosage}
                                                onChange={(e) => handleUpdateDischargeMedication(note.id, index, "dosage", e.target.value)}
                                                placeholder="e.g., 10 mg"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-xs">Frequency</Label>
                                              <Input
                                                value={med.frequency}
                                                onChange={(e) => handleUpdateDischargeMedication(note.id, index, "frequency", e.target.value)}
                                                placeholder="e.g., Twice daily"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-xs">Duration</Label>
                                              <Input
                                                value={med.duration}
                                                onChange={(e) => handleUpdateDischargeMedication(note.id, index, "duration", e.target.value)}
                                                placeholder="e.g., 7 days"
                                              />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                              <Label className="text-xs">Instructions</Label>
                                              <Textarea
                                                value={med.instructions}
                                                onChange={(e) => handleUpdateDischargeMedication(note.id, index, "instructions", e.target.value)}
                                                placeholder="Special instructions"
                                                className="min-h-[60px]"
                                              />
                                            </div>
                                          </div>
                                        </Card>
                                      ))}
                                      <Button
                                        variant="outline"
                                        onClick={() => handleAddDischargeMedication(note.id, {name: "", dosage: "", frequency: "", duration: "", instructions: ""})}
                                        className="w-full"
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Medication
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Instructions for Owner */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Instructions for Owner</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`homeCareInstructions-${note.id}`}>Home Care Instructions</Label>
                                        <Textarea
                                          id={`homeCareInstructions-${note.id}`}
                                          value={note.dischargeData!.homeCareInstructions}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "homeCareInstructions", e.target.value)}
                                          placeholder="Detailed home care instructions for the owner"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`activityRestrictions-${note.id}`}>Activity Restrictions</Label>
                                        <Textarea
                                          id={`activityRestrictions-${note.id}`}
                                          value={note.dischargeData!.activityRestrictions}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "activityRestrictions", e.target.value)}
                                          placeholder="Activity restrictions and limitations"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`dietInstructions-${note.id}`}>Diet Instructions</Label>
                                        <Textarea
                                          id={`dietInstructions-${note.id}`}
                                          value={note.dischargeData!.dietInstructions}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "dietInstructions", e.target.value)}
                                          placeholder="Dietary recommendations and restrictions"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Follow-up Care */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Follow-up Care</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`followUpAppointments-${note.id}`}>Follow-up Appointments</Label>
                                        <Textarea
                                          id={`followUpAppointments-${note.id}`}
                                          value={note.dischargeData!.followUpAppointments}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "followUpAppointments", e.target.value)}
                                          placeholder="Scheduled follow-up appointments"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`followUpInstructions-${note.id}`}>Follow-up Instructions</Label>
                                        <Textarea
                                          id={`followUpInstructions-${note.id}`}
                                          value={note.dischargeData!.followUpInstructions}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "followUpInstructions", e.target.value)}
                                          placeholder="Instructions for follow-up care"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`recheckDate-${note.id}`}>Recheck Date</Label>
                                        <Input
                                          id={`recheckDate-${note.id}`}
                                          type="date"
                                          value={note.dischargeData!.recheckDate}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "recheckDate", e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Warning Signs */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Warning Signs</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label>Warning Signs to Watch For</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.dischargeData!.warningSigns.map((sign, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {sign}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromDischargeList(note.id, "warningSigns", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add warning sign"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToDischargeList(note.id, "warningSigns", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToDischargeList(note.id, "warningSigns", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`whenToSeekEmergencyCare-${note.id}`}>When to Seek Emergency Care</Label>
                                        <Textarea
                                          id={`whenToSeekEmergencyCare-${note.id}`}
                                          value={note.dischargeData!.whenToSeekEmergencyCare}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "whenToSeekEmergencyCare", e.target.value)}
                                          placeholder="Specific situations when owner should seek emergency care"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Discharge Condition */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Discharge Condition</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`dischargeCondition-${note.id}`}>Discharge Condition</Label>
                                        <Select
                                          value={note.dischargeData!.dischargeCondition}
                                          onValueChange={(value) => handleUpdateDischargeField(note.id, "dischargeCondition", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select condition" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Stable">Stable</SelectItem>
                                            <SelectItem value="Improved">Improved</SelectItem>
                                            <SelectItem value="Guarded">Guarded</SelectItem>
                                            <SelectItem value="Critical">Critical</SelectItem>
                                            <SelectItem value="Fair">Fair</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`dischargeStatus-${note.id}`}>Discharge Status</Label>
                                        <Select
                                          value={note.dischargeData!.dischargeStatus}
                                          onValueChange={(value) => handleUpdateDischargeField(note.id, "dischargeStatus", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Discharged to owner">Discharged to owner</SelectItem>
                                            <SelectItem value="Transferred">Transferred</SelectItem>
                                            <SelectItem value="Against medical advice">Against medical advice</SelectItem>
                                            <SelectItem value="Deceased">Deceased</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Owner Education */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Owner Education</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`ownerEducation-${note.id}`}>Owner Education</Label>
                                        <Textarea
                                          id={`ownerEducation-${note.id}`}
                                          value={note.dischargeData!.ownerEducation}
                                          onChange={(e) => handleUpdateDischargeField(note.id, "ownerEducation", e.target.value)}
                                          placeholder="Educational information provided to owner"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`questionsAnswered-${note.id}`}
                                            checked={note.dischargeData!.questionsAnswered}
                                            onChange={(e) => handleUpdateDischargeField(note.id, "questionsAnswered", e.target.checked)}
                                            className="rounded border-gray-300"
                                          />
                                          <Label htmlFor={`questionsAnswered-${note.id}`} className="font-normal cursor-pointer">
                                            Owner's questions were answered
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`instructionsUnderstood-${note.id}`}
                                            checked={note.dischargeData!.instructionsUnderstood}
                                            onChange={(e) => handleUpdateDischargeField(note.id, "instructionsUnderstood", e.target.checked)}
                                            className="rounded border-gray-300"
                                          />
                                          <Label htmlFor={`instructionsUnderstood-${note.id}`} className="font-normal cursor-pointer">
                                            Owner understood discharge instructions
                                          </Label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Additional Notes */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`additionalNotes-${note.id}`}>Additional Notes</Label>
                                      <Textarea
                                        id={`additionalNotes-${note.id}`}
                                        value={note.dischargeData!.additionalNotes}
                                        onChange={(e) => handleUpdateDischargeField(note.id, "additionalNotes", e.target.value)}
                                        placeholder="Any additional relevant information"
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : isFollowUpNote ? (
                                // Render Follow-up form
                                <div className="space-y-8">
                                  {/* Provider & Patient Info */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Provider & Patient Information</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`vetName-${note.id}`}>Veterinarian Name</Label>
                                        <Input
                                          id={`vetName-${note.id}`}
                                          value={note.followUpData!.veterinarianName}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "veterinarianName", e.target.value)}
                                          placeholder="Enter veterinarian name"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`patientName-${note.id}`}>Patient Name</Label>
                                        <Input
                                          id={`patientName-${note.id}`}
                                          value={note.followUpData!.patientName}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "patientName", e.target.value)}
                                          placeholder="Patient name"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`ownerName-${note.id}`}>Owner Name</Label>
                                        <Input
                                          id={`ownerName-${note.id}`}
                                          value={note.followUpData!.ownerName}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "ownerName", e.target.value)}
                                          placeholder="Owner name"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Date & Time */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Date & Time</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`followUpDate-${note.id}`}>Follow-up Date</Label>
                                        <Input
                                          id={`followUpDate-${note.id}`}
                                          type="date"
                                          value={note.followUpData!.followUpDate}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "followUpDate", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`followUpTime-${note.id}`}>Follow-up Time</Label>
                                        <Input
                                          id={`followUpTime-${note.id}`}
                                          type="time"
                                          value={note.followUpData!.followUpTime}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "followUpTime", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`originalVisitDate-${note.id}`}>Original Visit Date</Label>
                                        <Input
                                          id={`originalVisitDate-${note.id}`}
                                          type="date"
                                          value={note.followUpData!.originalVisitDate}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "originalVisitDate", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`daysSinceLastVisit-${note.id}`}>Days Since Last Visit</Label>
                                        <Input
                                          id={`daysSinceLastVisit-${note.id}`}
                                          value={note.followUpData!.daysSinceLastVisit}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "daysSinceLastVisit", e.target.value)}
                                          placeholder="e.g., 7 days"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Visit Information */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Visit Information</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`visitType-${note.id}`}>Visit Type</Label>
                                        <Select
                                          value={note.followUpData!.visitType}
                                          onValueChange={(value) => handleUpdateFollowUpField(note.id, "visitType", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select visit type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Recheck">Recheck</SelectItem>
                                            <SelectItem value="Progress check">Progress check</SelectItem>
                                            <SelectItem value="Post-operative">Post-operative</SelectItem>
                                            <SelectItem value="Routine follow-up">Routine follow-up</SelectItem>
                                            <SelectItem value="Emergency follow-up">Emergency follow-up</SelectItem>
                                            <SelectItem value="Phone consultation">Phone consultation</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`reasonForFollowUp-${note.id}`}>Reason for Follow-up</Label>
                                        <Textarea
                                          id={`reasonForFollowUp-${note.id}`}
                                          value={note.followUpData!.reasonForFollowUp}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "reasonForFollowUp", e.target.value)}
                                          placeholder="Reason for this follow-up visit"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`chiefComplaint-${note.id}`}>Chief Complaint</Label>
                                        <Textarea
                                          id={`chiefComplaint-${note.id}`}
                                          value={note.followUpData!.chiefComplaint}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "chiefComplaint", e.target.value)}
                                          placeholder="Current chief complaint"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Previous Visit Summary */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Previous Visit Summary</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`previousDiagnosis-${note.id}`}>Previous Diagnosis</Label>
                                        <Input
                                          id={`previousDiagnosis-${note.id}`}
                                          value={note.followUpData!.previousDiagnosis}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "previousDiagnosis", e.target.value)}
                                          placeholder="Diagnosis from previous visit"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`previousTreatment-${note.id}`}>Previous Treatment</Label>
                                        <Textarea
                                          id={`previousTreatment-${note.id}`}
                                          value={note.followUpData!.previousTreatment}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "previousTreatment", e.target.value)}
                                          placeholder="Treatment provided during previous visit"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Current Assessment */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Current Assessment</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`currentStatus-${note.id}`}>Current Status</Label>
                                        <Textarea
                                          id={`currentStatus-${note.id}`}
                                          value={note.followUpData!.currentStatus}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "currentStatus", e.target.value)}
                                          placeholder="Current patient status and condition"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`improvement-${note.id}`}>Improvement Status</Label>
                                        <Select
                                          value={note.followUpData!.improvement}
                                          onValueChange={(value) => handleUpdateFollowUpField(note.id, "improvement", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select improvement status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Resolved">Resolved</SelectItem>
                                            <SelectItem value="Improved">Improved</SelectItem>
                                            <SelectItem value="No change">No change</SelectItem>
                                            <SelectItem value="Worse">Worse</SelectItem>
                                            <SelectItem value="Stable">Stable</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Current Symptoms</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.followUpData!.currentSymptoms.map((symptom, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {symptom}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromFollowUpList(note.id, "currentSymptoms", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add symptom"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToFollowUpList(note.id, "currentSymptoms", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToFollowUpList(note.id, "currentSymptoms", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Physical Examination */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Physical Examination</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`physicalExamFindings-${note.id}`}>Physical Exam Findings</Label>
                                        <Textarea
                                          id={`physicalExamFindings-${note.id}`}
                                          value={note.followUpData!.physicalExamFindings}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "physicalExamFindings", e.target.value)}
                                          placeholder="Physical examination findings"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <h4 className="text-sm font-medium">Vital Signs</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                          <div className="space-y-1">
                                            <Label htmlFor={`temp-${note.id}`} className="text-xs">Temperature (°F)</Label>
                                            <Input
                                              id={`temp-${note.id}`}
                                              value={note.followUpData!.vitalSigns.temperature}
                                              onChange={(e) => handleUpdateFollowUpVitalSign(note.id, "temperature", e.target.value)}
                                              placeholder="°F"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label htmlFor={`hr-${note.id}`} className="text-xs">Heart Rate (bpm)</Label>
                                            <Input
                                              id={`hr-${note.id}`}
                                              value={note.followUpData!.vitalSigns.heartRate}
                                              onChange={(e) => handleUpdateFollowUpVitalSign(note.id, "heartRate", e.target.value)}
                                              placeholder="bpm"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label htmlFor={`rr-${note.id}`} className="text-xs">Respiratory Rate (rpm)</Label>
                                            <Input
                                              id={`rr-${note.id}`}
                                              value={note.followUpData!.vitalSigns.respiratoryRate}
                                              onChange={(e) => handleUpdateFollowUpVitalSign(note.id, "respiratoryRate", e.target.value)}
                                              placeholder="rpm"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label htmlFor={`weight-${note.id}`} className="text-xs">Weight (kg)</Label>
                                            <Input
                                              id={`weight-${note.id}`}
                                              value={note.followUpData!.vitalSigns.weight}
                                              onChange={(e) => handleUpdateFollowUpVitalSign(note.id, "weight", e.target.value)}
                                              placeholder="kg"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label htmlFor={`bcs-${note.id}`} className="text-xs">Body Condition Score</Label>
                                            <Input
                                              id={`bcs-${note.id}`}
                                              value={note.followUpData!.vitalSigns.bodyConditionScore}
                                              onChange={(e) => handleUpdateFollowUpVitalSign(note.id, "bodyConditionScore", e.target.value)}
                                              placeholder="1-9"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Assessment */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Assessment</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`currentAssessment-${note.id}`}>Current Assessment</Label>
                                        <Textarea
                                          id={`currentAssessment-${note.id}`}
                                          value={note.followUpData!.currentAssessment}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "currentAssessment", e.target.value)}
                                          placeholder="Clinical assessment and interpretation"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`diagnosis-${note.id}`}>Diagnosis</Label>
                                        <Input
                                          id={`diagnosis-${note.id}`}
                                          value={note.followUpData!.diagnosis}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "diagnosis", e.target.value)}
                                          placeholder="Current diagnosis"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Differential Diagnoses</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.followUpData!.differentialDiagnoses.map((diagnosis, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {diagnosis}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromFollowUpList(note.id, "differentialDiagnoses", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add differential diagnosis"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToFollowUpList(note.id, "differentialDiagnoses", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToFollowUpList(note.id, "differentialDiagnoses", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Treatment Plan */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Treatment Plan</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`treatmentPlan-${note.id}`}>Treatment Plan</Label>
                                        <Textarea
                                          id={`treatmentPlan-${note.id}`}
                                          value={note.followUpData!.treatmentPlan}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "treatmentPlan", e.target.value)}
                                          placeholder="Treatment plan and recommendations"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <Label>Medications</Label>
                                        {note.followUpData!.medications.map((med, index) => (
                                          <Card key={index} className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                              <h4 className="font-medium">Medication {index + 1}</h4>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveFollowUpMedication(note.id, index)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                              <div className="space-y-2">
                                                <Label className="text-xs">Medication Name</Label>
                                                <Input
                                                  value={med.name}
                                                  onChange={(e) => handleUpdateFollowUpMedication(note.id, index, "name", e.target.value)}
                                                  placeholder="Medication name"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label className="text-xs">Dosage</Label>
                                                <Input
                                                  value={med.dosage}
                                                  onChange={(e) => handleUpdateFollowUpMedication(note.id, index, "dosage", e.target.value)}
                                                  placeholder="e.g., 10 mg"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label className="text-xs">Frequency</Label>
                                                <Input
                                                  value={med.frequency}
                                                  onChange={(e) => handleUpdateFollowUpMedication(note.id, index, "frequency", e.target.value)}
                                                  placeholder="e.g., Twice daily"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label className="text-xs">Duration</Label>
                                                <Input
                                                  value={med.duration}
                                                  onChange={(e) => handleUpdateFollowUpMedication(note.id, index, "duration", e.target.value)}
                                                  placeholder="e.g., 7 days"
                                                />
                                              </div>
                                              <div className="space-y-2 col-span-2">
                                                <Label className="text-xs">Instructions</Label>
                                                <Textarea
                                                  value={med.instructions}
                                                  onChange={(e) => handleUpdateFollowUpMedication(note.id, index, "instructions", e.target.value)}
                                                  placeholder="Special instructions"
                                                  className="min-h-[60px]"
                                                />
                                              </div>
                                            </div>
                                          </Card>
                                        ))}
                                        <Button
                                          variant="outline"
                                          onClick={() => handleAddFollowUpMedication(note.id, {name: "", dosage: "", frequency: "", duration: "", instructions: ""})}
                                          className="w-full"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add Medication
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Recommendations */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`recommendations-${note.id}`}>Recommendations</Label>
                                        <Textarea
                                          id={`recommendations-${note.id}`}
                                          value={note.followUpData!.recommendations}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "recommendations", e.target.value)}
                                          placeholder="General recommendations for the owner"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`activityRestrictions-${note.id}`}>Activity Restrictions</Label>
                                        <Textarea
                                          id={`activityRestrictions-${note.id}`}
                                          value={note.followUpData!.activityRestrictions}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "activityRestrictions", e.target.value)}
                                          placeholder="Activity restrictions and limitations"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`dietRecommendations-${note.id}`}>Diet Recommendations</Label>
                                        <Textarea
                                          id={`dietRecommendations-${note.id}`}
                                          value={note.followUpData!.dietRecommendations}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "dietRecommendations", e.target.value)}
                                          placeholder="Dietary recommendations"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Follow-up Plan */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Follow-up Plan</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`nextFollowUpDate-${note.id}`}>Next Follow-up Date</Label>
                                        <Input
                                          id={`nextFollowUpDate-${note.id}`}
                                          type="date"
                                          value={note.followUpData!.nextFollowUpDate}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "nextFollowUpDate", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`nextFollowUpInstructions-${note.id}`}>Next Follow-up Instructions</Label>
                                        <Textarea
                                          id={`nextFollowUpInstructions-${note.id}`}
                                          value={note.followUpData!.nextFollowUpInstructions}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "nextFollowUpInstructions", e.target.value)}
                                          placeholder="Instructions for next follow-up visit"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`followUpInterval-${note.id}`}>Follow-up Interval</Label>
                                        <Input
                                          id={`followUpInterval-${note.id}`}
                                          value={note.followUpData!.followUpInterval}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "followUpInterval", e.target.value)}
                                          placeholder="e.g., 2 weeks, 1 month"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Owner Communication */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Owner Communication</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`ownerConcerns-${note.id}`}>Owner Concerns</Label>
                                        <Textarea
                                          id={`ownerConcerns-${note.id}`}
                                          value={note.followUpData!.ownerConcerns}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "ownerConcerns", e.target.value)}
                                          placeholder="Owner's concerns and questions"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`ownerQuestions-${note.id}`}>Owner Questions</Label>
                                        <Textarea
                                          id={`ownerQuestions-${note.id}`}
                                          value={note.followUpData!.ownerQuestions}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "ownerQuestions", e.target.value)}
                                          placeholder="Questions asked by owner"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`ownerEducation-${note.id}`}>Owner Education</Label>
                                        <Textarea
                                          id={`ownerEducation-${note.id}`}
                                          value={note.followUpData!.ownerEducation}
                                          onChange={(e) => handleUpdateFollowUpField(note.id, "ownerEducation", e.target.value)}
                                          placeholder="Educational information provided to owner"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Additional Notes */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`additionalNotes-${note.id}`}>Additional Notes</Label>
                                      <Textarea
                                        id={`additionalNotes-${note.id}`}
                                        value={note.followUpData!.additionalNotes}
                                        onChange={(e) => handleUpdateFollowUpField(note.id, "additionalNotes", e.target.value)}
                                        placeholder="Any additional relevant information"
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : isProgressNote ? (
                                // Render Progress form
                                <div className="space-y-8">
                                  {/* Provider & Patient Info */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Provider & Patient Information</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`vetName-${note.id}`}>Veterinarian Name</Label>
                                        <Input
                                          id={`vetName-${note.id}`}
                                          value={note.progressData!.veterinarianName}
                                          onChange={(e) => handleUpdateProgressField(note.id, "veterinarianName", e.target.value)}
                                          placeholder="Enter veterinarian name"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`patientName-${note.id}`}>Patient Name</Label>
                                        <Input
                                          id={`patientName-${note.id}`}
                                          value={note.progressData!.patientName}
                                          onChange={(e) => handleUpdateProgressField(note.id, "patientName", e.target.value)}
                                          placeholder="Patient name"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`ownerName-${note.id}`}>Owner Name</Label>
                                        <Input
                                          id={`ownerName-${note.id}`}
                                          value={note.progressData!.ownerName}
                                          onChange={(e) => handleUpdateProgressField(note.id, "ownerName", e.target.value)}
                                          placeholder="Owner name"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Date & Time */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Date & Time</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`progressDate-${note.id}`}>Progress Note Date</Label>
                                        <Input
                                          id={`progressDate-${note.id}`}
                                          type="date"
                                          value={note.progressData!.progressDate}
                                          onChange={(e) => handleUpdateProgressField(note.id, "progressDate", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`progressTime-${note.id}`}>Progress Note Time</Label>
                                        <Input
                                          id={`progressTime-${note.id}`}
                                          type="time"
                                          value={note.progressData!.progressTime}
                                          onChange={(e) => handleUpdateProgressField(note.id, "progressTime", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`admissionDate-${note.id}`}>Admission Date</Label>
                                        <Input
                                          id={`admissionDate-${note.id}`}
                                          type="date"
                                          value={note.progressData!.admissionDate}
                                          onChange={(e) => handleUpdateProgressField(note.id, "admissionDate", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`daysSinceAdmission-${note.id}`}>Days Since Admission</Label>
                                        <Input
                                          id={`daysSinceAdmission-${note.id}`}
                                          value={note.progressData!.daysSinceAdmission}
                                          onChange={(e) => handleUpdateProgressField(note.id, "daysSinceAdmission", e.target.value)}
                                          placeholder="e.g., 3"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Visit Information */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Visit Information</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`visitType-${note.id}`}>Visit Type</Label>
                                        <Select
                                          value={note.progressData!.visitType}
                                          onValueChange={(value) => handleUpdateProgressField(note.id, "visitType", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select visit type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Daily progress">Daily progress</SelectItem>
                                            <SelectItem value="Post-operative day X">Post-operative day X</SelectItem>
                                            <SelectItem value="Hospitalization day X">Hospitalization day X</SelectItem>
                                            <SelectItem value="Routine check">Routine check</SelectItem>
                                            <SelectItem value="Status update">Status update</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`reasonForNote-${note.id}`}>Reason for Note</Label>
                                        <Textarea
                                          id={`reasonForNote-${note.id}`}
                                          value={note.progressData!.reasonForNote}
                                          onChange={(e) => handleUpdateProgressField(note.id, "reasonForNote", e.target.value)}
                                          placeholder="Reason for this progress note"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Clinical Status */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Clinical Status</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`clinicalStatus-${note.id}`}>Clinical Status</Label>
                                        <Select
                                          value={note.progressData!.clinicalStatus}
                                          onValueChange={(value) => handleUpdateProgressField(note.id, "clinicalStatus", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Stable">Stable</SelectItem>
                                            <SelectItem value="Improving">Improving</SelectItem>
                                            <SelectItem value="Deteriorating">Deteriorating</SelectItem>
                                            <SelectItem value="Critical">Critical</SelectItem>
                                            <SelectItem value="Guarded">Guarded</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`overallProgress-${note.id}`}>Overall Progress</Label>
                                        <Select
                                          value={note.progressData!.overallProgress}
                                          onValueChange={(value) => handleUpdateProgressField(note.id, "overallProgress", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select progress" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Significant improvement">Significant improvement</SelectItem>
                                            <SelectItem value="Moderate improvement">Moderate improvement</SelectItem>
                                            <SelectItem value="Mild improvement">Mild improvement</SelectItem>
                                            <SelectItem value="No change">No change</SelectItem>
                                            <SelectItem value="Worsening">Worsening</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subjective */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Subjective</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`ownerReport-${note.id}`}>Owner Report</Label>
                                        <Textarea
                                          id={`ownerReport-${note.id}`}
                                          value={note.progressData!.ownerReport}
                                          onChange={(e) => handleUpdateProgressField(note.id, "ownerReport", e.target.value)}
                                          placeholder="Owner's report on patient status"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`patientBehavior-${note.id}`}>Patient Behavior</Label>
                                          <Input
                                            id={`patientBehavior-${note.id}`}
                                            value={note.progressData!.patientBehavior}
                                            onChange={(e) => handleUpdateProgressField(note.id, "patientBehavior", e.target.value)}
                                            placeholder="e.g., Alert, Lethargic, Depressed"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`appetite-${note.id}`}>Appetite</Label>
                                          <Input
                                            id={`appetite-${note.id}`}
                                            value={note.progressData!.appetite}
                                            onChange={(e) => handleUpdateProgressField(note.id, "appetite", e.target.value)}
                                            placeholder="e.g., Normal, Reduced, Anorexic"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`urination-${note.id}`}>Urination</Label>
                                          <Input
                                            id={`urination-${note.id}`}
                                            value={note.progressData!.urination}
                                            onChange={(e) => handleUpdateProgressField(note.id, "urination", e.target.value)}
                                            placeholder="e.g., Normal, Increased, Decreased, Anuric"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`defecation-${note.id}`}>Defecation</Label>
                                          <Input
                                            id={`defecation-${note.id}`}
                                            value={note.progressData!.defecation}
                                            onChange={(e) => handleUpdateProgressField(note.id, "defecation", e.target.value)}
                                            placeholder="e.g., Normal, Diarrhea, Constipated"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Objective */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Objective</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`physicalExamFindings-${note.id}`}>Physical Exam Findings</Label>
                                        <Textarea
                                          id={`physicalExamFindings-${note.id}`}
                                          value={note.progressData!.physicalExamFindings}
                                          onChange={(e) => handleUpdateProgressField(note.id, "physicalExamFindings", e.target.value)}
                                          placeholder="Physical examination findings"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <h4 className="text-sm font-medium">Vital Signs</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                          <div className="space-y-1">
                                            <Label htmlFor={`temp-${note.id}`} className="text-xs">Temperature (°F)</Label>
                                            <Input
                                              id={`temp-${note.id}`}
                                              value={note.progressData!.vitalSigns.temperature}
                                              onChange={(e) => handleUpdateProgressVitalSign(note.id, "temperature", e.target.value)}
                                              placeholder="°F"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label htmlFor={`hr-${note.id}`} className="text-xs">Heart Rate (bpm)</Label>
                                            <Input
                                              id={`hr-${note.id}`}
                                              value={note.progressData!.vitalSigns.heartRate}
                                              onChange={(e) => handleUpdateProgressVitalSign(note.id, "heartRate", e.target.value)}
                                              placeholder="bpm"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label htmlFor={`rr-${note.id}`} className="text-xs">Respiratory Rate (rpm)</Label>
                                            <Input
                                              id={`rr-${note.id}`}
                                              value={note.progressData!.vitalSigns.respiratoryRate}
                                              onChange={(e) => handleUpdateProgressVitalSign(note.id, "respiratoryRate", e.target.value)}
                                              placeholder="rpm"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label htmlFor={`bp-${note.id}`} className="text-xs">Blood Pressure (mmHg)</Label>
                                            <Input
                                              id={`bp-${note.id}`}
                                              value={note.progressData!.vitalSigns.bloodPressure}
                                              onChange={(e) => handleUpdateProgressVitalSign(note.id, "bloodPressure", e.target.value)}
                                              placeholder="mmHg"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label htmlFor={`weight-${note.id}`} className="text-xs">Weight (kg)</Label>
                                            <Input
                                              id={`weight-${note.id}`}
                                              value={note.progressData!.vitalSigns.weight}
                                              onChange={(e) => handleUpdateProgressVitalSign(note.id, "weight", e.target.value)}
                                              placeholder="kg"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label htmlFor={`bcs-${note.id}`} className="text-xs">Body Condition Score</Label>
                                            <Input
                                              id={`bcs-${note.id}`}
                                              value={note.progressData!.vitalSigns.bodyConditionScore}
                                              onChange={(e) => handleUpdateProgressVitalSign(note.id, "bodyConditionScore", e.target.value)}
                                              placeholder="1-9"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`diagnosticResults-${note.id}`}>Diagnostic Results</Label>
                                        <Textarea
                                          id={`diagnosticResults-${note.id}`}
                                          value={note.progressData!.diagnosticResults}
                                          onChange={(e) => handleUpdateProgressField(note.id, "diagnosticResults", e.target.value)}
                                          placeholder="Diagnostic test results"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`labResults-${note.id}`}>Lab Results</Label>
                                        <Textarea
                                          id={`labResults-${note.id}`}
                                          value={note.progressData!.labResults}
                                          onChange={(e) => handleUpdateProgressField(note.id, "labResults", e.target.value)}
                                          placeholder="Laboratory test results"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`imagingResults-${note.id}`}>Imaging Results</Label>
                                        <Textarea
                                          id={`imagingResults-${note.id}`}
                                          value={note.progressData!.imagingResults}
                                          onChange={(e) => handleUpdateProgressField(note.id, "imagingResults", e.target.value)}
                                          placeholder="Imaging study results"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Assessment */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Assessment</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`assessment-${note.id}`}>Assessment</Label>
                                        <Textarea
                                          id={`assessment-${note.id}`}
                                          value={note.progressData!.assessment}
                                          onChange={(e) => handleUpdateProgressField(note.id, "assessment", e.target.value)}
                                          placeholder="Clinical assessment and interpretation"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`currentDiagnosis-${note.id}`}>Current Diagnosis</Label>
                                        <Input
                                          id={`currentDiagnosis-${note.id}`}
                                          value={note.progressData!.currentDiagnosis}
                                          onChange={(e) => handleUpdateProgressField(note.id, "currentDiagnosis", e.target.value)}
                                          placeholder="Current diagnosis"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`progressNotes-${note.id}`}>Progress Notes</Label>
                                        <Textarea
                                          id={`progressNotes-${note.id}`}
                                          value={note.progressData!.progressNotes}
                                          onChange={(e) => handleUpdateProgressField(note.id, "progressNotes", e.target.value)}
                                          placeholder="Notes on patient progress"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Complications</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.progressData!.complications.map((complication, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {complication}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromProgressList(note.id, "complications", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add complication"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToProgressList(note.id, "complications", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToProgressList(note.id, "complications", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Plan */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Plan</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`plan-${note.id}`}>Treatment Plan</Label>
                                        <Textarea
                                          id={`plan-${note.id}`}
                                          value={note.progressData!.plan}
                                          onChange={(e) => handleUpdateProgressField(note.id, "plan", e.target.value)}
                                          placeholder="Treatment plan and recommendations"
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <Label>Medications</Label>
                                        {note.progressData!.medications.map((med, index) => (
                                          <Card key={index} className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                              <h4 className="font-medium">Medication {index + 1}</h4>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveProgressMedication(note.id, index)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                              <div className="space-y-2">
                                                <Label className="text-xs">Medication Name</Label>
                                                <Input
                                                  value={med.name}
                                                  onChange={(e) => handleUpdateProgressMedication(note.id, index, "name", e.target.value)}
                                                  placeholder="Medication name"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label className="text-xs">Dosage</Label>
                                                <Input
                                                  value={med.dosage}
                                                  onChange={(e) => handleUpdateProgressMedication(note.id, index, "dosage", e.target.value)}
                                                  placeholder="e.g., 10 mg"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label className="text-xs">Frequency</Label>
                                                <Input
                                                  value={med.frequency}
                                                  onChange={(e) => handleUpdateProgressMedication(note.id, index, "frequency", e.target.value)}
                                                  placeholder="e.g., Twice daily"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label className="text-xs">Duration</Label>
                                                <Input
                                                  value={med.duration}
                                                  onChange={(e) => handleUpdateProgressMedication(note.id, index, "duration", e.target.value)}
                                                  placeholder="e.g., 7 days"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label className="text-xs">Changes</Label>
                                                <Select
                                                  value={med.changes}
                                                  onValueChange={(value) => handleUpdateProgressMedication(note.id, index, "changes", value)}
                                                >
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select change" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="New">New</SelectItem>
                                                    <SelectItem value="Increased">Increased</SelectItem>
                                                    <SelectItem value="Decreased">Decreased</SelectItem>
                                                    <SelectItem value="Discontinued">Discontinued</SelectItem>
                                                    <SelectItem value="Continued">Continued</SelectItem>
                                                    <SelectItem value="No change">No change</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div className="space-y-2 col-span-2">
                                                <Label className="text-xs">Instructions</Label>
                                                <Textarea
                                                  value={med.instructions}
                                                  onChange={(e) => handleUpdateProgressMedication(note.id, index, "instructions", e.target.value)}
                                                  placeholder="Special instructions"
                                                  className="min-h-[60px]"
                                                />
                                              </div>
                                            </div>
                                          </Card>
                                        ))}
                                        <Button
                                          variant="outline"
                                          onClick={() => handleAddProgressMedication(note.id, {name: "", dosage: "", frequency: "", duration: "", instructions: "", changes: ""})}
                                          className="w-full"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add Medication
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Treatments</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.progressData!.treatments.map((treatment, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {treatment}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromProgressList(note.id, "treatments", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add treatment"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToProgressList(note.id, "treatments", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToProgressList(note.id, "treatments", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Procedures</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.progressData!.procedures.map((procedure, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {procedure}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromProgressList(note.id, "procedures", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add procedure"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToProgressList(note.id, "procedures", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToProgressList(note.id, "procedures", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Monitoring */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Monitoring</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`monitoringPlan-${note.id}`}>Monitoring Plan</Label>
                                        <Textarea
                                          id={`monitoringPlan-${note.id}`}
                                          value={note.progressData!.monitoringPlan}
                                          onChange={(e) => handleUpdateProgressField(note.id, "monitoringPlan", e.target.value)}
                                          placeholder="Monitoring plan and frequency"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Parameters to Watch</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.progressData!.parametersToWatch.map((param, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {param}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromProgressList(note.id, "parametersToWatch", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add parameter (e.g., Heart rate, Temperature)"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToProgressList(note.id, "parametersToWatch", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToProgressList(note.id, "parametersToWatch", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Discharge Planning */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Discharge Planning</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`dischargeReadiness-${note.id}`}>Discharge Readiness</Label>
                                        <Select
                                          value={note.progressData!.dischargeReadiness}
                                          onValueChange={(value) => handleUpdateProgressField(note.id, "dischargeReadiness", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select readiness" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Ready">Ready</SelectItem>
                                            <SelectItem value="Not ready">Not ready</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Conditional">Conditional</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Discharge Criteria</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {note.progressData!.dischargeCriteria.map((criteria, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                              {criteria}
                                              <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleRemoveItemFromProgressList(note.id, "dischargeCriteria", index)}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Add discharge criteria"
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                handleAddItemToProgressList(note.id, "dischargeCriteria", (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = "";
                                              }
                                            }}
                                          />
                                          <Button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              if (input?.value.trim()) {
                                                handleAddItemToProgressList(note.id, "dischargeCriteria", input.value);
                                                input.value = "";
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`estimatedDischargeDate-${note.id}`}>Estimated Discharge Date</Label>
                                        <Input
                                          id={`estimatedDischargeDate-${note.id}`}
                                          type="date"
                                          value={note.progressData!.estimatedDischargeDate}
                                          onChange={(e) => handleUpdateProgressField(note.id, "estimatedDischargeDate", e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Communication */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Owner Communication</h3>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`ownerCommunication-${note.id}`}>Owner Communication</Label>
                                        <Textarea
                                          id={`ownerCommunication-${note.id}`}
                                          value={note.progressData!.ownerCommunication}
                                          onChange={(e) => handleUpdateProgressField(note.id, "ownerCommunication", e.target.value)}
                                          placeholder="Communication with owner"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`ownerUpdates-${note.id}`}>Owner Updates</Label>
                                        <Textarea
                                          id={`ownerUpdates-${note.id}`}
                                          value={note.progressData!.ownerUpdates}
                                          onChange={(e) => handleUpdateProgressField(note.id, "ownerUpdates", e.target.value)}
                                          placeholder="Updates provided to owner"
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Additional Notes */}
                                  <div className="space-y-4 border-t pt-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`additionalNotes-${note.id}`}>Additional Notes</Label>
                                      <Textarea
                                        id={`additionalNotes-${note.id}`}
                                        value={note.progressData!.additionalNotes}
                                        onChange={(e) => handleUpdateProgressField(note.id, "additionalNotes", e.target.value)}
                                        placeholder="Any additional relevant information"
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Render regular note content
                                <Textarea
                                  value={note.content}
                                  onChange={(e) => handleUpdateClinicalNote(note.id, e.target.value)}
                                  className="min-h-[100px]"
                                />
                              )}
                            </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No notes yet. Use the "Add Note" action to create SOAP, procedure, discharge, or
                      other context-specific notes.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>



            {/* Treatment Plan Tab */}
            <TabsContent value="treatment" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Applied Treatments */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Applied Treatments</CardTitle>
                      <CardDescription>Treatments added to this encounter</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {encounterItems.filter(item => item.type === 'treatment').length > 0 ? (
                          encounterItems
                            .filter(item => item.type === 'treatment')
                            .map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{item.title}</div>
                                  <div className="text-xs text-muted-foreground space-x-2">
                                    <span className="font-mono">{item.treatmentCode}</span>
                                    <span>• Qty: {item.quantity}</span>
                                    <span>• {item.status}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center space-x-1 font-semibold text-sm">
                                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                                    <span>{item.total.toFixed(2)}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEncounterItems(encounterItems.filter(i => i.id !== item.id));
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="text-center text-muted-foreground text-sm py-8">
                            No treatments added yet. Use "Add Treatment" in the left panel to add items.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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

            {/* Summary & Billing Tab */}
            <TabsContent value="summary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Encounter Summary & Billing</span>
                  </CardTitle>
                  <CardDescription>
                    Complete overview of all treatments, procedures, and charges for this encounter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {encounterItems.length > 0 ? (
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
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {encounterItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.treatmentCode}</TableCell>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {item.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQty = parseInt(e.target.value) || 1;
                                      const updated = encounterItems.map(i =>
                                        i.id === item.id
                                          ? {...i, quantity: newQty, total: i.price * newQty - i.discount}
                                          : i
                                      );
                                      setEncounterItems(updated);
                                    }}
                                    className="w-16 text-center h-8"
                                  />
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
                                  <Select
                                    value={item.status}
                                    onValueChange={(status: 'pending' | 'completed' | 'cancelled') => {
                                      const updated = encounterItems.map(i =>
                                        i.id === item.id ? {...i, status} : i
                                      );
                                      setEncounterItems(updated);
                                    }}
                                  >
                                    <SelectTrigger className="w-[110px] h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEncounterItems(encounterItems.filter(i => i.id !== item.id))}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}

                            {/* Totals Row */}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell colSpan={5} className="text-right">Subtotal:</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span>{encounterItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                                </div>
                              </TableCell>
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={5} className="text-right font-medium">Tax (0%):</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">0.00</span>
                                </div>
                              </TableCell>
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>
                            <TableRow className="bg-primary/10 font-bold text-lg">
                              <TableCell colSpan={5} className="text-right">Total:</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{encounterItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                                </div>
                              </TableCell>
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      {/* Billing Notes */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Billing Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            placeholder="Add any billing notes, payment arrangements, or special instructions..."
                            className="min-h-[80px]"
                          />
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No Treatments Added</p>
                      <p className="text-sm">
                        Go to the Treatment Plan tab to add treatments and services to this encounter.
                      </p>
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

          {/* Action Buttons */}
          <Card className="mt-6">
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
      </div>
      </Tabs>

      {/* Bottom Panel (collapsible, overlays content when expanded) */}
      <div
        className={cn(
          "fixed bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-lg",
          isBottomOpen ? "" : "h-[44px]"
        )}
        style={{ left: bottomPanelRect.left, width: bottomPanelRect.width, height: isBottomOpen ? bottomHeight : 44 }}
      >
        {/* Resize handle */}
        {isBottomOpen && (
          <div
            className="absolute -top-2 left-0 right-0 h-2 cursor-ns-resize"
            onMouseDown={(e) => {
              setIsResizingBottom(true);
              resizeStateRef.current = { startY: e.clientY, startHeight: bottomHeight };
            }}
          />
        )}
        <Tabs value={bottomTab} onValueChange={(v) => setBottomTab(v as any)} className="h-full">
          {/* Tabs bar */}
          <div className="relative h-[44px]">
            <div className="absolute inset-0 flex items-center justify-between px-3">
              <TabsList className="flex h-9 items-center gap-1 bg-transparent p-0">
                <TabsTrigger value="history" className="h-9 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  History
                </TabsTrigger>
                <TabsTrigger value="labs" className="h-9 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Labs
                </TabsTrigger>
                <TabsTrigger value="notes" className="h-9 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Notes
                </TabsTrigger>
              </TabsList>
              <Button size="sm" variant="outline" onClick={() => setIsBottomOpen(!isBottomOpen)}>
                {isBottomOpen ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          </div>

          {/* Panel content area (only visible when expanded) */}
          {isBottomOpen && (
            <div className="h-[calc(100%-44px)] overflow-auto p-3">
              <TabsContent value="history" className="m-0 space-y-3">
                {/* Filter bar */}
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={historyType} onValueChange={(v) => setHistoryType(v as any)}>
                      <SelectTrigger className="h-8 w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="visit">Visits</SelectItem>
                        <SelectItem value="vaccination">Vaccinations</SelectItem>
                        <SelectItem value="surgery">Surgeries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Clinician</Label>
                    <Input value={historyClinician} onChange={(e) => setHistoryClinician(e.target.value)} placeholder="Search clinician" className="h-8 w-[200px]" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">From</Label>
                    <Input type="date" value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} className="h-8 w-[160px]" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To</Label>
                    <Input type="date" value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} className="h-8 w-[160px]" />
                  </div>
                  <div className="ml-auto flex items-end gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Rows</Label>
                      <Select value={String(historyPageSize)} onValueChange={(v) => { setHistoryPage(1); setHistoryPageSize(Number(v)); }}>
                        <SelectTrigger className="h-8 w-[90px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportHistoryCsv}>Export CSV</Button>
                    <Button variant="outline" size="sm" onClick={exportHistoryPdf}>Export PDF</Button>
                    <Button variant="outline" size="sm" onClick={() => { setHistoryType('all'); setHistoryClinician(''); setHistoryFrom(''); setHistoryTo(''); setHistoryPage(1); }}>Clear</Button>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[110px]">Date</TableHead>
                        <TableHead className="w-[110px]">Type</TableHead>
                        <TableHead className="w-[140px]">Clinician</TableHead>
                        <TableHead>Description / Reason</TableHead>
                        <TableHead className="w-[160px]">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedHistory.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-sm text-muted-foreground">{new Date(row.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{row.type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{row.clinician}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{row.title}</div>
                            {row.subtitle && (
                              <div className="text-xs text-muted-foreground">{row.subtitle}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination controls */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Page {historyPage} of {totalHistoryPages} • {filteredHistory.length} records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => Math.max(1, p - 1))}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={historyPage >= totalHistoryPages} onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}>Next</Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="labs" className="m-0">
                <div className="text-sm text-muted-foreground">Lab requests/results (add content as needed)</div>
              </TabsContent>
              <TabsContent value="notes" className="m-0">
                <div className="text-sm text-muted-foreground">Scratch pad / encounter notes (add content as needed)</div>
              </TabsContent>
            </div>
          )}
        </Tabs>
      </div>

      </div> {/* End fixed-width container */}
      </div> {/* End main content area */}
      
      {/* Right Sidebar */}
      <EncounterSidebar 
        encounterItems={encounterItems as any}
        onItemClick={(item) => {
          console.log("Clicked item:", item);
          // Handle item click - could open details dialog, etc.
        }}
      />

      {/* Add Clinical Note Dialog (triggered by action button) */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Clinical Note</DialogTitle>
            <DialogDescription>
              Create a context-specific note for this encounter, such as a procedure or anesthesia record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Note Type</Label>
                <Select
                  value={noteDraft.type}
                  onValueChange={(value: NoteType) =>
                    setNoteDraft((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input
                  placeholder="e.g., Procedure Note - TPLO"
                  value={noteDraft.title}
                  onChange={(e) =>
                    setNoteDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                placeholder="Enter procedural details, anesthesia notes, discharge instructions, etc."
                className="min-h-[140px]"
                value={noteDraft.content}
                onChange={(e) =>
                  setNoteDraft((prev) => ({ ...prev, content: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClinicalNote} disabled={!noteDraft.content.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

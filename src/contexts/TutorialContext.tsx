import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { generateMockInventory, clearInventoryData, loadInventory } from "@/lib/inventoryStore";
import { generateMockTreatments, clearTreatmentsData } from "@/lib/treatmentStore";
import { add20DemoDrugs } from "@/lib/dataSeed";

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  target?: string;
  position?: "center" | "top" | "bottom" | "left" | "right";
  /** Role to switch to when this step becomes active */
  role?: string;
  /** Route to navigate to when this step becomes active */
  route?: string;
  /** Colour accent for the role badge */
  roleColor?: string;
  /** If true, tutorial auto-detects a click on the target element and advances */
  requiresAction?: boolean;
  /** Instruction shown in the click-prompt badge before the user clicks */
  actionLabel?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ── STEP 1: Welcome ────────────────────────────────────────────────────────
  {
    id: 1,
    title: "Welcome to InnoVetPro",
    description: "This guided tour walks you through the full clinic workflow — from registering a new patient all the way to discharge and billing. We'll step through every role: Receptionist → Attendant → Vet → Pharmacist → back to Receptionist. Let's begin!",
    position: "center",
    role: "Receptionist",
    route: "/patients",
    roleColor: "bg-sky-500",
  },

  // ── STEP 2: Register new patient ──────────────────────────────────────────
  {
    id: 2,
    title: "Receptionist — Add a New Patient",
    description: "As Receptionist, your first job is registering the animal. Click the '+ Add Patient' button (highlighted) to open the registration form. You'll capture the pet's name, species, breed, age, and the owner's contact details.",
    target: "nav-registered-patients",
    position: "right",
    role: "Receptionist",
    route: "/patients",
    roleColor: "bg-sky-500",
    requiresAction: true,
    actionLabel: "Click 'Registered Patients' in the sidebar, then click '+ Add Patient' →",
  },

  // ── STEP 3: Click Add Patient button ──────────────────────────────────────
  {
    id: 3,
    title: "Receptionist — Register a New Patient",
    description: "You're on the Registered Patients page. Click the green 'Register Patient' button (highlighted) to open the patient form. The tutorial will minimise while you fill in the details — it will reopen automatically once you save.",
    target: "btn-add-patient",
    position: "left",
    role: "Receptionist",
    route: "/patients",
    roleColor: "bg-sky-500",
  },

  // ── STEP 4: Search for your new patient ──────────────────────────────────
  {
    id: 4,
    title: "Receptionist — Find Your Patient",
    description: "Great, the patient is registered! Now search for them in the search bar below. Type the name of the patient you just added — the list will filter automatically.",
    target: "search-patients",
    position: "bottom",
    role: "Receptionist",
    route: "/patients",
    roleColor: "bg-sky-500",
  },

  // ── STEP 5: Click the patient card ──────────────────────────────────────
  {
    id: 5,
    title: "Receptionist — Open Patient Profile",
    description: "You can see your patient in the list. Click on their card to open the full patient profile where you can manage visits and view medical history.",
    target: "patient-card-first",
    position: "bottom",
    role: "Receptionist",
    route: "/patients",
    roleColor: "bg-sky-500",
    requiresAction: true,
    actionLabel: "Click the patient card to open their profile →",
  },

  // ── STEP 6: Scroll to Encounters & click New Visit ─────────────────────
  {
    id: 6,
    title: "Receptionist — Create a New Visit",
    description: "You're on the patient profile. Scroll down to the 'Encounters & Medical History' section. Click the 'New Visit' button (highlighted) to create a visit for today.",
    target: "btn-new-visit",
    position: "left",
    role: "Receptionist",
    roleColor: "bg-sky-500",
  },

  // ── STEP 7: Fill the New Visit form (tutorial minimises) ───────────────
  {
    id: 7,
    title: "Receptionist — Fill Visit Details",
    description: "The New Visit dialog is open. Fill in the encounter type, reason for visit, chief complaint, and attending veterinarian. Click 'Create Visit' when done — the tutorial will minimise while you fill the form and will reopen once you save.",
    target: "btn-new-visit",
    position: "left",
    role: "Receptionist",
    roleColor: "bg-sky-500",
  },

  // ── STEP 8: Check in patient ──────────────────────────────────────────────
  {
    id: 8,
    title: "Receptionist — Check In the Patient",
    description: "With the visit created, check the patient in. On the patient profile or in Appointments, click 'Check In'. This moves them to WAITING status and they appear on the Live Queue dashboard. The Attendant can now see them for triage.",
    target: "live-queue",
    position: "bottom",
    role: "Receptionist",
    route: "/dashboard",
    roleColor: "bg-sky-500",
  },

  // ── STEP 9: Attendant sees queue ──────────────────────────────────────────
  {
    id: 9,
    title: "Attendant — Today's Appointments",
    description: "Role switched to Attendant (Nurse). The dashboard shows all patients checked in today. Scroll down to 'Today's Appointments' — you'll see the patient you just checked in with status WAITING. Click 'Triage' on their card to begin the triage process.",
    target: "live-queue",
    position: "bottom",
    role: "Nurse",
    route: "/dashboard",
    roleColor: "bg-amber-500",
    requiresAction: true,
    actionLabel: "Scroll to Today's Appointments → click 'Triage' for the patient →",
  },

  // ── STEP 10: Triage ────────────────────────────────────────────────────────
  {
    id: 10,
    title: "Attendant — Triage the Patient",
    description: "The Triage page has opened. Record the patient's vitals: Temperature (°C), Heart Rate (bpm), Respiratory Rate (bpm), and Weight (kg). You can also note their chief complaint. Once vitals are saved, click 'Complete Triage' — this triggers a notification to the Vet that the patient is ready for consultation.",
    target: "triage-page",
    position: "right",
    role: "Nurse",
    route: "/triage",
    roleColor: "bg-amber-500",
    requiresAction: true,
    actionLabel: "Record vitals and click 'Complete Triage' →",
  },

  // ── STEP 11: Start consultation ────────────────────────────────────────────
  {
    id: 11,
    title: "Attendant → Vet — Start Consultation",
    description: "Triage is complete. You can start the consultation as the Attendant (if working alongside the Vet) or the Vet can take over from their own login. We're switching to Vet role now. In the patient profile, click 'Start Consultation' (or 'New Record') — this opens the full clinical record.",
    target: "nav-registered-patients",
    position: "right",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
    requiresAction: true,
    actionLabel: "Open patient profile → click 'Start Consultation' →",
  },

  // ── STEP 12: Overview tab ──────────────────────────────────────────────────
  {
    id: 12,
    title: "Vet — Clinical Record: Overview",
    description: "The clinical record is now open. The Overview tab shows a summary of the current visit: patient info, today's vitals from triage, chief complaint, and active encounter status. Review this before examining the patient — it gives you the full picture at a glance.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 13: History tab ──────────────────────────────────────────────────
  {
    id: 13,
    title: "Vet — Clinical Record: History",
    description: "Click the 'History' tab. Here you document the patient's medical history: previous diagnoses, surgeries, chronic conditions, allergies, and vaccination history. For returning patients, past visit records appear here automatically. This context is critical for accurate diagnosis.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 14: Physical Exam ────────────────────────────────────────────────
  {
    id: 14,
    title: "Vet — Clinical Record: Physical Exam",
    description: "On the 'Physical Exam' tab, record your findings system by system: cardiovascular, respiratory, gastrointestinal, musculoskeletal, neurological, skin & coat, eyes, ears, and oral cavity. Use the structured fields or free-text. Abnormal findings are flagged in red for easy review.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 15: Clinical Notes ───────────────────────────────────────────────
  {
    id: 15,
    title: "Vet — Clinical Record: Clinical Notes",
    description: "The 'Clinical Notes' tab is your SOAP note area — Subjective, Objective, Assessment, Plan. Write your differential diagnoses and working diagnosis here. These notes are time-stamped, form the legal medical record, and are visible to all roles with clinical access.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 16: Diagnostics ──────────────────────────────────────────────────
  {
    id: 16,
    title: "Vet — Clinical Record: Diagnostics",
    description: "On the 'Diagnostics' tab, order lab tests (CBC, biochemistry, urinalysis, culture & sensitivity, cytology, imaging). Lab orders are sent to the lab queue. When results come back, they attach directly to this record. You can also upload external diagnostic images.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 17: Treatment + Inventory ───────────────────────────────────────
  {
    id: 17,
    title: "Vet — Clinical Record: Treatment + Inventory",
    description: "The 'Treatment' tab is where you add procedures performed (IV fluid placement, wound suturing, injections). Each treatment line is linked to an inventory item — when you add a treatment, the system checks stock. If an item is low or out of stock, a warning appears. This is how Inventory stays accurate in real time.",
    target: "nav-inventory",
    position: "right",
    role: "Vet",
    route: "/inventory",
    roleColor: "bg-blue-600",
  },

  // ── STEP 18: Medications ──────────────────────────────────────────────────
  {
    id: 18,
    title: "Vet — Clinical Record: Medications",
    description: "On the 'Medications' tab, add drugs administered in-clinic (IV antibiotics, anti-emetics, pain relief). Each drug entry auto-decrements from pharmacy inventory — no double-entry needed. Dosage, route, and frequency are recorded here and passed to the Pharmacist's dispensing queue.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 19: Vaccinations ─────────────────────────────────────────────────
  {
    id: 19,
    title: "Vet — Clinical Record: Vaccinations",
    description: "The 'Vaccinations' tab records any vaccines given this visit (Rabies, DA2PP, Bordetella, FELV etc.). The system tracks due dates and automatically schedules a reminder to the owner before the next booster is due — reducing missed vaccination appointments.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 20: Prescriptions ────────────────────────────────────────────────
  {
    id: 20,
    title: "Vet — Clinical Record: Prescriptions",
    description: "Finally, the 'Prescriptions' tab lets you write take-home medication scripts. Add drug name, dose, frequency, duration, and dispensing instructions. These are handed to the Pharmacist for dispensing. A PDF prescription can be generated and sent to the owner. Click 'Complete Consultation' when all tabs are done.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 21: Pharmacist ───────────────────────────────────────────────────
  {
    id: 21,
    title: "Pharmacist — Dispense Medications",
    description: "Role switched to Pharmacist. The prescribed medications from the Vet now appear in the dispensing queue. Verify each item: check the drug, dose, and patient name. Click 'Dispense' to confirm — this auto-decrements stock from Inventory. If any item is out of stock, you'll be alerted to source an alternative.",
    target: "nav-inventory",
    position: "right",
    role: "Pharmacist",
    route: "/inventory",
    roleColor: "bg-purple-500",
    requiresAction: true,
    actionLabel: "Click Inventory in the sidebar to see stock levels →",
  },

  // ── STEP 22: Billing (disabled note) ─────────────────────────────────────
  {
    id: 22,
    title: "Receptionist — Billing (Preview)",
    description: "Role switched back to Receptionist. The Billing module is currently being set up for your clinic — it will show the full invoice: consultation fee, procedures, medications, and any applicable taxes. Payment can be collected via M-Pesa STK Push, cash, or insurance. Billing will be enabled in your plan once activated.",
    target: "nav-billing",
    position: "right",
    role: "Receptionist",
    route: "/billing",
    roleColor: "bg-sky-500",
  },

  // ── STEP 23: Discharge ────────────────────────────────────────────────────
  {
    id: 23,
    title: "Receptionist — Discharge the Patient",
    description: "Once payment is confirmed (or pre-authorized), the Receptionist clicks 'Discharge'. The patient's encounter is closed, a discharge summary is generated, and the owner receives a copy via SMS or email. The patient's record is archived and available for future visits. That's the full workflow!",
    target: "live-queue",
    position: "bottom",
    role: "Receptionist",
    route: "/dashboard",
    roleColor: "bg-sky-500",
  },

  // ── STEP 24: Complete ─────────────────────────────────────────────────────
  {
    id: 24,
    title: "Tour Complete — You're Ready!",
    description: "You've completed the full InnoVetPro clinic workflow. Your team can switch roles anytime from the profile menu (top right). Use 'Generate Demo Data' on the dashboard to populate the system with sample patients and explore all features. Welcome aboard!",
    position: "center",
    role: "SuperAdmin",
    route: "/dashboard",
    roleColor: "bg-emerald-500",
  },
];

interface TutorialContextValue {
  isActive: boolean;
  step: number;
  currentStep: TutorialStep | null;
  totalSteps: number;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  goToStep: (n: number) => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  // Pure React state — intentionally NOT persisted, so it resets on every page refresh
  const [isActive, setIsActive] = useState(true);
  const [step, setStep] = useState(1);
  // Track whether the tutorial itself seeded inventory so we can clean up after
  const tutorialSeededRef = useRef(false);

  // Seed inventory on initial mount (tutorial auto-starts with isActive=true).
  // Only mark as tutorial-seeded if inventory was actually empty before we seeded it
  // — so we never wipe data the user already had.
  useEffect(() => {
    const wasEmpty = loadInventory().length === 0;
    generateMockInventory();
    add20DemoDrugs();
    generateMockTreatments();
    tutorialSeededRef.current = wasEmpty;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = isActive
    ? TUTORIAL_STEPS.find(s => s.id === step) ?? null
    : null;

  /** Re-launch tutorial: seed inventory if currently empty, reset to step 1. */
  const startTutorial = useCallback(() => {
    const wasEmpty = loadInventory().length === 0;
    generateMockInventory();
    add20DemoDrugs();
    generateMockTreatments();
    tutorialSeededRef.current = wasEmpty;
    setStep(1);
    setIsActive(true);
  }, []);

  /** Clear tutorial-seeded data and close overlay. */
  const endTutorial = useCallback(() => {
    setIsActive(false);
    if (tutorialSeededRef.current) {
      clearInventoryData();
      clearTreatmentsData();
      tutorialSeededRef.current = false;
    }
  }, []);

  const nextStep = useCallback(() => {
    setStep(prev => {
      if (prev >= TUTORIAL_STEPS.length) {
        setIsActive(false);
        if (tutorialSeededRef.current) {
          clearInventoryData();
          clearTreatmentsData();
          tutorialSeededRef.current = false;
        }
        return prev;
      }
      return prev + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setStep(prev => Math.max(1, prev - 1));
  }, []);

  const skipTutorial = endTutorial;

  const goToStep = useCallback((n: number) => {
    if (n >= 1 && n <= TUTORIAL_STEPS.length) {
      setStep(n);
      setIsActive(true);
    }
  }, []);

  return (
    <TutorialContext.Provider value={{
      isActive,
      step,
      currentStep,
      totalSteps: TUTORIAL_STEPS.length,
      startTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      goToStep,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used inside TutorialProvider");
  return ctx;
}

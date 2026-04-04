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
    position: "bottom",
    role: "Receptionist",
    route: "/patients",
    roleColor: "bg-sky-500",
  },

  // ── STEP 4: Create new visit ──────────────────────────────────────────────
  {
    id: 4,
    title: "Receptionist — Create a New Visit",
    description: "Once registered, create a visit for today. You can do this two ways: (1) Open the patient's profile in Registered Patients and click 'New Visit', or (2) go to Appointments and book a slot. Either method adds the patient to today's clinic queue.",
    target: "nav-registered-patients",
    position: "right",
    role: "Receptionist",
    route: "/patients",
    roleColor: "bg-sky-500",
    requiresAction: true,
    actionLabel: "Open patient profile → click 'New Visit' to continue →",
  },

  // ── STEP 5: Check in patient ──────────────────────────────────────────────
  {
    id: 5,
    title: "Receptionist — Check In the Patient",
    description: "With the visit created, check the patient in. On the patient profile or in Appointments, click 'Check In'. This moves them to WAITING status and they appear on the Live Queue dashboard. The Attendant can now see them for triage.",
    target: "live-queue",
    position: "bottom",
    role: "Receptionist",
    route: "/dashboard",
    roleColor: "bg-sky-500",
  },

  // ── STEP 6: Attendant sees queue ──────────────────────────────────────────
  {
    id: 6,
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

  // ── STEP 7: Triage ────────────────────────────────────────────────────────
  {
    id: 7,
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

  // ── STEP 8: Start consultation ────────────────────────────────────────────
  {
    id: 8,
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

  // ── STEP 9: Overview tab ──────────────────────────────────────────────────
  {
    id: 9,
    title: "Vet — Clinical Record: Overview",
    description: "The clinical record is now open. The Overview tab shows a summary of the current visit: patient info, today's vitals from triage, chief complaint, and active encounter status. Review this before examining the patient — it gives you the full picture at a glance.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 10: History tab ──────────────────────────────────────────────────
  {
    id: 10,
    title: "Vet — Clinical Record: History",
    description: "Click the 'History' tab. Here you document the patient's medical history: previous diagnoses, surgeries, chronic conditions, allergies, and vaccination history. For returning patients, past visit records appear here automatically. This context is critical for accurate diagnosis.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 11: Physical Exam ────────────────────────────────────────────────
  {
    id: 11,
    title: "Vet — Clinical Record: Physical Exam",
    description: "On the 'Physical Exam' tab, record your findings system by system: cardiovascular, respiratory, gastrointestinal, musculoskeletal, neurological, skin & coat, eyes, ears, and oral cavity. Use the structured fields or free-text. Abnormal findings are flagged in red for easy review.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 12: Clinical Notes ───────────────────────────────────────────────
  {
    id: 12,
    title: "Vet — Clinical Record: Clinical Notes",
    description: "The 'Clinical Notes' tab is your SOAP note area — Subjective, Objective, Assessment, Plan. Write your differential diagnoses and working diagnosis here. These notes are time-stamped, form the legal medical record, and are visible to all roles with clinical access.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 13: Diagnostics ──────────────────────────────────────────────────
  {
    id: 13,
    title: "Vet — Clinical Record: Diagnostics",
    description: "On the 'Diagnostics' tab, order lab tests (CBC, biochemistry, urinalysis, culture & sensitivity, cytology, imaging). Lab orders are sent to the lab queue. When results come back, they attach directly to this record. You can also upload external diagnostic images.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 14: Treatment + Inventory ───────────────────────────────────────
  {
    id: 14,
    title: "Vet — Clinical Record: Treatment + Inventory",
    description: "The 'Treatment' tab is where you add procedures performed (IV fluid placement, wound suturing, injections). Each treatment line is linked to an inventory item — when you add a treatment, the system checks stock. If an item is low or out of stock, a warning appears. This is how Inventory stays accurate in real time.",
    target: "nav-inventory",
    position: "right",
    role: "Vet",
    route: "/inventory",
    roleColor: "bg-blue-600",
  },

  // ── STEP 15: Medications ──────────────────────────────────────────────────
  {
    id: 15,
    title: "Vet — Clinical Record: Medications",
    description: "On the 'Medications' tab, add drugs administered in-clinic (IV antibiotics, anti-emetics, pain relief). Each drug entry auto-decrements from pharmacy inventory — no double-entry needed. Dosage, route, and frequency are recorded here and passed to the Pharmacist's dispensing queue.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 16: Vaccinations ─────────────────────────────────────────────────
  {
    id: 16,
    title: "Vet — Clinical Record: Vaccinations",
    description: "The 'Vaccinations' tab records any vaccines given this visit (Rabies, DA2PP, Bordetella, FELV etc.). The system tracks due dates and automatically schedules a reminder to the owner before the next booster is due — reducing missed vaccination appointments.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 17: Prescriptions ────────────────────────────────────────────────
  {
    id: 17,
    title: "Vet — Clinical Record: Prescriptions",
    description: "Finally, the 'Prescriptions' tab lets you write take-home medication scripts. Add drug name, dose, frequency, duration, and dispensing instructions. These are handed to the Pharmacist for dispensing. A PDF prescription can be generated and sent to the owner. Click 'Complete Consultation' when all tabs are done.",
    position: "center",
    role: "Vet",
    route: "/patients",
    roleColor: "bg-blue-600",
  },

  // ── STEP 18: Pharmacist ───────────────────────────────────────────────────
  {
    id: 18,
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

  // ── STEP 19: Billing (disabled note) ─────────────────────────────────────
  {
    id: 19,
    title: "Receptionist — Billing (Preview)",
    description: "Role switched back to Receptionist. The Billing module is currently being set up for your clinic — it will show the full invoice: consultation fee, procedures, medications, and any applicable taxes. Payment can be collected via M-Pesa STK Push, cash, or insurance. Billing will be enabled in your plan once activated.",
    target: "nav-billing",
    position: "right",
    role: "Receptionist",
    route: "/billing",
    roleColor: "bg-sky-500",
  },

  // ── STEP 20: Discharge ────────────────────────────────────────────────────
  {
    id: 20,
    title: "Receptionist — Discharge the Patient",
    description: "Once payment is confirmed (or pre-authorized), the Receptionist clicks 'Discharge'. The patient's encounter is closed, a discharge summary is generated, and the owner receives a copy via SMS or email. The patient's record is archived and available for future visits. That's the full workflow!",
    target: "live-queue",
    position: "bottom",
    role: "Receptionist",
    route: "/dashboard",
    roleColor: "bg-sky-500",
  },

  // ── STEP 21: Complete ─────────────────────────────────────────────────────
  {
    id: 21,
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

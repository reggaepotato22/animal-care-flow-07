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
  {
    id: 1,
    title: "Welcome to InnoVetPro",
    description: "Your complete veterinary clinic command center. This 2-minute tour walks through the full patient journey — from check-in to discharge — across every role in your clinic.",
    position: "center",
  },
  {
    id: 2,
    title: "Receptionist — Register a Patient",
    description: "As a Receptionist, start every visit here. Click '+ New Patient' to register a first-time visitor, or use 'Registered Patients' to check in a returning patient and add them to today's queue.",
    target: "dashboard-new-patient",
    position: "bottom",
    role: "Receptionist",
    route: "/dashboard",
    roleColor: "bg-sky-500",
    requiresAction: true,
    actionLabel: "Click the highlighted button to continue →",
  },
  {
    id: 3,
    title: "Receptionist — Live Queue",
    description: "Once checked in, the patient appears in the Live Patient Progress board. Each card shows their current workflow step and lets you track progress across all roles in real time.",
    target: "live-queue",
    position: "bottom",
    role: "Receptionist",
    route: "/dashboard",
    roleColor: "bg-sky-500",
  },
  {
    id: 4,
    title: "Attendant (Nurse) — Vitals & Wellness",
    description: "Switch to Attendant. In Triage, record temperature, blood pressure, heart rate and respiratory rate. Log wellness checks each shift: eating, drinking and stool output. This data gates the Vet's prescription form.",
    target: "triage-page",
    position: "right",
    role: "Nurse",
    route: "/triage",
    roleColor: "bg-amber-500",
    requiresAction: true,
    actionLabel: "Click Triage in the sidebar to continue →",
  },
  {
    id: 5,
    title: "Veterinarian — Examination & Rx",
    description: "As a Vet, open the patient's clinical record. Write a daily progress note with vitals — this UNLOCKS the prescription form. Diagnose, add treatments, and prescribe medications that auto-deduct from pharmacy inventory.",
    target: "nav-records",
    position: "right",
    role: "Vet",
    route: "/records",
    roleColor: "bg-blue-500",
    requiresAction: true,
    actionLabel: "Click Records in the sidebar to continue →",
  },
  {
    id: 6,
    title: "Pharmacist — Dispense & Inventory",
    description: "Switch to Pharmacist. Medications prescribed by the Vet appear here. Confirm dispensing — the system auto-decrements inventory quantity and triggers a low-stock alert if any drug falls below its reorder level.",
    target: "nav-inventory",
    position: "right",
    role: "Pharmacist",
    route: "/inventory",
    roleColor: "bg-purple-500",
    requiresAction: true,
    actionLabel: "Click Inventory in the sidebar to continue →",
  },
  {
    id: 7,
    title: "Billing — Collect Payment & Discharge",
    description: "Back as Receptionist, navigate to Billing. Review the invoice (consultation, procedures, medications). Collect payment via M-Pesa or cash. Discharge is LOCKED until payment is confirmed or pre-authorized.",
    target: "nav-billing",
    position: "right",
    role: "Receptionist",
    route: "/billing",
    roleColor: "bg-sky-500",
    requiresAction: true,
    actionLabel: "Click Billing in the sidebar to continue →",
  },
  {
    id: 8,
    title: "You're Ready to Go!",
    description: "That's the complete InnoVetPro workflow. Use 'Generate Mock Data' on the dashboard to explore with sample patients across all stages. Your team can switch roles anytime from the profile menu.",
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

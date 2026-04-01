import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  target?: string;
  position?: "center" | "top" | "bottom" | "left" | "right";
  role?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to InnoVetPro",
    description: "Your Complete Clinic Command Center. This quick tour will walk you through the key features of the system so you can hit the ground running.",
    position: "center",
  },
  {
    id: 2,
    title: "Select Your Role",
    description: "Click the Profile icon in the top-right header to select your role (e.g. Receptionist, Vet, Nurse, Pharmacist). Each role shows only the tools relevant to that job.",
    target: "header-profile",
    position: "bottom",
  },
  {
    id: 3,
    title: "Patient Intake",
    description: "As a Receptionist, you have two main options: register a New Patient who has never visited before, or check in an Existing Patient from the Registered Patients list.",
    target: "dashboard-new-patient",
    position: "bottom",
    role: "Receptionist",
  },
  {
    id: 4,
    title: "Check-In a Patient",
    description: "Open Registered Patients from the left navigation. Find the patient, click Check-In to add them to today's queue. They will appear in the Live Patient Progress tracker on the dashboard.",
    target: "nav-registered-patients",
    position: "right",
  },
  {
    id: 5,
    title: "Clinical Flow",
    description: "Once checked in, the patient moves through the clinical workflow: Attendant (vitals & cage assignment) → Vet (examination, diagnosis, prescription) → Pharmacist (medication dispensing & inventory update).",
    position: "center",
  },
  {
    id: 6,
    title: "Billing & Visit Closure",
    description: "After the Vet and Pharmacist complete their steps, navigate to Billing to finalize the visit invoice. Mark the encounter as complete to remove the patient from the active queue.",
    target: "nav-billing",
    position: "right",
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

  const currentStep = isActive
    ? TUTORIAL_STEPS.find(s => s.id === step) ?? null
    : null;

  const startTutorial = useCallback(() => {
    setStep(1);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setStep(prev => {
      if (prev >= TUTORIAL_STEPS.length) {
        setIsActive(false);
        return prev;
      }
      return prev + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setStep(prev => Math.max(1, prev - 1));
  }, []);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
  }, []);

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

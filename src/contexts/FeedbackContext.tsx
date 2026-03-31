import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useRole } from "@/contexts/RoleContext";
import type { SurveyEvent } from "@/lib/feedbackService";

export type { SurveyEvent };

export interface SurveyConfig {
  event: SurveyEvent;
  question: string;
  meta?: Record<string, string>;
}

interface FeedbackContextValue {
  triggerSurvey: (event: SurveyEvent, meta?: Record<string, string>) => void;
  openSnagModal: () => void;
  snagOpen: boolean;
  setSnagOpen: (v: boolean) => void;
  survey: SurveyConfig | null;
  dismissSurvey: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function getSurveyQuestion(event: SurveyEvent, role: string): string {
  if (event === "appointment_booked" && role === "Receptionist")
    return "How smooth was it to find an open slot and book this appointment?";
  if (event === "record_saved" && role === "Vet")
    return "Did anything feel clunky while entering this medical record?";
  if (event === "record_saved" && role === "Nurse")
    return "Was the clinical charting form easy to navigate?";
  if (event === "invoice_finalized" && (role === "SuperAdmin" || role === "Pharmacist"))
    return "How easy was it to finalize this invoice and apply discounts?";
  if (event === "patient_saved")
    return "How easy was it to register this patient's information?";
  return "How would you rate this workflow step?";
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [snagOpen, setSnagOpen] = useState(false);
  const [survey, setSurvey] = useState<SurveyConfig | null>(null);
  const { role } = useRole();

  const triggerSurvey = useCallback(
    (event: SurveyEvent, meta?: Record<string, string>) => {
      const question = getSurveyQuestion(event, role ?? "");
      setSurvey({ event, question, meta });
    },
    [role]
  );

  const dismissSurvey = useCallback(() => setSurvey(null), []);
  const openSnagModal = useCallback(() => setSnagOpen(true), []);

  return (
    <FeedbackContext.Provider
      value={{ triggerSurvey, openSnagModal, snagOpen, setSnagOpen, survey, dismissSurvey }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside FeedbackProvider");
  return ctx;
}

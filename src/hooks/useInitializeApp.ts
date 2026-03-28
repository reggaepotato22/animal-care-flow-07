import { useEffect } from "react";
import { initializeSamplePatients } from "@/lib/patientStore";

export function useInitializeApp() {
  useEffect(() => {
    // We no longer initialize sample patients by default.
    // The user can generate them via the dashboard button.
  }, []);
}

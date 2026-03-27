import { useEffect } from "react";
import { initializeSamplePatients } from "@/lib/patientStore";

export function useInitializeApp() {
  useEffect(() => {
    // Initialize sample patients if none exist
    initializeSamplePatients();
  }, []);
}

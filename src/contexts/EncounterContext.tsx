import React, { createContext, useContext, useState, useEffect } from "react";
import { Encounter, EncounterStatus } from "@/lib/types";
import { toast } from "sonner";

interface EncounterContextValue {
  encounters: Encounter[];
  activeEncounter: Encounter | null;
  createEncounter: (patientId: string, data: Partial<Encounter>) => Encounter;
  updateEncounterStatus: (encounterId: string, status: EncounterStatus) => void;
  setActiveEncounter: (encounter: Encounter | null) => void;
  getEncountersByPatient: (patientId: string) => Encounter[];
  getWaitingEncounters: () => Encounter[];
}

const EncounterContext = createContext<EncounterContextValue | null>(null);

const STORAGE_KEY = "acf_encounters";

export function EncounterProvider({ children }: { children: React.ReactNode }) {
  const [encounters, setEncounters] = useState<Encounter[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encounters));
  }, [encounters]);

  const createEncounter = (patientId: string, data: Partial<Encounter>): Encounter => {
    const newEncounter: Encounter = {
      id: `ENC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      patientId,
      status: "WAITING",
      startTime: new Date().toISOString(),
      reason: data.reason || "",
      chiefComplaint: data.chiefComplaint || "",
      veterinarian: data.veterinarian || "",
      ...data,
    };

    setEncounters((prev) => [...prev, newEncounter]);
    toast.success("New visit created successfully!");
    return newEncounter;
  };

  const updateEncounterStatus = (encounterId: string, status: EncounterStatus) => {
    setEncounters((prev) =>
      prev.map((enc) =>
        enc.id === encounterId
          ? {
              ...enc,
              status,
              endTime: status === "DISCHARGED" ? new Date().toISOString() : enc.endTime,
            }
          : enc
      )
    );

    if (activeEncounter?.id === encounterId) {
      setActiveEncounter((prev) => (prev ? { ...prev, status } : null));
    }
    
    toast.success(`Encounter status updated to ${status}`);
  };

  const getEncountersByPatient = (patientId: string) => {
    return encounters.filter((enc) => enc.patientId === patientId);
  };

  const getWaitingEncounters = () => {
    return encounters.filter((enc) => enc.status === "WAITING");
  };

  const value: EncounterContextValue = {
    encounters,
    activeEncounter,
    createEncounter,
    updateEncounterStatus,
    setActiveEncounter,
    getEncountersByPatient,
    getWaitingEncounters,
  };

  return (
    <EncounterContext.Provider value={value}>
      {children}
    </EncounterContext.Provider>
  );
}

export function useEncounter() {
  const ctx = useContext(EncounterContext);
  if (!ctx) {
    throw new Error("useEncounter must be used within EncounterProvider");
  }
  return ctx;
}

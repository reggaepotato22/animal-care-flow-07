import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Encounter, EncounterStatus } from "@/lib/types";
import { toast } from "sonner";
import { getAccountScopedKey, getActiveAccountId } from "@/lib/accountStore";
import { useAccount } from "@/contexts/AccountContext";

interface EncounterContextValue {
  encounters: Encounter[];
  activeEncounter: Encounter | null;
  createEncounter: (patientId: string, data: Partial<Encounter>) => Encounter;
  updateEncounterStatus: (encounterId: string, status: EncounterStatus) => void;
  setActiveEncounter: (encounter: Encounter | null) => void;
  getEncountersByPatient: (patientId: string) => Encounter[];
  getWaitingEncounters: () => Encounter[];
  getActiveEncounterForPatient: (patientId: string) => Encounter | undefined;
}

const EncounterContext = createContext<EncounterContextValue | null>(null);

const STORAGE_KEY_BASE = "acf_encounters";
const CHANNEL_BASE = "acf_encounter_updates";

function encountersKey() {
  return getAccountScopedKey(STORAGE_KEY_BASE);
}

function encounterChannelName() {
  const id = getActiveAccountId();
  return `acct:${id}:${CHANNEL_BASE}`;
}

const STEP_LABELS: Record<string, string> = {
  WAITING: "awaiting triage",
  IN_TRIAGE: "triage in progress",
  TRIAGED: "triage complete — ready for vet",
  IN_CONSULTATION: "in consultation",
  IN_SURGERY: "in surgery",
  RECOVERY: "in recovery",
  DISCHARGED: "discharged",
};

export function EncounterProvider({ children }: { children: React.ReactNode }) {
  const { activeAccountId } = useAccount();
  const encounterChannelRef = useRef<BroadcastChannel | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>(() => {
    try {
      const stored = localStorage.getItem(encountersKey());
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(encountersKey());
      setEncounters(stored ? JSON.parse(stored) : []);
      setActiveEncounter(null);
    } catch {
      setEncounters([]);
      setActiveEncounter(null);
    }
  }, [activeAccountId]);

  // Persist to localStorage whenever encounters change
  useEffect(() => {
    try { localStorage.setItem(encountersKey(), JSON.stringify(encounters)); } catch {}
  }, [encounters]);

  // Cross-tab sync via BroadcastChannel
  useEffect(() => {
    try {
      encounterChannelRef.current?.close();
    } catch {}
    encounterChannelRef.current = new BroadcastChannel(encounterChannelName());

    const handle = (event: MessageEvent) => {
      const { type, payload } = event.data as { type: string; payload: Record<string, unknown> };

      if (type === "ENCOUNTER_CREATED") {
        const enc = payload as unknown as Encounter;
        setEncounters(prev => prev.find(e => e.id === enc.id) ? prev : [...prev, enc]);
      } else if (type === "ENCOUNTER_STATUS_UPDATE") {
        const { encounterId, status, endTime, petName, patientId } = payload as {
          encounterId: string; status: EncounterStatus; endTime?: string;
          petName?: string; patientId?: string;
        };
        setEncounters(prev => {
          const updated = prev.map(enc =>
            enc.id === encounterId ? { ...enc, status, ...(endTime ? { endTime } : {}) } : enc
          );
          // Use the freshly-updated list to find encounter info for notification
          const enc = updated.find(e => e.id === encounterId);
          const resolvedName = petName || enc?.petName || "A patient";
          window.dispatchEvent(new CustomEvent("acf:notification", {
            detail: {
              type: status === "TRIAGED" ? "success" : "info",
              patientId: patientId || enc?.patientId,
              patientName: resolvedName,
              step: status,
              message: `${resolvedName} — ${STEP_LABELS[status] ?? status}`,
            },
          }));
          return updated;
        });
        setActiveEncounter(prev =>
          prev?.id === encounterId ? { ...prev, status } : prev
        );
      }
    };
    encounterChannelRef.current.addEventListener("message", handle);

    // Also listen for localStorage changes from other tabs as fallback
    const onStorage = (e: StorageEvent) => {
      if (e.key === encountersKey() && e.newValue) {
        try {
          const fresh = JSON.parse(e.newValue) as Encounter[];
          setEncounters(fresh);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      encounterChannelRef.current?.removeEventListener("message", handle);
      window.removeEventListener("storage", onStorage);
      try {
        encounterChannelRef.current?.close();
      } catch {}
      encounterChannelRef.current = null;
    };
  }, [activeAccountId]);

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
    setEncounters(prev => [...prev, newEncounter]);
    try {
      encounterChannelRef.current?.postMessage({ type: "ENCOUNTER_CREATED", payload: newEncounter });
    } catch {}
    toast.success(`Visit created for ${newEncounter.petName || "patient"}`);
    return newEncounter;
  };

  const updateEncounterStatus = (encounterId: string, status: EncounterStatus) => {
    const endTime = status === "DISCHARGED" ? new Date().toISOString() : undefined;
    setEncounters(prev =>
      prev.map(enc =>
        enc.id === encounterId ? { ...enc, status, ...(endTime ? { endTime } : {}) } : enc
      )
    );
    setActiveEncounter(prev =>
      prev?.id === encounterId ? { ...prev, status } : prev
    );
    const encForBroadcast = encounters.find(e => e.id === encounterId);
    try {
      encounterChannelRef.current?.postMessage({
        type: "ENCOUNTER_STATUS_UPDATE",
        payload: {
          encounterId, status,
          ...(endTime ? { endTime } : {}),
          petName: encForBroadcast?.petName,
          patientId: encForBroadcast?.patientId,
        },
      });
    } catch {}
    // Same-tab notification
    const enc = encounters.find(e => e.id === encounterId);
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: status === "TRIAGED" ? "success" : status === "DISCHARGED" ? "info" : "info",
        patientId: enc?.patientId,
        patientName: enc?.petName,
        step: status,
        message: `${enc?.petName || "Patient"} — ${STEP_LABELS[status] ?? status}`,
      },
    }));
    toast.success(`Status updated: ${STEP_LABELS[status] ?? status}`);
  };

  const getEncountersByPatient = (patientId: string) =>
    encounters.filter(enc => enc.patientId === patientId);

  const getWaitingEncounters = () =>
    encounters.filter(enc => enc.status === "WAITING");

  const getActiveEncounterForPatient = (patientId: string) =>
    encounters.find(enc =>
      enc.patientId === patientId &&
      !["DISCHARGED"].includes(enc.status)
    );

  const value: EncounterContextValue = {
    encounters, activeEncounter,
    createEncounter, updateEncounterStatus, setActiveEncounter,
    getEncountersByPatient, getWaitingEncounters, getActiveEncounterForPatient,
  };

  return <EncounterContext.Provider value={value}>{children}</EncounterContext.Provider>;
}

export function useEncounter() {
  const ctx = useContext(EncounterContext);
  if (!ctx) throw new Error("useEncounter must be used within EncounterProvider");
  return ctx;
}

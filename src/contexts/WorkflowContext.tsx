import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolveWorkflow, type WorkflowStep, type WorkflowStepId, defaultWorkflow } from "@/config/workflow";

type PatientStepMap = Record<string, WorkflowStepId>;
export type PatientLifecycleStatus = "Active" | "Hospitalized" | "Discharged" | "Referred" | "Deceased";
type PatientStatusMap = Record<string, PatientLifecycleStatus>;

const STORAGE_KEY = "acf_workflow_order";
const STORAGE_MAP_KEY = "acf_workflow_patient_steps";
const STORAGE_STATUS_KEY = "acf_patient_lifecycle_status";

// Use BroadcastChannel for cross-tab real-time updates
const workflowChannel = new BroadcastChannel("acf_workflow_updates");

interface WorkflowContextValue {
  workflow: WorkflowStep[];
  setWorkflowOrder: (steps: WorkflowStepId[]) => void;
  getStep: (patientId: string) => WorkflowStepId;
  setStep: (patientId: string, step: WorkflowStepId) => void;
  nextStep: (patientId: string) => void;
  prevStep: (patientId: string) => void;
  getIndex: (stepId: WorkflowStepId) => number;
  getPatientStatus: (patientId: string) => PatientLifecycleStatus;
  setPatientStatus: (patientId: string, status: PatientLifecycleStatus) => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({
  children,
  steps,
}: {
  children: React.ReactNode;
  steps?: WorkflowStepId[] | WorkflowStep[];
}) {
  const [workflow, setWorkflow] = useState<WorkflowStep[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ids = JSON.parse(raw) as WorkflowStepId[];
        return resolveWorkflow(ids);
      }
    } catch {}
    return resolveWorkflow(steps);
  });
  const [map, setMap] = useState<PatientStepMap>({});
  const [statusMap, setStatusMap] = useState<PatientStatusMap>({});

  useEffect(() => {
    try {
      const rawMap = localStorage.getItem(STORAGE_MAP_KEY);
      if (rawMap) setMap(JSON.parse(rawMap) as PatientStepMap);
      
      const rawStatus = localStorage.getItem(STORAGE_STATUS_KEY);
      if (rawStatus) setStatusMap(JSON.parse(rawStatus) as PatientStatusMap);
    } catch {}

    // Listen for updates from other tabs
    const handleChannelMessage = (event: MessageEvent) => {
      if (event.data.type === "STEP_UPDATE") {
        const { patientId, step } = event.data.payload;
        setMap((prev) => ({ ...prev, [patientId]: step }));
        
        // Auto-update status if it's a step change
        if (step === "COMPLETED") {
          setStatusMap(prev => ({ ...prev, [patientId]: "Discharged" }));
        } else if (step === "REGISTERED" || step === "TRIAGE" || step === "CONSULTATION" || step === "PHARMACY") {
          setStatusMap(prev => {
            // Only move to Active if not Deceased or Referred
            const current = prev[patientId];
            if (current === "Deceased" || current === "Referred") return prev;
            return { ...prev, [patientId]: "Active" };
          });
        }
      } else if (event.data.type === "STATUS_UPDATE") {
        const { patientId, status } = event.data.payload;
        setStatusMap((prev) => ({ ...prev, [patientId]: status }));
      }
    };
    workflowChannel.addEventListener("message", handleChannelMessage);
    return () => workflowChannel.removeEventListener("message", handleChannelMessage);
  }, []);

  const persistMap = (m: PatientStepMap) => {
    try {
      localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(m));
    } catch {}
  };

  const persistStatusMap = (m: PatientStatusMap) => {
    try {
      localStorage.setItem(STORAGE_STATUS_KEY, JSON.stringify(m));
    } catch {}
  };

  useEffect(() => {
    if (steps && steps.length > 0) {
      setWorkflow(resolveWorkflow(steps));
    }
  }, [steps]);

  const setWorkflowOrder = (ids: WorkflowStepId[]) => {
    setWorkflow(resolveWorkflow(ids));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {}
    window.dispatchEvent(new CustomEvent("acf:workflow-updated"));
  };

  const getIndex = (stepId: WorkflowStepId) =>
    workflow.findIndex((s) => s.id === stepId);

  const getStep = (patientId: string) => {
    return map[patientId] ?? workflow[0]?.id ?? defaultWorkflow[0].id;
  };

  const getPatientStatus = (patientId: string) => {
    return statusMap[patientId] ?? "Active";
  };

  const setPatientStatus = (patientId: string, status: PatientLifecycleStatus) => {
    setStatusMap((prev) => {
      const next = { ...prev, [patientId]: status };
      persistStatusMap(next);
      return next;
    });
    
    // Broadcast status update
    workflowChannel.postMessage({
      type: "STATUS_UPDATE",
      payload: { patientId, status },
    });
  };

  const setStep = (patientId: string, step: WorkflowStepId) => {
    setMap((prev) => {
      const next = { ...prev, [patientId]: step };
      persistMap(next);
      return next;
    });
    
    // Automatically update lifecycle status based on workflow step
    if (step === "COMPLETED") {
      setPatientStatus(patientId, "Discharged");
    } else {
      const currentStatus = getPatientStatus(patientId);
      if (currentStatus !== "Deceased" && currentStatus !== "Referred" && currentStatus !== "Hospitalized") {
        setPatientStatus(patientId, "Active");
      }
    }
    
    // Broadcast update to other tabs
    workflowChannel.postMessage({
      type: "STEP_UPDATE",
      payload: { patientId, step },
    });
  };

  const nextStep = (patientId: string) => {
    const current = getStep(patientId);
    const idx = getIndex(current);
    if (idx < 0) return;
    const next = workflow[idx + 1]?.id;
    if (next) setStep(patientId, next);
  };

  const prevStep = (patientId: string) => {
    const current = getStep(patientId);
    const idx = getIndex(current);
    if (idx <= 0) return;
    const prevId = workflow[idx - 1]?.id;
    if (prevId) setStep(patientId, prevId);
  };

  const value: WorkflowContextValue = {
    workflow,
    setWorkflowOrder,
    getStep,
    setStep,
    nextStep,
    prevStep,
    getIndex,
    getPatientStatus,
    setPatientStatus,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflowContext() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) {
    throw new Error("useWorkflowContext must be used within WorkflowProvider");
  }
  return ctx;
}

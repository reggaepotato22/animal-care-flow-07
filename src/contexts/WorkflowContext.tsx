import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolveWorkflow, type WorkflowStep, type WorkflowStepId, defaultWorkflow } from "@/config/workflow";

type PatientStepMap = Record<string, WorkflowStepId>;
const STORAGE_KEY = "acf_workflow_order";
const STORAGE_MAP_KEY = "acf_workflow_patient_steps";

interface WorkflowContextValue {
  workflow: WorkflowStep[];
  setWorkflowOrder: (steps: WorkflowStepId[]) => void;
  getStep: (patientId: string) => WorkflowStepId;
  setStep: (patientId: string, step: WorkflowStepId) => void;
  nextStep: (patientId: string) => void;
  prevStep: (patientId: string) => void;
  getIndex: (stepId: WorkflowStepId) => number;
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
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_MAP_KEY);
      if (raw) setMap(JSON.parse(raw) as PatientStepMap);
    } catch {}
  }, []);
  const persistMap = (m: PatientStepMap) => {
    try {
      localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(m));
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

  const setStep = (patientId: string, step: WorkflowStepId) => {
    setMap((prev) => {
      const next = { ...prev, [patientId]: step };
      persistMap(next);
      return next;
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

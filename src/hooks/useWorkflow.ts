import { useMemo } from "react";
import { resolveWorkflow, type WorkflowStep, type WorkflowStepId } from "@/config/workflow";
import { useWorkflowContext } from "@/contexts/WorkflowContext";

export interface UseWorkflowOptions {
  steps?: WorkflowStepId[] | WorkflowStep[];
  patientId?: string;
}

export function useWorkflow(options: UseWorkflowOptions = {}) {
  const { steps, patientId } = options;
  const fallbackWorkflow = useMemo(() => resolveWorkflow(steps), [steps]);
  const ctx = (() => {
    try {
      return useWorkflowContext();
    } catch {
      return null;
    }
  })();

  const workflow = ctx?.workflow ?? fallbackWorkflow;

  const currentId: WorkflowStepId | null = patientId
    ? (ctx?.getStep(patientId) ?? workflow[0]?.id ?? null)
    : workflow[0]?.id ?? null;

  const index = currentId ? workflow.findIndex((s) => s.id === currentId) : 0;
  const progress = workflow.length > 1 ? (index / (workflow.length - 1)) * 100 : 0;

  const next = () => {
    if (patientId && ctx) ctx.nextStep(patientId);
  };
  const prev = () => {
    if (patientId && ctx) ctx.prevStep(patientId);
  };
  const goTo = (id: WorkflowStepId) => {
    if (patientId && ctx) ctx.setStep(patientId, id);
  };

  return {
    steps: workflow,
    currentStepId: currentId,
    currentIndex: index,
    progress,
    hasPrev: index > 0,
    hasNext: index < workflow.length - 1,
    next,
    prev,
    goTo,
  };
}


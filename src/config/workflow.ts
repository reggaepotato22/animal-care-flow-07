export type WorkflowStepId =
  | "REGISTERED"
  | "TRIAGE"
  | "CONSULTATION"
  | "PHARMACY"
  | "COMPLETED";

export interface WorkflowStep {
  id: WorkflowStepId;
  label: string;
}

export const defaultWorkflow: WorkflowStep[] = [
  { id: "REGISTERED", label: "Check-in" },
  { id: "TRIAGE", label: "Triage" },
  { id: "CONSULTATION", label: "Consultation" },
  { id: "PHARMACY", label: "Pharmacy" },
  { id: "COMPLETED", label: "Completed" },
];

export function resolveWorkflow(steps?: WorkflowStepId[] | WorkflowStep[]) {
  if (!steps || steps.length === 0) return defaultWorkflow;
  return steps.map((s) => {
    if (typeof s === "string") {
      const found = defaultWorkflow.find((d) => d.id === s);
      return found || { id: s as WorkflowStepId, label: s };
    }
    return s;
  });
}

export function getStepRoute(step: WorkflowStepId) {
  switch (step) {
    case "REGISTERED":
      return "/patients/add";
    case "TRIAGE":
      return "/triage";
    case "CONSULTATION":
      return "/records/new";
    case "PHARMACY":
      return "/inventory";
    case "COMPLETED":
      return "/billing";
    default:
      return "/";
  }
}


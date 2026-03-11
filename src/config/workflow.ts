export type WorkflowStepId =
  | "Reception"
  | "Triage"
  | "Vet"
  | "Surgery"
  | "Recovery"
  | "Billing";

export interface WorkflowStep {
  id: WorkflowStepId;
  label: string;
}

export const defaultWorkflow: WorkflowStep[] = [
  { id: "Reception", label: "Reception" },
  { id: "Triage", label: "Triage" },
  { id: "Vet", label: "Consultation" },
  { id: "Billing", label: "Billing/Pharmacy" },
];

export function resolveWorkflow(steps?: WorkflowStepId[] | WorkflowStep[]) {
  if (!steps || steps.length === 0) return defaultWorkflow;
  return steps.map((s) =>
    typeof s === "string" ? { id: s, label: s } : s,
  );
}

export function getStepRoute(step: WorkflowStepId) {
  switch (step) {
    case "Reception":
      return "/patients/add";
    case "Triage":
      return "/triage";
    case "Vet":
      return "/admin/records/new";
    case "Surgery":
      return "/hospitalization";
    case "Recovery":
      return "/hospitalization";
    case "Billing":
      return "/billing";
    default:
      return "/";
  }
}


import React, { createContext, useContext, useEffect, useState } from "react";
import { resolveWorkflow, type WorkflowStep, type WorkflowStepId, defaultWorkflow } from "@/config/workflow";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatientMeta {
  name: string;
  owner: string;
  time: string;
  type: string;
  checkedInAt: string; // ISO date string
}

type PatientStepMap = Record<string, WorkflowStepId>;
export type PatientLifecycleStatus = "Active" | "Hospitalized" | "Discharged" | "Referred" | "Deceased";
type PatientStatusMap = Record<string, PatientLifecycleStatus>;
type PatientMetaMap = Record<string, PatientMeta>;

export interface CheckedInPatient extends PatientMeta {
  patientId: string;
  step: WorkflowStepId;
}

export interface ProcessHistoryEntry {
  patientId: string;
  petName: string;
  owner: string;
  checkedInAt: string;
  completedAt: string;
  durationMinutes: number;
  finalStatus: PatientLifecycleStatus;
  type: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_ORDER_KEY    = "acf_workflow_order";
const STORAGE_MAP_KEY      = "acf_workflow_patient_steps";
const STORAGE_STATUS_KEY   = "acf_patient_lifecycle_status";
const STORAGE_META_KEY     = "acf_patient_meta";
const STORAGE_CHECKIN_KEY  = "acf_checked_in_patients";
const STORAGE_HISTORY_KEY  = "acf_patient_process_history";

// Module-level channel (one per origin, stable across renders)
const workflowChannel = new BroadcastChannel("acf_workflow_updates");

// ─── Context interface ────────────────────────────────────────────────────────

export interface WorkflowContextValue {
  workflow: WorkflowStep[];
  setWorkflowOrder: (steps: WorkflowStepId[]) => void;
  getStep: (patientId: string) => WorkflowStepId;
  setStep: (patientId: string, step: WorkflowStepId, meta?: Partial<PatientMeta>) => void;
  nextStep: (patientId: string) => void;
  prevStep: (patientId: string) => void;
  getIndex: (stepId: WorkflowStepId) => number;
  getPatientStatus: (patientId: string) => PatientLifecycleStatus;
  setPatientStatus: (patientId: string, status: PatientLifecycleStatus) => void;
  // Check-in
  checkIn: (patientId: string, meta: PatientMeta) => void;
  isCheckedIn: (patientId: string) => boolean;
  getCheckedInPatients: () => CheckedInPatient[];
  patientMeta: PatientMetaMap;
  // Process history
  getProcessHistory: () => ProcessHistoryEntry[];
  clearPatientFromActive: (patientId: string) => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function persist<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function dispatchNotification(detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("acf:notification", { detail }));
}

function recordProcessHistory(
  patientId: string,
  meta: PatientMeta | undefined,
  finalStatus: PatientLifecycleStatus
) {
  if (!meta) return;
  const checkedInAt = new Date(meta.checkedInAt);
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - checkedInAt.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  const entry: ProcessHistoryEntry = {
    patientId,
    petName: meta.name,
    owner: meta.owner,
    checkedInAt: meta.checkedInAt,
    completedAt: completedAt.toISOString(),
    durationMinutes,
    finalStatus: finalStatus === "Active" ? "Discharged" : finalStatus,
    type: meta.type,
  };

  const existing = load<ProcessHistoryEntry[]>(STORAGE_HISTORY_KEY, []);
  existing.unshift(entry);
  persist(STORAGE_HISTORY_KEY, existing);
}

function getProcessHistory(): ProcessHistoryEntry[] {
  return load<ProcessHistoryEntry[]>(STORAGE_HISTORY_KEY, []);
}

function clearPatientFromActive(patientId: string) {
  // Remove from checked-in list when completed
  const checkedIn = load<string[]>(STORAGE_CHECKIN_KEY, []);
  const filtered = checkedIn.filter(id => id !== patientId);
  persist(STORAGE_CHECKIN_KEY, filtered);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WorkflowProvider({
  children,
  steps,
}: {
  children: React.ReactNode;
  steps?: WorkflowStepId[] | WorkflowStep[];
}) {
  const [workflow, setWorkflow] = useState<WorkflowStep[]>(() => {
    const saved = load<WorkflowStepId[] | null>(STORAGE_ORDER_KEY, null);
    return saved ? resolveWorkflow(saved) : resolveWorkflow(steps);
  });

  const [map, setMap] = useState<PatientStepMap>(() =>
    load<PatientStepMap>(STORAGE_MAP_KEY, {})
  );
  const [statusMap, setStatusMap] = useState<PatientStatusMap>(() =>
    load<PatientStatusMap>(STORAGE_STATUS_KEY, {})
  );
  const [metaMap, setMetaMap] = useState<PatientMetaMap>(() =>
    load<PatientMetaMap>(STORAGE_META_KEY, {})
  );
  const [checkedInIds, setCheckedInIds] = useState<string[]>(() =>
    load<string[]>(STORAGE_CHECKIN_KEY, [])
  );

  // ── Cross-tab BroadcastChannel listener ─────────────────────────────────────
  useEffect(() => {
    const handle = (event: MessageEvent) => {
      const { type, payload } = event.data as { type: string; payload: Record<string, unknown> };

      if (type === "STEP_UPDATE") {
        const { patientId, step, petName, ownerName } = payload as {
          patientId: string; step: WorkflowStepId; petName?: string; ownerName?: string;
        };
        setMap(prev => { const n = { ...prev, [patientId]: step }; persist(STORAGE_MAP_KEY, n); return n; });
        if (step === "COMPLETED") {
          setStatusMap(prev => { const n = { ...prev, [patientId]: "Discharged" as PatientLifecycleStatus }; persist(STORAGE_STATUS_KEY, n); return n; });
        } else {
          setStatusMap(prev => {
            if (prev[patientId] === "Deceased" || prev[patientId] === "Referred") return prev;
            const n = { ...prev, [patientId]: "Active" as PatientLifecycleStatus }; persist(STORAGE_STATUS_KEY, n); return n;
          });
        }
        dispatchNotification({ type: "info", patientId, step, patientName: petName || ownerName });

      } else if (type === "STATUS_UPDATE") {
        const { patientId, status } = payload as { patientId: string; status: PatientLifecycleStatus };
        setStatusMap(prev => { const n = { ...prev, [patientId]: status }; persist(STORAGE_STATUS_KEY, n); return n; });

      } else if (type === "PATIENT_CHECKIN") {
        const { patientId, meta, step } = payload as { patientId: string; meta: PatientMeta; step: WorkflowStepId };
        setMetaMap(prev => { const n = { ...prev, [patientId]: meta }; persist(STORAGE_META_KEY, n); return n; });
        setCheckedInIds(prev => {
          if (prev.includes(patientId)) return prev;
          const n = [...prev, patientId]; persist(STORAGE_CHECKIN_KEY, n); return n;
        });
        setMap(prev => { const n = { ...prev, [patientId]: step }; persist(STORAGE_MAP_KEY, n); return n; });
        dispatchNotification({ type: "success", patientId, step: "TRIAGE", patientName: meta.name,
          message: `${meta.name} (${meta.owner}) has been checked in → Triage queue` });
      }
    };

    workflowChannel.addEventListener("message", handle);
    return () => workflowChannel.removeEventListener("message", handle);
  }, []);

  useEffect(() => {
    if (steps && steps.length > 0) setWorkflow(resolveWorkflow(steps));
  }, [steps]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const setWorkflowOrder = (ids: WorkflowStepId[]) => {
    setWorkflow(resolveWorkflow(ids));
    persist(STORAGE_ORDER_KEY, ids);
    window.dispatchEvent(new CustomEvent("acf:workflow-updated"));
  };

  const getIndex = (stepId: WorkflowStepId) => workflow.findIndex(s => s.id === stepId);
  const getStep  = (patientId: string): WorkflowStepId => map[patientId] ?? workflow[0]?.id ?? defaultWorkflow[0].id;
  const getPatientStatus = (patientId: string): PatientLifecycleStatus => statusMap[patientId] ?? "Active";

  const setPatientStatus = (patientId: string, status: PatientLifecycleStatus) => {
    setStatusMap(prev => { const n = { ...prev, [patientId]: status }; persist(STORAGE_STATUS_KEY, n); return n; });
    workflowChannel.postMessage({ type: "STATUS_UPDATE", payload: { patientId, status } });
  };

  // Update from other tabs when patient completes
  useEffect(() => {
    const handle = (event: MessageEvent) => {
      const { type, payload } = event.data as { type: string; payload: Record<string, unknown> };
      if (type === "STEP_UPDATE") {
        const { patientId, step } = payload as { patientId: string; step: WorkflowStepId };
        if (step === "COMPLETED") {
          // Remove from checked-in list when completed from other tab
          setCheckedInIds(prev => {
            const filtered = prev.filter(id => id !== patientId);
            persist(STORAGE_CHECKIN_KEY, filtered);
            return filtered;
          });
        }
      }
    };
    workflowChannel.addEventListener("message", handle);
    return () => workflowChannel.removeEventListener("message", handle);
  }, []);

  const setStep = (patientId: string, step: WorkflowStepId, meta?: Partial<PatientMeta>) => {
    setMap(prev => { const n = { ...prev, [patientId]: step }; persist(STORAGE_MAP_KEY, n); return n; });
    if (step === "COMPLETED") {
      setPatientStatus(patientId, "Discharged");
      // Record timeline and clear from active
      const patientMeta = metaMap[patientId];
      const currentStatus = getPatientStatus(patientId);
      recordProcessHistory(patientId, patientMeta, currentStatus);
      clearPatientFromActive(patientId);
      setCheckedInIds(prev => {
        const filtered = prev.filter(id => id !== patientId);
        persist(STORAGE_CHECKIN_KEY, filtered);
        return filtered;
      });
    } else {
      const cur = getPatientStatus(patientId);
      if (cur !== "Deceased" && cur !== "Referred" && cur !== "Hospitalized") {
        setPatientStatus(patientId, "Active");
      }
    }
    // Always resolve patient name from metaMap if not provided via meta
    const resolvedMeta = metaMap[patientId];
    workflowChannel.postMessage({
      type: "STEP_UPDATE",
      payload: {
        patientId,
        step,
        petName:   meta?.name   ?? resolvedMeta?.name,
        ownerName: meta?.owner  ?? resolvedMeta?.owner,
      },
    });
    // Also fire same-tab notification with resolved name
    dispatchNotification({
      type: "info",
      patientId,
      step,
      patientName: meta?.name ?? resolvedMeta?.name,
    });
  };

  const nextStep = (patientId: string) => {
    const idx = getIndex(getStep(patientId));
    const next = idx >= 0 ? workflow[idx + 1]?.id : undefined;
    if (next) setStep(patientId, next);
  };

  const prevStep = (patientId: string) => {
    const idx = getIndex(getStep(patientId));
    const prev = idx > 0 ? workflow[idx - 1]?.id : undefined;
    if (prev) setStep(patientId, prev);
  };

  const checkIn = (patientId: string, meta: PatientMeta) => {
    setMetaMap(prev => { const n = { ...prev, [patientId]: meta }; persist(STORAGE_META_KEY, n); return n; });
    setCheckedInIds(prev => {
      if (prev.includes(patientId)) return prev;
      const n = [...prev, patientId]; persist(STORAGE_CHECKIN_KEY, n); return n;
    });
    setMap(prev => { const n = { ...prev, [patientId]: "TRIAGE" as WorkflowStepId }; persist(STORAGE_MAP_KEY, n); return n; });
    // Broadcast to other tabs
    workflowChannel.postMessage({ type: "PATIENT_CHECKIN", payload: { patientId, meta, step: "TRIAGE" } });
    workflowChannel.postMessage({ type: "STEP_UPDATE", payload: { patientId, step: "TRIAGE", petName: meta.name, ownerName: meta.owner } });
    // Notify same tab
    dispatchNotification({ type: "success", patientId, step: "TRIAGE", patientName: meta.name,
      message: `${meta.name} (${meta.owner}) checked in — sent to Triage queue` });
  };

  const isCheckedIn = (patientId: string) => checkedInIds.includes(patientId);

  const getCheckedInPatients = (): CheckedInPatient[] =>
    checkedInIds.map(id => ({
      patientId: id,
      step: map[id] ?? "TRIAGE",
      ...(metaMap[id] ?? { name: `Patient ${id}`, owner: "", time: "", type: "", checkedInAt: new Date().toISOString() }),
    }));

  const value: WorkflowContextValue = {
    workflow, setWorkflowOrder,
    getStep, setStep, nextStep, prevStep, getIndex,
    getPatientStatus, setPatientStatus,
    checkIn, isCheckedIn, getCheckedInPatients,
    patientMeta: metaMap,
    getProcessHistory,
    clearPatientFromActive: (patientId: string) => {
      setCheckedInIds(prev => {
        const filtered = prev.filter(id => id !== patientId);
        persist(STORAGE_CHECKIN_KEY, filtered);
        return filtered;
      });
    },
  };

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflowContext() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflowContext must be used within WorkflowProvider");
  return ctx;
}

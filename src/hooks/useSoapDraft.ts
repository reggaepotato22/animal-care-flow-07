import { useEffect, useRef, useCallback } from "react";
import { updateParkedDraft } from "@/lib/parkedPatientsStore";

const DRAFT_KEY_PREFIX = "acf_soap_draft_";

export interface SoapFields {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

function draftKey(patientId: string, encounterId?: string): string {
  return `${DRAFT_KEY_PREFIX}${patientId}${encounterId ? `_${encounterId}` : ""}`;
}

export function saveSoapDraft(
  patientId: string,
  data: SoapFields,
  encounterId?: string
): void {
  try {
    localStorage.setItem(
      draftKey(patientId, encounterId),
      JSON.stringify({ ...data, savedAt: new Date().toISOString() })
    );
    updateParkedDraft(patientId, data.subjective.slice(0, 120));
  } catch {}
}

export function loadSoapDraft(
  patientId: string,
  encounterId?: string
): (SoapFields & { savedAt?: string }) | null {
  try {
    const raw = localStorage.getItem(draftKey(patientId, encounterId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSoapDraft(
  patientId: string,
  encounterId?: string
): void {
  try {
    localStorage.removeItem(draftKey(patientId, encounterId));
  } catch {}
}

/**
 * Drop this hook into any SOAP note editor.
 * It auto-saves the provided `fields` every `intervalMs` milliseconds
 * and immediately when the component unmounts.
 */
export function useSoapDraft(
  patientId: string,
  fields: SoapFields,
  options: {
    encounterId?: string;
    intervalMs?: number;
    enabled?: boolean;
    onSave?: (at: string) => void;
  } = {}
): { forceSave: () => void } {
  const { encounterId, intervalMs = 30_000, enabled = true, onSave } = options;
  const fieldsRef = useRef(fields);
  useEffect(() => { fieldsRef.current = fields; }, [fields]);

  const forceSave = useCallback(() => {
    if (!enabled || !patientId) return;
    saveSoapDraft(patientId, fieldsRef.current, encounterId);
    onSave?.(new Date().toISOString());
  }, [enabled, patientId, encounterId, onSave]);

  useEffect(() => {
    if (!enabled || !patientId) return;
    const id = setInterval(forceSave, intervalMs);
    return () => {
      clearInterval(id);
      forceSave();
    };
  }, [enabled, patientId, intervalMs, forceSave]);

  return { forceSave };
}

import { treatmentItems as seedTreatments, type TreatmentItem } from "@/data/treatments";

const TREATMENTS_KEY  = "acf_treatment_items";
export const TREATMENTS_CHANNEL = "acf_treatments_updates";

/** Load treatments from localStorage. Returns [] when nothing stored (zero-state). */
export function loadTreatments(): TreatmentItem[] {
  try {
    const raw = localStorage.getItem(TREATMENTS_KEY);
    if (raw) return JSON.parse(raw) as TreatmentItem[];
  } catch {}
  return [];
}

export function saveTreatments(items: TreatmentItem[]): void {
  try { localStorage.setItem(TREATMENTS_KEY, JSON.stringify(items)); } catch {}
  broadcastTreatmentsUpdate();
}

export function saveTreatmentItem(item: TreatmentItem): void {
  const items = loadTreatments();
  const idx = items.findIndex(i => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  saveTreatments(items);
}

export function deleteTreatmentItem(id: string): void {
  saveTreatments(loadTreatments().filter(i => i.id !== id));
}

/** Seed the full treatment catalog (called by Generate Mock Data). */
export function generateMockTreatments(): TreatmentItem[] {
  saveTreatments(seedTreatments);
  return [...seedTreatments];
}

export function clearTreatmentsData(): void {
  try { localStorage.setItem(TREATMENTS_KEY, JSON.stringify([])); } catch {}
  broadcastTreatmentsUpdate();
}

export function broadcastTreatmentsUpdate(): void {
  try {
    const ch = new BroadcastChannel(TREATMENTS_CHANNEL);
    ch.postMessage({ type: "TREATMENTS_UPDATE" });
    ch.close();
  } catch {}
}

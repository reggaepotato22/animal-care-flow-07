import { InventoryItem, inventoryItems as seedInventory } from "@/data/inventory";

const INVENTORY_KEY = "acf_inventory_items";
export const INVENTORY_CHANNEL = "acf_inventory_updates";

export function loadInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (raw) return JSON.parse(raw) as InventoryItem[];
  } catch {}
  // Seed from static data on first load
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(seedInventory));
  return [...seedInventory];
}

export function saveInventoryItem(item: InventoryItem): void {
  const items = loadInventory();
  const idx = items.findIndex(i => i.id === item.id);
  const updated = { ...item, lastUpdated: new Date().toISOString() };
  if (idx >= 0) items[idx] = updated;
  else items.push(updated);
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  broadcastInventoryUpdate();
}

export function deleteInventoryItem(id: string): void {
  const items = loadInventory().filter(i => i.id !== id);
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  broadcastInventoryUpdate();
}

/** Deduct qty from an item by name (case-insensitive partial match) or id. Returns true if found. */
export function deductInventoryByName(name: string, qty: number): boolean {
  const items = loadInventory();
  const lower = name.toLowerCase();
  const idx = items.findIndex(i =>
    i.name.toLowerCase().includes(lower) || i.id === name
  );
  if (idx < 0) return false;
  items[idx].quantity = Math.max(0, items[idx].quantity - qty);
  items[idx].lastUpdated = new Date().toISOString();
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  broadcastInventoryUpdate();
  return true;
}

export function deductInventoryItem(id: string, qty: number): boolean {
  const items = loadInventory();
  const idx = items.findIndex(i => i.id === id);
  if (idx < 0) return false;
  items[idx].quantity = Math.max(0, items[idx].quantity - qty);
  items[idx].lastUpdated = new Date().toISOString();
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  broadcastInventoryUpdate();
  return true;
}

export function broadcastInventoryUpdate(): void {
  try {
    const ch = new BroadcastChannel(INVENTORY_CHANNEL);
    ch.postMessage({ type: "INVENTORY_UPDATE" });
    ch.close();
  } catch {}
}

/** Parse a simple CSV string (headers on first row) into InventoryItems */
export function parseInventoryCSV(csv: string): Partial<InventoryItem>[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return {
      id: obj.id || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sku: obj.sku || "",
      name: obj.name || "",
      category: obj.category || "other",
      description: obj.description,
      quantity: Number(obj.quantity) || 0,
      unit: obj.unit || "unit",
      unitCost: Number(obj.unit_cost || obj.unitcost || obj.cost) || 0,
      supplier: obj.supplier,
      location: obj.location,
      reorderLevel: Number(obj.reorder_level || obj.reorderlevel) || 5,
      reorderQuantity: Number(obj.reorder_qty || obj.reorderquantity) || 10,
      isActive: obj.is_active !== "false",
    } as Partial<InventoryItem>;
  });
}

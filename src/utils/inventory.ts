import { inventoryItems, InventoryItem } from "@/data/inventory";
import { TreatmentItem, LinkedInventoryItem } from "@/data/treatments";

/**
 * Deduct inventory items when a treatment is applied
 * Returns an array of results indicating success/failure for each inventory item
 */
export interface InventoryDeductionResult {
  inventoryId: string;
  inventoryItem: InventoryItem;
  requestedQuantity: number;
  availableQuantity: number;
  deductedQuantity: number;
  success: boolean;
  error?: string;
}

export function deductInventoryForTreatment(
  treatment: TreatmentItem,
  treatmentQuantity: number = 1
): InventoryDeductionResult[] {
  if (!treatment.linkedInventory || treatment.linkedInventory.length === 0) {
    return [];
  }

  const results: InventoryDeductionResult[] = [];

  treatment.linkedInventory.forEach((linkedItem: LinkedInventoryItem) => {
    const inventoryItem = inventoryItems.find(item => item.id === linkedItem.inventoryId);
    
    if (!inventoryItem) {
      results.push({
        inventoryId: linkedItem.inventoryId,
        inventoryItem: {} as InventoryItem,
        requestedQuantity: linkedItem.quantity * treatmentQuantity,
        availableQuantity: 0,
        deductedQuantity: 0,
        success: false,
        error: "Inventory item not found"
      });
      return;
    }

    if (!inventoryItem.isActive) {
      results.push({
        inventoryId: linkedItem.inventoryId,
        inventoryItem,
        requestedQuantity: linkedItem.quantity * treatmentQuantity,
        availableQuantity: inventoryItem.quantity,
        deductedQuantity: 0,
        success: false,
        error: "Inventory item is inactive"
      });
      return;
    }

    const requestedQuantity = linkedItem.quantity * treatmentQuantity;
    const availableQuantity = inventoryItem.quantity;

    if (availableQuantity < requestedQuantity) {
      if (linkedItem.required) {
        // Required item is insufficient - fail the deduction
        results.push({
          inventoryId: linkedItem.inventoryId,
          inventoryItem,
          requestedQuantity,
          availableQuantity,
          deductedQuantity: 0,
          success: false,
          error: `Insufficient stock. Required: ${requestedQuantity}, Available: ${availableQuantity}`
        });
      } else {
        // Optional item - deduct what's available
        inventoryItem.quantity = 0;
        results.push({
          inventoryId: linkedItem.inventoryId,
          inventoryItem,
          requestedQuantity,
          availableQuantity,
          deductedQuantity: availableQuantity,
          success: true,
          error: `Partial deduction. Requested: ${requestedQuantity}, Deducted: ${availableQuantity}`
        });
      }
    } else {
      // Sufficient stock - deduct the requested quantity
      inventoryItem.quantity -= requestedQuantity;
      results.push({
        inventoryId: linkedItem.inventoryId,
        inventoryItem,
        requestedQuantity,
        availableQuantity,
        deductedQuantity: requestedQuantity,
        success: true
      });
    }
  });

  return results;
}

/**
 * Check if a treatment can be applied (all required inventory items are available)
 */
export function canApplyTreatment(
  treatment: TreatmentItem,
  treatmentQuantity: number = 1
): { canApply: boolean; errors: string[] } {
  if (!treatment.linkedInventory || treatment.linkedInventory.length === 0) {
    return { canApply: true, errors: [] };
  }

  const errors: string[] = [];

  treatment.linkedInventory.forEach((linkedItem: LinkedInventoryItem) => {
    if (!linkedItem.required) return; // Skip optional items for pre-check

    const inventoryItem = inventoryItems.find(item => item.id === linkedItem.inventoryId);
    
    if (!inventoryItem) {
      errors.push(`Inventory item not found: ${linkedItem.inventoryId}`);
      return;
    }

    if (!inventoryItem.isActive) {
      errors.push(`Inventory item is inactive: ${inventoryItem.name}`);
      return;
    }

    const requestedQuantity = linkedItem.quantity * treatmentQuantity;
    if (inventoryItem.quantity < requestedQuantity) {
      errors.push(
        `Insufficient stock for ${inventoryItem.name}. Required: ${requestedQuantity}, Available: ${inventoryItem.quantity}`
      );
    }
  });

  return {
    canApply: errors.length === 0,
    errors
  };
}




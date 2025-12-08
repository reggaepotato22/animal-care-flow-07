export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  unit: string; // e.g., "ml", "pack", "box", "vial", "unit"
  unitCost: number;
  supplier?: string;
  location?: string; // Storage location
  expirationDate?: string; // ISO date string
  lotNumber?: string;
  reorderLevel: number; // Minimum quantity before reorder
  reorderQuantity: number; // Quantity to order when reorder level is reached
  isActive: boolean;
  lastUpdated: string; // ISO date string
}

export const inventoryCategories = {
  "drugs": "Medications & Drugs",
  "vaccines": "Vaccines",
  "consumables": "Consumables",
  "surgical": "Surgical Supplies",
  "diagnostic": "Diagnostic Materials",
  "equipment": "Equipment & Instruments",
  "food": "Prescription Food",
  "other": "Other"
};

// Mock inventory data
export const inventoryItems: InventoryItem[] = [
  {
    id: "1",
    sku: "DRUG-001",
    name: "Amoxicillin 250mg",
    category: "drugs",
    description: "Broad-spectrum antibiotic",
    quantity: 45,
    unit: "tablet",
    unitCost: 0.85,
    supplier: "PharmaVet Supplies",
    location: "Pharmacy - Shelf A3",
    expirationDate: "2025-06-15",
    lotNumber: "AMX-2024-001",
    reorderLevel: 20,
    reorderQuantity: 100,
    isActive: true,
    lastUpdated: "2024-01-20T10:30:00Z"
  },
  {
    id: "2",
    sku: "VAC-001",
    name: "Rabies Vaccine",
    category: "vaccines",
    description: "Inactivated rabies vaccine",
    quantity: 12,
    unit: "vial",
    unitCost: 15.50,
    supplier: "VetMed Pharmaceuticals",
    location: "Refrigerator - Vaccine Section",
    expirationDate: "2024-12-31",
    lotNumber: "RAB-2024-042",
    reorderLevel: 10,
    reorderQuantity: 50,
    isActive: true,
    lastUpdated: "2024-01-18T14:20:00Z"
  },
  {
    id: "3",
    sku: "CONS-001",
    name: "Suture Pack - 3-0 Nylon",
    category: "surgical",
    description: "Sterile suture pack, 3-0 Nylon",
    quantity: 8,
    unit: "pack",
    unitCost: 12.75,
    supplier: "Surgical Supplies Co",
    location: "Surgery Room - Cabinet 2",
    expirationDate: "2026-03-20",
    lotNumber: "SUT-2023-156",
    reorderLevel: 15,
    reorderQuantity: 30,
    isActive: true,
    lastUpdated: "2024-01-19T09:15:00Z"
  },
  {
    id: "4",
    sku: "CONS-002",
    name: "Disposable Syringes 5ml",
    category: "consumables",
    description: "Sterile disposable syringes, 5ml capacity",
    quantity: 150,
    unit: "unit",
    unitCost: 0.35,
    supplier: "Medical Supplies Direct",
    location: "Exam Room - Supply Drawer",
    reorderLevel: 50,
    reorderQuantity: 200,
    isActive: true,
    lastUpdated: "2024-01-21T11:45:00Z"
  },
  {
    id: "5",
    sku: "DIAG-001",
    name: "Blood Collection Tubes - EDTA",
    category: "diagnostic",
    description: "Vacutainer tubes with EDTA, 3ml",
    quantity: 25,
    unit: "tube",
    unitCost: 0.95,
    supplier: "Lab Supplies Inc",
    location: "Lab - Refrigerator",
    expirationDate: "2025-08-10",
    lotNumber: "EDTA-2024-078",
    reorderLevel: 30,
    reorderQuantity: 100,
    isActive: true,
    lastUpdated: "2024-01-20T16:30:00Z"
  },
  {
    id: "6",
    sku: "VAC-002",
    name: "DHPP Vaccine",
    category: "vaccines",
    description: "Canine distemper, hepatitis, parvo, parainfluenza",
    quantity: 5,
    unit: "vial",
    unitCost: 18.00,
    supplier: "VetMed Pharmaceuticals",
    location: "Refrigerator - Vaccine Section",
    expirationDate: "2024-11-30",
    lotNumber: "DHPP-2024-089",
    reorderLevel: 10,
    reorderQuantity: 50,
    isActive: true,
    lastUpdated: "2024-01-17T13:20:00Z"
  },
  {
    id: "7",
    sku: "DRUG-002",
    name: "Ibuprofen 100mg",
    category: "drugs",
    description: "Anti-inflammatory medication",
    quantity: 18,
    unit: "tablet",
    unitCost: 0.65,
    supplier: "PharmaVet Supplies",
    location: "Pharmacy - Shelf B1",
    expirationDate: "2025-09-20",
    lotNumber: "IBU-2024-012",
    reorderLevel: 20,
    reorderQuantity: 100,
    isActive: true,
    lastUpdated: "2024-01-19T10:00:00Z"
  },
  {
    id: "8",
    sku: "CONS-003",
    name: "Surgical Gloves - Latex Free, Medium",
    category: "surgical",
    description: "Sterile latex-free surgical gloves, size medium",
    quantity: 22,
    unit: "box",
    unitCost: 8.50,
    supplier: "Medical Supplies Direct",
    location: "Surgery Room - Supply Cabinet",
    reorderLevel: 10,
    reorderQuantity: 25,
    isActive: true,
    lastUpdated: "2024-01-21T08:30:00Z"
  },
  {
    id: "9",
    sku: "FOOD-001",
    name: "Prescription Diet - Renal Support",
    category: "food",
    description: "Veterinary prescription diet for renal support, 12kg bag",
    quantity: 3,
    unit: "bag",
    unitCost: 45.00,
    supplier: "Pet Nutrition Co",
    location: "Storage Room - Food Section",
    expirationDate: "2024-09-15",
    lotNumber: "REN-2024-034",
    reorderLevel: 5,
    reorderQuantity: 10,
    isActive: true,
    lastUpdated: "2024-01-18T15:00:00Z"
  },
  {
    id: "10",
    sku: "DIAG-002",
    name: "Urine Test Strips",
    category: "diagnostic",
    description: "Multi-parameter urine test strips, 100 strips per bottle",
    quantity: 2,
    unit: "bottle",
    unitCost: 28.50,
    supplier: "Lab Supplies Inc",
    location: "Lab - Shelf 3",
    expirationDate: "2024-10-05",
    lotNumber: "UR-2024-056",
    reorderLevel: 3,
    reorderQuantity: 5,
    isActive: true,
    lastUpdated: "2024-01-16T12:00:00Z"
  },
  {
    id: "11",
    sku: "CONS-004",
    name: "Cotton Swabs",
    category: "consumables",
    description: "Sterile cotton swabs, 100 per box",
    quantity: 45,
    unit: "box",
    unitCost: 3.25,
    supplier: "Medical Supplies Direct",
    location: "Exam Room - Supply Drawer",
    reorderLevel: 20,
    reorderQuantity: 50,
    isActive: true,
    lastUpdated: "2024-01-20T14:15:00Z"
  },
  {
    id: "12",
    sku: "SURG-001",
    name: "Surgical Scissors - Straight",
    category: "equipment",
    description: "Stainless steel surgical scissors, straight, 5.5 inch",
    quantity: 1,
    unit: "unit",
    unitCost: 45.00,
    supplier: "Surgical Supplies Co",
    location: "Surgery Room - Instrument Tray",
    reorderLevel: 2,
    reorderQuantity: 3,
    isActive: true,
    lastUpdated: "2024-01-15T09:00:00Z"
  }
];








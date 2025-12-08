// Treatment Categories
export const treatmentCategories = {
  "medical-procedures": "Medical Procedures",
  "medications": "Medications",
  "lab-tests": "Lab Tests",
  "preventives": "Preventives",
  "fees-charges": "Fees & Charges",
  "boarding-grooming": "Boarding & Grooming",
  "packages-bundles": "Packages / Bundles"
} as const;

export type TreatmentCategory = keyof typeof treatmentCategories;

export interface LinkedInventoryItem {
  inventoryId: string; // ID of the inventory item
  quantity: number; // Quantity to deduct per treatment
  required: boolean; // Whether this item is required for the treatment
}

export interface TreatmentItem {
  id: string;
  code: string;
  name: string;
  category: TreatmentCategory;
  description: string;
  price: number;
  cost: number;
  duration: number; // minutes
  isActive: boolean;
  requiresAppointment: boolean;
  taxable: boolean;
  requiresPrescription: boolean;
  tags: string[];
  includes?: string[]; // For packages - list of treatment codes
  linkedInventory?: LinkedInventoryItem[]; // Inventory items to deduct when treatment is applied
}

// Master Treatment Catalog
export const treatmentItems: TreatmentItem[] = [
  // Medical Procedures
  {
    id: "T-001",
    code: "EXAM-001",
    name: "Comprehensive Physical Examination",
    category: "medical-procedures",
    description: "Complete physical examination including vital signs, body systems assessment",
    price: 85.00,
    cost: 25.00,
    duration: 30,
    isActive: true,
    requiresAppointment: true,
    taxable: true,
    requiresPrescription: false,
    tags: ["exam", "wellness", "routine"]
  },
  {
    id: "T-002",
    code: "EXAM-002",
    name: "Emergency Examination",
    category: "medical-procedures",
    description: "Urgent medical evaluation and stabilization",
    price: 150.00,
    cost: 45.00,
    duration: 45,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: false,
    tags: ["exam", "emergency", "urgent"]
  },
  {
    id: "T-003",
    code: "SURG-001",
    name: "Spay Surgery (Dog)",
    category: "medical-procedures",
    description: "Ovariohysterectomy for female dogs",
    price: 450.00,
    cost: 150.00,
    duration: 90,
    isActive: true,
    requiresAppointment: true,
    taxable: true,
    requiresPrescription: false,
    tags: ["surgery", "spay", "canine"],
    linkedInventory: [
      { inventoryId: "3", quantity: 1, required: true }, // Suture Pack
      { inventoryId: "8", quantity: 1, required: true }, // Surgical Gloves
      { inventoryId: "4", quantity: 1, required: false } // Syringe (optional)
    ]
  },
  {
    id: "T-004",
    code: "SURG-002",
    name: "Neuter Surgery (Dog)",
    category: "medical-procedures",
    description: "Castration for male dogs",
    price: 350.00,
    cost: 100.00,
    duration: 60,
    isActive: true,
    requiresAppointment: true,
    taxable: true,
    requiresPrescription: false,
    tags: ["surgery", "neuter", "canine"]
  },
  {
    id: "T-005",
    code: "DENT-001",
    name: "Dental Cleaning",
    category: "medical-procedures",
    description: "Professional dental cleaning and scaling under anesthesia",
    price: 320.00,
    cost: 80.00,
    duration: 120,
    isActive: true,
    requiresAppointment: true,
    taxable: true,
    requiresPrescription: false,
    tags: ["dental", "cleaning", "anesthesia"]
  },
  {
    id: "T-006",
    code: "DENT-002",
    name: "Tooth Extraction",
    category: "medical-procedures",
    description: "Single tooth extraction",
    price: 75.00,
    cost: 20.00,
    duration: 20,
    isActive: true,
    requiresAppointment: true,
    taxable: true,
    requiresPrescription: false,
    tags: ["dental", "extraction", "surgery"]
  },

  // Vaccinations (Preventives)
  {
    id: "T-007",
    code: "VAC-001",
    name: "Rabies Vaccination",
    category: "preventives",
    description: "Annual rabies vaccination for dogs and cats",
    price: 45.00,
    cost: 15.00,
    duration: 15,
    isActive: true,
    requiresAppointment: true,
    taxable: false,
    requiresPrescription: false,
    tags: ["vaccination", "preventive", "annual", "rabies"],
    linkedInventory: [
      { inventoryId: "2", quantity: 1, required: true } // Rabies Vaccine vial
    ]
  },
  {
    id: "T-008",
    code: "VAC-002",
    name: "DHPP Vaccination (Dog)",
    category: "preventives",
    description: "Distemper, Hepatitis, Parvovirus, Parainfluenza vaccination for dogs",
    price: 55.00,
    cost: 18.00,
    duration: 15,
    isActive: true,
    requiresAppointment: true,
    taxable: false,
    requiresPrescription: false,
    tags: ["vaccination", "preventive", "canine", "dhpp"],
    linkedInventory: [
      { inventoryId: "6", quantity: 1, required: true } // DHPP Vaccine vial
    ]
  },
  {
    id: "T-009",
    code: "VAC-003",
    name: "FVRCP Vaccination (Cat)",
    category: "preventives",
    description: "Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia vaccination",
    price: 50.00,
    cost: 16.00,
    duration: 15,
    isActive: true,
    requiresAppointment: true,
    taxable: false,
    requiresPrescription: false,
    tags: ["vaccination", "preventive", "feline", "fvrcp"]
  },
  {
    id: "T-010",
    code: "VAC-004",
    name: "Bordetella Vaccination",
    category: "preventives",
    description: "Kennel cough vaccination",
    price: 35.00,
    cost: 12.00,
    duration: 10,
    isActive: true,
    requiresAppointment: true,
    taxable: false,
    requiresPrescription: false,
    tags: ["vaccination", "preventive", "kennel-cough"]
  },

  // Lab Tests
  {
    id: "T-011",
    code: "LAB-001",
    name: "Complete Blood Count (CBC)",
    category: "lab-tests",
    description: "Complete blood count with differential",
    price: 65.00,
    cost: 20.00,
    duration: 0,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: true,
    tags: ["lab", "diagnostic", "blood", "cbc"]
  },
  {
    id: "T-012",
    code: "LAB-002",
    name: "Chemistry Panel",
    category: "lab-tests",
    description: "Comprehensive metabolic panel",
    price: 85.00,
    cost: 25.00,
    duration: 0,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: true,
    tags: ["lab", "diagnostic", "blood", "chemistry"]
  },
  {
    id: "T-013",
    code: "LAB-003",
    name: "Urinalysis",
    category: "lab-tests",
    description: "Complete urinalysis with microscopic examination",
    price: 45.00,
    cost: 15.00,
    duration: 0,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: false,
    tags: ["lab", "diagnostic", "urine"]
  },
  {
    id: "T-014",
    code: "LAB-004",
    name: "Fecal Examination",
    category: "lab-tests",
    description: "Fecal flotation for parasite detection",
    price: 35.00,
    cost: 10.00,
    duration: 0,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: false,
    tags: ["lab", "diagnostic", "fecal", "parasite"]
  },
  {
    id: "T-015",
    code: "LAB-005",
    name: "Heartworm Test",
    category: "lab-tests",
    description: "Heartworm antigen test",
    price: 40.00,
    cost: 12.00,
    duration: 0,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: false,
    tags: ["lab", "diagnostic", "heartworm", "preventive"]
  },

  // Medications
  {
    id: "T-016",
    code: "MED-001",
    name: "Heartgard Plus (Monthly)",
    category: "medications",
    description: "Heartworm prevention medication",
    price: 25.00,
    cost: 8.00,
    duration: 5,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: true,
    tags: ["medication", "heartworm", "preventive"]
  },
  {
    id: "T-017",
    code: "MED-002",
    name: "Antibiotic Course (7 days)",
    category: "medications",
    description: "Standard antibiotic treatment",
    price: 35.00,
    cost: 10.00,
    duration: 5,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: true,
    tags: ["medication", "antibiotic", "treatment"],
    linkedInventory: [
      { inventoryId: "1", quantity: 7, required: true } // Amoxicillin 250mg tablets
    ]
  },
  {
    id: "T-018",
    code: "MED-003",
    name: "Pain Management (5 days)",
    category: "medications",
    description: "Post-operative pain medication",
    price: 30.00,
    cost: 9.00,
    duration: 5,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: true,
    tags: ["medication", "pain", "post-op"]
  },

  // Fees & Charges
  {
    id: "T-019",
    code: "FEE-001",
    name: "Office Visit Fee",
    category: "fees-charges",
    description: "Standard office visit fee",
    price: 50.00,
    cost: 0.00,
    duration: 0,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: false,
    tags: ["fee", "office-visit"]
  },
  {
    id: "T-020",
    code: "FEE-002",
    name: "Emergency Fee",
    category: "fees-charges",
    description: "After-hours emergency service fee",
    price: 100.00,
    cost: 0.00,
    duration: 0,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: false,
    tags: ["fee", "emergency"]
  },
  {
    id: "T-021",
    code: "FEE-003",
    name: "Hospitalization (per day)",
    category: "fees-charges",
    description: "Daily hospitalization fee",
    price: 75.00,
    cost: 20.00,
    duration: 0,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: false,
    tags: ["fee", "hospitalization"]
  },

  // Boarding & Grooming
  {
    id: "T-022",
    code: "BOARD-001",
    name: "Boarding (per day)",
    category: "boarding-grooming",
    description: "Daily boarding fee",
    price: 40.00,
    cost: 15.00,
    duration: 0,
    isActive: true,
    requiresAppointment: true,
    taxable: true,
    requiresPrescription: false,
    tags: ["boarding", "daily"]
  },
  {
    id: "T-023",
    code: "GROOM-001",
    name: "Full Grooming Service",
    category: "boarding-grooming",
    description: "Bath, haircut, nail trim, ear cleaning",
    price: 65.00,
    cost: 20.00,
    duration: 90,
    isActive: true,
    requiresAppointment: true,
    taxable: true,
    requiresPrescription: false,
    tags: ["grooming", "bath", "haircut"]
  },
  {
    id: "T-024",
    code: "GROOM-002",
    name: "Nail Trim",
    category: "boarding-grooming",
    description: "Nail trimming service",
    price: 15.00,
    cost: 5.00,
    duration: 15,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: false,
    tags: ["grooming", "nails"]
  },

  // Packages / Bundles
  {
    id: "T-025",
    code: "PKG-001",
    name: "Puppy Wellness Package",
    category: "packages-bundles",
    description: "Complete puppy wellness package including exam, vaccines, deworming, fecal test",
    price: 250.00,
    cost: 100.00,
    duration: 60,
    isActive: true,
    requiresAppointment: true,
    taxable: false,
    requiresPrescription: false,
    tags: ["package", "wellness", "puppy"],
    includes: ["EXAM-001", "VAC-002", "VAC-004", "LAB-004"]
  },
  {
    id: "T-026",
    code: "PKG-002",
    name: "Senior Pet Wellness Package",
    category: "packages-bundles",
    description: "Comprehensive senior pet exam with bloodwork and urinalysis",
    price: 275.00,
    cost: 110.00,
    duration: 45,
    isActive: true,
    requiresAppointment: true,
    taxable: false,
    requiresPrescription: false,
    tags: ["package", "wellness", "senior"],
    includes: ["EXAM-001", "LAB-001", "LAB-002", "LAB-003"]
  },
  {
    id: "T-027",
    code: "PKG-003",
    name: "Dental Package",
    category: "packages-bundles",
    description: "Dental cleaning with pre-anesthetic bloodwork",
    price: 380.00,
    cost: 100.00,
    duration: 150,
    isActive: true,
    requiresAppointment: true,
    taxable: true,
    requiresPrescription: false,
    tags: ["package", "dental"],
    includes: ["DENT-001", "LAB-001"]
  }
];



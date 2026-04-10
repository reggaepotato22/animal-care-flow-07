
import { savePatients, samplePatients, generatePatientId, generateOwnerId, AUTH_PRESERVE_KEYS } from "./patientStore";
import { saveStaff, sampleStaff } from "./staffStore";
import { createDemoAppointments, saveAppointments } from "./appointmentStore";
import { saveRoles, saveGroups, saveUsers, sampleRoles, sampleGroups, sampleUsers } from "./roleStore";
import { getAccountScopedKey } from "./accountStore";
import { generateMockInventory, clearInventoryData, loadInventory, saveInventoryItem } from "./inventoryStore";
import { generateMockTreatments, clearTreatmentsData, broadcastTreatmentsUpdate } from "./treatmentStore";
import { saveHospRecord, broadcastHospUpdate, type HospRecord } from "./hospitalizationStore";
import { upsertClinicalRecord, broadcastClinicalRecordUpdate } from "./clinicalRecordStore";
import { seedDemoStaffProfiles } from "./staffProfileStore";
import { saveInvoices, type Invoice } from "./billingStore";
import { pushFromEvent } from "./notificationStore";
import { broadcast } from "./realtimeEngine";
import type { InventoryItem } from "@/data/inventory";

export function clearAllData() {
  if (typeof window === "undefined") return;
  const preserved: Record<string, string> = {};
  for (const key of AUTH_PRESERVE_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) preserved[key] = val;
  }
  localStorage.clear();
  for (const [key, val] of Object.entries(preserved)) {
    localStorage.setItem(key, val);
  }
  clearInventoryData();
  clearTreatmentsData();
  window.location.reload();
}

const DEMO_DRUGS: Omit<InventoryItem, "lastUpdated">[] = [
  { id: "drug-001", sku: "AMX-500", name: "Amoxicillin 500mg", category: "drugs", description: "Broad-spectrum antibiotic", quantity: 120, unit: "tablets", unitCost: 0.8, reorderLevel: 20, reorderQuantity: 100, isActive: true },
  { id: "drug-002", sku: "TRM-50",  name: "Tramadol 50mg",     category: "drugs", description: "Opioid analgesic",        quantity: 80,  unit: "tablets", unitCost: 1.2, reorderLevel: 15, reorderQuantity: 60,  isActive: true },
  { id: "drug-003", sku: "MTP-5",   name: "Metronidazole 5mg/ml", category: "drugs", description: "Antiprotozoal / anaerobic antibiotic", quantity: 30, unit: "vials", unitCost: 4.5, reorderLevel: 8, reorderQuantity: 20, isActive: true },
  { id: "drug-004", sku: "DEX-4",   name: "Dexamethasone 4mg/ml", category: "drugs", description: "Corticosteroid anti-inflammatory", quantity: 25, unit: "vials", unitCost: 6.0, reorderLevel: 5, reorderQuantity: 15, isActive: true },
  { id: "drug-005", sku: "ENR-50",  name: "Enrofloxacin 50mg",    category: "drugs", description: "Fluoroquinolone antibiotic", quantity: 90, unit: "tablets", unitCost: 1.5, reorderLevel: 20, reorderQuantity: 80, isActive: true },
  { id: "drug-006", sku: "BUP-03",  name: "Buprenorphine 0.3mg/ml", category: "drugs", description: "Partial opioid agonist analgesic", quantity: 18, unit: "vials", unitCost: 12.0, reorderLevel: 5, reorderQuantity: 10, isActive: true },
  { id: "drug-007", sku: "FUR-40",  name: "Furosemide 40mg",      category: "drugs", description: "Loop diuretic", quantity: 60, unit: "tablets", unitCost: 0.6, reorderLevel: 10, reorderQuantity: 50, isActive: true },
  { id: "drug-008", sku: "ATR-06",  name: "Atropine 0.6mg/ml",   category: "drugs", description: "Anticholinergic / pre-op med", quantity: 22, unit: "vials", unitCost: 5.5, reorderLevel: 5, reorderQuantity: 12, isActive: true },
  { id: "drug-009", sku: "KTM-100", name: "Ketamine 100mg/ml",   category: "drugs", description: "Dissociative anaesthetic", quantity: 10, unit: "vials", unitCost: 18.0, reorderLevel: 3, reorderQuantity: 8, isActive: true },
  { id: "drug-010", sku: "MID-5",   name: "Midazolam 5mg/ml",    category: "drugs", description: "Benzodiazepine sedative", quantity: 14, unit: "vials", unitCost: 9.0, reorderLevel: 4, reorderQuantity: 10, isActive: true },
  { id: "drug-011", sku: "PRO-10",  name: "Propofol 10mg/ml",    category: "drugs", description: "IV induction agent", quantity: 8,  unit: "vials", unitCost: 22.0, reorderLevel: 3, reorderQuantity: 6, isActive: true },
  { id: "drug-012", sku: "CXN-250", name: "Cephalexin 250mg",    category: "drugs", description: "First-gen cephalosporin antibiotic", quantity: 100, unit: "capsules", unitCost: 0.9, reorderLevel: 20, reorderQuantity: 80, isActive: true },
  { id: "drug-013", sku: "MRP-500", name: "Meloxicam 0.5mg/ml",  category: "drugs", description: "NSAID analgesic / anti-inflammatory", quantity: 40, unit: "vials", unitCost: 7.0, reorderLevel: 8, reorderQuantity: 20, isActive: true },
  { id: "drug-014", sku: "OME-20",  name: "Omeprazole 20mg",     category: "drugs", description: "Proton pump inhibitor", quantity: 70, unit: "capsules", unitCost: 0.7, reorderLevel: 15, reorderQuantity: 60, isActive: true },
  { id: "drug-015", sku: "MAR-16",  name: "Maropitant 16mg",     category: "drugs", description: "Antiemetic (Cerenia)", quantity: 35, unit: "tablets", unitCost: 5.0, reorderLevel: 8, reorderQuantity: 20, isActive: true },
  { id: "drug-016", sku: "HYD-1",   name: "Hydrocortisone 1%",   category: "drugs", description: "Topical corticosteroid", quantity: 20, unit: "tubes", unitCost: 3.5, reorderLevel: 5, reorderQuantity: 15, isActive: true },
  { id: "drug-017", sku: "VIT-B12", name: "Vitamin B12 1000mcg/ml", category: "drugs", description: "Cobalamin injection", quantity: 50, unit: "vials", unitCost: 2.0, reorderLevel: 10, reorderQuantity: 30, isActive: true },
  { id: "drug-018", sku: "FLX-10",  name: "Fluoxetine 10mg",     category: "drugs", description: "SSRI / behavioural medication", quantity: 45, unit: "capsules", unitCost: 1.1, reorderLevel: 10, reorderQuantity: 40, isActive: true },
  { id: "drug-019", sku: "GAB-100", name: "Gabapentin 100mg",    category: "drugs", description: "Anticonvulsant / neuropathic pain", quantity: 55, unit: "capsules", unitCost: 0.95, reorderLevel: 12, reorderQuantity: 50, isActive: true },
  { id: "drug-020", sku: "LRS-1L",  name: "Lactated Ringer's 1L", category: "drugs", description: "Crystalloid IV fluid", quantity: 40, unit: "bags", unitCost: 3.0, reorderLevel: 10, reorderQuantity: 30, isActive: true },
];

export function add20DemoDrugs(): void {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  const existing = loadInventory();
  const existingIds = new Set(existing.map(i => i.id));
  for (const drug of DEMO_DRUGS) {
    if (!existingIds.has(drug.id)) {
      saveInventoryItem({ ...drug, lastUpdated: now } as InventoryItem);
    }
  }
  broadcastHospUpdate();
}

const TODAY = new Date().toISOString().split("T")[0];
const T = (h: number, m = 0) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

export function seedDemoHospRecords(): void {
  if (typeof window === "undefined") return;

  const base = { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

  const records: HospRecord[] = [
    // 1. Admitted — just checked in, no surgery
    {
      ...base, id: "DEMO-H001", patientId: "demo-pt-1",
      patientName: "Sarah Kamau", petName: "Biscuit", species: "Domestic Shorthair Cat",
      admissionDate: TODAY, admissionTime: T(8, 30),
      reason: "Vomiting and lethargy for 3 days, dehydration suspected",
      attendingVet: "Dr. Wanjiku", ward: "General Ward", kennelId: "K-04",
      status: "admitted", priority: "urgent", daysStay: 0,
      preOpSedation: false, preOpFasting: false, paymentStatus: "pending",
    },
    // 2. Surgery Prep — pre-op fasting/sedation flagged
    {
      ...base, id: "DEMO-H002", patientId: "demo-pt-2",
      patientName: "James Odhiambo", petName: "Rex", species: "German Shepherd Dog",
      admissionDate: TODAY, admissionTime: T(7, 0),
      reason: "Ruptured cruciate ligament — TPLO surgery scheduled",
      attendingVet: "Dr. Mwangi", ward: "Surgical Suite", kennelId: "K-01",
      status: "surgery_prep", priority: "routine", daysStay: 1,
      surgeryStage: "PREP_FOR_SURGERY",
      stageHistory: [
        { stage: "AWAITING_SURGERY", timestamp: new Date(Date.now() - 86400000).toISOString(), by: "Dr. Mwangi", note: "Scheduled TPLO" },
        { stage: "PREP_FOR_SURGERY", timestamp: new Date().toISOString(), by: "Nurse Achieng", note: "IV placed, fasted 12h" },
      ],
      preOpSedation: true, preOpFasting: true, paymentStatus: "pre_authorized",
      wellnessChecks: [
        { id: "wc-1", timestamp: new Date(Date.now() - 3600000 * 10).toISOString(), recordedBy: "Nurse Achieng", shift: "morning",
          foodIntake: "none", waterIntake: "none", stoolOutput: "normal", urineOutput: "normal", behavior: "restless", notes: "Pre-op fasting — water withheld since 02:00" },
      ],
    },
    // 3. In Surgery — currently under anaesthesia
    {
      ...base, id: "DEMO-H003", patientId: "demo-pt-3",
      patientName: "Grace Njoroge", petName: "Mango", species: "Labrador Retriever Dog",
      admissionDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      admissionTime: T(9, 0),
      reason: "Gastric dilatation-volvulus (GDV) emergency surgery",
      attendingVet: "Dr. Otieno", ward: "Operating Theatre", kennelId: "K-02",
      status: "in_surgery", priority: "emergency", daysStay: 1,
      surgeryStage: "IN_SURGERY",
      stageHistory: [
        { stage: "AWAITING_SURGERY", timestamp: new Date(Date.now() - 86400000).toISOString(), by: "Dr. Otieno", note: "Emergency GDV" },
        { stage: "PREP_FOR_SURGERY", timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), by: "Nurse Kiplangat" },
        { stage: "IN_SURGERY",       timestamp: new Date(Date.now() - 3600000).toISOString(),     by: "Dr. Otieno", note: "Incision made 10:15" },
      ],
      preOpSedation: true, preOpFasting: true, paymentStatus: "pending",
    },
    // 4. Post-surgery recovery — vet has done a progress note (unlocks prescriptions)
    {
      ...base, id: "DEMO-H004", patientId: "demo-pt-4",
      patientName: "Peter Kiprotich", petName: "Luna", species: "French Bulldog Dog",
      admissionDate: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
      admissionTime: T(14, 0),
      reason: "Splenectomy post-trauma; monitoring for internal bleeding",
      attendingVet: "Dr. Wanjiku", ward: "ICU", kennelId: "K-03",
      status: "recovery", priority: "urgent", daysStay: 2,
      surgeryStage: "POST_SURGERY_RECOVERY",
      stageHistory: [
        { stage: "AWAITING_SURGERY",      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), by: "Dr. Wanjiku" },
        { stage: "IN_SURGERY",            timestamp: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(), by: "Dr. Wanjiku" },
        { stage: "POST_SURGERY_RECOVERY", timestamp: new Date(Date.now() - 86400000).toISOString(), by: "Dr. Wanjiku", note: "Surgery successful, spleen removed" },
      ],
      preOpSedation: true, preOpFasting: true, paymentStatus: "pending",
      progressNotes: [
        {
          id: "pn-demo-1", date: TODAY, time: T(8, 0), veterinarian: "Dr. Wanjiku",
          temperature: "38.4", bloodPressure: "115/75", heartRate: "88", respiratoryRate: "22",
          weight: "12.5", painScore: 3,
          assessment: "Post-splenectomy Day 2. Haemodynamically stable. Mild pain.",
          plan: "Continue IV fluids LRS at 5ml/kg/hr, Tramadol 2mg/kg Q8H PO, monitor PCV q4h.",
          modifications: ["Reduce fluid rate if PCV stable by 14:00"],
          nextReview: TODAY + "T16:00",
          condition: "improving",
        },
      ],
      wellnessChecks: [
        { id: "wc-demo-1", timestamp: new Date().toISOString(), recordedBy: "Nurse Achieng", shift: "morning",
          foodIntake: "partial", waterIntake: "normal", stoolOutput: "soft", urineOutput: "normal", behavior: "lethargic", notes: "Ate 50% of morning portion" },
      ],
    },
    // 5. Discharged — payment confirmed, complete journey
    {
      ...base, id: "DEMO-H005", patientId: "demo-pt-5",
      patientName: "Amina Hassan", petName: "Simba", species: "Maine Coon Cat",
      admissionDate: new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0],
      admissionTime: T(10, 30),
      reason: "Urinary obstruction — urethral catheterisation and monitoring",
      attendingVet: "Dr. Mwangi", ward: "General Ward", kennelId: "K-05",
      status: "discharged", priority: "urgent", daysStay: 4,
      surgeryStage: "DISCHARGED",
      stageHistory: [
        { stage: "AWAITING_SURGERY",      timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), by: "Dr. Mwangi" },
        { stage: "IN_WARD",               timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), by: "Dr. Mwangi", note: "Catheter placed, urinating well" },
        { stage: "DISCHARGED",            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), by: "Dr. Mwangi", note: "Full recovery, discharged with home meds" },
      ],
      preOpSedation: false, preOpFasting: false, paymentStatus: "paid",
      progressNotes: [
        {
          id: "pn-demo-2", date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
          time: T(9, 0), veterinarian: "Dr. Mwangi",
          temperature: "38.6", bloodPressure: "120/80", heartRate: "110", respiratoryRate: "24",
          weight: "5.2", painScore: 1,
          assessment: "Urinary obstruction resolved. Appetite returning. Ready for discharge tomorrow.",
          plan: "Discontinue IV fluids. Oral antibiotics Amoxicillin 125mg BID x 7 days. Recheck in 1 week.",
          modifications: [],
          nextReview: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0] + "T09:00",
          condition: "improving",
        },
      ],
    },
  ];

  for (const rec of records) {
    saveHospRecord(rec);
  }
  broadcastHospUpdate();
}

function seedMockClinicalRecords(patients: { id: string; name: string; owner?: string }[]): void {
  if (typeof window === "undefined" || patients.length === 0) return;
  const now = Date.now();
  const day = 86400000;

  const templates = [
    {
      offset: 0, status: "completed", type: "CONSULTATION",
      vet: "Dr. Wanjiku",
      notes: "Presented with 2-day history of vomiting and inappetence. Abdomen mildly tense on palpation. IV fluids commenced, anti-emetics administered. Recheck in 48 hours.",
      rx: [{ name: "Metronidazole 5mg/ml", dose: "15mg/kg IV Q12H x 3 days" }, { name: "Maropitant 16mg", dose: "1mg/kg SC once daily x 3 days" }],
    },
    {
      offset: 1, status: "completed", type: "TRIAGE",
      vet: "Nurse Achieng",
      notes: "Walk-in. Temperature 39.8°C, HR 132 bpm, RR 28/min. Lethargic, mild dehydration (skin turgor 2 sec). Triage level ORANGE — vet review required within 30 min.",
      rx: [],
    },
    {
      offset: 2, status: "completed", type: "CONSULTATION",
      vet: "Dr. Mwangi",
      notes: "Annual wellness exam. BCS 4/9, teeth grade II tartar. All vaccinations up to date. Recommend dental scaling next visit. Owner counselled on weight management and flea prophylaxis.",
      rx: [{ name: "Meloxicam 0.5mg/ml", dose: "0.1mg/kg PO SID x 5 days for dental discomfort" }],
    },
    {
      offset: 3, status: "completed", type: "PROCEDURE",
      vet: "Dr. Otieno",
      notes: "Lateral skin laceration 4cm, full thickness. Wound debrided and sutured with 3-0 Vicryl interrupted pattern under local anaesthesia (Lidocaine 2%). Elizabethan collar applied. Recheck day 10.",
      rx: [{ name: "Amoxicillin 500mg", dose: "20mg/kg PO BID x 7 days" }, { name: "Tramadol 50mg", dose: "2mg/kg PO Q8H x 3 days" }],
    },
    {
      offset: 5, status: "completed", type: "CONSULTATION",
      vet: "Dr. Wanjiku",
      notes: "Follow-up post-splenectomy Day 7. Healing well. Sutures intact, no swelling or discharge at incision site. PCV 32% (improving). Appetite fully restored. Discharge medications completed.",
      rx: [],
    },
    {
      offset: 6, status: "completed", type: "CONSULTATION",
      vet: "Dr. Mwangi",
      notes: "Presented for urinary straining. Blocked urethra — urethral catheter placed under sedation. Urine output 40ml/hr post-catheterisation. Started on IV LRS. Owner advised on dietary management.",
      rx: [{ name: "Buprenorphine 0.3mg/ml", dose: "0.02mg/kg IV Q6H for pain" }, { name: "Furosemide 40mg", dose: "1mg/kg IV BID" }],
    },
    {
      offset: 8, status: "completed", type: "CONSULTATION",
      vet: "Dr. Otieno",
      notes: "Lab results reviewed: CBC — mild anaemia (PCV 28%), mild leukocytosis. Differential includes tick-borne disease. Blood smear — Ehrlichia morulae seen. Started doxycycline course.",
      rx: [{ name: "Dexamethasone 4mg/ml", dose: "0.1mg/kg IV once for immune suppression" }, { name: "Vitamin B12 1000mcg/ml", dose: "0.5ml SC weekly x 4 weeks" }],
    },
    {
      offset: 10, status: "completed", type: "PROCEDURE",
      vet: "Dr. Wanjiku",
      notes: "Elective ovariohysterectomy. Pre-op bloods normal. Anaesthesia induced with Propofol 4mg/kg IV, maintained on Isoflurane. Routine spay completed without complications. Recovery uneventful. Discharged next day.",
      rx: [{ name: "Meloxicam 0.5mg/ml", dose: "0.1mg/kg PO SID x 5 days" }, { name: "Amoxicillin 500mg", dose: "20mg/kg PO BID x 5 days" }],
    },
  ];

  templates.forEach((t, i) => {
    const patient = patients[i % patients.length];
    const savedAt = new Date(now - t.offset * day).toISOString();
    const recId = `seed-rec-${i}-${now}`;
    upsertClinicalRecord({
      id: recId,
      encounterId: recId,
      patientId: patient.id,
      petName: patient.name,
      ownerName: (patient as any).owner ?? "Unknown Owner",
      status: t.status,
      savedAt,
      veterinarian: t.vet,
      data: {
        type: t.type,
        notes: t.notes,
        prescriptions: t.rx,
        seeded: true,
      },
    });
  });
  broadcastClinicalRecordUpdate();
}

export function seedMockData() {
  if (typeof window === "undefined") return;

  // Seed Patients
  const patients = samplePatients.map((p, i) => ({
    ...p,
    id: `sample-${Date.now()}-${i}`,
    patientId: generatePatientId(),
    ownerId: generateOwnerId(),
  }));
  savePatients(patients);

  // Seed Staff
  const staff = sampleStaff.map((s, i) => ({
    ...s,
    id: `staff-${Date.now()}-${i}`,
  }));
  saveStaff(staff);

  // Seed Roles, Groups, Users
  saveRoles(sampleRoles);
  saveGroups(sampleGroups);
  saveUsers(sampleUsers);

  saveAppointments(createDemoAppointments(patients[0]?.id || "p1"));

  // Seed Inventory
  generateMockInventory();
  add20DemoDrugs();

  // Seed Treatment Catalog
  generateMockTreatments();

  // Seed Demo Hospitalization Records
  seedDemoHospRecords();

  // Seed Clinical Records linked to the seeded patients
  seedMockClinicalRecords(patients);

  // Seed Staff Profiles (for Profile Gate)
  seedDemoStaffProfiles();

  // Seed Billing Invoices (15 invoices with varied statuses, M-Pesa TxIDs, KES amounts)
  seedMockInvoices(patients);

  // Seed Audit Events (30 fake events across all 5 tabs into acf_live_feed)
  generateMockAuditEvents();

  // Seed Notifications (3 unread notifications for each role)
  seedMockNotifications();

  // Final broadcast that all seeding is complete
  broadcastTreatmentsUpdate();
  broadcastHospUpdate();
  broadcastClinicalRecordUpdate();

  // Mark as initialized
  localStorage.setItem(getAccountScopedKey("vetcare_sample_patients_initialized"), "true");
  localStorage.setItem(getAccountScopedKey("vetcare_mock_data_seeded"), "true");

  window.location.reload();
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK BILLING INVOICES
// ═══════════════════════════════════════════════════════════════════════════
export function seedMockInvoices(patients: Array<{ id?: string; name?: string; species?: string; breed?: string; owner?: string; phone?: string }>): void {
  if (typeof window === "undefined") return;

  const statuses: Invoice["status"][] = ["paid", "pending", "overdue", "draft"];
  const paymentMethods: Invoice["paymentMethod"][] = ["mpesa", "cash", "insurance", "card"];
  const services = [
    ["Consultation", "Vaccination"],
    ["Deworming", "Clinical Exam"],
    ["Surgery", "Post-op Care"],
    ["Lab Tests", "Consultation"],
    ["Emergency Treatment"],
    ["Annual Checkup", "Vaccination", "Deworming"],
    ["Ultrasound", "Consultation"],
    ["Dental Cleaning"],
    ["Neutering", "Pain Management"],
    ["Wound Dressing", "Antibiotics"],
  ];

  const invoices: Invoice[] = [];
  const now = new Date();

  for (let i = 0; i < 15; i++) {
    const patient = patients[i % patients.length];
    const status = statuses[i % statuses.length];
    const paymentMethod = status === "paid" ? paymentMethods[i % paymentMethods.length] : null;
    const total = [1500, 2500, 4200, 1800, 6500, 3200, 8500, 1200, 5500, 2800, 3900, 1500, 7200, 2100, 4800][i];
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);

    const invoice: Invoice = {
      id: `inv-${Date.now()}-${i}`,
      number: `INV-${String(1000 + i).slice(1)}`,
      patientId: patient?.id || `patient-${i}`,
      petName: patient?.name || `Pet ${i + 1}`,
      species: patient?.species || "Dog",
      breed: patient?.breed || "Mixed",
      clientName: patient?.owner || `Client ${i + 1}`,
      clientPhone: patient?.phone || `+2547${String(Math.random()).slice(2, 11)}`,
      attendingVet: ["Dr. Wanjiku", "Dr. Mwangi", "Dr. Otieno", "Dr. Achieng"][i % 4],
      services: services[i % services.length],
      lineItems: services[i % services.length].map((s, idx) => ({
        id: `line-${i}-${idx}`,
        name: s,
        qty: 1,
        unitPrice: Math.floor(total / services[i % services.length].length),
      })),
      subtotal: total,
      vatRate: 0.16,
      vatAmount: Math.floor(total * 0.16),
      total: Math.floor(total * 1.16),
      status,
      paymentMethod,
      mpesaTxId: paymentMethod === "mpesa" ? `MP${Date.now().toString().slice(-8)}${i}` : undefined,
      isLocked: status === "paid",
      createdAt: createdAt.toISOString(),
      dueAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      paidAt: status === "paid" ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      notes: i % 3 === 0 ? "Follow-up required in 7 days" : undefined,
    };

    invoices.push(invoice);
  }

  saveInvoices(invoices);
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK AUDIT EVENTS (30 events across all 5 tabs)
// ═══════════════════════════════════════════════════════════════════════════
export function generateMockAuditEvents(): void {
  if (typeof window === "undefined") return;

  const eventTypes = [
    { type: "PATIENT_ADMITTED", actor: "Dr. Wanjiku", role: "Vet", patient: "Biscuit" },
    { type: "PATIENT_DISCHARGED", actor: "Nurse Achieng", role: "Nurse", patient: "Max" },
    { type: "VITALS_UPDATED", actor: "Dr. Mwangi", role: "Vet", patient: "Luna" },
    { type: "LAB_READY", actor: "Lab Tech", role: "System", patient: "Rocky" },
    { type: "RX_DISPENSED", actor: "Pharmacist Kim", role: "Pharmacist", patient: "Bella" },
    { type: "BILLING_LOCKED", actor: "Faith", role: "Receptionist", patient: "Charlie" },
    { type: "FEEDING_DUE", actor: "System", role: "System", patient: "Daisy" },
    { type: "WELLNESS_CHECK", actor: "Dr. Otieno", role: "Vet", patient: "Milo" },
    { type: "APPOINTMENT_CONFIRMED", actor: "System", role: "System", patient: "Coco" },
    { type: "INVOICE_CREATED", actor: "Faith", role: "Receptionist", patient: "Simba" },
    { type: "INVOICE_PAID", actor: "System", role: "System", patient: "Simba" },
    { type: "STOCK_UPDATED", actor: "Admin", role: "SuperAdmin", patient: "" },
    { type: "LOGIN", actor: "Dr. Wanjiku", role: "Vet", patient: "" },
    { type: "ROLE_SWITCH", actor: "Super Admin", role: "SuperAdmin", patient: "" },
    { type: "DATA_EXPORT", actor: "Dr. Mwangi", role: "Vet", patient: "" },
  ];

  const events = [];
  const now = Date.now();

  for (let i = 0; i < 30; i++) {
    const template = eventTypes[i % eventTypes.length];
    const timestamp = new Date(now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString();
    
    events.push({
      id: `evt-${Date.now()}-${i}`,
      type: template.type,
      payload: {
        patientName: template.patient || `Patient ${i + 1}`,
        invoiceNumber: template.type.includes("INVOICE") ? `INV-${1000 + i}` : undefined,
        ward: template.type.includes("ADMITTED") ? "Ward A" : undefined,
        amount: template.type === "BILLING_LOCKED" ? [1500, 2500, 4200, 6500][i % 4] : undefined,
        medication: template.type === "RX_DISPENSED" ? ["Amoxicillin", "Meloxicam", "Cerenia"][i % 3] : undefined,
      },
      actorRole: template.role,
      actorName: template.actor,
      clinicId: "demo-clinic",
      timestamp,
    });
  }

  localStorage.setItem("acf_live_feed", JSON.stringify(events));
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK NOTIFICATIONS (3 unread per role)
// ═══════════════════════════════════════════════════════════════════════════
export function seedMockNotifications(): void {
  if (typeof window === "undefined") return;

  const NOTIF_KEY = "acf_notifications";
  const roles = ["SuperAdmin", "Vet", "Nurse", "Receptionist", "Pharmacist"];
  
  const notifications = [];
  
  for (const role of roles) {
    for (let i = 0; i < 3; i++) {
      notifications.push({
        id: `notif-${role}-${i}`,
        eventType: ["PATIENT_ADMITTED", "VITALS_UPDATED", "BILLING_LOCKED"][i],
        title: ["Patient Admitted", "Vitals Recorded", "Invoice Finalised"][i],
        body: `Notification ${i + 1} for ${role}`,
        targetRoles: [role],
        read: false,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        patientName: ["Biscuit", "Max", "Luna"][i],
      });
    }
  }

  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
}

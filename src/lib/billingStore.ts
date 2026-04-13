import { getAccountScopedKey } from "./accountStore";

const INVOICES_KEY = "acf_invoices";

export type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";
export type PaymentMethod = "mpesa" | "cash" | "insurance" | "card" | null;

export interface InvoiceLineItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  number: string; // INV-0001
  patientId: string;
  petName: string;
  species: string;
  breed: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  attendingVet: string;
  services: string[]; // short labels for table
  lineItems: InvoiceLineItem[];
  subtotal: number;
  vatRate: number; // 0 or 0.16
  vatAmount: number;
  total: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  mpesaTxId?: string;
  isLocked: boolean;
  createdAt: string;
  dueAt: string;
  paidAt?: string;
  notes?: string;
}

function key() {
  return getAccountScopedKey(INVOICES_KEY);
}

export function getInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(key());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(key(), JSON.stringify(invoices));
}

export function getInvoiceById(id: string): Invoice | undefined {
  return getInvoices().find(i => i.id === id);
}

export function upsertInvoice(invoice: Invoice): Invoice {
  const list = getInvoices();
  const idx = list.findIndex(i => i.id === invoice.id);
  if (idx >= 0) list[idx] = invoice;
  else list.unshift(invoice);
  saveInvoices(list);
  return invoice;
}

export function markInvoicePaid(id: string, method: PaymentMethod, mpesaTxId?: string): Invoice | null {
  const list = getInvoices();
  const idx = list.findIndex(i => i.id === id);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    status: "paid",
    paymentMethod: method ?? "cash",
    mpesaTxId,
    isLocked: true,
    paidAt: new Date().toISOString(),
  };
  saveInvoices(list);
  return list[idx];
}

export function lockInvoice(id: string): Invoice | null {
  const list = getInvoices();
  const idx = list.findIndex(i => i.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], isLocked: true, status: list[idx].status === "draft" ? "pending" : list[idx].status };
  saveInvoices(list);
  return list[idx];
}

export function voidInvoice(id: string): void {
  const list = getInvoices().filter(i => i.id !== id);
  saveInvoices(list);
}

export function createInvoice(partial: Omit<Invoice, "id" | "number" | "createdAt" | "isLocked">): Invoice {
  const list = getInvoices();
  const num = String(list.length + 1).padStart(4, "0");
  const inv: Invoice = {
    ...partial,
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    number: `INV-${num}`,
    createdAt: new Date().toISOString(),
    isLocked: false,
  };
  list.unshift(inv);
  saveInvoices(list);
  return inv;
}

// ─── Billing summary stats ───────────────────────────────────────────────────
export function getBillingStats(invoices: Invoice[]) {
  const paid    = invoices.filter(i => i.status === "paid");
  const pending = invoices.filter(i => i.status === "pending");
  const overdue = invoices.filter(i => i.status === "overdue");
  const all     = invoices;
  return {
    totalBilled:  all.reduce((s, i) => s + i.total, 0),
    totalPaid:    paid.reduce((s, i) => s + i.total, 0),
    totalPending: pending.reduce((s, i) => s + i.total, 0),
    totalOverdue: overdue.reduce((s, i) => s + i.total, 0),
    countPending: pending.length,
    countOverdue: overdue.length,
    countPaid:    paid.length,
  };
}

// ─── Seed ────────────────────────────────────────────────────────────────────
function d(daysAgo: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString();
}

function due(daysFromNow: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromNow);
  return dt.toISOString();
}

function mpesa() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const DEMO_PATIENTS = [
  { patientId: "demo-pt-1", petName: "Biscuit",  species: "Cat",  breed: "Domestic Shorthair", clientName: "Sarah Kamau",      clientPhone: "+254712345678", clientEmail: "sarah.kamau@email.com",   attendingVet: "Dr. Wanjiku" },
  { patientId: "demo-pt-2", petName: "Rex",       species: "Dog",  breed: "German Shepherd",    clientName: "James Odhiambo",   clientPhone: "+254723456789", clientEmail: "james.odhiambo@email.com", attendingVet: "Dr. Mwangi" },
  { patientId: "demo-pt-3", petName: "Mango",     species: "Dog",  breed: "Labrador Retriever", clientName: "Grace Njoroge",    clientPhone: "+254734567890", clientEmail: "grace.njoroge@email.com",  attendingVet: "Dr. Wanjiku" },
  { patientId: "demo-pt-4", petName: "Luna",      species: "Dog",  breed: "French Bulldog",     clientName: "Peter Kiprotich",  clientPhone: "+254745678901", clientEmail: "peter.k@email.com",        attendingVet: "Dr. Omondi" },
  { patientId: "demo-pt-5", petName: "Simba",     species: "Cat",  breed: "Maine Coon",         clientName: "Amina Hassan",     clientPhone: "+254756789012", clientEmail: "amina.h@email.com",        attendingVet: "Dr. Mwangi" },
  { patientId: "demo-pt-6", petName: "Coco",      species: "Dog",  breed: "Maltese",            clientName: "David Mutua",      clientPhone: "+254767890123", clientEmail: "david.m@email.com",        attendingVet: "Dr. Wanjiku" },
  { patientId: "demo-pt-7", petName: "Shadow",    species: "Cat",  breed: "British Shorthair",  clientName: "Faith Akinyi",     clientPhone: "+254778901234", clientEmail: "faith.a@email.com",        attendingVet: "Dr. Omondi" },
  { patientId: "demo-pt-8", petName: "Buddy",     species: "Dog",  breed: "Golden Retriever",   clientName: "Moses Githinji",   clientPhone: "+254789012345", clientEmail: "moses.g@email.com",        attendingVet: "Dr. Mwangi" },
];

const SERVICE_BUNDLES: { services: string[]; items: Omit<InvoiceLineItem, "id">[] }[] = [
  {
    services: ["Consultation", "CBC Panel", "Amoxicillin"],
    items: [
      { name: "Consultation Fee",    qty: 1, unitPrice: 2500 },
      { name: "CBC Blood Panel",     qty: 1, unitPrice: 3500 },
      { name: "Amoxicillin 250mg",   qty: 14, unitPrice: 120 },
    ],
  },
  {
    services: ["Surgery – TPLO", "Anaesthesia", "IV Fluids", "Ketoprofen"],
    items: [
      { name: "TPLO Surgery",        qty: 1, unitPrice: 85000 },
      { name: "Anaesthesia",         qty: 1, unitPrice: 15000 },
      { name: "IV Fluid Drip",       qty: 3, unitPrice: 800 },
      { name: "Ketoprofen Injection",qty: 2, unitPrice: 650 },
    ],
  },
  {
    services: ["Emergency GDV Surgery", "Anaesthesia", "ICU Monitoring"],
    items: [
      { name: "Emergency Surgery",   qty: 1, unitPrice: 120000 },
      { name: "Anaesthesia",         qty: 1, unitPrice: 18000 },
      { name: "ICU Monitoring (day)",qty: 2, unitPrice: 5000 },
      { name: "IV Fluid Drip",       qty: 4, unitPrice: 800 },
    ],
  },
  {
    services: ["Splenectomy", "Post-Op Care", "Cephalexin"],
    items: [
      { name: "Splenectomy",         qty: 1, unitPrice: 95000 },
      { name: "Post-Op Care (day)",  qty: 3, unitPrice: 4500 },
      { name: "Cephalexin 500mg",    qty: 10, unitPrice: 150 },
    ],
  },
  {
    services: ["Urethral Catheterisation", "Urinalysis", "Furosemide"],
    items: [
      { name: "Catheterisation",     qty: 1, unitPrice: 12000 },
      { name: "Urinalysis",          qty: 1, unitPrice: 2000 },
      { name: "Furosemide Injection",qty: 3, unitPrice: 400 },
      { name: "Hospitalisation (day)",qty: 2, unitPrice: 3500 },
    ],
  },
  {
    services: ["Dental Scaling", "Tooth Extraction", "Metronidazole"],
    items: [
      { name: "Dental Scaling",      qty: 1, unitPrice: 8000 },
      { name: "Tooth Extraction",    qty: 2, unitPrice: 3500 },
      { name: "Metronidazole 200mg", qty: 7, unitPrice: 80 },
    ],
  },
  {
    services: ["Vaccination – DA2PP", "Bordetella", "Rabies"],
    items: [
      { name: "DA2PP Vaccine",       qty: 1, unitPrice: 2200 },
      { name: "Bordetella Vaccine",  qty: 1, unitPrice: 1800 },
      { name: "Rabies Vaccine",      qty: 1, unitPrice: 1500 },
      { name: "Consultation Fee",    qty: 1, unitPrice: 1500 },
    ],
  },
  {
    services: ["Deworming", "Flea Treatment", "Tick Control"],
    items: [
      { name: "Deworming Tablet",    qty: 1, unitPrice: 600 },
      { name: "Frontline Spray",     qty: 1, unitPrice: 2800 },
      { name: "Tick-Off Collar",     qty: 1, unitPrice: 1200 },
    ],
  },
];

type SeedInvoice = {
  patientIdx: number;
  bundleIdx: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  daysAgo: number;
  daysOverdue?: number;
  vatRate: number;
};

const SEED_PLAN: SeedInvoice[] = [
  { patientIdx: 0, bundleIdx: 0, status: "paid",    paymentMethod: "mpesa",     daysAgo: 14, vatRate: 0.16 },
  { patientIdx: 1, bundleIdx: 1, status: "paid",    paymentMethod: "insurance", daysAgo: 10, vatRate: 0.16 },
  { patientIdx: 2, bundleIdx: 2, status: "paid",    paymentMethod: "mpesa",     daysAgo: 7,  vatRate: 0.16 },
  { patientIdx: 3, bundleIdx: 3, status: "paid",    paymentMethod: "cash",      daysAgo: 5,  vatRate: 0    },
  { patientIdx: 4, bundleIdx: 4, status: "paid",    paymentMethod: "mpesa",     daysAgo: 4,  vatRate: 0.16 },
  { patientIdx: 5, bundleIdx: 5, status: "pending", paymentMethod: null,        daysAgo: 3,  vatRate: 0.16 },
  { patientIdx: 6, bundleIdx: 6, status: "pending", paymentMethod: null,        daysAgo: 2,  vatRate: 0.16 },
  { patientIdx: 7, bundleIdx: 7, status: "pending", paymentMethod: null,        daysAgo: 1,  vatRate: 0    },
  { patientIdx: 0, bundleIdx: 5, status: "overdue", paymentMethod: null,        daysAgo: 30, vatRate: 0.16 },
  { patientIdx: 1, bundleIdx: 7, status: "overdue", paymentMethod: null,        daysAgo: 21, vatRate: 0    },
  { patientIdx: 2, bundleIdx: 6, status: "overdue", paymentMethod: null,        daysAgo: 18, vatRate: 0.16 },
  { patientIdx: 3, bundleIdx: 0, status: "draft",   paymentMethod: null,        daysAgo: 0,  vatRate: 0.16 },
  { patientIdx: 4, bundleIdx: 1, status: "draft",   paymentMethod: null,        daysAgo: 0,  vatRate: 0.16 },
  { patientIdx: 5, bundleIdx: 2, status: "paid",    paymentMethod: "card",      daysAgo: 8,  vatRate: 0.16 },
  { patientIdx: 6, bundleIdx: 3, status: "paid",    paymentMethod: "mpesa",     daysAgo: 6,  vatRate: 0.16 },
];

export function seedMockInvoices(): void {
  const existing = getInvoices();
  if (existing.length >= 10) return; // already seeded

  const invoices: Invoice[] = SEED_PLAN.map((plan, idx) => {
    const pt = DEMO_PATIENTS[plan.patientIdx];
    const bundle = SERVICE_BUNDLES[plan.bundleIdx];
    const items: InvoiceLineItem[] = bundle.items.map((it, i) => ({
      ...it,
      id: `li-${idx}-${i}`,
    }));
    const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const vatAmount = Math.round(subtotal * plan.vatRate);
    const total = subtotal + vatAmount;
    const createdAt = d(plan.daysAgo);
    const dueAt = plan.status === "overdue" ? d(plan.daysAgo - 14) : due(14);
    const paidAt = plan.status === "paid" ? d(plan.daysAgo - 1) : undefined;

    return {
      id: `inv-demo-${String(idx + 1).padStart(3, "0")}`,
      number: `INV-${String(idx + 1).padStart(4, "0")}`,
      patientId: pt.patientId,
      petName: pt.petName,
      species: pt.species,
      breed: pt.breed,
      clientName: pt.clientName,
      clientPhone: pt.clientPhone,
      clientEmail: pt.clientEmail,
      attendingVet: pt.attendingVet,
      services: bundle.services,
      lineItems: items,
      subtotal,
      vatRate: plan.vatRate,
      vatAmount,
      total,
      status: plan.status,
      paymentMethod: plan.paymentMethod,
      mpesaTxId: plan.paymentMethod === "mpesa" ? mpesa() : undefined,
      isLocked: plan.status === "paid" || plan.status === "overdue",
      createdAt,
      dueAt,
      paidAt,
    };
  });

  saveInvoices(invoices);
}

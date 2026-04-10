import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { generateMockInventory, clearInventoryData, loadInventory } from "@/lib/inventoryStore";
import { generateMockTreatments, clearTreatmentsData } from "@/lib/treatmentStore";
import { add20DemoDrugs } from "@/lib/dataSeed";
import { subscribe, broadcast, EVENTS, type RealtimeEvent } from "@/lib/realtimeEngine";

// ─── Step Type ────────────────────────────────────────────────────────────────
export interface TutorialStep {
  id: string;
  forRole: string;
  title: string;
  body: string;
  route?: string;
  spotlight?: string;
  position?: "center" | "top" | "bottom" | "left" | "right";
  roleColor: string;
  icon: string;
  waitForEvent?: string;
  waitLabel?: string;
  broadcastOnEnter?: { type: string; payload: Record<string, unknown> };
  requiresAction?: boolean;
  actionLabel?: string;
  isDone?: boolean;
}

// ─── Role metadata ────────────────────────────────────────────────────────────
export const ROLE_META: Record<string, { color: string; label: string; icon: string }> = {
  Receptionist: { color: "bg-sky-500",     label: "Receptionist",  icon: "📋" },
  Vet:          { color: "bg-blue-600",    label: "Veterinarian",  icon: "🩺" },
  Pharmacist:   { color: "bg-purple-500",  label: "Pharmacist",    icon: "💊" },
  Nurse:        { color: "bg-amber-500",   label: "Attendant",     icon: "🐾" },
  SuperAdmin:   { color: "bg-emerald-500", label: "Super Admin",   icon: "🛡️" },
};

// ─── All tutorial paths ───────────────────────────────────────────────────────
export const ALL_TUTORIAL_STEPS: TutorialStep[] = [
  // ════════════════════════════════════════════════════════════
  // RECEPTIONIST PATH — 8 steps
  // ════════════════════════════════════════════════════════════
  {
    id: "rec-1", forRole: "Receptionist", roleColor: "bg-sky-500", icon: "👋",
    title: "Welcome, Receptionist!",
    body: "You're the first point of contact. This tutorial walks you through registering patients, checking them in, generating invoices, and reviewing client profiles.",
    route: "/dashboard",
    position: "center",
  },
  {
    id: "rec-2", forRole: "Receptionist", roleColor: "bg-sky-500", icon: "🐾",
    title: "Register a New Patient",
    body: "Head to Registered Patients and click the highlighted '+ Add Patient' button to open the registration form.",
    route: "/patients",
    spotlight: "add-patient-btn",
    position: "left",
    requiresAction: true,
    actionLabel: "Click the highlighted 'Add Patient' button →",
  },
  {
    id: "rec-3", forRole: "Receptionist", roleColor: "bg-sky-500", icon: "🗓️",
    title: "Check In to the Triage Queue",
    body: "Once a patient is registered, navigate to Triage to add them to the waiting queue. The Attendant will then pick them up.",
    route: "/triage",
    spotlight: "triage-page",
    position: "right",
  },
  {
    id: "rec-4", forRole: "Receptionist", roleColor: "bg-sky-500", icon: "⏳",
    title: "Waiting for Vitals Update…",
    body: "The Attendant is recording the patient's vitals on another device. Once submitted, you'll be automatically moved to the next step.",
    route: "/triage",
    position: "center",
    waitForEvent: EVENTS.VITALS_UPDATED,
    waitLabel: "⏳ Waiting for the Attendant to complete triage on another tab…",
  },
  {
    id: "rec-5", forRole: "Receptionist", roleColor: "bg-sky-500", icon: "🧾",
    title: "Billing Unlocked — Generate the Invoice",
    body: "Vitals are in! Head to Billing to generate the invoice for this visit — consultation, procedures, and medications are all auto-populated.",
    route: "/billing",
    spotlight: "nav-billing",
    position: "right",
  },
  {
    id: "rec-6", forRole: "Receptionist", roleColor: "bg-sky-500", icon: "🔒",
    title: "Lock the Invoice",
    body: "Review the invoice, then click 'Lock Invoice' (highlighted) to finalise it. This triggers a notification to the Pharmacist to prepare the prescription.",
    route: "/billing",
    spotlight: "lock-invoice-btn",
    position: "left",
    requiresAction: true,
    actionLabel: "Click the highlighted 'Lock Invoice' button →",
  },
  {
    id: "rec-7", forRole: "Receptionist", roleColor: "bg-sky-500", icon: "👤",
    title: "Review the Client CRM Profile",
    body: "After billing, open the Clients section to review the owner's history, communication preferences, and linked pets.",
    route: "/clients",
    position: "center",
  },
  {
    id: "rec-8", forRole: "Receptionist", roleColor: "bg-sky-500", icon: "🎉",
    title: "You're a Pro Receptionist! 🎉",
    body: "You've mastered the reception workflow — patient registration, triage queue, invoicing, and client management. The clinic runs smoothly because of you!",
    route: "/dashboard",
    position: "center",
    isDone: true,
  },

  // ════════════════════════════════════════════════════════════
  // VET PATH — 8 steps
  // ════════════════════════════════════════════════════════════
  {
    id: "vet-1", forRole: "Vet", roleColor: "bg-blue-600", icon: "👋",
    title: "Welcome, Doctor!",
    body: "This tutorial guides you through the clinical workflow — reviewing triaged patients, recording SOAP notes, linking prescriptions, and managing hospitalized patients.",
    route: "/dashboard",
    position: "center",
  },
  {
    id: "vet-2", forRole: "Vet", roleColor: "bg-blue-600", icon: "📋",
    title: "A Patient is in the Queue",
    body: "Open the Triage page to see patients ready for consultation. Select a patient card to begin reviewing their intake.",
    route: "/triage",
    spotlight: "triage-page",
    position: "right",
  },
  {
    id: "vet-3", forRole: "Vet", roleColor: "bg-blue-600", icon: "📁",
    title: "Review Patient History",
    body: "Before consulting, check the patient's medical history — previous diagnoses, vaccinations, allergies, and prior visit records are all here.",
    route: "/patients",
    position: "center",
  },
  {
    id: "vet-4", forRole: "Vet", roleColor: "bg-blue-600", icon: "🎙️",
    title: "Dictate Your SOAP Note",
    body: "Open a new clinical record and click the microphone icon (highlighted) to dictate your Subjective, Objective, Assessment, and Plan note hands-free.",
    route: "/records/new",
    spotlight: "dictate-btn",
    position: "left",
    requiresAction: true,
    actionLabel: "Click the mic icon to start dictation →",
  },
  {
    id: "vet-5", forRole: "Vet", roleColor: "bg-blue-600", icon: "💊",
    title: "Link a Prescription to Inventory",
    body: "On the Prescriptions tab, add a drug and link it to the inventory (highlighted). This auto-queues it for the Pharmacist and tracks stock levels.",
    route: "/records/new",
    spotlight: "rx-link-btn",
    position: "left",
    requiresAction: true,
    actionLabel: "Click the highlighted 'Link to Inventory' button →",
  },
  {
    id: "vet-6", forRole: "Vet", roleColor: "bg-blue-600", icon: "⏳",
    title: "Waiting for Pharmacist…",
    body: "The Pharmacist is dispensing the prescription. This step advances automatically once they confirm dispensing.",
    route: "/patients",
    position: "center",
    waitForEvent: EVENTS.RX_DISPENSED,
    waitLabel: "⏳ Waiting for Pharmacist to dispense the prescription…",
  },
  {
    id: "vet-7", forRole: "Vet", roleColor: "bg-blue-600", icon: "🏥",
    title: "Mark Patient for Discharge",
    body: "The medication is dispensed. Head to Hospitalization and mark this patient as ready for discharge — this notifies the Receptionist to close the billing.",
    route: "/hospitalization",
    position: "center",
  },
  {
    id: "vet-8", forRole: "Vet", roleColor: "bg-blue-600", icon: "🩺",
    title: "Outstanding Clinical Work, Doc! 🩺",
    body: "You've completed the full clinical loop — triage review, SOAP notes, prescriptions, and discharge. The system handled all the routing automatically!",
    route: "/dashboard",
    position: "center",
    isDone: true,
  },

  // ════════════════════════════════════════════════════════════
  // PHARMACIST PATH — 6 steps
  // ════════════════════════════════════════════════════════════
  {
    id: "phar-1", forRole: "Pharmacist", roleColor: "bg-purple-500", icon: "📦",
    title: "Check Current Stock Levels",
    body: "Start by reviewing the current inventory. Low-stock and out-of-stock items are flagged in red — restock before dispensing if needed.",
    route: "/inventory",
    position: "center",
  },
  {
    id: "phar-2", forRole: "Pharmacist", roleColor: "bg-purple-500", icon: "⏳",
    title: "Waiting for Invoice to be Locked…",
    body: "The Receptionist is finalising the invoice. Once they lock it, your dispensing queue will be activated.",
    route: "/inventory",
    position: "center",
    waitForEvent: EVENTS.BILLING_LOCKED,
    waitLabel: "⏳ Waiting for Receptionist to lock the invoice…",
  },
  {
    id: "phar-3", forRole: "Pharmacist", roleColor: "bg-purple-500", icon: "📝",
    title: "Review the Prescription",
    body: "Head to Treatments to review the Vet's prescription — drug name, dose, route, frequency, and duration are all listed.",
    route: "/treatments",
    position: "center",
  },
  {
    id: "phar-4", forRole: "Pharmacist", roleColor: "bg-purple-500", icon: "💉",
    title: "Dispense the Medication",
    body: "Back in Inventory, find the prescribed item and click the highlighted 'Dispense' button. Stock will be auto-decremented.",
    route: "/inventory",
    spotlight: "dispense-btn",
    position: "left",
    requiresAction: true,
    actionLabel: "Click the highlighted 'Dispense' button →",
  },
  {
    id: "phar-5", forRole: "Pharmacist", roleColor: "bg-purple-500", icon: "📡",
    title: "Notifying the Vet…",
    body: "Broadcasting RX_DISPENSED — the Vet will be notified automatically that the prescription is ready for the patient.",
    route: "/inventory",
    position: "center",
    broadcastOnEnter: { type: EVENTS.RX_DISPENSED, payload: { patientName: "Demo Patient", medication: "Amoxicillin 250mg" } },
  },
  {
    id: "phar-6", forRole: "Pharmacist", roleColor: "bg-purple-500", icon: "💊",
    title: "Dispensing Complete! 💊",
    body: "The medication has been dispensed, inventory updated, and the Vet notified. The patient is ready for pickup. Great work!",
    route: "/dashboard",
    position: "center",
    isDone: true,
  },

  // ════════════════════════════════════════════════════════════
  // ATTENDANT (Nurse) PATH — 5 steps
  // ════════════════════════════════════════════════════════════
  {
    id: "att-1", forRole: "Nurse", roleColor: "bg-amber-500", icon: "🏥",
    title: "View Admitted Patients",
    body: "The Hospitalization board shows all currently admitted patients. Each card shows the patient's status, care plan, and pending tasks.",
    route: "/hospitalization",
    position: "center",
  },
  {
    id: "att-2", forRole: "Nurse", roleColor: "bg-amber-500", icon: "❤️",
    title: "Log a Wellness Check",
    body: "Open a patient workspace and click the highlighted 'Wellness Check' button to log an observation. This gets recorded in the patient's event timeline.",
    route: "/hospitalization",
    spotlight: "wellness-btn",
    position: "left",
    requiresAction: true,
    actionLabel: "Click the highlighted 'Wellness Check' button →",
  },
  {
    id: "att-3", forRole: "Nurse", roleColor: "bg-amber-500", icon: "🍽️",
    title: "Update the Feeding Schedule",
    body: "Click the highlighted 'Feeding' button (highlighted) to log the feeding and update the schedule. Missed feedings trigger a FEEDING_DUE alert.",
    route: "/hospitalization",
    spotlight: "feeding-btn",
    position: "left",
    requiresAction: true,
    actionLabel: "Click the highlighted 'Feeding' button →",
  },
  {
    id: "att-4", forRole: "Nurse", roleColor: "bg-amber-500", icon: "📡",
    title: "Broadcasting Wellness Check…",
    body: "Notifying the Vet and SuperAdmin that a wellness check has been completed.",
    route: "/hospitalization",
    position: "center",
    broadcastOnEnter: { type: EVENTS.WELLNESS_CHECK, payload: { patientName: "Demo Patient" } },
  },
  {
    id: "att-5", forRole: "Nurse", roleColor: "bg-amber-500", icon: "🐾",
    title: "Great Care, Attendant! 🐾",
    body: "You've logged wellness checks, updated feeding schedules, and kept the care plan current. The patients are in great hands!",
    route: "/dashboard",
    position: "center",
    isDone: true,
  },

  // ════════════════════════════════════════════════════════════
  // NURSE PATH — 6 steps (vitals, monitoring, progress notes)
  // ════════════════════════════════════════════════════════════
  {
    id: "nur-1", forRole: "Nurse", roleColor: "bg-pink-500", icon: "👋",
    title: "Welcome, Nurse!",
    body: "This tutorial covers your core workflow: recording patient vitals, monitoring hospitalized animals, and writing progress notes.",
    route: "/triage",
    position: "center",
  },
  {
    id: "nur-2", forRole: "Nurse", roleColor: "bg-pink-500", icon: "🌡️",
    title: "Record Patient Vitals",
    body: "On the Triage page, select a patient from the queue. Enter their temperature, heart rate, respiratory rate, and weight.",
    route: "/triage",
    spotlight: "triage-page",
    position: "right",
    requiresAction: true,
    actionLabel: "Select a patient and record their vitals →",
  },
  {
    id: "nur-3", forRole: "Nurse", roleColor: "bg-pink-500", icon: "✅",
    title: "Complete Triage",
    body: "Once all vitals are entered, click 'Complete Triage'. This broadcasts a VITALS_UPDATED event — the Vet is automatically notified.",
    route: "/triage",
    spotlight: "triage-page",
    position: "right",
  },
  {
    id: "nur-4", forRole: "Nurse", roleColor: "bg-pink-500", icon: "📊",
    title: "Monitor the Flowsheet",
    body: "In the Hospitalization workspace, the Flowsheet tab tracks vitals over time. Add new rows for each monitoring interval.",
    route: "/hospitalization",
    position: "center",
  },
  {
    id: "nur-5", forRole: "Nurse", roleColor: "bg-pink-500", icon: "📝",
    title: "Write a Progress Note",
    body: "Under the Notes tab, add a progress note describing the patient's condition. Notes are time-stamped and visible to the full clinical team.",
    route: "/hospitalization",
    position: "center",
  },
  {
    id: "nur-6", forRole: "Nurse", roleColor: "bg-pink-500", icon: "🏅",
    title: "Excellent Nursing Care! 🏅",
    body: "You've recorded vitals, updated the flowsheet, and written progress notes. Your monitoring keeps the care team informed and patients safe.",
    route: "/dashboard",
    position: "center",
    isDone: true,
  },

  // ════════════════════════════════════════════════════════════
  // SUPERADMIN PATH — 5 steps
  // ════════════════════════════════════════════════════════════
  {
    id: "sa-1", forRole: "SuperAdmin", roleColor: "bg-emerald-500", icon: "🛡️",
    title: "Welcome, Super Admin!",
    body: "This tutorial covers the admin-only tools: staff management, the live activity feed, reports, audit trails, and system settings.",
    route: "/dashboard",
    position: "center",
  },
  {
    id: "sa-2", forRole: "SuperAdmin", roleColor: "bg-emerald-500", icon: "👥",
    title: "Manage Staff Accounts",
    body: "Head to Staff Management to create new staff accounts, assign roles, and set permissions. Each staff member gets their own login profile.",
    route: "/staff",
    position: "center",
  },
  {
    id: "sa-3", forRole: "SuperAdmin", roleColor: "bg-emerald-500", icon: "📡",
    title: "Live Activity Feed",
    body: "The Live Feed shows every real-time event across all roles and devices — patient admissions, vitals, prescriptions, billing. Filter by Clinical, Financial, or Comms.",
    route: "/live-feed",
    position: "center",
  },
  {
    id: "sa-4", forRole: "SuperAdmin", roleColor: "bg-emerald-500", icon: "📊",
    title: "Reports & Audit Trail",
    body: "Reports gives you clinic analytics — visit volumes, revenue, inventory burn rate. The Audit Trail shows every data change with who made it and when.",
    route: "/audit",
    position: "center",
  },
  {
    id: "sa-5", forRole: "SuperAdmin", roleColor: "bg-emerald-500", icon: "⚙️",
    title: "Clinic Settings",
    body: "Configure everything in Settings — clinic profile, billing (VAT, KRA PIN, KES), workflow steps, WhatsApp/SMS integrations, appearance, and data management.",
    route: "/settings",
    position: "center",
    isDone: true,
  },
];

// ─── Context Interface ─────────────────────────────────────────────────────────
interface TutorialContextValue {
  isActive: boolean;
  currentStep: TutorialStep | null;
  stepIndex: number;
  totalStepsForRole: number;
  activeRole: string | null;
  isWaiting: boolean;
  recentEvents: RealtimeEvent[];
  startTutorial: (role: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  /** legacy compat */
  step: number;
  totalSteps: number;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive]         = useState(false);
  const [activeRole, setActiveRole]     = useState<string | null>(null);
  const [stepIndex, setStepIndex]       = useState(0);
  const [isWaiting, setIsWaiting]       = useState(false);
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);
  const tutorialSeededRef               = useRef(false);
  const unsubWaitRef                    = useRef<(() => void) | null>(null);

  // Seed inventory on mount if empty
  useEffect(() => {
    const wasEmpty = loadInventory().length === 0;
    generateMockInventory();
    add20DemoDrugs();
    generateMockTreatments();
    tutorialSeededRef.current = wasEmpty;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepsForRole = activeRole
    ? ALL_TUTORIAL_STEPS.filter(s => s.forRole === activeRole)
    : [];

  const currentStep = isActive && stepsForRole.length > 0
    ? stepsForRole[stepIndex] ?? null
    : null;

  // Fire broadcastOnEnter when a step has it
  useEffect(() => {
    if (!isActive || !currentStep?.broadcastOnEnter) return;
    const { type, payload } = currentStep.broadcastOnEnter;
    try {
      broadcast({
        type,
        payload,
        actorRole: activeRole ?? "System",
        actorName: `${activeRole ?? "System"} (Tutorial)`,
        clinicId: "clinic-demo",
        timestamp: new Date().toISOString(),
      });
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stepIndex]);

  // waitForEvent: subscribe and advance when event fires
  useEffect(() => {
    if (unsubWaitRef.current) { unsubWaitRef.current(); unsubWaitRef.current = null; }
    if (!isActive || !currentStep?.waitForEvent) { setIsWaiting(false); return; }

    setIsWaiting(true);
    const targetType = currentStep.waitForEvent;

    unsubWaitRef.current = subscribe((event) => {
      setRecentEvents(prev => [event, ...prev].slice(0, 3));
      if (event.type === targetType) {
        setIsWaiting(false);
        if (unsubWaitRef.current) { unsubWaitRef.current(); unsubWaitRef.current = null; }
        setStepIndex(prev => prev + 1);
      }
    });
    return () => { if (unsubWaitRef.current) { unsubWaitRef.current(); unsubWaitRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stepIndex, activeRole]);

  const endTutorial = useCallback(() => {
    setIsActive(false);
    setActiveRole(null);
    setStepIndex(0);
    setIsWaiting(false);
    setRecentEvents([]);
    if (unsubWaitRef.current) { unsubWaitRef.current(); unsubWaitRef.current = null; }
    if (tutorialSeededRef.current) {
      clearInventoryData();
      clearTreatmentsData();
      tutorialSeededRef.current = false;
    }
  }, []);

  const startTutorial = useCallback((role: string) => {
    const wasEmpty = loadInventory().length === 0;
    generateMockInventory();
    add20DemoDrugs();
    generateMockTreatments();
    tutorialSeededRef.current = wasEmpty;
    setActiveRole(role);
    setStepIndex(0);
    setIsWaiting(false);
    setRecentEvents([]);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex(prev => {
      const steps = ALL_TUTORIAL_STEPS.filter(s => s.forRole === activeRole);
      if (prev >= steps.length - 1) { endTutorial(); return prev; }
      return prev + 1;
    });
  }, [activeRole, endTutorial]);

  const prevStep = useCallback(() => {
    setStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  return (
    <TutorialContext.Provider value={{
      isActive,
      currentStep,
      stepIndex,
      totalStepsForRole: stepsForRole.length,
      activeRole,
      isWaiting,
      recentEvents,
      startTutorial,
      nextStep,
      prevStep,
      skipTutorial: endTutorial,
      // legacy compat
      step: stepIndex + 1,
      totalSteps: stepsForRole.length,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used inside TutorialProvider");
  return ctx;
}

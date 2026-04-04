import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { getAccountScopedKey } from "@/lib/accountStore";
import { EMERGENCY_CHANNEL, playEmergencySound } from "@/lib/emergencyAlert";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifRole = "Receptionist" | "Nurse" | "Vet" | "Pharmacist" | "SuperAdmin";

export interface LiveNotification {
  id: string;
  message: string;
  type: "info" | "warning" | "critical" | "success";
  timestamp: number;
  read: boolean;
  patientId?: string;
  patientName?: string;
  step?: string;
  /** Roles that should receive this notification. Empty = all roles. */
  targetRoles?: NotifRole[];
}

/** Returns true if the notification is relevant to the given role */
function isNotifForRole(n: LiveNotification, role: string): boolean {
  if (!n.targetRoles || n.targetRoles.length === 0) return true;
  return n.targetRoles.includes(role as NotifRole);
}

interface NotificationContextValue {
  notifications: LiveNotification[];
  /** All notifications (no role filter — for global admin use) */
  allNotifications: LiveNotification[];
  unreadCount: number;
  addNotification: (n: Omit<LiveNotification, "id" | "timestamp" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD"; payload: Omit<LiveNotification, "id" | "timestamp" | "read"> }
  | { type: "MARK_READ"; id: string }
  | { type: "MARK_ALL_READ" }
  | { type: "CLEAR_ALL" }
  | { type: "LOAD"; notifications: LiveNotification[] };

const MAX = 60;

function reducer(state: LiveNotification[], action: Action): LiveNotification[] {
  switch (action.type) {
    case "LOAD":
      return action.notifications;
    case "ADD": {
      const n: LiveNotification = {
        ...action.payload,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: Date.now(),
        read: false,
      };
      return [n, ...state].slice(0, MAX);
    }
    case "MARK_READ":
      return state.map(n => n.id === action.id ? { ...n, read: true } : n);
    case "MARK_ALL_READ":
      return state.map(n => ({ ...n, read: true }));
    case "CLEAR_ALL":
      return [];
    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEP_MSGS: Record<string, { msg: string; targetRoles: NotifRole[] }> = {
  TRIAGE:          { msg: "checked in — awaiting triage",        targetRoles: ["Nurse"]                         },
  CONSULTATION:    { msg: "triage complete — ready for vet",     targetRoles: ["Vet"]                           },
  PHARMACY:        { msg: "consultation done — ready for pharmacy", targetRoles: ["Pharmacist"]               },
  COMPLETED:       { msg: "visit completed — ready for discharge", targetRoles: ["Receptionist", "SuperAdmin"] },
  REGISTERED:      { msg: "registered",                         targetRoles: []                                },
  IN_TRIAGE:       { msg: "triage in progress",                 targetRoles: ["Nurse", "Vet", "SuperAdmin"]   },
  TRIAGED:         { msg: "triage complete — ready for vet",    targetRoles: ["Vet", "SuperAdmin"]             },
  IN_CONSULTATION: { msg: "in consultation",                    targetRoles: ["Vet", "SuperAdmin"]             },
  IN_SURGERY:        { msg: "in surgery",                          targetRoles: ["Vet", "Nurse", "SuperAdmin"]        },
  RECOVERY:          { msg: "in recovery",                         targetRoles: ["Vet", "Nurse", "SuperAdmin"]        },
  DISCHARGED:        { msg: "discharged",                          targetRoles: ["Receptionist", "SuperAdmin"]        },
  IN_PROCEDURE:      { msg: "in procedure",                        targetRoles: ["Vet", "Nurse", "SuperAdmin"]        },
  IN_FOLLOW_UP:      { msg: "follow-up visit in progress",         targetRoles: ["Vet", "SuperAdmin"]                 },
  IN_HOSPITAL_ROUND: { msg: "hospital round — wellness check due", targetRoles: ["Nurse", "SuperAdmin"]               },
};

function buildPayload(name?: string, step?: string): {
  message: string; targetRoles: NotifRole[]
} {
  const patient = name || "A patient";
  const entry   = step ? STEP_MSGS[step] : undefined;
  return {
    message:     `${patient} — ${entry?.msg ?? (step ? `moved to ${step}` : "updated")}`,
    targetRoles: entry?.targetRoles ?? [],
  };
}

const STORAGE_KEY_BASE = "boravet_notifications";
const CHANNEL_BASE = "acf_notifications_channel";

function storageKey(accountId: string) {
  return getAccountScopedKey(STORAGE_KEY_BASE, accountId);
}

function channelName(accountId: string) {
  return `acct:${accountId}:${CHANNEL_BASE}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { activeAccountId } = useAccount();
  const senderIdRef = useRef(`notif-sender-${Math.random().toString(36).slice(2)}`);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const [allNotifications, dispatch] = useReducer(reducer, []);

  // Role comes from localStorage so we don't create a circular context dep
  const currentRole = (): string => {
    try { return JSON.parse(localStorage.getItem("acf_role") ?? "null") ?? "SuperAdmin"; }
    catch { return "SuperAdmin"; }
  };

  // notifications filtered by current role (re-computed each render)
  const notifications = allNotifications.filter(n => isNotifForRole(n, currentRole()));

  // Persist whenever state changes
  useEffect(() => {
    try { localStorage.setItem(storageKey(activeAccountId), JSON.stringify(allNotifications)); } catch {}
  }, [allNotifications, activeAccountId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(activeAccountId));
      dispatch({ type: "LOAD", notifications: raw ? (JSON.parse(raw) as LiveNotification[]) : [] });
    } catch {
      dispatch({ type: "LOAD", notifications: [] });
    }
  }, [activeAccountId]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey(activeAccountId)) return;
      try {
        const parsed = e.newValue ? (JSON.parse(e.newValue) as LiveNotification[]) : [];
        dispatch({ type: "LOAD", notifications: parsed });
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [activeAccountId]);

  const postAdd = useCallback((payload: Omit<LiveNotification, "id" | "timestamp" | "read">) => {
    try {
      channelRef.current?.postMessage({ type: "NOTIF_ADD", payload, senderId: senderIdRef.current });
    } catch {}
  }, []);

  const addNotification = useCallback((n: Omit<LiveNotification, "id" | "timestamp" | "read">) => {
    dispatch({ type: "ADD", payload: n });
    postAdd(n);
  }, [postAdd]);

  // ── Same-tab: custom event ────────────────────────────────────────────────
  useEffect(() => {
    const handleCustom = (e: Event) => {
      const d = (e as CustomEvent).detail as {
        type?: string; message?: string;
        patientId?: string; patientName?: string; step?: string;
        targetRoles?: NotifRole[];
      };
      const { message: autoMsg, targetRoles: autoRoles } =
        buildPayload(d.patientName, d.step);
      addNotification({
        type:        (d.type as LiveNotification["type"]) ?? "info",
        message:     d.message ?? autoMsg,
        patientId:   d.patientId,
        patientName: d.patientName,
        step:        d.step,
        targetRoles: d.targetRoles ?? autoRoles,
      });
    };
    window.addEventListener("acf:notification", handleCustom);
    return () => window.removeEventListener("acf:notification", handleCustom);
  }, [addNotification]);

  // ── Cross-tab: BroadcastChannels ─────────────────────────────────────────
  useEffect(() => {
    const wfCh  = new BroadcastChannel("acf_workflow_updates");
    const encCh = new BroadcastChannel("acf_encounter_updates");
    try {
      channelRef.current?.close();
    } catch {}
    channelRef.current = new BroadcastChannel(channelName(activeAccountId));
    const notifCh = channelRef.current;

    const handleWf = (e: MessageEvent) => {
      const { type, payload } = e.data as { type: string; payload: Record<string, unknown> };
      if (type === "EMERGENCY_VISIT") {
        const name = (payload.patientName as string) ?? "Patient";
        addNotification({
          type: "critical",
          message: `🚨 EMERGENCY: ${name} — immediate triage required (${payload.chiefComplaint ?? ""})`,
          patientId:   payload.patientId as string,
          patientName: name,
          step:        "TRIAGE",
          targetRoles: ["SuperAdmin", "Nurse", "Vet", "Receptionist"],
        });
      } else if (type === "PATIENT_CHECKIN") {
        const meta = payload.meta as { name: string; owner: string } | undefined;
        const name = meta?.name ?? "Patient";
        const { message, targetRoles } = buildPayload(name, "TRIAGE");
        addNotification({
          type: "success",
          message: `${name} (${meta?.owner ?? ""}) ${message.split(" — ")[1] ?? "checked in"}`,
          patientId:   payload.patientId as string,
          patientName: name,
          step:        "TRIAGE",
          targetRoles,
        });
      } else if (type === "STEP_UPDATE") {
        const { patientId, step, petName } = payload as {
          patientId: string; step: string; petName?: string;
        };
        const { message, targetRoles } = buildPayload(petName, step);
        addNotification({ type: "info", message, patientId, patientName: petName, step, targetRoles });
      }
    };

    const handleEnc = (e: MessageEvent) => {
      const { type, payload } = e.data as { type: string; payload: Record<string, unknown> };
      if (type === "ENCOUNTER_STATUS_UPDATE") {
        const status  = payload.status as string;
        const petName = payload.petName as string | undefined;
        const { message, targetRoles } = buildPayload(petName, status);
        addNotification({
          type: status === "TRIAGED" ? "success" : "info",
          message,
          step: status,
          targetRoles,
        });
      }
    };

    const handleNotif = (e: MessageEvent) => {
      const data = e.data as { type?: string; payload?: Omit<LiveNotification, "id" | "timestamp" | "read">; senderId?: string };
      if (data.type !== "NOTIF_ADD" || !data.payload) return;
      if (data.senderId && data.senderId === senderIdRef.current) return;
      dispatch({ type: "ADD", payload: data.payload });
    };

    // Cross-tab emergency sound: play siren whenever any tab broadcasts an emergency
    const emergencyCh = new BroadcastChannel(EMERGENCY_CHANNEL);
    emergencyCh.addEventListener("message", () => playEmergencySound());

    wfCh.addEventListener("message", handleWf);
    encCh.addEventListener("message", handleEnc);
    notifCh.addEventListener("message", handleNotif);
    return () => {
      wfCh.close();
      encCh.close();
      try { notifCh.close(); } catch {}
      emergencyCh.close();
    };
  }, [activeAccountId, addNotification]);

  const markRead    = (id: string) => dispatch({ type: "MARK_READ", id });
  const markAllRead = () => dispatch({ type: "MARK_ALL_READ" });
  const clearAll    = () => dispatch({ type: "CLEAR_ALL" });
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, allNotifications, unreadCount,
      addNotification, markRead, markAllRead, clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

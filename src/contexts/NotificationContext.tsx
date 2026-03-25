import React, { createContext, useContext, useEffect, useReducer } from "react";

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
  IN_SURGERY:      { msg: "in surgery",                         targetRoles: ["Vet", "Nurse", "SuperAdmin"]   },
  RECOVERY:        { msg: "in recovery",                        targetRoles: ["Vet", "Nurse", "SuperAdmin"]   },
  DISCHARGED:      { msg: "discharged",                         targetRoles: ["Receptionist", "SuperAdmin"]   },
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

const STORAGE_KEY = "boravet_notifications";

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [allNotifications, dispatch] = useReducer(reducer, [], () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as LiveNotification[] : [];
    } catch { return []; }
  });

  // Role comes from localStorage so we don't create a circular context dep
  const currentRole = (): string => {
    try { return JSON.parse(localStorage.getItem("acf_role") ?? "null") ?? "SuperAdmin"; }
    catch { return "SuperAdmin"; }
  };

  // notifications filtered by current role (re-computed each render)
  const notifications = allNotifications.filter(n => isNotifForRole(n, currentRole()));

  // Persist whenever state changes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications)); } catch {}
  }, [allNotifications]);

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
      dispatch({
        type: "ADD",
        payload: {
          type:        (d.type as LiveNotification["type"]) ?? "info",
          message:     d.message ?? autoMsg,
          patientId:   d.patientId,
          patientName: d.patientName,
          step:        d.step,
          targetRoles: d.targetRoles ?? autoRoles,
        },
      });
    };
    window.addEventListener("acf:notification", handleCustom);
    return () => window.removeEventListener("acf:notification", handleCustom);
  }, []);

  // ── Cross-tab: BroadcastChannels ─────────────────────────────────────────
  useEffect(() => {
    const wfCh  = new BroadcastChannel("acf_workflow_updates");
    const encCh = new BroadcastChannel("acf_encounter_updates");

    const handleWf = (e: MessageEvent) => {
      const { type, payload } = e.data as { type: string; payload: Record<string, unknown> };
      if (type === "PATIENT_CHECKIN") {
        const meta = payload.meta as { name: string; owner: string } | undefined;
        const name = meta?.name ?? "Patient";
        const { message, targetRoles } = buildPayload(name, "TRIAGE");
        dispatch({
          type: "ADD",
          payload: {
            type: "success",
            message: `${name} (${meta?.owner ?? ""}) ${message.split(" — ")[1] ?? "checked in"}`,
            patientId:   payload.patientId as string,
            patientName: name,
            step:        "TRIAGE",
            targetRoles,
          },
        });
      } else if (type === "STEP_UPDATE") {
        const { patientId, step, petName } = payload as {
          patientId: string; step: string; petName?: string;
        };
        const { message, targetRoles } = buildPayload(petName, step);
        dispatch({
          type: "ADD",
          payload: { type: "info", message, patientId, patientName: petName, step, targetRoles },
        });
      }
    };

    const handleEnc = (e: MessageEvent) => {
      const { type, payload } = e.data as { type: string; payload: Record<string, unknown> };
      if (type === "ENCOUNTER_STATUS_UPDATE") {
        const status  = payload.status as string;
        const petName = payload.petName as string | undefined;
        const { message, targetRoles } = buildPayload(petName, status);
        dispatch({
          type: "ADD",
          payload: {
            type: status === "TRIAGED" ? "success" : "info",
            message,
            step: status,
            targetRoles,
          },
        });
      }
    };

    wfCh.addEventListener("message", handleWf);
    encCh.addEventListener("message", handleEnc);
    return () => {
      wfCh.close();
      encCh.close();
    };
  }, []);

  const addNotification = (n: Omit<LiveNotification, "id" | "timestamp" | "read">) =>
    dispatch({ type: "ADD", payload: n });

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

// ═══════════════════════════════════════════════════════════════════════════
// NotificationBell.tsx — Realtime role-targeted notification popover
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRole } from "@/contexts/RoleContext";
import { subscribe } from "@/lib/realtimeEngine";
import {
  getNotificationsForRole,
  pushFromEvent,
  markRead,
  markAllRead,
  type NotificationItem,
} from "@/lib/notificationStore";
import { cn } from "@/lib/utils";

// ─── Event type → border color ────────────────────────────────────────────────
const EVENT_BORDER: Record<string, string> = {
  PATIENT_ADMITTED:       "border-l-primary",
  PATIENT_DISCHARGED:     "border-l-blue-500",
  LAB_READY:              "border-l-purple-500",
  VITALS_UPDATED:         "border-l-amber-500",
  RX_DISPENSED:           "border-l-teal-500",
  BILLING_LOCKED:         "border-l-emerald-500",
  FEEDING_DUE:            "border-l-orange-500",
  WELLNESS_CHECK:         "border-l-pink-500",
  APPOINTMENT_CONFIRMED:  "border-l-sky-500",
};

const EVENT_DOT: Record<string, string> = {
  PATIENT_ADMITTED:       "bg-primary",
  PATIENT_DISCHARGED:     "bg-blue-500",
  LAB_READY:              "bg-purple-500",
  VITALS_UPDATED:         "bg-amber-500",
  RX_DISPENSED:           "bg-teal-500",
  BILLING_LOCKED:         "bg-emerald-500",
  FEEDING_DUE:            "bg-orange-500",
  WELLNESS_CHECK:         "bg-pink-500",
  APPOINTMENT_CONFIRMED:  "bg-sky-500",
};

function getBorder(type: string) { return EVENT_BORDER[type] ?? "border-l-primary"; }
function getDot(type: string)    { return EVENT_DOT[type]    ?? "bg-primary"; }

// ─── Notification Item Row ────────────────────────────────────────────────────
function NotifRow({
  item, isNew, onRead,
}: { item: NotificationItem; isNew: boolean; onRead: () => void }) {
  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, x: -16 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      onClick={onRead}
      className={cn(
        "p-3 rounded-lg border-l-4 cursor-pointer hover:bg-muted/50 transition-colors",
        getBorder(item.eventType),
        !item.read ? "bg-muted/30 ring-1 ring-inset ring-primary/10" : ""
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getDot(item.eventType))} />
          <p className={cn("text-xs truncate", !item.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
            {item.title}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 pl-3">
        {item.body}
      </p>
      {item.patientName && (
        <Badge variant="outline" className="text-[9px] mt-1 h-3.5 px-1.5 ml-3">
          {item.patientName}
        </Badge>
      )}
    </motion.div>
  );
}

// ─── Bell Component ───────────────────────────────────────────────────────────
export function NotificationBell() {
  const { role } = useRole();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(() =>
    getNotificationsForRole(role)
  );
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const ringRef = useRef(false);

  const refresh = () => setItems(getNotificationsForRole(role));

  // Subscribe to realtime engine (BroadcastChannel + same-tab CustomEvent)
  useEffect(() => {
    const unsub = subscribe((event) => {
      pushFromEvent(event);
      const updated = getNotificationsForRole(role);
      setItems(updated);
      if (updated.length > 0) {
        const newId = updated[0].id;
        setNewIds(prev => new Set([...prev, newId]));
        ringRef.current = true;
        setTimeout(() => {
          ringRef.current = false;
          setNewIds(prev => { const s = new Set(prev); s.delete(newId); return s; });
        }, 4000);
      }
    });
    return unsub;
  }, [role]);

  // Re-read when role changes (profile switch)
  useEffect(() => { refresh(); }, [role]);

  const unread = items.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    markAllRead(role);
    refresh();
  };

  const handleRead = (id: string) => {
    markRead(id);
    refresh();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Live Notifications"
          data-tutorial="realtime-bell"
        >
          <motion.div
            animate={unread > 0 && !open
              ? { rotate: [0, -12, 12, -8, 8, 0] }
              : { rotate: 0 }
            }
            transition={{ duration: 0.5, repeat: unread > 0 ? Infinity : 0, repeatDelay: 6 }}
          >
            <Zap className="h-5 w-5" />
          </motion.div>
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center pointer-events-none"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 shadow-xl" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Live Alerts</span>
            <AnimatePresence>
              {unread > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Badge variant="destructive" className="text-[10px] px-1.5 h-4">
                    {unread} new
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleMarkAllRead}
            title="Mark all read"
          >
            <CheckCheck className="h-3 w-3" />
          </Button>
        </div>

        {/* List */}
        <ScrollArea className="max-h-[384px]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No live alerts yet</p>
              <p className="text-xs mt-1 opacity-70">Events will appear here in real-time</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <AnimatePresence initial={false}>
                {items.map(item => (
                  <NotifRow
                    key={item.id}
                    item={item}
                    isNew={newIds.has(item.id)}
                    onRead={() => handleRead(item.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-3 py-2 text-center">
            <p className="text-[10px] text-muted-foreground">
              Showing alerts for <span className="font-semibold text-foreground">{role}</span> role
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LiveFeed.tsx — SuperAdmin real-time activity timeline
// Route: /live-feed (inside ProtectedRoutes / Layout)
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import {
  Activity, UserPlus, LogOut, FlaskConical, Thermometer,
  Pill, CreditCard, Utensils, Heart, CalendarCheck,
  Radio, Trash2, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { Navigate } from "react-router-dom";
import { getLiveFeed, subscribe, clearLiveFeed, EVENTS, type RealtimeEvent } from "@/lib/realtimeEngine";
import { cn } from "@/lib/utils";

// ─── Event display config ─────────────────────────────────────────────────────
const EVENT_META: Record<string, { icon: React.ElementType; label: string; color: string; category: string }> = {
  [EVENTS.PATIENT_ADMITTED]:        { icon: UserPlus,       label: "Patient Admitted",        color: "text-primary bg-primary/10",           category: "clinical" },
  [EVENTS.PATIENT_DISCHARGED]:      { icon: LogOut,         label: "Patient Discharged",       color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",   category: "clinical" },
  [EVENTS.LAB_READY]:               { icon: FlaskConical,   label: "Lab Results Ready",        color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20", category: "clinical" },
  [EVENTS.VITALS_UPDATED]:          { icon: Thermometer,    label: "Vitals Updated",           color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",   category: "clinical" },
  [EVENTS.RX_DISPENSED]:            { icon: Pill,           label: "Prescription Dispensed",   color: "text-teal-600 bg-teal-50 dark:bg-teal-900/20",   category: "clinical" },
  [EVENTS.BILLING_LOCKED]:          { icon: CreditCard,     label: "Invoice Finalised",        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", category: "financial" },
  [EVENTS.FEEDING_DUE]:             { icon: Utensils,       label: "Feeding Due",              color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", category: "clinical" },
  [EVENTS.WELLNESS_CHECK]:          { icon: Heart,          label: "Wellness Check",           color: "text-pink-600 bg-pink-50 dark:bg-pink-900/20",   category: "clinical" },
  [EVENTS.APPOINTMENT_CONFIRMED]:   { icon: CalendarCheck,  label: "Appointment Confirmed",    color: "text-sky-600 bg-sky-50 dark:bg-sky-900/20",   category: "comms" },
};

const ROLE_COLORS: Record<string, string> = {
  SuperAdmin:   "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Vet:          "bg-primary/10 text-primary",
  Nurse:        "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  Receptionist: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  Pharmacist:   "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  System:       "bg-muted text-muted-foreground",
};

type FilterType = "all" | "clinical" | "financial" | "comms";

function getCategory(type: string): string {
  return EVENT_META[type]?.category ?? "clinical";
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "??";
}

// ─── Feed Entry ───────────────────────────────────────────────────────────────
function FeedEntry({ event, isNew }: { event: RealtimeEvent; isNew: boolean }) {
  const meta = EVENT_META[event.type] ?? {
    icon: Activity,
    label: String(event.type).replace(/_/g, " "),
    color: "text-gray-600 bg-gray-100",
    category: "clinical",
  };
  const Icon = meta.icon;
  const p = event.payload as Record<string, string>;
  const ts = new Date(event.timestamp);

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -12, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="flex gap-3 py-3 px-1 group"
    >
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center">
        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm", meta.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 w-px bg-border/60 mt-1 min-h-[16px]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Actor avatar */}
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
              {getInitials(event.actorName)}
            </div>
            <span className="text-sm font-semibold">{event.actorName}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 h-4", ROLE_COLORS[event.actorRole] ?? ROLE_COLORS.System)}>
              {event.actorRole}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isNew && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                LIVE
              </span>
            )}
            {/* Timestamp pill */}
            <span className="text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
              {formatDistanceToNow(ts, { addSuffix: true })}
            </span>
          </div>
        </div>

        <p className="text-sm mt-1">
          <span className="font-medium">{meta.label}</span>
          {p.patientName && <> — <span className="text-primary font-semibold">{p.patientName}</span></>}
          {p.amount && <> · <span className="text-emerald-600 font-semibold">{p.amount}</span></>}
        </p>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {p.species  && <span className="text-[11px] text-muted-foreground">{p.species}</span>}
          {p.ward     && <span className="text-[11px] text-muted-foreground">Ward: {p.ward}</span>}
          {p.invoiceId && <span className="text-[11px] text-muted-foreground font-mono">#{p.invoiceId.slice(-6)}</span>}
          <span className="text-[10px] text-muted-foreground/60 ml-auto">
            {format(ts, "HH:mm:ss")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiveFeed() {
  const { role, has } = useRole();
  const [events, setEvents]   = useState<RealtimeEvent[]>(() => getLiveFeed());
  const [filter, setFilter]   = useState<FilterType>("all");
  const [newIds, setNewIds]   = useState<Set<string>>(new Set());
  const [isLive, setIsLive]   = useState(false);

  // Gate: SuperAdmin only
  if (!has("can_view_audit")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <Radio className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium">SuperAdmin access required.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Check BroadcastChannel availability
    setIsLive(typeof BroadcastChannel !== "undefined");

    const unsub = subscribe((event) => {
      setEvents(prev => [event, ...prev].slice(0, 200));
      setNewIds(prev => new Set([...prev, event.id]));
      setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(event.id); return s; }), 8000);
    });
    return unsub;
  }, []);

  const filtered = events.filter(e =>
    filter === "all" ? true : getCategory(e.type) === filter
  );

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "clinical",  label: "Clinical" },
    { key: "financial", label: "Financial" },
    { key: "comms",     label: "Comms" },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Live Activity Feed</h1>
            {isLive ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">(BroadcastChannel unavailable)</span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time clinic events from all tabs and users · {events.length} event{events.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={() => { clearLiveFeed(); setEvents([]); }}
        >
          <Trash2 className="h-4 w-4" />
          Clear Feed
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all",
              filter === f.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f.label}
          </button>
        ))}
        {filtered.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="pt-4 pb-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
              <Radio className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">No events yet</p>
              <p className="text-sm mt-1 max-w-xs opacity-70">
                Events appear here when patients are admitted, discharged, vitals are updated, or invoices are paid.
              </p>
              <p className="text-xs mt-3 opacity-50">
                Try admitting a patient or completing triage to see live events.
              </p>
            </div>
          ) : (
            <div>
              <AnimatePresence initial={false}>
                {filtered.map((event, i) => (
                  <FeedEntry
                    key={event.id}
                    event={event}
                    isNew={newIds.has(event.id)}
                  />
                ))}
              </AnimatePresence>
              {/* End marker */}
              <div className="flex items-center gap-2 py-3 opacity-40">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                <span className="text-[11px] text-muted-foreground">End of feed</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

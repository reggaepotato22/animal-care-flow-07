import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Scissors, Search, Plus, Clock, UserCheck, AlertTriangle,
  CheckCircle2, Activity, Calendar, ChevronRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadSurgeries, subscribeToSurgery, PHASE_META, SURGERY_PHASES,
  type SurgeryRecord, type SurgeryStatus,
} from "@/lib/surgeryStore";
import { ScheduleSurgeryDialog } from "@/components/ScheduleSurgeryDialog";

// ── Helpers ────────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES: SurgeryStatus[] = ["PRE_OP", "INDUCTION", "INTRA_OP", "POST_OP"];

function dayLabel(iso?: string): string {
  if (!iso) return "Unscheduled";
  try {
    const d = parseISO(iso);
    if (isToday(d))    return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEEE, MMM d");
  } catch { return "Scheduled"; }
}

function priorityColor(p: string) {
  return p === "emergency" ? "bg-red-100 text-red-800 border-red-300"
       : p === "urgent"    ? "bg-amber-100 text-amber-800 border-amber-300"
       : "bg-gray-100 text-gray-600 border-gray-300";
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SurgeryBoard() {
  const navigate = useNavigate();
  const [surgeries, setSurgeries] = useState<SurgeryRecord[]>([]);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<"all" | SurgeryStatus>("all");

  useEffect(() => {
    const load = () => setSurgeries(loadSurgeries());
    load();
    return subscribeToSurgery(load);
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    scheduled:  surgeries.filter(s => s.status === "SCHEDULED").length,
    active:     surgeries.filter(s => ACTIVE_STATUSES.includes(s.status)).length,
    completed:  surgeries.filter(s => s.status === "COMPLETED").length,
    emergency:  surgeries.filter(s => s.priority === "emergency" && s.status !== "COMPLETED" && s.status !== "CANCELLED").length,
  }), [surgeries]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return surgeries
      .filter(s => s.status !== "CANCELLED")
      .filter(s => statusFilter === "all" || s.status === statusFilter)
      .filter(s =>
        !q ||
        s.petName.toLowerCase().includes(q) ||
        s.patientName.toLowerCase().includes(q) ||
        s.surgeryType.toLowerCase().includes(q) ||
        s.surgeon.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const activeA = ACTIVE_STATUSES.includes(a.status);
        const activeB = ACTIVE_STATUSES.includes(b.status);
        if (activeA && !activeB) return -1;
        if (!activeA && activeB) return 1;
        const ta = a.scheduledTime ?? a.createdAt;
        const tb = b.scheduledTime ?? b.createdAt;
        return new Date(ta).getTime() - new Date(tb).getTime();
      });
  }, [surgeries, search, statusFilter]);

  // Group by day label
  const grouped = useMemo(() => {
    const map = new Map<string, SurgeryRecord[]>();
    filtered.forEach(s => {
      const label = ACTIVE_STATUSES.includes(s.status)
        ? "🔴 In Progress"
        : dayLabel(s.scheduledTime ?? s.createdAt);
      const arr = map.get(label) ?? [];
      arr.push(s);
      map.set(label, arr);
    });
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            Surgery Board
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Scheduled and active surgical procedures</p>
        </div>
        <ScheduleSurgeryDialog>
          <Button className="gap-2"><Plus className="h-4 w-4" />Schedule Surgery</Button>
        </ScheduleSurgeryDialog>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Scheduled",  value: stats.scheduled,  Icon: Calendar,     color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "In Progress",value: stats.active,     Icon: Activity,     color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
          { label: "Completed",  value: stats.completed,  Icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50 dark:bg-green-950/30" },
          { label: "Emergency",  value: stats.emergency,  Icon: Zap,          color: "text-red-600",    bg: "bg-red-50 dark:bg-red-950/30" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-xl border p-4 flex items-center gap-3", s.bg)}>
            <s.Icon className={cn("h-8 w-8 shrink-0", s.color)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient, surgery type, surgeon…"
            className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatus(v as typeof statusFilter)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {SURGERY_PHASES.map(p => (
              <SelectItem key={p} value={p}>{PHASE_META[p].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Surgery list ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Scissors className="h-14 w-14 mx-auto text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            {surgeries.length === 0 ? "No surgeries scheduled yet" : "No results match your filters"}
          </p>
          {surgeries.length === 0 && (
            <ScheduleSurgeryDialog>
              <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Schedule First Surgery</Button>
            </ScheduleSurgeryDialog>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([label, items]) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold">{label}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(sx => <SurgeryRow key={sx.id} rec={sx} onClick={() => navigate(`/surgeries/${sx.id}`)} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Surgery row card ───────────────────────────────────────────────────────────

function SurgeryRow({ rec, onClick }: { rec: SurgeryRecord; onClick: () => void }) {
  const meta    = PHASE_META[rec.status];
  const isActive = ACTIVE_STATUSES.includes(rec.status);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border px-4 py-3 flex items-center gap-4 transition-all group hover:shadow-md hover:border-primary/40",
        isActive && "border-orange-300 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/20",
        rec.status === "COMPLETED" && "opacity-70",
      )}
    >
      {/* Time / status indicator */}
      <div className="shrink-0 w-14 text-center">
        {rec.scheduledTime ? (
          <div>
            <p className="text-sm font-bold font-mono">
              {format(parseISO(rec.scheduledTime), "HH:mm")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {format(parseISO(rec.scheduledTime), "MMM d")}
            </p>
          </div>
        ) : (
          <Clock className="h-5 w-5 text-muted-foreground mx-auto" />
        )}
      </div>

      {/* Divider */}
      <div className={cn("w-1 self-stretch rounded-full shrink-0",
        isActive         ? "bg-orange-500 animate-pulse" :
        rec.status === "COMPLETED" ? "bg-green-400" :
        rec.status === "SCHEDULED" ? "bg-blue-400" : "bg-muted"
      )} />

      {/* Patient + procedure */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{rec.petName}</span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-sm">{rec.surgeryType}</span>
          {isActive && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
          <span>Owner: {rec.patientName}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><UserCheck className="h-3 w-3"/>{rec.surgeon}</span>
          {rec.anesthetist && <><span>·</span><span>Anest: {rec.anesthetist}</span></>}
          {rec.operatingRoom && <><span>·</span><span>OR: {rec.operatingRoom}</span></>}
          {rec.species && <><span>·</span><span>{rec.species}</span></>}
        </div>
      </div>

      {/* Badges */}
      <div className="shrink-0 flex items-center gap-2 flex-wrap justify-end">
        {rec.isAggressive && (
          <Badge variant="destructive" className="text-[10px] h-4.5 gap-1 hidden sm:flex">
            <AlertTriangle className="h-2.5 w-2.5" />Aggr.
          </Badge>
        )}
        <Badge className={cn("border text-[10px] hidden sm:flex", priorityColor(rec.priority))}>
          {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
        </Badge>
        <Badge className={cn("border text-[10px]", meta.badge)}>{meta.label}</Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

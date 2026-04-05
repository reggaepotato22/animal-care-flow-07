import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Plus, Hospital, Bed, AlertTriangle, Scissors,
  UserCheck, ChevronRight, Heart,
} from "lucide-react";
import { AdmissionRequestDialog } from "@/components/AdmissionRequestDialog";
import { cn } from "@/lib/utils";
import {
  loadHospRecords, subscribeToHospitalization,
  SURGERY_STAGE_LABELS,
  type HospRecord,
} from "@/lib/hospitalizationStore";

function buildRecords() { return loadHospRecords(); }

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  admitted:      { label: "Admitted",    badge: "bg-blue-100 text-blue-800 border-blue-300",     dot: "bg-blue-500" },
  critical:      { label: "Critical",    badge: "bg-red-100 text-red-800 border-red-300",       dot: "bg-red-500" },
  in_surgery:    { label: "In Surgery",  badge: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-500" },
  surgery_prep:  { label: "Surgery Prep",badge: "bg-amber-100 text-amber-800 border-amber-300", dot: "bg-amber-500" },
  recovery:      { label: "Recovery",    badge: "bg-purple-100 text-purple-800 border-purple-300", dot: "bg-purple-500" },
  in_ward:       { label: "In Ward",     badge: "bg-cyan-100 text-cyan-800 border-cyan-300",     dot: "bg-cyan-500" },
  discharged:    { label: "Discharged",  badge: "bg-green-100 text-green-800 border-green-300", dot: "bg-green-500" },
};

function statusMeta(rec: HospRecord) {
  const key = rec.status ?? "admitted";
  return STATUS_META[key] ?? { label: key, badge: "bg-muted text-muted-foreground border-muted", dot: "bg-gray-400" };
}

export default function Hospitalization() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<HospRecord[]>(buildRecords);
  const [search, setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => subscribeToHospitalization(() => setRecords(buildRecords())), []);

  const active    = useMemo(() => records.filter(r => r.status !== "discharged"), [records]);
  const critical  = useMemo(() => records.filter(r => r.status === "critical" || r.workspaceStatus === "CRITICAL").length, [records]);
  const inSurgery = useMemo(() => records.filter(r => r.status === "in_surgery").length, [records]);
  const discharged= useMemo(() => records.filter(r => r.status === "discharged").length, [records]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      const matchQ = !q ||
        r.petName.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.attendingVet.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || r.status === statusFilter;
      return matchQ && matchS;
    });
  }, [records, search, statusFilter]);

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hospitalization</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {active.length} patient{active.length !== 1 ? "s" : ""} currently admitted
          </p>
        </div>
        <AdmissionRequestDialog>
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Admit Patient
          </Button>
        </AdmissionRequestDialog>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { label: "Admitted",   value: active.length,    Icon: Bed,           bg: "bg-blue-50 dark:bg-blue-950/30",   icon: "text-blue-600" },
          { label: "Critical",   value: critical,          Icon: AlertTriangle,  bg: "bg-red-50 dark:bg-red-950/30",    icon: "text-red-600" },
          { label: "In Surgery", value: inSurgery,         Icon: Scissors,      bg: "bg-orange-50 dark:bg-orange-950/30", icon: "text-orange-600" },
          { label: "Discharged", value: discharged,        Icon: Heart,         bg: "bg-green-50 dark:bg-green-950/30", icon: "text-green-600" },
        ] as { label:string; value:number; Icon:React.ElementType; bg:string; icon:string }[]).map(s => (
          <Card key={s.label} className="border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                <s.Icon className={cn("h-5 w-5", s.icon)} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search + Filter ────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patients, owners, vet, reason…" value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="admitted">Admitted</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="in_surgery">In Surgery</SelectItem>
            <SelectItem value="surgery_prep">Surgery Prep</SelectItem>
            <SelectItem value="recovery">Recovery</SelectItem>
            <SelectItem value="in_ward">In Ward</SelectItem>
            <SelectItem value="discharged">Discharged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Patient list ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filtered.map(record => (
          <PatientRow
            key={record.id}
            record={record}
            onClick={() => navigate(`/hospitalizations/${record.id}`)}
          />
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Hospital className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="font-medium text-muted-foreground">
                {search || statusFilter !== "all" ? "No patients match your filters" : "No hospitalization records yet"}
              </p>
              {!search && statusFilter === "all" && (
                <p className="text-xs text-muted-foreground mt-1">Admit a patient using the button above.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}

// ── PatientRow ────────────────────────────────────────────────────────────────
function PatientRow({ record, onClick }: { record: HospRecord; onClick: () => void }) {
  const sm = statusMeta(record);
  const los = differenceInDays(new Date(), new Date(record.admissionDate));
  const isCritical = record.status === "critical" || record.workspaceStatus === "CRITICAL";
  const inSurgery  = record.status === "in_surgery" ||
    (record.surgeryStage && ["AWAITING_SURGERY","PREP_FOR_SURGERY","IN_SURGERY"].includes(record.surgeryStage));

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer",
        "hover:border-primary/40",
        isCritical && "border-red-300 dark:border-red-800",
      )}
    >
      {/* Priority stripe */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", sm.dot)} />

      <div className="pl-4 pr-4 py-4 flex items-center gap-5">

        {/* Species avatar */}
        <div className={cn(
          "h-11 w-11 rounded-full flex items-center justify-center shrink-0 text-lg font-bold",
          isCritical ? "bg-red-100 text-red-700 dark:bg-red-900/30" : "bg-primary/10 text-primary"
        )}>
          {record.petName.charAt(0).toUpperCase()}
        </div>

        {/* Primary info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{record.petName}</span>
            <Badge className={cn("border text-[11px] h-5", sm.badge)}>{sm.label}</Badge>
            {record.isAggressive && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[11px] h-5 gap-1">
                <AlertTriangle className="h-2.5 w-2.5" /> Aggressive
              </Badge>
            )}
            {inSurgery && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-[11px] h-5 gap-1">
                <Scissors className="h-2.5 w-2.5 animate-pulse" />
                {record.surgeryStage ? SURGERY_STAGE_LABELS[record.surgeryStage]?.label : "In Surgery"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
            <span>{record.patientName}</span>
            <span className="opacity-40">·</span>
            <span>{record.species}</span>
            <span className="opacity-40">·</span>
            <span className="truncate max-w-[240px]">{record.reason}</span>
          </div>
        </div>

        {/* Ward + Vet */}
        <div className="hidden md:flex flex-col items-end gap-1 shrink-0 min-w-[140px]">
          <div className="flex items-center gap-1.5 text-xs">
            <Bed className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{record.ward}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5" />
            <span>{record.attendingVet}</span>
          </div>
        </div>

        {/* Admission + LOS */}
        <div className="hidden sm:flex flex-col items-center shrink-0 min-w-[72px]">
          <span className="text-xl font-bold leading-none">{los === 0 ? 1 : los}</span>
          <span className="text-[11px] text-muted-foreground">day{los !== 1 ? "s" : ""}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {format(new Date(record.admissionDate), "MMM d")}
          </span>
        </div>

        {/* CTA */}
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity h-8"
          onClick={e => { e.stopPropagation(); onClick(); }}
        >
          Open Workspace <ChevronRight className="h-3.5 w-3.5" />
        </Button>

      </div>
    </div>
  );
}
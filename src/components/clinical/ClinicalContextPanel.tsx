import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Thermometer, Heart, Wind, Pill, AlertTriangle,
  Clock, Stethoscope, Activity, ChevronUp, ChevronDown, Minus, Scale,
} from "lucide-react";
import type { ClinicalFinding } from "@/pages/NewRecord";

interface Vital {
  date: string;
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  weight?: string;
  bloodPressure?: string;
}

interface Medication {
  name: string;
  dosage?: string;
  prescribed?: string;
  status?: "active" | "past" | string;
}

interface RecentVisit {
  date: string;
  reason: string;
  vet?: string;
  notes?: string;
}

export interface ClinicalContextPanelProps {
  allergies?: string[];
  vitals?: Vital[];
  medications?: Medication[];
  recentVisits?: RecentVisit[];
  activeProblems?: ClinicalFinding[];
  lastDiagnosis?: string;
  conditions?: string[];
}

function parseNum(str: string = ""): number | null {
  const m = str.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

type TrendDir = "up" | "down" | "same" | null;

function getTrend(curr: number | null, prev: number | null): TrendDir {
  if (curr === null || prev === null) return null;
  const diff = curr - prev;
  if (Math.abs(diff) < 0.01) return "same";
  return diff > 0 ? "up" : "down";
}

function TrendIcon({ dir }: { dir: TrendDir }) {
  if (!dir || dir === "same") return <Minus className="h-3 w-3 text-muted-foreground/50" />;
  if (dir === "up") return <ChevronUp className="h-3 w-3 text-amber-500" />;
  return <ChevronDown className="h-3 w-3 text-blue-500" />;
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

export function ClinicalContextPanel({
  allergies = [],
  vitals = [],
  medications = [],
  recentVisits = [],
  activeProblems = [],
  lastDiagnosis,
  conditions = [],
}: ClinicalContextPanelProps) {
  const sorted = [...vitals].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latest = sorted[0];
  const prev = sorted[1];

  const knownAllergies = allergies.filter(
    (a) => a && a.toLowerCase() !== "none known" && a.toLowerCase() !== "none"
  );

  const activeMeds = medications.filter((m) => m.status !== "past");
  const pastMeds = medications.filter((m) => m.status === "past");

  const visibleProblems = activeProblems.filter((p) => p.status !== "ruled_out");

  return (
    <div className="space-y-1 py-2">
      {/* ── Allergies ────────────────────────────────── */}
      {knownAllergies.length > 0 && (
        <div>
          <SectionTitle icon={AlertTriangle} label="Allergies" />
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {knownAllergies.map((a, i) => (
              <Badge key={i} variant="destructive" className="text-[10px] py-0 h-4">
                {a}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* ── Vitals ───────────────────────────────────── */}
      {latest && (
        <div>
          <SectionTitle icon={Activity} label="Vitals" />
          <div className="px-3 pb-2 space-y-1.5">
            {prev && (
              <p className="text-[9px] text-muted-foreground/60 mb-1">
                trend vs {new Date(prev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            )}
            {(
              [
                { icon: Thermometer, label: "Temp",   value: latest.temperature,     curr: parseNum(latest.temperature),     prevV: parseNum(prev?.temperature) },
                { icon: Heart,       label: "HR",     value: latest.heartRate,        curr: parseNum(latest.heartRate),       prevV: parseNum(prev?.heartRate) },
                { icon: Wind,        label: "RR",     value: latest.respiratoryRate,  curr: parseNum(latest.respiratoryRate), prevV: parseNum(prev?.respiratoryRate) },
                { icon: Scale,       label: "Weight", value: latest.weight,           curr: parseNum(latest.weight),          prevV: parseNum(prev?.weight) },
              ] as const
            ).map(({ icon: Icon, label, value, curr, prevV }) =>
              value ? (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-10 shrink-0 text-[10px]">{label}</span>
                  <span className="font-medium flex-1 truncate text-[11px]">{value}</span>
                  <TrendIcon dir={getTrend(curr, prevV)} />
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* ── Medications ──────────────────────────────── */}
      <div>
        <SectionTitle icon={Pill} label="Medications" />
        <div className="px-3 pb-2">
          {activeMeds.length > 0 ? (
            <div className="space-y-1.5">
              {activeMeds.map((m, i) => (
                <div key={i} className="text-[11px] leading-tight">
                  <span className="font-medium">{m.name}</span>
                  {m.dosage && (
                    <span className="text-muted-foreground"> · {m.dosage}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">No active medications</p>
          )}
          {pastMeds.length > 0 && (
            <details className="mt-1.5">
              <summary className="text-[10px] text-muted-foreground cursor-pointer select-none hover:text-foreground">
                {pastMeds.length} past medication{pastMeds.length > 1 ? "s" : ""}
              </summary>
              <div className="mt-1 space-y-1 pl-2 border-l border-muted">
                {pastMeds.map((m, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground">
                    {m.name}{m.dosage ? ` · ${m.dosage}` : ""}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* ── Recent Visits ────────────────────────────── */}
      <div>
        <SectionTitle icon={Clock} label="Last 3 Visits" />
        <div className="px-3 pb-2">
          {recentVisits.length > 0 ? (
            <div className="space-y-2">
              {recentVisits.slice(0, 3).map((v, i) => (
                <div key={i} className="border-l-2 border-muted pl-2">
                  <div className="text-[11px] font-medium truncate">{v.reason}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(v.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {v.vet && ` · ${v.vet}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">No visit history</p>
          )}
        </div>
      </div>

      {/* ── Active Problems ──────────────────────────── */}
      {visibleProblems.length > 0 && (
        <div>
          <SectionTitle icon={AlertTriangle} label="Active Problems" />
          <div className="px-3 pb-2 space-y-1.5">
            {visibleProblems.map((p) => (
              <div key={p.id} className="flex items-start gap-1.5">
                <span
                  className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                    p.status === "confirmed" ? "bg-red-500" : "bg-amber-400"
                  }`}
                />
                <span className="text-[11px] flex-1 leading-tight">{p.finding}</span>
                <Badge
                  variant="outline"
                  className={`text-[9px] py-0 h-4 shrink-0 ${
                    p.status === "confirmed"
                      ? "border-red-200 text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400"
                      : "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400"
                  }`}
                >
                  {p.status === "confirmed" ? "Confirmed" : "Tentative"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Last Diagnosis ───────────────────────────── */}
      {lastDiagnosis && (
        <div>
          <SectionTitle icon={Stethoscope} label="Last Diagnosis" />
          <div className="px-3 pb-2">
            <p className="text-[11px] font-medium">{lastDiagnosis}</p>
          </div>
        </div>
      )}

      {/* ── Chronic Conditions ───────────────────────── */}
      {conditions.length > 0 && (
        <div>
          <SectionTitle icon={Activity} label="Chronic Conditions" />
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {conditions.map((c, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] py-0 h-4">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!latest && knownAllergies.length === 0 && medications.length === 0 &&
       recentVisits.length === 0 && visibleProblems.length === 0 &&
       !lastDiagnosis && conditions.length === 0 && (
        <div className="px-3 py-6 text-center">
          <Activity className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-[11px] text-muted-foreground italic">No clinical context available</p>
        </div>
      )}
    </div>
  );
}

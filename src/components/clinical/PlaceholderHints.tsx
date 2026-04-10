import React, { useMemo, useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlaceholderContext {
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  weight?: string;
  bodyConditionScore?: string;
  patientName?: string;
  species?: string;
  breed?: string;
  primaryDiagnosis?: string;
  chiefComplaint?: string;
  veterinarian?: string;
}

interface PlaceholderHintsProps {
  value: string;
  onChange: (newValue: string) => void;
  context?: PlaceholderContext;
  className?: string;
}

const PLACEHOLDER_PATTERN = /\[([^\]]+)\]/g;

function getSuggestion(key: string, ctx: PlaceholderContext): string | null {
  const k = key.toLowerCase().trim();

  // Vitals
  if ((k === "temp" || k === "temperature") && ctx.temperature) return ctx.temperature;
  if ((k === "hr" || k === "heart rate" || k === "heartrate") && ctx.heartRate) return ctx.heartRate + " bpm";
  if ((k === "rr" || k === "respiratory rate") && ctx.respiratoryRate) return ctx.respiratoryRate + " rpm";
  if (k === "weight" && ctx.weight) return ctx.weight + " kg";
  if ((k === "bcs" || k === "body condition score") && ctx.bodyConditionScore) return ctx.bodyConditionScore + "/9";

  // Patient info
  if ((k === "patient" || k === "patient name") && ctx.patientName) return ctx.patientName;
  if (k === "species" && ctx.species) return ctx.species;
  if (k === "breed" && ctx.breed) return ctx.breed;
  if ((k === "vet" || k === "veterinarian" || k === "doctor") && ctx.veterinarian) return ctx.veterinarian;

  // Diagnosis
  if ((k === "diagnosis" || k === "primary diagnosis") && ctx.primaryDiagnosis) return ctx.primaryDiagnosis;
  if ((k === "chief complaint" || k === "complaint") && ctx.chiefComplaint) return ctx.chiefComplaint;

  // Date/time suggestions
  if (k === "date") return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (k === "time") return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Timeframe suggestions
  if (k === "timeframe") return null; // will show options
  if (k === "duration") return null;

  // Common clinical values
  if (k === "findings") return null;
  if (k === "results") return null;

  return null;
}

const TIMEFRAME_OPTIONS = ["1 week", "2 weeks", "1 month", "3 months", "6 months"];

function extractPlaceholders(text: string): string[] {
  const matches: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  const re = /\[([^\]]+)\]/g;
  while ((m = re.exec(text)) !== null) {
    const key = m[1];
    if (!seen.has(key)) {
      seen.add(key);
      matches.push(key);
    }
  }
  return matches;
}

function replaceFirst(text: string, placeholder: string, value: string): string {
  return text.replace(`[${placeholder}]`, value);
}

function replaceAll(text: string, placeholder: string, value: string): string {
  return text.split(`[${placeholder}]`).join(value);
}

export function PlaceholderHints({ value, onChange, context = {}, className }: PlaceholderHintsProps) {
  const [expanded, setExpanded] = useState(true);
  const [timeframeOpen, setTimeframeOpen] = useState<string | null>(null);

  const placeholders = useMemo(() => extractPlaceholders(value), [value]);

  if (placeholders.length === 0) return null;

  return (
    <div className={cn("mt-1.5 rounded-lg border border-amber-200/70 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-700/40", className)}>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left"
      >
        <Wand2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex-1">
          {placeholders.length} placeholder{placeholders.length > 1 ? "s" : ""} to fill
        </span>
        {expanded
          ? <ChevronUp className="h-3 w-3 text-amber-500" />
          : <ChevronDown className="h-3 w-3 text-amber-500" />}
      </button>

      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {placeholders.map((key) => {
            const suggestion = getSuggestion(key, context);
            const isTimeframe = key.toLowerCase() === "timeframe" || key.toLowerCase() === "duration";

            return (
              <div key={key} className="flex items-center gap-2 flex-wrap">
                <code className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-mono border border-amber-200/60 dark:border-amber-700/40 shrink-0">
                  [{key}]
                </code>

                {suggestion ? (
                  <button
                    type="button"
                    onClick={() => onChange(replaceAll(value, key, suggestion))}
                    className="flex items-center gap-1 text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded-full transition-colors"
                  >
                    <Lightbulb className="h-2.5 w-2.5" />
                    Use: <span className="font-semibold ml-0.5">{suggestion}</span>
                  </button>
                ) : isTimeframe ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {TIMEFRAME_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(replaceFirst(value, key, opt))}
                        className="text-[10px] bg-muted hover:bg-muted/80 border border-border px-2 py-0.5 rounded-full transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">fill manually</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

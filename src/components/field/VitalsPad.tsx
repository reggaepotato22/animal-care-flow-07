import { useState, ElementType } from "react";
import { Thermometer, Scale, Heart, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VitalsData {
  temperature: string;
  weight: string;
  heartRate: string;
  respiratoryRate: string;
}

interface VitalsPadProps {
  vitals: VitalsData;
  onChange: (key: keyof VitalsData, value: string) => void;
}

const VITAL_FIELDS: { key: keyof VitalsData; label: string; unit: string; Icon: ElementType }[] = [
  { key: "temperature",     label: "Temp",       unit: "°C",  Icon: Thermometer },
  { key: "weight",          label: "Weight",     unit: "kg",  Icon: Scale },
  { key: "heartRate",       label: "Heart Rate", unit: "bpm", Icon: Heart },
  { key: "respiratoryRate", label: "Resp. Rate", unit: "/min",Icon: Wind },
];

function NumericPad({ label, unit, value, onChange, onClose }: {
  label: string; unit: string; value: string;
  onChange: (v: string) => void; onClose: () => void;
}) {
  const handle = (key: string) => {
    if (key === "⌫") { onChange(value.slice(0, -1)); return; }
    if (key === "." && value.includes(".")) return;
    if (value.length >= 6) return;
    onChange(value + key);
  };
  const keys = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];
  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-end" onClick={onClose}>
      <div className="w-full bg-card border-t-2 border-primary rounded-t-3xl p-4 pb-8"
           onClick={e => e.stopPropagation()}>
        <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <div className="text-center text-5xl font-mono font-bold py-3 min-h-[72px] text-foreground">
          {value || <span className="text-muted-foreground/40">0</span>}
          <span className="text-lg text-muted-foreground ml-2">{unit}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {keys.map(k => (
            <button key={k} onClick={() => handle(k)}
              className={cn(
                "h-16 rounded-2xl text-2xl font-semibold transition-all active:scale-95 select-none",
                k === "⌫"
                  ? "bg-destructive/20 text-destructive"
                  : "bg-muted hover:bg-muted/70 text-foreground"
              )}>
              {k}
            </button>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full mt-4 h-14 rounded-2xl bg-primary text-primary-foreground text-lg font-bold active:scale-98">
          Done ✓
        </button>
      </div>
    </div>
  );
}

export function VitalsPad({ vitals, onChange }: VitalsPadProps) {
  const [activePad, setActivePad] = useState<keyof VitalsData | null>(null);
  const activeField = VITAL_FIELDS.find(f => f.key === activePad);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {VITAL_FIELDS.map(field => {
          const val = vitals[field.key];
          return (
            <button key={field.key} onClick={() => setActivePad(field.key)}
              className={cn(
                "flex flex-col items-center justify-center h-28 rounded-2xl border-2 transition-all active:scale-95 p-3 select-none",
                val
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-muted/30 text-muted-foreground"
              )}>
              <field.Icon className="h-6 w-6 mb-1" />
              <span className={cn("text-2xl font-bold font-mono", val ? "text-primary" : "text-muted-foreground/50")}>
                {val || "—"}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">{field.label} · {field.unit}</span>
            </button>
          );
        })}
      </div>
      {activePad && activeField && (
        <NumericPad
          label={activeField.label}
          unit={activeField.unit}
          value={vitals[activePad]}
          onChange={v => onChange(activePad, v)}
          onClose={() => setActivePad(null)}
        />
      )}
    </>
  );
}

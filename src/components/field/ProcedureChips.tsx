import { ElementType } from "react";
import {
  Syringe, Pill, Bandage, Droplets, TestTube2, FlaskConical,
  Eye, Scissors, Microscope, ScanLine, Waves, Activity,
  Stethoscope, Check, Volume2, SmilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const FIELD_PROCEDURES: { id: string; label: string; Icon: ElementType }[] = [
  { id: "vaccination",    label: "Vaccination",     Icon: Syringe      },
  { id: "deworming",      label: "Deworming",       Icon: Pill         },
  { id: "wound_clean",    label: "Wound Cleaning",  Icon: Bandage      },
  { id: "iv_fluids",      label: "IV Fluids",       Icon: Droplets     },
  { id: "blood_sample",   label: "Blood Sample",    Icon: TestTube2    },
  { id: "urine_sample",   label: "Urine Sample",    Icon: FlaskConical },
  { id: "dental",         label: "Dental Check",    Icon: SmilePlus    },
  { id: "eye_treatment",  label: "Eye Treatment",   Icon: Eye          },
  { id: "ear_cleaning",   label: "Ear Cleaning",    Icon: Volume2      },
  { id: "bandaging",      label: "Bandaging",       Icon: Activity     },
  { id: "suturing",       label: "Suturing",        Icon: Scissors     },
  { id: "castration",     label: "Castration",      Icon: Scissors     },
  { id: "spay",           label: "Spay",            Icon: Microscope   },
  { id: "xray",           label: "X-Ray",           Icon: ScanLine     },
  { id: "ultrasound",     label: "Ultrasound",      Icon: Waves        },
  { id: "penicillin",     label: "Penicillin",      Icon: Stethoscope  },
];

interface ProcedureChipsProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function ProcedureChips({ selected, onChange }: ProcedureChipsProps) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(p => p !== id) : [...selected, id]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FIELD_PROCEDURES.map(proc => {
        const active = selected.includes(proc.id);
        const Icon = active ? Check : proc.Icon;
        return (
          <button
            key={proc.id}
            onClick={() => toggle(proc.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium",
              "transition-all active:scale-95 select-none border",
              active
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/50 text-foreground border-border hover:border-primary/40"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{proc.label}</span>
          </button>
        );
      })}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getParkedPatients, unparkPatient, type ParkedPatient } from "@/lib/parkedPatientsStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { X, BookmarkCheck, CornerUpRight, ParkingSquare, AlertTriangle, Microscope, FileEdit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function getSpeciesEmoji(species?: string): string {
  if (!species) return "🐾";
  const s = species.toLowerCase();
  if (s.includes("dog") || s.includes("canine")) return "🐶";
  if (s.includes("cat") || s.includes("feline")) return "🐱";
  if (s.includes("bird") || s.includes("avian")) return "🦜";
  if (s.includes("rabbit")) return "🐰";
  if (s.includes("reptile") || s.includes("lizard") || s.includes("snake")) return "🦎";
  return "🐾";
}

export function ParkedPatientsSidebar() {
  const navigate = useNavigate();
  const [parked, setParked] = useState<ParkedPatient[]>(getParkedPatients);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const refresh = () => setParked(getParkedPatients());
    window.addEventListener("acf:parked-patients-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("acf:parked-patients-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (parked.length === 0) return null;

  const handleResume = (p: ParkedPatient) => {
    navigate(p.returnPath);
  };

  const handleUnpark = (e: React.MouseEvent, patientId: string) => {
    e.stopPropagation();
    unparkPatient(patientId);
    setParked(getParkedPatients());
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">
        {/* Expanded panel */}
        {expanded && (
          <div className="bg-card border border-border rounded-xl shadow-2xl w-64 overflow-hidden animate-in slide-in-from-bottom-2 fade-in-0 duration-200">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/60 border-b border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                Parked Patients
                <Badge className="text-[9px] h-4 px-1.5 ml-1 bg-primary text-primary-foreground">
                  {parked.length}
                </Badge>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                onClick={() => setExpanded(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {parked.map((p) => (
                <div
                  key={p.patientId}
                  onClick={() => handleResume(p)}
                  className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted/50 cursor-pointer group transition-colors"
                >
                  <span className="text-base mt-0.5 shrink-0">{getSpeciesEmoji(p.species)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{p.patientName}</p>
                    {(p.draftLabel || p.draftNote) && (
                      <p className="text-[10px] text-muted-foreground truncate italic mt-0.5">
                        "{p.draftLabel || p.draftNote}"
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {(p.tentativeFindings ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          <AlertTriangle className="h-2 w-2" />
                          {p.tentativeFindings} tentative
                        </span>
                      )}
                      {(p.pendingLabs ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                          <Microscope className="h-2 w-2" />
                          {p.pendingLabs} lab{(p.pendingLabs ?? 0) > 1 ? "s" : ""}
                        </span>
                      )}
                      {!(p.tentativeFindings) && !(p.pendingLabs) && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                          <FileEdit className="h-2 w-2" />
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(p.parkedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); handleResume(p); }}
                        >
                          <CornerUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Resume</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleUnpark(e, p.patientId)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Dismiss</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-3 py-2 bg-muted/30 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                Click any patient to resume their session
              </p>
            </div>
          </div>
        )}

        {/* Floating trigger button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setExpanded((s) => !s)}
              className={cn(
                "flex items-center gap-2 rounded-full shadow-lg px-3 py-2 text-xs font-semibold transition-all hover:scale-105 active:scale-95",
                expanded
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
              )}
            >
              <ParkingSquare className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Parked</span>
              <span className={cn(
                "inline-flex items-center justify-center rounded-full h-4 w-4 text-[10px] font-bold",
                expanded ? "bg-primary-foreground/30 text-primary-foreground" : "bg-primary text-primary-foreground"
              )}>
                {parked.length}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {parked.length} parked patient{parked.length !== 1 ? "s" : ""} — click to resume
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

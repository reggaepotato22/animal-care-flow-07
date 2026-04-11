import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, Tag, Hash, MoreVertical, Play, Check, Stethoscope, X } from "lucide-react";
import { EncounterStatus } from "@/lib/types";

interface EncounterHeaderProps {
  encounter: any;
  onStatusChange: (status: EncounterStatus) => void;
  onStatusChipClass: (status: string) => string;
  onStartConsultation?: () => void;
}

export function EncounterHeader({ encounter, onStatusChange, onStatusChipClass, onStartConsultation }: EncounterHeaderProps) {
  if (!encounter) return null;

  const statusActions: Record<EncounterStatus, { label: string; icon: React.ElementType; next: EncounterStatus }[]> = {
    WAITING:           [{ label: "Start Triage",        icon: Stethoscope, next: "IN_TRIAGE" }],
    IN_TRIAGE:         [{ label: "Complete Triage",     icon: Check,       next: "TRIAGED" }],
    TRIAGED:           [{ label: "Start Consultation",  icon: Play,        next: "IN_CONSULTATION" }],
    IN_CONSULTATION: [
      { label: "Move to Surgery",      icon: Stethoscope, next: "IN_SURGERY" },
      { label: "Discharge",            icon: X,           next: "DISCHARGED" },
    ],
    IN_PROCEDURE:      [{ label: "Complete Procedure",  icon: Check,       next: "DISCHARGED" }],
    IN_SURGERY:        [{ label: "Move to Recovery",    icon: Check,       next: "RECOVERY" }],
    RECOVERY:          [{ label: "Discharge",           icon: X,           next: "DISCHARGED" }],
    IN_FOLLOW_UP:      [{ label: "Complete Follow-Up",  icon: Check,       next: "DISCHARGED" }],
    IN_HOSPITAL_ROUND: [{ label: "Discharge",           icon: X,           next: "DISCHARGED" }],
    DISCHARGED:        [],
  };

  const primaryAction = statusActions[encounter.status as EncounterStatus]?.[0];

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-3">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono text-muted-foreground">{encounter.id}</span>
        </div>
        <div className="flex items-center gap-3">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{encounter.reason}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Started at {new Date(encounter.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={onStatusChipClass(encounter.status)}>{encounter.status}</Badge>
          {primaryAction && (
            <Button size="sm" className="h-8" onClick={() => {
              onStatusChange(primaryAction.next);
              if (primaryAction.next === "IN_CONSULTATION") onStartConsultation?.();
            }}>
              <primaryAction.icon className="h-4 w-4 mr-2" />
              {primaryAction.label}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(statusActions[encounter.status as EncounterStatus] ?? []).map((action) => (
                <DropdownMenuItem key={action.label} onClick={() => {
                  onStatusChange(action.next);
                  if (action.next === "IN_CONSULTATION") onStartConsultation?.();
                }}>
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

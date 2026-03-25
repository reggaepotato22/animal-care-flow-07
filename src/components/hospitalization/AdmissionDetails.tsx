import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Stethoscope, MapPin, Edit, Check, X, Scissors, ChevronRight, AlertTriangle, Bed } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  advanceSurgeryStage, broadcastHospUpdate, saveHospRecord,
  SURGERY_STAGE_LABELS, SURGERY_STAGE_ORDER,
  type HospRecord, type SurgeryStage,
} from "@/lib/hospitalizationStore";

type HospitalizationRecord = HospRecord;

interface AdmissionDetailsProps {
  record: HospitalizationRecord;
}

const STATUS_STAGE_OPTIONS = [
  { value: "admitted",     label: "Admitted"      },
  { value: "critical",     label: "Critical"      },
  { value: "surgery_prep", label: "Surgery Prep"  },
  { value: "in_surgery",   label: "In Surgery"    },
  { value: "recovery",     label: "Recovery"      },
  { value: "in_ward",      label: "In Ward"       },
  { value: "discharged",   label: "Discharged"    },
] as const;

export function AdmissionDetails({ record }: AdmissionDetailsProps) {
  const { toast } = useToast();

  const [localRecord, setLocalRecord] = useState<HospRecord>(record);
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [editedReason, setEditedReason] = useState(record.reason);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [editedAssignment, setEditedAssignment] = useState({
    attendingVet: record.attendingVet,
    ward: record.ward,
    kennelNumber: `K-${record.id.slice(-2)}`,
  });
  const [stageNote, setStageNote] = useState("");
  const [stageBy, setStageBy]   = useState("");

  const currentStageIdx = localRecord.surgeryStage
    ? SURGERY_STAGE_ORDER.indexOf(localRecord.surgeryStage)
    : -1;

  const handleAdvanceStage = (stage: SurgeryStage) => {
    const updated = advanceSurgeryStage(localRecord.id, stage, stageBy || undefined, stageNote || undefined);
    if (updated) {
      setLocalRecord(updated);
      broadcastHospUpdate();
      toast({
        title: `Stage updated: ${SURGERY_STAGE_LABELS[stage].label}`,
        description: SURGERY_STAGE_LABELS[stage].description,
      });
      setStageNote("");
    }
  };

  const handleInitiateSurgery = () => handleAdvanceStage("AWAITING_SURGERY");

  const handleSaveReason = () => {
    const updated = { ...localRecord, reason: editedReason, updatedAt: new Date().toISOString() };
    saveHospRecord(updated);
    broadcastHospUpdate();
    setLocalRecord(updated);
    setIsEditingReason(false);
    toast({ title: "Reason updated" });
  };

  const handleSaveAssignment = () => {
    const updated = {
      ...localRecord,
      attendingVet: editedAssignment.attendingVet,
      ward: editedAssignment.ward,
      updatedAt: new Date().toISOString(),
    };
    saveHospRecord(updated);
    broadcastHospUpdate();
    setLocalRecord(updated);
    setIsEditingAssignment(false);
    toast({ title: "Assignment updated" });
  };

  return (
    <div className="space-y-6">
      {/* ── Surgery Stage Pipeline ── */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scissors className="h-4 w-4 text-red-500" />
            Surgery & Treatment Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stage progress track */}
          <div className="flex items-start gap-1 overflow-x-auto pb-2">
            {SURGERY_STAGE_ORDER.map((stage, idx) => {
              const cfg       = SURGERY_STAGE_LABELS[stage];
              const isActive  = localRecord.surgeryStage === stage;
              const isDone    = currentStageIdx > idx;
              const isNext    = currentStageIdx + 1 === idx || (currentStageIdx === -1 && idx === 0);
              return (
                <div key={stage} className="flex items-center shrink-0">
                  <div className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-center min-w-[90px] border transition-all
                    ${isActive  ? "border-primary bg-primary/10 shadow-sm"  :
                      isDone    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" :
                      isNext    ? "border-dashed border-muted-foreground/40 bg-muted/20 cursor-pointer hover:bg-accent" :
                      "border-border bg-muted/10 opacity-50"}`}
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wide leading-tight
                      ${isActive ? "text-primary" : isDone ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {cfg.label}
                    </span>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse mt-0.5" />}
                    {isDone    && <Check className="h-3 w-3 text-emerald-600 mt-0.5" />}
                    {isNext && !isActive && !isDone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 text-[10px] px-1 mt-0.5"
                        onClick={() => handleAdvanceStage(stage)}
                      >
                        Set
                      </Button>
                    )}
                  </div>
                  {idx < SURGERY_STAGE_ORDER.length - 1 && (
                    <ChevronRight className={`h-4 w-4 mx-0.5 shrink-0 ${isDone ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick-set any stage + optional note */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Set stage directly</Label>
              <Select onValueChange={(v) => handleAdvanceStage(v as SurgeryStage)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Jump to stage…" />
                </SelectTrigger>
                <SelectContent>
                  {SURGERY_STAGE_ORDER.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{SURGERY_STAGE_LABELS[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Updated by</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Dr. name…"
                value={stageBy}
                onChange={e => setStageBy(e.target.value)}
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-xs">Stage note (optional)</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Pre-op checklist complete, patient fasted…"
                value={stageNote}
                onChange={e => setStageNote(e.target.value)}
              />
            </div>
          </div>

          {/* Stage history */}
          {localRecord.stageHistory && localRecord.stageHistory.length > 0 && (
            <div className="border-t pt-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Stage History</p>
              {[...localRecord.stageHistory].reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 text-[10px] tabular-nums">
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                  <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                    {SURGERY_STAGE_LABELS[h.stage as SurgeryStage]?.label ?? h.stage}
                  </Badge>
                  {h.by   && <span className="shrink-0">by {h.by}</span>}
                  {h.note && <span className="italic truncate">— {h.note}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Initiate surgery button if not yet started */}
          {!localRecord.surgeryStage && (
            <div className="flex gap-2 pt-1 border-t">
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={handleInitiateSurgery}
              >
                <Scissors className="h-3.5 w-3.5" />
                Mark as Awaiting Surgery
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => handleAdvanceStage("POST_SURGERY_RECOVERY")}
              >
                <Bed className="h-3.5 w-3.5" />
                Place in Recovery
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Info grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Pet Name</label>
                <p className="font-medium text-sm">{localRecord.petName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Owner</label>
                <p className="text-sm">{localRecord.patientName}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Species / Breed</label>
                <p className="text-sm">{localRecord.species}</p>
              </div>
              {localRecord.priority && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <p className="text-sm capitalize">{localRecord.priority}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admission Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Admission Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date</label>
                <p className="font-medium text-sm">{new Date(localRecord.admissionDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Time</label>
                <p className="font-medium text-sm">{localRecord.admissionTime}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Days in Hospital</label>
                <p className="font-medium text-sm">{localRecord.daysStay} days</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(localRecord.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reason for Hospitalization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Stethoscope className="h-4 w-4" />
              Reason for Hospitalization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingReason ? (
              <div className="space-y-3">
                <Textarea
                  value={editedReason}
                  onChange={e => setEditedReason(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveReason} size="sm"><Check className="h-3.5 w-3.5 mr-1" />Save</Button>
                  <Button onClick={() => { setEditedReason(localRecord.reason); setIsEditingReason(false); }} variant="outline" size="sm"><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">{editedReason}</p>
                <Button onClick={() => setIsEditingReason(true)} variant="outline" size="sm">
                  <Edit className="h-3.5 w-3.5 mr-1" />Edit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Assignment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditingAssignment ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Attending Veterinarian</Label>
                  <Input
                    className="h-8 text-sm"
                    value={editedAssignment.attendingVet}
                    onChange={e => setEditedAssignment({ ...editedAssignment, attendingVet: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ward / Room</Label>
                  <Input
                    className="h-8 text-sm"
                    value={editedAssignment.ward}
                    onChange={e => setEditedAssignment({ ...editedAssignment, ward: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kennel Number</Label>
                  <Input
                    className="h-8 text-sm"
                    value={editedAssignment.kennelNumber}
                    onChange={e => setEditedAssignment({ ...editedAssignment, kennelNumber: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveAssignment} size="sm"><Check className="h-3.5 w-3.5 mr-1" />Save</Button>
                  <Button onClick={() => setIsEditingAssignment(false)} variant="outline" size="sm"><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Attending Vet</label>
                    <p className="font-medium text-sm">{editedAssignment.attendingVet}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Ward / Room</label>
                    <p className="font-medium text-sm">{editedAssignment.ward}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Kennel</label>
                    <p className="font-medium text-sm">{editedAssignment.kennelNumber}</p>
                  </div>
                </div>
                <Button onClick={() => setIsEditingAssignment(true)} variant="outline" size="sm">
                  <Edit className="h-3.5 w-3.5 mr-1" />Change Assignment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
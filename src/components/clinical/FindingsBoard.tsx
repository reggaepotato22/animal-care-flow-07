import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Check, X, Scissors, Bed, FlaskConical,
  Eye, AlertTriangle, ChevronRight, HelpCircle, Trash2,
} from "lucide-react";
import { AdmissionRequestDialog } from "@/components/AdmissionRequestDialog";
import type { ClinicalFinding, FindingStatus, FindingNextStep } from "@/pages/NewRecord";

// ── Constants ────────────────────────────────────────────────────────────────

const FINDING_SOURCES = [
  "Physical Exam",
  "Lab Work",
  "Imaging (X-Ray)",
  "Imaging (Ultrasound)",
  "Imaging (CT/MRI)",
  "Blood Work",
  "Urinalysis",
  "Cytology",
  "Biopsy / Histopathology",
  "ECG",
  "Owner History",
  "Observation",
  "Other",
];

const NEXT_STEP_OPTIONS: { value: FindingNextStep; label: string; icon: React.ElementType; color: string }[] = [
  { value: "surgery",       label: "Schedule Surgery",       icon: Scissors,    color: "text-red-600"    },
  { value: "hospitalize",   label: "Hospitalize Patient",    icon: Bed,         color: "text-orange-600" },
  { value: "further_tests", label: "Order Further Tests",    icon: FlaskConical,color: "text-blue-600"   },
  { value: "medication",    label: "Start Medication",       icon: Plus,        color: "text-purple-600" },
  { value: "monitoring",    label: "Continue Monitoring",    icon: Eye,         color: "text-cyan-600"   },
  { value: "discharge",     label: "Discharge Patient",      icon: Check,       color: "text-green-600"  },
  { value: "",              label: "No action yet",          icon: HelpCircle,  color: "text-muted-foreground" },
];

const STATUS_CFG: Record<FindingStatus, { label: string; badge: string }> = {
  tentative:  { label: "Tentative",  badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200" },
  confirmed:  { label: "Confirmed",  badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200" },
  ruled_out:  { label: "Ruled Out",  badge: "bg-muted/40 text-muted-foreground line-through" },
};

// ── Props ────────────────────────────────────────────────────────────────────

interface FindingsBoardProps {
  noteId: string;
  findings: ClinicalFinding[];
  onAdd:      (noteId: string, finding: string, source: string) => void;
  onConfirm:  (noteId: string, id: string, by: string, note: string, nextStep: FindingNextStep) => void;
  onRuleOut:  (noteId: string, id: string) => void;
  onRemove:   (noteId: string, id: string) => void;
  patientData: {
    patientId: string;
    patientName: string;
    petName: string;
    species: string;
    veterinarian: string;
    diagnosis: string;
  };
  onEncounterStatusChange?: (status: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function FindingsBoard({
  noteId, findings, onAdd, onConfirm, onRuleOut, onRemove,
  patientData, onEncounterStatusChange,
}: FindingsBoardProps) {
  // Add finding form
  const [newFinding,  setNewFinding]  = useState("");
  const [newSource,   setNewSource]   = useState("Physical Exam");

  // Confirm dialog
  const [confirmTarget, setConfirmTarget] = useState<ClinicalFinding | null>(null);
  const [confirmBy,     setConfirmBy]     = useState("");
  const [confirmNote,   setConfirmNote]   = useState("");
  const [nextStep,      setNextStep]      = useState<FindingNextStep>("");

  const tentative = findings.filter(f => f.status === "tentative");
  const confirmed = findings.filter(f => f.status === "confirmed");
  const ruledOut  = findings.filter(f => f.status === "ruled_out");

  const handleAdd = () => {
    if (!newFinding.trim()) return;
    onAdd(noteId, newFinding.trim(), newSource);
    setNewFinding("");
  };

  const handleConfirmSubmit = () => {
    if (!confirmTarget) return;
    onConfirm(noteId, confirmTarget.id, confirmBy, confirmNote, nextStep);

    // Trigger encounter / next-step side effects
    if (nextStep === "surgery" || nextStep === "hospitalize") {
      onEncounterStatusChange?.("IN_SURGERY");
    }

    setConfirmTarget(null);
    setConfirmBy("");
    setConfirmNote("");
    setNextStep("");
  };

  return (
    <div className="space-y-4">
      {/* ── Add finding row ── */}
      <div className="flex flex-col sm:flex-row gap-2 p-3 border rounded-lg bg-muted/10">
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <Label className="text-xs font-medium">New Finding</Label>
          <Input
            className="h-8 text-sm"
            placeholder="e.g., Enlarged lymph nodes, elevated ALT, fluid on X-ray…"
            value={newFinding}
            onChange={e => setNewFinding(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs font-medium">Source / Method</Label>
          <Select value={newSource} onValueChange={setNewSource}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINDING_SOURCES.map(s => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button size="sm" className="h-8 gap-1.5 text-xs whitespace-nowrap" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add Finding
          </Button>
        </div>
      </div>

      {/* ── Two-column board ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Tentative column */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <HelpCircle className="h-3.5 w-3.5" />
              Tentative Findings
              {tentative.length > 0 && (
                <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1.5 border-amber-400 text-amber-600">
                  {tentative.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {tentative.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3 italic">No tentative findings yet.</p>
            )}
            {tentative.map(f => (
              <div key={f.id} className="border rounded-lg p-2.5 bg-amber-50/40 dark:bg-amber-950/20 space-y-1.5">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{f.finding}</p>
                    <p className="text-[10px] text-muted-foreground">{f.source} · {new Date(f.addedAt).toLocaleString()}</p>
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => onRemove(noteId, f.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="h-6 text-[10px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => { setConfirmTarget(f); setNextStep(""); }}
                  >
                    <Check className="h-3 w-3" />
                    Confirm
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-6 text-[10px] px-2 gap-1 border-muted-foreground/30"
                    onClick={() => onRuleOut(noteId, f.id)}
                  >
                    <X className="h-3 w-3" />
                    Rule Out
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Confirmed column */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <Check className="h-3.5 w-3.5" />
              Confirmed Findings
              {confirmed.length > 0 && (
                <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1.5 border-emerald-400 text-emerald-600">
                  {confirmed.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {confirmed.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3 italic">No confirmed findings yet.</p>
            )}
            {confirmed.map(f => {
              const ns = NEXT_STEP_OPTIONS.find(o => o.value === (f.nextStep ?? ""));
              const NsIcon = ns?.icon ?? HelpCircle;
              return (
                <div key={f.id} className="border rounded-lg p-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{f.finding}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.source}
                        {f.confirmedBy && ` · Confirmed by ${f.confirmedBy}`}
                        {f.confirmedAt && ` · ${new Date(f.confirmedAt).toLocaleString()}`}
                      </p>
                      {f.confirmationNote && (
                        <p className="text-[10px] italic text-muted-foreground mt-0.5">"{f.confirmationNote}"</p>
                      )}
                    </div>
                    <Button
                      size="sm" variant="ghost"
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => onRemove(noteId, f.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Next step action button */}
                  {f.nextStep && f.nextStep !== "" ? (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">Next step:</span>
                      {(f.nextStep === "surgery" || f.nextStep === "hospitalize") ? (
                        <AdmissionRequestDialog patientData={patientData}>
                          <Button
                            size="sm" variant="outline"
                            className={`h-5 text-[10px] px-2 gap-1 ${ns?.color}`}
                          >
                            <NsIcon className="h-3 w-3" />
                            {ns?.label}
                          </Button>
                        </AdmissionRequestDialog>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${ns?.color}`}>
                          <NsIcon className="h-3 w-3" />
                          {ns?.label}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Ruled out (collapsed) */}
      {ruledOut.length > 0 && (
        <div className="border rounded-lg px-3 py-2 bg-muted/10">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
            Ruled Out ({ruledOut.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ruledOut.map(f => (
              <span key={f.id} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground line-through bg-muted/30 rounded px-2 py-0.5">
                {f.finding}
                <button className="ml-1 hover:text-destructive" onClick={() => onRemove(noteId, f.id)}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Confirm Finding Dialog ── */}
      <Dialog open={!!confirmTarget} onOpenChange={open => !open && setConfirmTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Check className="h-4 w-4" />
              Confirm Finding
            </DialogTitle>
          </DialogHeader>

          {confirmTarget && (
            <div className="space-y-4 py-1">
              <div className="rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                <p className="text-sm font-semibold">{confirmTarget.finding}</p>
                <p className="text-xs text-muted-foreground">{confirmTarget.source}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Confirmed by (optional)</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="Dr. name or test reference…"
                  value={confirmBy}
                  onChange={e => setConfirmBy(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Confirmation note / evidence</Label>
                <Textarea
                  className="text-xs min-h-[70px]"
                  placeholder="e.g., ALT 320 U/L (ref 10–100), abdominal ultrasound confirms hepatomegaly…"
                  value={confirmNote}
                  onChange={e => setConfirmNote(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Recommended Next Step</Label>
                <div className="grid grid-cols-2 gap-2">
                  {NEXT_STEP_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNextStep(opt.value)}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs text-left transition-all
                          ${nextStep === opt.value
                            ? "border-primary bg-primary/10 font-semibold"
                            : "border-border hover:border-muted-foreground/40"
                          }`}
                      >
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${opt.color}`} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(nextStep === "surgery" || nextStep === "hospitalize") && (
                <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <p>Confirming will flag this patient for <strong>{nextStep === "surgery" ? "surgical intervention" : "hospitalization"}</strong>. An admission request dialog will open so you can complete the details.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmTarget(null)}>Cancel</Button>
            {(nextStep === "surgery" || nextStep === "hospitalize") && confirmTarget ? (
              <AdmissionRequestDialog patientData={patientData}>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" onClick={handleConfirmSubmit}>
                  <Check className="h-3.5 w-3.5" />
                  Confirm &amp; Admit
                </Button>
              </AdmissionRequestDialog>
            ) : (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" onClick={handleConfirmSubmit}>
                <Check className="h-3.5 w-3.5" />
                Confirm Finding
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

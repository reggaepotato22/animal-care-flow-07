import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, User, Calendar, TrendingUp, Thermometer, Heart, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  addProgressNote, hasTodayProgressNote,
  type HospRecord, type ProgressNote,
} from "@/lib/hospitalizationStore";

interface ProgressNotesProps {
  record: HospRecord;
  onNoteAdded?: () => void;
}

const EMPTY_NOTE = {
  veterinarian: "",
  temperature: "",
  bloodPressure: "",
  heartRate: "",
  respiratoryRate: "",
  weight: "",
  painScore: 0,
  assessment: "",
  plan: "",
  modifications: "",
  nextReview: "",
  condition: "stable" as "improving" | "stable" | "declining",
};

export function ProgressNotes({ record, onNoteAdded }: ProgressNotesProps) {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const notes: ProgressNote[] = record.progressNotes ?? [];
  const todayHasNote = hasTodayProgressNote(record.id);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState(EMPTY_NOTE);

  const handleAddNote = () => {
    const { veterinarian, temperature, bloodPressure, heartRate, respiratoryRate, assessment, plan, nextReview } = newNote;
    if (!veterinarian || !temperature || !bloodPressure || !heartRate || !respiratoryRate || !assessment || !plan || !nextReview) {
      toast({
        title: "Missing required vitals",
        description: "Temperature, BP, Heart Rate, Respiratory Rate, Assessment, Plan and Next Review are all required.",
        variant: "destructive",
      });
      return;
    }
    const now = new Date();
    const note: ProgressNote = {
      id: `PN-${Date.now()}`,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      veterinarian,
      temperature,
      bloodPressure,
      heartRate,
      respiratoryRate,
      weight: newNote.weight || undefined,
      painScore: newNote.painScore,
      assessment,
      plan,
      modifications: newNote.modifications ? newNote.modifications.split("\n").filter(m => m.trim()) : [],
      nextReview,
      condition: newNote.condition,
    };
    addProgressNote(record.id, note);
    setNewNote(EMPTY_NOTE);
    setIsAddNoteOpen(false);
    onNoteAdded?.();
    toast({ title: "Progress note saved", description: `Vitals recorded — prescriptions now unlocked for today.` });
    // Notify Nurse/Attendant that a progress note has been submitted
    addNotification({
      type: "info",
      message: `Progress note added for ${record.petName} (${record.patientName}) by ${note.veterinarian} — wellness check due.`,
      patientId: record.patientId,
      patientName: record.petName,
      step: "IN_HOSPITAL_ROUND",
      targetRoles: ["Nurse", "SuperAdmin"],
    });
  };

  const conditionCls = (c: string) => {
    if (c === "improving") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200";
    if (c === "declining") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200";
  };

  const conditionIcon = (c: string) => c === "improving"
    ? <TrendingUp className="h-3.5 w-3.5" />
    : c === "declining"
    ? <TrendingUp className="h-3.5 w-3.5 rotate-180" />
    : <Activity className="h-3.5 w-3.5" />;

  const painColor = (p: number) =>
    p <= 2 ? "text-emerald-600" : p <= 5 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">Daily Progress Notes</h3>
          {todayHasNote ? (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Today complete
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400 gap-1">
              <AlertTriangle className="h-3 w-3" /> Note required today
            </Badge>
          )}
        </div>

        <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="touch-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Progress Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>Daily Progress Note — {record.petName}</DialogTitle>
              <DialogDescription>
                Mandatory vitals must be recorded before medications can be prescribed today.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 max-h-[68vh] overflow-y-auto pr-1">
              {/* Vitals section */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-primary" /> Vital Signs <span className="text-destructive">*</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="temperature">Temperature (°C) *</Label>
                    <Input id="temperature" placeholder="e.g. 38.5" value={newNote.temperature}
                      onChange={e => setNewNote({ ...newNote, temperature: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bp">Blood Pressure (mmHg) *</Label>
                    <Input id="bp" placeholder="e.g. 120/80" value={newNote.bloodPressure}
                      onChange={e => setNewNote({ ...newNote, bloodPressure: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hr">Heart Rate (bpm) *</Label>
                    <Input id="hr" placeholder="e.g. 78" value={newNote.heartRate}
                      onChange={e => setNewNote({ ...newNote, heartRate: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rr">Respiratory Rate (rpm) *</Label>
                    <Input id="rr" placeholder="e.g. 20" value={newNote.respiratoryRate}
                      onChange={e => setNewNote({ ...newNote, respiratoryRate: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" placeholder="optional" value={newNote.weight}
                      onChange={e => setNewNote({ ...newNote, weight: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Pain Score (0–10)</Label>
                    <div className="flex items-center gap-2">
                      <Input type="range" min={0} max={10} value={newNote.painScore}
                        onChange={e => setNewNote({ ...newNote, painScore: Number(e.target.value) })}
                        className="flex-1 h-2" />
                      <span className={`text-lg font-bold w-6 text-center ${painColor(newNote.painScore)}`}>{newNote.painScore}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinician & condition */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="vet">Veterinarian *</Label>
                  <Input id="vet" placeholder="Dr. Smith" value={newNote.veterinarian}
                    onChange={e => setNewNote({ ...newNote, veterinarian: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Overall Condition *</Label>
                  <Select value={newNote.condition}
                    onValueChange={v => setNewNote({ ...newNote, condition: v as "improving" | "stable" | "declining" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="improving">Improving</SelectItem>
                      <SelectItem value="stable">Stable</SelectItem>
                      <SelectItem value="declining">Declining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="assessment">Assessment *</Label>
                <Textarea id="assessment" placeholder="Clinical observations, response to treatment..."
                  className="min-h-[80px]" value={newNote.assessment}
                  onChange={e => setNewNote({ ...newNote, assessment: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="plan">Plan *</Label>
                <Textarea id="plan" placeholder="Treatment plan, next steps..."
                  className="min-h-[80px]" value={newNote.plan}
                  onChange={e => setNewNote({ ...newNote, plan: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mods">Treatment Modifications (one per line)</Label>
                <Textarea id="mods" placeholder="e.g. Reduced Tramadol q6h → q8h"
                  className="min-h-[60px]" value={newNote.modifications}
                  onChange={e => setNewNote({ ...newNote, modifications: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nextReview">Next Review *</Label>
                <Input id="nextReview" type="datetime-local" value={newNote.nextReview}
                  onChange={e => setNewNote({ ...newNote, nextReview: e.target.value })} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>Cancel</Button>
              <Button onClick={handleAddNote}>Save Progress Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Note list */}
      {notes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Thermometer className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No progress notes yet</p>
            <p className="text-xs mt-1">Add today's progress note to unlock prescription capability</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note, i) => (
            <Card key={note.id} className={i === 0 ? "ring-2 ring-primary/20 shadow-md" : "shadow-sm"}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">{new Date(note.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="text-muted-foreground text-sm">at {note.time}</span>
                      {i === 0 && <Badge variant="outline" className="text-[10px]">Latest</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{note.veterinarian}</span>
                    </div>
                  </div>
                  <Badge className={`${conditionCls(note.condition)} gap-1`}>
                    {conditionIcon(note.condition)}
                    {note.condition.charAt(0).toUpperCase() + note.condition.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* Vitals strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { icon: Thermometer, label: "Temp", value: `${note.temperature} °C`, color: "text-orange-600" },
                    { icon: Heart, label: "HR", value: `${note.heartRate} bpm`, color: "text-red-500" },
                    { icon: Activity, label: "BP", value: note.bloodPressure, color: "text-blue-600" },
                    { icon: Activity, label: "RR", value: `${note.respiratoryRate} rpm`, color: "text-teal-600" },
                  ].map(v => (
                    <div key={v.label} className="rounded-lg bg-muted/40 px-3 py-2 flex items-center gap-2">
                      <v.icon className={`h-4 w-4 shrink-0 ${v.color}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{v.label}</p>
                        <p className="text-sm font-semibold truncate">{v.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {note.painScore !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Pain Score:</span>
                    <span className={`font-bold text-base ${painColor(note.painScore)}`}>{note.painScore}/10</span>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Assessment</p>
                  <p className="text-sm leading-relaxed">{note.assessment}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Plan</p>
                  <p className="text-sm leading-relaxed">{note.plan}</p>
                </div>
                {note.modifications.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Modifications</p>
                    <ul className="space-y-1">
                      {note.modifications.map((m, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="border-t pt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Next review:</span>
                  <span className="font-medium">{new Date(note.nextReview).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
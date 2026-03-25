import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Utensils, Check, Bell, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  addFeedingEntry, completeFeedingEntry, broadcastHospUpdate,
  type HospRecord, type FeedingEntry,
} from "@/lib/hospitalizationStore";

// ── Feeding templates ────────────────────────────────────────────────────────

const FEEDING_TEMPLATES = [
  {
    label: "Standard Dog — Post-Op",
    foodType: "Hill's i/d Digestive Care (wet)",
    amount: "1/2 cup",
    times: ["07:00", "13:00", "19:00"],
    notes: "Small portions. Monitor appetite. No dry food for 48h post-op.",
  },
  {
    label: "Standard Cat — Recovery",
    foodType: "Royal Canin Recovery (wet)",
    amount: "2 tablespoons",
    times: ["07:00", "13:00", "19:00"],
    notes: "Warm food to body temp. Hand-feed if appetite is low.",
  },
  {
    label: "Critical / ICU Patient",
    foodType: "Syringe feeding — Liquid diet",
    amount: "10 ml per feed",
    times: ["06:00", "10:00", "14:00", "18:00", "22:00"],
    notes: "Monitor swallow reflex before feeding. Record intake accurately.",
  },
  {
    label: "Post-Dental — Soft Diet",
    foodType: "Purina EN Gastroenteric (wet / mashed)",
    amount: "3/4 cup",
    times: ["08:00", "18:00"],
    notes: "No hard kibble for 7 days. Check oral cavity before each feed.",
  },
  {
    label: "Diabetic Patient",
    foodType: "Hill's m/d Glucose Management",
    amount: "measured per body weight",
    times: ["07:30", "19:30"],
    notes: "Feed immediately before or after insulin injection. Consistent timing is critical.",
  },
];

interface FeedingScheduleProps {
  record: HospRecord;
}

export function FeedingSchedule({ record }: FeedingScheduleProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<FeedingEntry[]>(record.feedingSchedule ?? []);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const [newEntry, setNewEntry] = useState({
    time: "08:00",
    foodType: "",
    amount: "",
    givenBy: "",
    notes: "",
  });

  const applyTemplate = (templateLabel: string) => {
    const tpl = FEEDING_TEMPLATES.find(t => t.label === templateLabel);
    if (!tpl) return;
    setSelectedTemplate(templateLabel);
    setNewEntry(prev => ({
      ...prev,
      foodType: tpl.foodType,
      amount:   tpl.amount,
      notes:    tpl.notes,
    }));
    // Pre-fill time with first slot from template
    if (tpl.times.length > 0) setNewEntry(prev => ({ ...prev, time: tpl.times[0] }));
  };

  const handleAddTemplate = () => {
    const tpl = FEEDING_TEMPLATES.find(t => t.label === selectedTemplate);
    if (!tpl) return;
    const newEntries: FeedingEntry[] = tpl.times.map((time, i) => ({
      id:        `feed-${Date.now()}-${i}`,
      time,
      foodType:  tpl.foodType,
      amount:    tpl.amount,
      notes:     tpl.notes,
      completed: false,
    }));
    newEntries.forEach(e => addFeedingEntry(record.id, e));
    broadcastHospUpdate();
    setEntries(prev => [...prev, ...newEntries]);
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type:        "info",
        message:     `Feeding schedule set for ${record.petName} (${tpl.label})`,
        patientId:   record.patientId,
        patientName: record.petName,
        targetRoles: ["SuperAdmin", "Nurse", "Vet"],
      },
    }));
    toast({ title: "Feeding schedule added", description: `${tpl.times.length} feeding times from template "${tpl.label}"` });
    setSelectedTemplate("");
    setIsAddOpen(false);
  };

  const handleAddManual = () => {
    if (!newEntry.foodType || !newEntry.amount) {
      toast({ title: "Missing info", description: "Food type and amount are required.", variant: "destructive" });
      return;
    }
    const entry: FeedingEntry = {
      id:        `feed-${Date.now()}`,
      time:      newEntry.time,
      foodType:  newEntry.foodType,
      amount:    newEntry.amount,
      givenBy:   newEntry.givenBy || undefined,
      notes:     newEntry.notes  || undefined,
      completed: false,
    };
    addFeedingEntry(record.id, entry);
    broadcastHospUpdate();
    setEntries(prev => [...prev, entry].sort((a, b) => a.time.localeCompare(b.time)));
    toast({ title: "Feeding entry added" });
    setNewEntry({ time: "08:00", foodType: "", amount: "", givenBy: "", notes: "" });
    setIsAddOpen(false);
  };

  const handleMarkDone = (entryId: string) => {
    completeFeedingEntry(record.id, entryId);
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, completed: true, completedAt: new Date().toISOString() } : e));
    toast({ title: "Feeding marked complete" });
  };

  const sorted = [...entries].sort((a, b) => a.time.localeCompare(b.time));
  const pending   = sorted.filter(e => !e.completed);
  const completed = sorted.filter(e =>  e.completed);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Feeding Schedule & Reminders</h3>
          {pending.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-400 text-amber-600">
              {pending.length} pending
            </Badge>
          )}
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-7 text-xs">
              <Plus className="h-3.5 w-3.5" />Add Feeding
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Add Feeding Entry — {record.petName}
              </DialogTitle>
            </DialogHeader>

            {/* Template section */}
            <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Quick-load Template
              </Label>
              <Select value={selectedTemplate} onValueChange={applyTemplate}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Choose a feeding template…" />
                </SelectTrigger>
                <SelectContent>
                  {FEEDING_TEMPLATES.map(t => (
                    <SelectItem key={t.label} value={t.label} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <div className="text-xs text-muted-foreground bg-background rounded p-2 border space-y-1">
                  {FEEDING_TEMPLATES.find(t => t.label === selectedTemplate)?.times.map((tm, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{tm}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedTemplate && (
                <Button size="sm" className="w-full h-7 text-xs gap-1.5" onClick={handleAddTemplate}>
                  <Check className="h-3.5 w-3.5" />Apply Template (all times)
                </Button>
              )}
            </div>

            <div className="relative flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">or add manually</span>
              <div className="flex-1 border-t" />
            </div>

            {/* Manual entry */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Time *</Label>
                <Input type="time" className="h-8 text-xs" value={newEntry.time} onChange={e => setNewEntry(p => ({ ...p, time: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amount *</Label>
                <Input className="h-8 text-xs" placeholder="e.g. 1/2 cup" value={newEntry.amount} onChange={e => setNewEntry(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Food Type *</Label>
                <Input className="h-8 text-xs" placeholder="e.g. Hill's i/d wet food" value={newEntry.foodType} onChange={e => setNewEntry(p => ({ ...p, foodType: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Given By</Label>
                <Input className="h-8 text-xs" placeholder="Attendant name…" value={newEntry.givenBy} onChange={e => setNewEntry(p => ({ ...p, givenBy: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Notes / Instructions</Label>
                <Textarea className="text-xs min-h-[60px]" placeholder="Special instructions…" value={newEntry.notes} onChange={e => setNewEntry(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddManual}>Add Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending feeds */}
      {pending.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <Bell className="h-3.5 w-3.5 animate-pulse" />
              Pending Feedings ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {pending.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-2 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300 shrink-0">{e.time}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{e.foodType}</p>
                    <p className="text-[10px] text-muted-foreground">{e.amount}{e.notes ? ` — ${e.notes}` : ""}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 shrink-0 gap-1 border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleMarkDone(e.id)}
                >
                  <Check className="h-3 w-3" />Done
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed feeds */}
      {completed.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Completed ({completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1">
            {completed.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 opacity-70">
                <span className="font-mono text-xs shrink-0">{e.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate">{e.foodType} — {e.amount}</p>
                  {e.completedAt && (
                    <p className="text-[10px] text-muted-foreground">
                      Done at {new Date(e.completedAt).toLocaleTimeString()}
                      {e.givenBy ? ` by ${e.givenBy}` : ""}
                    </p>
                  )}
                </div>
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border-2 border-dashed rounded-xl">
          <Utensils className="h-8 w-8 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">No feeding schedule set</p>
            <p className="text-xs text-muted-foreground mt-0.5">Use a template or add a manual entry to start tracking feedings.</p>
          </div>
        </div>
      )}
    </div>
  );
}

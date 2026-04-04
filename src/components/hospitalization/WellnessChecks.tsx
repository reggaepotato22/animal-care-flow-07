import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, AlertTriangle, Droplets, Leaf, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  addWellnessCheck,
  type HospRecord, type WellnessCheck,
} from "@/lib/hospitalizationStore";

interface WellnessChecksProps {
  record: HospRecord;
  onCheckAdded?: () => void;
}

const EMPTY_CHECK: Omit<WellnessCheck, "id" | "timestamp"> = {
  recordedBy: "",
  shift: "morning",
  foodIntake: "partial",
  waterIntake: "normal",
  stoolOutput: "normal",
  urineOutput: "normal",
  behavior: "normal",
  notes: "",
};

const FOOD_COLORS: Record<string, string> = {
  none: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  full: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};
const WATER_COLORS: Record<string, string> = {
  none: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  reduced: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  normal: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  increased: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};
const STOOL_COLORS: Record<string, string> = {
  none: "bg-amber-100 text-amber-800",
  soft: "bg-yellow-100 text-yellow-800",
  normal: "bg-emerald-100 text-emerald-800",
  diarrhea: "bg-red-100 text-red-800",
  bloody: "bg-red-200 text-red-900 font-semibold",
};
const BEHAVIOR_COLORS: Record<string, string> = {
  normal: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  lethargic: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  agitated: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  restless: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const isConcerning = (check: WellnessCheck) =>
  check.foodIntake === "none" ||
  check.waterIntake === "none" ||
  check.stoolOutput === "bloody" ||
  check.stoolOutput === "diarrhea" ||
  check.behavior === "agitated";

export function WellnessChecks({ record, onCheckAdded }: WellnessChecksProps) {
  const { toast } = useToast();
  const checks: WellnessCheck[] = record.wellnessChecks
    ? [...record.wellnessChecks].reverse()
    : [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CHECK);

  const handleSave = () => {
    if (!form.recordedBy) {
      toast({ title: "Attendant name required", variant: "destructive" });
      return;
    }
    const check: WellnessCheck = {
      ...form,
      id: `WC-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    addWellnessCheck(record.id, check);
    setForm(EMPTY_CHECK);
    setOpen(false);
    onCheckAdded?.();
    toast({ title: "Wellness check logged", description: `${record.petName} — ${check.shift} shift recorded.` });
  };

  const shiftCls = (s: string) =>
    s === "morning" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
    : s === "afternoon" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
    : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Wellness Checks</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="touch-btn">
              <Plus className="h-4 w-4 mr-2" />
              Log Wellness Check
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Wellness Check — {record.petName}</DialogTitle>
              <DialogDescription>
                Record daily food, water, output, and behavior observations per vet orders.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Attendant Name *</Label>
                  <Input placeholder="Your name" value={form.recordedBy}
                    onChange={e => setForm({ ...form, recordedBy: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Shift</Label>
                  <Select value={form.shift} onValueChange={v => setForm({ ...form, shift: v as WellnessCheck["shift"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Intake */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Intake</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Food Intake</Label>
                    <Select value={form.foodIntake} onValueChange={v => setForm({ ...form, foodIntake: v as WellnessCheck["foodIntake"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Water Intake</Label>
                    <Select value={form.waterIntake} onValueChange={v => setForm({ ...form, waterIntake: v as WellnessCheck["waterIntake"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="reduced">Reduced</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="increased">Increased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Output */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Output</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Stool Output</Label>
                    <Select value={form.stoolOutput} onValueChange={v => setForm({ ...form, stoolOutput: v as WellnessCheck["stoolOutput"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="soft">Soft</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="diarrhea">Diarrhea</SelectItem>
                        <SelectItem value="bloody">Bloody ⚠</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Urine Output</Label>
                    <Select value={form.urineOutput} onValueChange={v => setForm({ ...form, urineOutput: v as WellnessCheck["urineOutput"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="reduced">Reduced</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="increased">Increased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Behavior</Label>
                <Select value={form.behavior} onValueChange={v => setForm({ ...form, behavior: v as WellnessCheck["behavior"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="lethargic">Lethargic</SelectItem>
                    <SelectItem value="agitated">Agitated</SelectItem>
                    <SelectItem value="restless">Restless</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Additional Notes</Label>
                <Textarea placeholder="Any observations not covered above..." className="min-h-[64px]"
                  value={form.notes ?? ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Check</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {checks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Droplets className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No wellness checks logged yet</p>
            <p className="text-xs mt-1">Log each shift: food, water, stool, urine, and behavior</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {checks.map(check => {
            const concerning = isConcerning(check);
            return (
              <Card key={check.id} className={concerning ? "border-destructive/40 bg-destructive/[0.03]" : "shadow-sm"}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={shiftCls(check.shift)}>
                          {check.shift.charAt(0).toUpperCase() + check.shift.slice(1)} shift
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(check.timestamp).toLocaleString("en-GB", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Recorded by: <span className="font-medium">{check.recordedBy}</span></p>
                    </div>
                    {concerning && (
                      <Badge variant="destructive" className="gap-1 shrink-0">
                        <AlertTriangle className="h-3 w-3" /> Concern
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-1 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="rounded-lg p-2 bg-muted/40">
                      <p className="text-muted-foreground mb-1">Food</p>
                      <Badge className={`${FOOD_COLORS[check.foodIntake]} text-[10px]`}>{check.foodIntake}</Badge>
                    </div>
                    <div className="rounded-lg p-2 bg-muted/40">
                      <p className="text-muted-foreground mb-1">Water</p>
                      <Badge className={`${WATER_COLORS[check.waterIntake]} text-[10px]`}>{check.waterIntake}</Badge>
                    </div>
                    <div className="rounded-lg p-2 bg-muted/40">
                      <p className="text-muted-foreground mb-1">Stool</p>
                      <Badge className={`${STOOL_COLORS[check.stoolOutput] ?? "bg-gray-100 text-gray-700"} text-[10px]`}>{check.stoolOutput}</Badge>
                    </div>
                    <div className="rounded-lg p-2 bg-muted/40">
                      <p className="text-muted-foreground mb-1">Behavior</p>
                      <Badge className={`${BEHAVIOR_COLORS[check.behavior] ?? "bg-gray-100 text-gray-700"} text-[10px]`}>{check.behavior}</Badge>
                    </div>
                  </div>
                  {check.notes && (
                    <p className="text-xs text-muted-foreground italic border-t pt-2">{check.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

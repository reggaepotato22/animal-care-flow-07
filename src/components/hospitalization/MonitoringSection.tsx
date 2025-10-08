import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Heart, Thermometer, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HospitalizationRecord {
  id: string;
  patientName: string;
  petName: string;
}

interface VitalSign {
  id: string;
  timestamp: string;
  temperature: number;
  pulse: number;
  respiration: number;
  weight: number;
  hydrationStatus: string;
  painScore: number;
  recordedBy: string;
}

interface NursingNote {
  id: string;
  timestamp: string;
  shift: string;
  nurse: string;
  category: string;
  note: string;
  priority: "normal" | "important" | "critical";
}

interface MonitoringSectionProps {
  record: HospitalizationRecord;
}

export function MonitoringSection({ record }: MonitoringSectionProps) {
  const { toast } = useToast();
  const [vitals, setVitals] = useState<VitalSign[]>([
    {
      id: "V001",
      timestamp: "2024-01-21 06:00",
      temperature: 101.2,
      pulse: 88,
      respiration: 24,
      weight: 32.5,
      hydrationStatus: "Well hydrated",
      painScore: 2,
      recordedBy: "Nurse Johnson"
    },
    {
      id: "V002",
      timestamp: "2024-01-21 14:00",
      temperature: 100.8,
      pulse: 92,
      respiration: 22,
      weight: 32.3,
      hydrationStatus: "Well hydrated",
      painScore: 1,
      recordedBy: "Nurse Williams"
    }
  ]);

  const [nursingNotes] = useState<NursingNote[]>([
    {
      id: "N001",
      timestamp: "2024-01-21 06:30",
      shift: "Day",
      nurse: "Nurse Johnson",
      category: "General",
      note: "Patient alert and responsive. Appetite good, ate 75% of breakfast. Wound site clean and dry. No signs of infection.",
      priority: "normal"
    },
    {
      id: "N002",
      timestamp: "2024-01-21 14:15",
      shift: "Day",
      nurse: "Nurse Williams",
      category: "Medication",
      note: "Administered Tramadol 2mg/kg PO. Patient tolerated well, no adverse reactions observed.",
      priority: "normal"
    },
    {
      id: "N003",
      timestamp: "2024-01-21 18:45",
      shift: "Evening",
      nurse: "Nurse Davis",
      category: "Behavior",
      note: "Patient restless, whining intermittently. Pain score increased to 3/10. Additional pain medication given per protocol.",
      priority: "important"
    }
  ]);

  const [isRecordVitalsOpen, setIsRecordVitalsOpen] = useState(false);
  const [newVitals, setNewVitals] = useState({
    temperature: "",
    pulse: "",
    respiration: "",
    weight: "",
    hydrationStatus: "Well hydrated",
    painScore: "",
    recordedBy: ""
  });

  const handleRecordVitals = () => {
    if (!newVitals.temperature || !newVitals.pulse || !newVitals.respiration || !newVitals.weight || !newVitals.painScore || !newVitals.recordedBy) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const vitalSign: VitalSign = {
      id: `V${String(vitals.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      temperature: parseFloat(newVitals.temperature),
      pulse: parseInt(newVitals.pulse),
      respiration: parseInt(newVitals.respiration),
      weight: parseFloat(newVitals.weight),
      hydrationStatus: newVitals.hydrationStatus,
      painScore: parseInt(newVitals.painScore),
      recordedBy: newVitals.recordedBy
    };

    setVitals([...vitals, vitalSign]);
    setNewVitals({
      temperature: "",
      pulse: "",
      respiration: "",
      weight: "",
      hydrationStatus: "Well hydrated",
      painScore: "",
      recordedBy: ""
    });
    setIsRecordVitalsOpen(false);
    toast({
      title: "Vitals recorded",
      description: "Vital signs have been recorded successfully."
    });
  };

  const getPainScoreColor = (score: number) => {
    if (score <= 2) return "bg-success/10 text-success border-success/20";
    if (score <= 5) return "bg-warning/10 text-warning border-warning/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-destructive/10 text-destructive border-destructive/20";
      case "important": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-info/10 text-info border-info/20";
    }
  };

  const getHydrationColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "well hydrated": return "bg-success/10 text-success border-success/20";
      case "mild dehydration": return "bg-warning/10 text-warning border-warning/20";
      case "moderate dehydration":
      case "severe dehydration": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <Tabs defaultValue="vitals" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
        <TabsTrigger value="nursing">Nursing Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="vitals">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Vital Signs Monitoring
              </CardTitle>
              <Dialog open={isRecordVitalsOpen} onOpenChange={setIsRecordVitalsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Vitals
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Record Vital Signs</DialogTitle>
                    <DialogDescription>
                      Record new vital signs for {record.petName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="temperature">Temperature (°F) *</Label>
                        <Input
                          id="temperature"
                          type="number"
                          step="0.1"
                          value={newVitals.temperature}
                          onChange={(e) => setNewVitals({...newVitals, temperature: e.target.value})}
                          placeholder="e.g., 101.2"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pulse">Pulse (bpm) *</Label>
                        <Input
                          id="pulse"
                          type="number"
                          value={newVitals.pulse}
                          onChange={(e) => setNewVitals({...newVitals, pulse: e.target.value})}
                          placeholder="e.g., 88"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="respiration">Respiration *</Label>
                        <Input
                          id="respiration"
                          type="number"
                          value={newVitals.respiration}
                          onChange={(e) => setNewVitals({...newVitals, respiration: e.target.value})}
                          placeholder="e.g., 24"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="weight">Weight (lbs) *</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          value={newVitals.weight}
                          onChange={(e) => setNewVitals({...newVitals, weight: e.target.value})}
                          placeholder="e.g., 32.5"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="hydration">Hydration Status</Label>
                        <Select value={newVitals.hydrationStatus} onValueChange={(value) => setNewVitals({...newVitals, hydrationStatus: value})}>
                          <SelectTrigger id="hydration">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Well hydrated">Well hydrated</SelectItem>
                            <SelectItem value="Mild dehydration">Mild dehydration</SelectItem>
                            <SelectItem value="Moderate dehydration">Moderate dehydration</SelectItem>
                            <SelectItem value="Severe dehydration">Severe dehydration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pain-score">Pain Score (0-10) *</Label>
                        <Input
                          id="pain-score"
                          type="number"
                          min="0"
                          max="10"
                          value={newVitals.painScore}
                          onChange={(e) => setNewVitals({...newVitals, painScore: e.target.value})}
                          placeholder="e.g., 2"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="recorded-by">Recorded By *</Label>
                      <Input
                        id="recorded-by"
                        value={newVitals.recordedBy}
                        onChange={(e) => setNewVitals({...newVitals, recordedBy: e.target.value})}
                        placeholder="e.g., Nurse Johnson"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRecordVitalsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRecordVitals}>Record Vitals</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Temp (°F)</TableHead>
                  <TableHead>Pulse</TableHead>
                  <TableHead>Respiration</TableHead>
                  <TableHead>Weight (lbs)</TableHead>
                  <TableHead>Hydration</TableHead>
                  <TableHead>Pain Score</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vitals.map((vital) => (
                  <TableRow key={vital.id}>
                    <TableCell className="font-medium">
                      {new Date(vital.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        {vital.temperature}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        {vital.pulse}
                      </div>
                    </TableCell>
                    <TableCell>{vital.respiration}</TableCell>
                    <TableCell>{vital.weight}</TableCell>
                    <TableCell>
                      <Badge className={getHydrationColor(vital.hydrationStatus)}>
                        {vital.hydrationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPainScoreColor(vital.painScore)}>
                        {vital.painScore}/10
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {vital.recordedBy}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="nursing">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nursing Notes
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nursingNotes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(note.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant="outline">{note.shift} Shift</Badge>
                      <Badge className={getPriorityColor(note.priority)}>
                        {note.priority}
                      </Badge>
                      <Badge variant="secondary">{note.category}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {note.nurse}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{note.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
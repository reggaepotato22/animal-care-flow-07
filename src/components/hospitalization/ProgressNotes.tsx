import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, User, Calendar, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HospitalizationRecord {
  id: string;
  patientName: string;
  petName: string;
}

interface ProgressNote {
  id: string;
  date: string;
  time: string;
  veterinarian: string;
  assessment: string;
  plan: string;
  modifications: string[];
  nextReview: string;
  condition: "improving" | "stable" | "declining";
}

interface ProgressNotesProps {
  record: HospitalizationRecord;
}

export function ProgressNotes({ record }: ProgressNotesProps) {
  const { toast } = useToast();
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([
    {
      id: "PN001",
      date: "2024-01-21",
      time: "08:30",
      veterinarian: "Dr. Smith",
      assessment: "Patient continues to recover well from surgery. Incision site appears clean with no signs of infection. Pain appears well controlled with current medication regimen. Appetite has improved significantly since yesterday.",
      plan: "Continue current pain management protocol. Monitor incision site q8h. Encourage mobility and appetite. Consider discharge planning if continues to improve.",
      modifications: [
        "Reduced Tramadol frequency from q6h to q8h",
        "Added physical therapy exercises"
      ],
      nextReview: "2024-01-21 20:00",
      condition: "improving"
    },
    {
      id: "PN002",
      date: "2024-01-20",
      time: "16:45",
      veterinarian: "Dr. Smith",
      assessment: "Post-operative day 1. Patient alert and responsive. Some discomfort noted, responding well to pain medication. Incision site clean and dry. No complications observed during initial recovery period.",
      plan: "Continue monitoring q4h overnight. Maintain current pain management. Start oral intake trial if patient shows interest in food.",
      modifications: [],
      nextReview: "2024-01-21 08:00",
      condition: "stable"
    }
  ]);

  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    veterinarian: "",
    assessment: "",
    plan: "",
    modifications: "",
    nextReview: "",
    condition: "stable" as "improving" | "stable" | "declining"
  });

  const handleAddNote = () => {
    if (!newNote.veterinarian || !newNote.assessment || !newNote.plan || !newNote.nextReview) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    const progressNote: ProgressNote = {
      id: `PN${String(progressNotes.length + 1).padStart(3, '0')}`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      veterinarian: newNote.veterinarian,
      assessment: newNote.assessment,
      plan: newNote.plan,
      modifications: newNote.modifications ? newNote.modifications.split('\n').filter(m => m.trim()) : [],
      nextReview: newNote.nextReview,
      condition: newNote.condition
    };

    setProgressNotes([progressNote, ...progressNotes]);
    setNewNote({
      veterinarian: "",
      assessment: "",
      plan: "",
      modifications: "",
      nextReview: "",
      condition: "stable"
    });
    setIsAddNoteOpen(false);
    toast({
      title: "Progress note added",
      description: "The progress note has been added successfully."
    });
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "improving": return "bg-success/10 text-success border-success/20";
      case "stable": return "bg-info/10 text-info border-info/20";
      case "declining": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case "improving": return <TrendingUp className="h-4 w-4" />;
      case "stable": return <div className="h-4 w-4 bg-current rounded-full" />;
      case "declining": return <TrendingUp className="h-4 w-4 rotate-180" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Daily Progress Notes</h3>
        <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Progress Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Progress Note</DialogTitle>
              <DialogDescription>
                Add a new progress note for {record.petName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="veterinarian">Veterinarian *</Label>
                <Input
                  id="veterinarian"
                  value={newNote.veterinarian}
                  onChange={(e) => setNewNote({...newNote, veterinarian: e.target.value})}
                  placeholder="e.g., Dr. Smith"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="condition">Patient Condition *</Label>
                <Select value={newNote.condition} onValueChange={(value: "improving" | "stable" | "declining") => setNewNote({...newNote, condition: value})}>
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improving">Improving</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="declining">Declining</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assessment">Assessment *</Label>
                <Textarea
                  id="assessment"
                  value={newNote.assessment}
                  onChange={(e) => setNewNote({...newNote, assessment: e.target.value})}
                  placeholder="Describe the patient's current condition, symptoms, and observations..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan">Plan *</Label>
                <Textarea
                  id="plan"
                  value={newNote.plan}
                  onChange={(e) => setNewNote({...newNote, plan: e.target.value})}
                  placeholder="Outline the treatment plan and next steps..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="modifications">Treatment Modifications (optional)</Label>
                <Textarea
                  id="modifications"
                  value={newNote.modifications}
                  onChange={(e) => setNewNote({...newNote, modifications: e.target.value})}
                  placeholder="List any changes to treatment (one per line)..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">Enter each modification on a new line</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextReview">Next Review Date & Time *</Label>
                <Input
                  id="nextReview"
                  type="datetime-local"
                  value={newNote.nextReview}
                  onChange={(e) => setNewNote({...newNote, nextReview: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNote}>Add Progress Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {progressNotes.map((note, index) => (
          <Card key={note.id} className={index === 0 ? "ring-2 ring-primary/20" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">
                      {new Date(note.date).toLocaleDateString()}
                    </span>
                    <span className="text-muted-foreground">at {note.time}</span>
                  </div>
                  {index === 0 && (
                    <Badge variant="outline" className="text-xs">
                      Latest
                    </Badge>
                  )}
                </div>
                  <Badge className={getConditionColor(note.condition)}>
                    <span className="flex items-center gap-1">
                      {getConditionIcon(note.condition)}
                      {note.condition}
                    </span>
                  </Badge>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{note.veterinarian}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assessment */}
              <div>
                <h4 className="font-medium mb-2 text-foreground">Assessment</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {note.assessment}
                </p>
              </div>

              {/* Plan */}
              <div>
                <h4 className="font-medium mb-2 text-foreground">Plan</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {note.plan}
                </p>
              </div>

              {/* Treatment Modifications */}
              {note.modifications.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-foreground">Treatment Modifications</h4>
                  <ul className="space-y-1">
                    {note.modifications.map((modification, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {modification}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Review */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next review scheduled:</span>
                  <span className="font-medium">
                    {new Date(note.nextReview).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Hospitalization Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-foreground">Total Days:</span>
              <p className="text-muted-foreground">2 days</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Overall Trend:</span>
              <div className="flex items-center gap-1">
                <Badge className={getConditionColor("improving")}>
                  <span className="flex items-center gap-1">
                    {getConditionIcon("improving")}
                    Improving
                  </span>
                </Badge>
              </div>
            </div>
            <div>
              <span className="font-medium text-foreground">Discharge Planning:</span>
              <p className="text-muted-foreground">Under consideration</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
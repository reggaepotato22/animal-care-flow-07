import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Skull, FileText, Syringe, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PostMortemRecord {
  id: string;
  reportId: string;
  patientName: string;
  petName: string;
  species: string;
  breed: string;
  dateOfDeath: string;
  timeOfDeath: string;
  examiningVeterinarian: string;
  causeOfDeath: string;
  mannerOfDeath: "natural" | "accidental" | "euthanasia" | "undetermined";
  bodyCondition: "very_poor" | "poor" | "fair" | "good" | "excellent";
  externalExamination: string;
  grossFindings: string;
  additionalTesting: string[];
  createdDate: string;
}

const mockPostMortemRecords: PostMortemRecord[] = [
  {
    id: "1",
    reportId: "PM024801",
    patientName: "Robert Johnson",
    petName: "Rex",
    species: "Dog",
    breed: "German Shepherd",
    dateOfDeath: "2024-01-15",
    timeOfDeath: "14:30",
    examiningVeterinarian: "Dr. Smith",
    causeOfDeath: "Acute heart failure secondary to dilated cardiomyopathy",
    mannerOfDeath: "natural",
    bodyCondition: "fair",
    externalExamination: "Adult male dog in fair body condition. No external trauma noted.",
    grossFindings: "Enlarged heart with thin ventricular walls, pulmonary edema present",
    additionalTesting: ["Histopathology"],
    createdDate: "2024-01-15"
  },
  {
    id: "2", 
    reportId: "PM024802",
    patientName: "Maria Garcia",
    petName: "Luna",
    species: "Cat",
    breed: "Persian",
    dateOfDeath: "2024-01-12",
    timeOfDeath: "09:15",
    examiningVeterinarian: "Dr. Brown",
    causeOfDeath: "Renal failure with uremia",
    mannerOfDeath: "euthanasia",
    bodyCondition: "poor",
    externalExamination: "Elderly female cat showing signs of chronic illness and weight loss.",
    grossFindings: "Kidneys small and fibrotic, pale appearance consistent with chronic kidney disease",
    additionalTesting: ["Histopathology", "Toxicology"],
    createdDate: "2024-01-12"
  },
  {
    id: "3",
    reportId: "PM024803", 
    patientName: "David Thompson",
    petName: "Buddy",
    species: "Dog",
    breed: "Labrador Retriever",
    dateOfDeath: "2024-01-10",
    timeOfDeath: "16:45",
    examiningVeterinarian: "Dr. Wilson",
    causeOfDeath: "Gastric dilatation-volvulus (bloat)",
    mannerOfDeath: "accidental",
    bodyCondition: "good",
    externalExamination: "Well-muscled adult male dog with distended abdomen.",
    grossFindings: "Stomach severely distended and rotated 180 degrees, spleen enlarged and congested",
    additionalTesting: [],
    createdDate: "2024-01-10"
  }
];

export default function PostmortemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const record = mockPostMortemRecords.find(r => r.id === id);

  if (!record) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/postmortem")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Post-Mortem Records
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Post-mortem record not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getMannerColor = (manner: string) => {
    switch (manner) {
      case "natural": return "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400";
      case "accidental": return "bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400";
      case "euthanasia": return "bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400";
      case "undetermined": return "bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-400";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getBodyConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent": return "bg-green-500/10 text-green-700 border-green-200 dark:text-green-400";
      case "good": return "bg-lime-500/10 text-lime-700 border-lime-200 dark:text-lime-400";
      case "fair": return "bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400";
      case "poor": return "bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400";
      case "very_poor": return "bg-red-500/10 text-red-700 border-red-200 dark:text-red-400";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/postmortem")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Post-Mortem Records
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Post-Mortem Report</h1>
            <p className="text-muted-foreground font-mono text-lg">{record.reportId}</p>
          </div>
          <div className="flex gap-2">
            <Badge className={getMannerColor(record.mannerOfDeath)}>
              {record.mannerOfDeath}
            </Badge>
            <Badge className={getBodyConditionColor(record.bodyCondition)}>
              {record.bodyCondition.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pet Name</p>
                <p className="font-semibold">{record.petName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-semibold">{record.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Species</p>
                <p className="font-semibold">{record.species}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Breed</p>
                <p className="font-semibold">{record.breed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examination Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Examination Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date of Death</p>
                <p className="font-semibold">{new Date(record.dateOfDeath).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time of Death</p>
                <p className="font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {record.timeOfDeath}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Examining Veterinarian</p>
                <p className="font-semibold">{record.examiningVeterinarian}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Report Created</p>
                <p className="font-semibold">{new Date(record.createdDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cause of Death */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skull className="h-5 w-5" />
              Cause of Death
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{record.causeOfDeath}</p>
          </CardContent>
        </Card>

        {/* Examination Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Examination Findings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">External Examination</h4>
              <p className="text-muted-foreground">{record.externalExamination}</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Gross Findings</h4>
              <p className="text-muted-foreground">{record.grossFindings}</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Testing */}
        {record.additionalTesting.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5" />
                Additional Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {record.additionalTesting.map((test, index) => (
                  <Badge key={index} variant="outline">
                    {test}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

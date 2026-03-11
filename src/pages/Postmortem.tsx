import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Skull, ChevronDown, ChevronRight, Calendar, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

export default function Postmortem() {
  const navigate = useNavigate();
  const [records] = useState<PostMortemRecord[]>(mockPostMortemRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedManner, setSelectedManner] = useState<string>("all");

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.causeOfDeath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.reportId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesManner = selectedManner === "all" || record.mannerOfDeath === selectedManner;
    
    return matchesSearch && matchesManner;
  });

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Post-Mortem Records</h1>
          <p className="text-muted-foreground">
            View and manage post-mortem examination reports and findings
          </p>
        </div>
        
        <Button 
          className="flex items-center gap-2"
          onClick={() => navigate("/postmortem/new")}
        >
          <Plus className="h-4 w-4" />
          New Post-Mortem Report
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by pet name, owner, report ID, or cause of death..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedManner} onValueChange={setSelectedManner}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by manner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manners</SelectItem>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="accidental">Accidental</SelectItem>
                <SelectItem value="euthanasia">Euthanasia</SelectItem>
                <SelectItem value="undetermined">Undetermined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow 
                  key={record.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/postmortem/${record.id}`)}
                >
                  <TableCell className="w-28 font-mono text-sm font-medium">
                    {record.reportId}
                  </TableCell>
                  <TableCell className="w-24 font-medium">
                    {record.petName}
                  </TableCell>
                  <TableCell className="w-32">
                    {record.patientName}
                  </TableCell>
                  <TableCell className="w-40">
                    <div className="truncate">
                      {record.species} ({record.breed})
                    </div>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="flex flex-col text-sm">
                      <span>{new Date(record.dateOfDeath).toLocaleDateString()}</span>
                      <span className="text-muted-foreground text-xs">{record.timeOfDeath}</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="truncate">
                      {record.examiningVeterinarian}
                    </div>
                  </TableCell>
                  <TableCell className="w-28">
                    <Badge className={getMannerColor(record.mannerOfDeath)}>
                      {record.mannerOfDeath}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-24">
                    <Badge className={getBodyConditionColor(record.bodyCondition)}>
                      {record.bodyCondition.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Skull className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No post-mortem records found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Paperclip, User, Stethoscope, ChevronDown, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClinicalRecord {
  id: string;
  patientName: string;
  petName: string;
  species: string;
  date: string;
  veterinarian: string;
  complaint: string;
  diagnosis: string;
  treatment: string;
  status: "ongoing" | "completed" | "follow-up";
  attachments: number;
  petImage?: string;
}


const mockRecords: ClinicalRecord[] = [
  {
    id: "1",
    patientName: "Sarah Johnson",
    petName: "Max",
    species: "Dog (Golden Retriever)",
    date: "2024-01-20",
    veterinarian: "Dr. Smith",
    complaint: "Limping on left front leg",
    diagnosis: "Mild sprain in left forelimb",
    treatment: "Rest, anti-inflammatory medication",
    status: "ongoing",
    attachments: 2,
    petImage: "/placeholder.svg"
  },
  {
    id: "2",
    patientName: "Mike Wilson",
    petName: "Whiskers",
    species: "Cat (Persian)",
    date: "2024-01-19",
    veterinarian: "Dr. Brown",
    complaint: "Not eating, lethargic",
    diagnosis: "Upper respiratory infection",
    treatment: "Antibiotics, supportive care",
    status: "completed",
    attachments: 1,
    petImage: "/placeholder.svg"
  },
  {
    id: "3",
    patientName: "Emily Davis",
    petName: "Bella",
    species: "Dog (Labrador)",
    date: "2024-01-18",
    veterinarian: "Dr. Johnson",
    complaint: "Annual wellness exam",
    diagnosis: "Healthy, vaccinations updated",
    treatment: "Routine vaccinations",
    status: "completed",
    attachments: 0,
    petImage: "/placeholder.svg"
  }
];


export default function Records() {
  console.log("Records component loaded - templates refactored");
  const navigate = useNavigate();
  const [records] = useState<ClinicalRecord[]>(mockRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());


  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing": return "bg-warning/10 text-warning border-warning/20";
      case "completed": return "bg-success/10 text-success border-success/20";
      case "follow-up": return "bg-info/10 text-info border-info/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Clinical Records</h1>
          <p className="text-muted-foreground">
            Access and manage patient clinical records and medical history
          </p>
        </div>
        
        <Button className="flex items-center gap-2" onClick={() => navigate('/records/new')}>
          <Plus className="h-4 w-4" />
          New Record
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, pet name, or diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 pl-4"></TableHead>
                <TableHead className="w-16 pl-0">Pet</TableHead>
                <TableHead className="min-w-24 pl-0">Pet Name</TableHead>
                <TableHead className="min-w-32">Owner</TableHead>
                <TableHead className="min-w-36">Species</TableHead>
                <TableHead className="min-w-24">Date</TableHead>
                <TableHead className="min-w-28">Veterinarian</TableHead>
                <TableHead className="min-w-20">Status</TableHead>
                <TableHead className="min-w-24">Attachments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const isExpanded = expandedRecords.has(record.id);
                
                return (
                  <Collapsible key={record.id} open={isExpanded} onOpenChange={(open) => {
                    const newExpanded = new Set(expandedRecords);
                    if (open) {
                      newExpanded.add(record.id);
                    } else {
                      newExpanded.delete(record.id);
                    }
                    setExpandedRecords(newExpanded);
                  }}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="w-12 pl-4">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="w-16 pl-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={record.petImage} alt={record.petName} />
                          <AvatarFallback className="text-xs">
                            {record.petName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell 
                        className="font-medium cursor-pointer pl-0"
                        onClick={() => navigate(`/records/${record.id}`)}
                      >
                        {record.petName}
                      </TableCell>
                      <TableCell 
                        className="cursor-pointer"
                        onClick={() => navigate(`/records/${record.id}`)}
                      >
                        {record.patientName}
                      </TableCell>
                      <TableCell 
                        className="cursor-pointer"
                        onClick={() => navigate(`/records/${record.id}`)}
                      >
                        {record.species}
                      </TableCell>
                      <TableCell 
                        className="cursor-pointer"
                        onClick={() => navigate(`/records/${record.id}`)}
                      >
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell 
                        className="cursor-pointer"
                        onClick={() => navigate(`/records/${record.id}`)}
                      >
                        {record.veterinarian}
                      </TableCell>
                      <TableCell 
                        className="cursor-pointer"
                        onClick={() => navigate(`/records/${record.id}`)}
                      >
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell 
                        className="cursor-pointer"
                        onClick={() => navigate(`/records/${record.id}`)}
                      >
                        {record.attachments > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Paperclip className="h-3 w-3" />
                            {record.attachments}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell colSpan={8} className="bg-muted/20 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Complaint
                              </h4>
                              <p className="text-muted-foreground">{record.complaint}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <Stethoscope className="h-4 w-4" />
                                Diagnosis
                              </h4>
                              <p className="text-muted-foreground">{record.diagnosis}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Treatment
                              </h4>
                              <p className="text-muted-foreground">{record.treatment}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No clinical records found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
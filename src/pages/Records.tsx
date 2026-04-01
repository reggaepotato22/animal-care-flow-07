import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Paperclip, User, Stethoscope, ChevronDown, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEncounter } from "@/contexts/EncounterContext";
import { loadAttachments } from "@/lib/attachmentStore";
import { loadClinicalRecords, subscribeToClinicalRecords } from "@/lib/clinicalRecordStore";
import { toast } from "sonner";

interface ClinicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  petName: string;
  species: string;
  breed: string;
  date: string;
  veterinarian: string;
  complaint: string;
  diagnosis: string;
  treatment: string;
  status: "ongoing" | "completed" | "follow-up" | "waiting" | "in-triage" | "triaged" | "in-consultation" | "discharged";
  attachments: number;
  petImage?: string;
}

// Load real patients from localStorage
function loadKnownPatients(): Array<{
  patientId: string;
  petName: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  species?: string;
  breed?: string;
}> {
  try {
    const raw = localStorage.getItem("acf_known_patients");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Build records from real encounter data - filter out records with unknown owners
function buildRecordsFromEncounters(encounters: any[]): ClinicalRecord[] {
  const patients = loadKnownPatients();
  
  return encounters
    .filter(enc => {
      const patient = patients.find(p => p.patientId === enc.patientId);
      const ownerName = patient?.ownerName || enc.ownerName;
      // Filter out records with no owner information
      return ownerName && ownerName !== "Unknown Owner" && ownerName.trim() !== "";
    })
    .map(enc => {
      const patient = patients.find(p => p.patientId === enc.patientId);
      const attachments = loadAttachments(enc.patientId).length;
      
      return {
        id: enc.id,
        patientId: enc.patientId,
        patientName: patient?.ownerName || enc.ownerName || "Unknown Owner",
        petName: patient?.petName || enc.petName || enc.patientId,
        species: patient?.species || enc.species || "—",
        breed: patient?.breed || "—",
        date: enc.startTime ? enc.startTime.split("T")[0] : new Date().toISOString().split("T")[0],
        veterinarian: enc.veterinarian || "—",
        complaint: enc.chiefComplaint || enc.reason || "Consultation",
        diagnosis: "—", // Will be populated from SOAP notes
        treatment: "—",
        status: mapEncounterStatus(enc.status),
        attachments,
      };
    });
}

function mapEncounterStatus(status: string): ClinicalRecord["status"] {
  switch (status) {
    case "WAITING": return "waiting";
    case "IN_TRIAGE": return "in-triage";
    case "TRIAGED": return "triaged";
    case "IN_CONSULTATION": return "in-consultation";
    case "DISCHARGED":
    case "completed": return "completed";
    case "follow-up": return "follow-up";
    case "waiting": return "waiting";
    case "in-triage": return "in-triage";
    case "triaged": return "triaged";
    default: return "ongoing";
  }
}

function loadSavedRecords(): ClinicalRecord[] {
  try {
    const items = loadClinicalRecords();
    const patients = loadKnownPatients();
    return items.map(r => {
      const patient = patients.find(p => p.patientId === r.patientId);
      const d = r.data as any;
      const complaint = d?.chiefComplaint || d?.reason || "Consultation";
      const diagnosis = d?.primaryDiagnosis || d?.assessment || "—";
      const veterinarian = r.veterinarian || d?.veterinarian || "—";
      const attachments = loadAttachments(r.patientId).length;
      return {
        id:          r.id,
        patientId:   r.patientId,
        patientName: r.ownerName ?? patient?.ownerName ?? "Owner",
        petName:     r.petName   ?? patient?.petName ?? r.patientId,
        species:     patient?.species || "—",
        breed:       patient?.breed || "—",
        date:        r.savedAt ? r.savedAt.split("T")[0] : new Date().toISOString().split("T")[0],
        veterinarian,
        complaint,
        diagnosis,
        treatment:   "—",
        status:      mapEncounterStatus(r.status ?? "ongoing"),
        attachments,
      };
    });
  } catch { return []; }
}

export default function Records() {
  const navigate = useNavigate();
  const location = useLocation();
  const { encounters } = useEncounter();
  const recordsBase = "/records";
  
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const unsub = subscribeToClinicalRecords(() => setRefresh(r => r + 1));
    return () => unsub();
  }, []);

  const records = useMemo(() => {
    return [
      ...loadSavedRecords().filter(r => r.patientName !== "Unknown Owner" && r.patientName.trim() !== ""),
      ...buildRecordsFromEncounters(encounters),
    ];
  }, [encounters, refresh]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.petName.toLowerCase().includes(searchQuery.toLowerCase()) || record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || record.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
      case "in-consultation":
        return "bg-warning/10 text-warning border-warning/20";
      case "completed":
      case "discharged":
        return "bg-success/10 text-success border-success/20";
      case "follow-up":
        return "bg-info/10 text-info border-info/20";
      case "waiting":
        return "bg-muted/10 text-muted-foreground border-muted/20";
      case "in-triage":
        return "bg-purple/10 text-purple border-purple/20";
      case "triaged":
        return "bg-blue/10 text-blue border-blue/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Clinical Records</h1>
          <p className="text-muted-foreground">
            Access and manage patient clinical records and medical history
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/triage')}
          >
            <Stethoscope className="h-4 w-4" />
            Triage
          </Button>
          <Button className="flex items-center gap-2" onClick={() => navigate(`${recordsBase}/new`)}>
            <Plus className="h-4 w-4" />
            New Record
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by patient name, pet name, or diagnosis..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableBody>
                {filteredRecords.map(record => {
                const isExpanded = expandedRecords.has(record.id);
                return <Collapsible key={record.id} open={isExpanded} onOpenChange={open => {
                  const newExpanded = new Set(expandedRecords);
                  if (open) {
                    newExpanded.add(record.id);
                  } else {
                    newExpanded.delete(record.id);
                  }
                  setExpandedRecords(newExpanded);
                }}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="w-12">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="w-16">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={record.petImage} alt={record.petName} />
                            <AvatarFallback className="text-xs">
                              {record.petName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="w-32 font-medium cursor-pointer" onClick={() => navigate(`${recordsBase}/${record.id}`)}>
                          <div>
                            <div>{record.petName}</div>
                            <div className="text-xs font-mono text-muted-foreground">{record.patientId}</div>
                          </div>
                        </TableCell>
                        <TableCell className="w-36 cursor-pointer" onClick={() => navigate(`${recordsBase}/${record.id}`)}>
                          {record.patientName}
                        </TableCell>
                        <TableCell className="w-40 cursor-pointer" onClick={() => navigate(`${recordsBase}/${record.id}`)}>
                          {record.species}
                        </TableCell>
                        <TableCell className="w-28 cursor-pointer" onClick={() => navigate(`${recordsBase}/${record.id}`)}>
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="w-32 cursor-pointer" onClick={() => navigate(`${recordsBase}/${record.id}`)}>
                          {record.veterinarian}
                        </TableCell>
                        <TableCell className="w-24 cursor-pointer" onClick={() => navigate(`${recordsBase}/${record.id}`)}>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-28 cursor-pointer" onClick={() => navigate(`${recordsBase}/${record.id}`)}>
                          {record.attachments > 0 && <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Paperclip className="h-3 w-3" />
                              {record.attachments}
                            </Badge>}
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
                    </Collapsible>;
              })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredRecords.length === 0 && <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No clinical records found matching your criteria.</p>
          </CardContent>
        </Card>}
    </div>;
}

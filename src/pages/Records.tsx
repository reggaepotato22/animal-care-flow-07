import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Paperclip, User, Stethoscope, ChevronDown, ChevronRight, BookOpen, AlertTriangle, Microscope, CornerUpRight, Clock, ParkingSquare, ArrowUpRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEncounter } from "@/contexts/EncounterContext";
import { loadAttachments } from "@/lib/attachmentStore";
import { loadClinicalRecords, subscribeToClinicalRecords } from "@/lib/clinicalRecordStore";
import { formatDistanceToNow } from "date-fns";
import { getParkedPatients } from "@/lib/parkedPatientsStore";
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
  status: "ongoing" | "completed" | "follow-up" | "waiting" | "in-triage" | "triaged" | "in-consultation" | "discharged" | "draft";
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

// Build records from real encounter data — show ALL encounters, use best available name
function buildRecordsFromEncounters(encounters: any[]): ClinicalRecord[] {
  const patients = loadKnownPatients();
  
  return encounters.map(enc => {
    const patient = patients.find(p => p.patientId === enc.patientId);
    const attachments = loadAttachments(enc.patientId).length;
    const ownerName = patient?.ownerName || enc.ownerName || enc.ownerEmail?.split("@")[0] || "—";
    const petName   = patient?.petName   || enc.petName   || enc.patientId;

    return {
      id: enc.id,
      patientId: enc.patientId,
      patientName: ownerName,
      petName,
      species: patient?.species || enc.species || "—",
      breed:   patient?.breed   || "—",
      date: enc.startTime ? enc.startTime.split("T")[0] : new Date().toISOString().split("T")[0],
      veterinarian: enc.veterinarian || "—",
      complaint: enc.chiefComplaint || enc.reason || "Consultation",
      diagnosis: "—",
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
        patientName: r.ownerName || patient?.ownerName || "Owner",
        petName:     r.petName   || patient?.petName   || r.encounterId || r.patientId,
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

  // Draft records — from clinical store with status === "draft"
  const draftRecords = useMemo(() => {
    return loadClinicalRecords()
      .filter(r => r.status === "draft")
      .map(r => {
        const d = r.data as any;
        return {
          id: r.id,
          encounterId: r.encounterId,
          patientId: r.patientId,
          petName: r.petName || r.patientId,
          ownerName: r.ownerName || "—",
          veterinarian: r.veterinarian || "—",
          savedAt: r.savedAt,
          tentativeCount: d?.tentativeCount ?? 0,
          pendingLabCount: d?.pendingLabCount ?? 0,
          draftLabel: d?.draftLabel || d?.chiefComplaint || "Draft encounter",
          resumePath: r.encounterId
            ? `/patients/${r.patientId}/encounters/${r.encounterId}?draft=true`
            : `/records/new?patientId=${r.patientId}&draft=true`,
        };
      });
  }, [refresh]);

  const records = useMemo(() => {
    const saved = loadSavedRecords().filter(r => r.status !== "draft");
    const fromEnc = buildRecordsFromEncounters(encounters);
    // Dedup: saved records take priority; skip encounter rows already in saved
    const savedIds = new Set(saved.map(r => r.id));
    const deduped = fromEnc.filter(r => !savedIds.has(r.id));
    return [...saved, ...deduped];
  }, [encounters, refresh]);

  // Parked patients (from the floating sidebar store)
  const parkedPatients = useMemo(() => getParkedPatients(), [refresh]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.petName.toLowerCase().includes(searchQuery.toLowerCase()) || record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || record.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Smart navigation: active encounters → workspace, completed → chart
  const getRecordNavPath = (record: ClinicalRecord) => {
    const activeStatuses = ["in-consultation", "ongoing", "in-triage", "triaged", "waiting"];
    if (activeStatuses.includes(record.status)) {
      return `/patients/${record.patientId}/encounters/${record.id}`;
    }
    return `/records/${record.id}`;
  };

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

      {/* ── Parked Patients: Resume Banner ────────────────────────────────── */}
      {parkedPatients.length > 0 && draftRecords.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-violet-300 dark:border-violet-700/50 bg-violet-50/50 dark:bg-violet-900/10 px-4 py-3">
          <ParkingSquare className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">
              {parkedPatients.length} parked patient{parkedPatients.length !== 1 ? "s" : ""} — consultation in progress
            </p>
            <p className="text-xs text-violet-600/80 dark:text-violet-400/70 truncate">
              {parkedPatients.map(p => p.patientName).join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {parkedPatients.map(p => (
              <Button
                key={p.patientId}
                size="sm"
                variant="outline"
                className="gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/30"
                onClick={() => navigate(p.returnPath)}
              >
                <CornerUpRight className="h-3.5 w-3.5" />
                Resume {p.patientName}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ── Drafts: Resume Panel ──────────────────────────────────────────── */}
      {draftRecords.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-900/10">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
              <BookOpen className="h-4 w-4" />
              Saved Drafts
              <Badge className="text-[10px] bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-200 border-0 ml-1">
                {draftRecords.length}
              </Badge>
              <span className="text-xs font-normal text-amber-700/70 dark:text-amber-400/70 ml-auto">
                These consultations are in-progress and awaiting completion
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="space-y-2">
              {draftRecords.map(draft => (
                <div
                  key={draft.id}
                  className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-white dark:bg-amber-950/20 px-3 py-2.5"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 shrink-0">
                    <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold">{draft.petName}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{draft.ownerName}</span>
                      {draft.tentativeCount > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {draft.tentativeCount} tentative finding{draft.tentativeCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      {draft.pendingLabCount > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 gap-1">
                          <Microscope className="h-2.5 w-2.5" />
                          {draft.pendingLabCount} pending lab{draft.pendingLabCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 italic">"{draft.draftLabel}"</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      Saved {formatDistanceToNow(new Date(draft.savedAt), { addSuffix: true })}
                      {draft.veterinarian && draft.veterinarian !== "—" && ` · ${draft.veterinarian}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border-0 shrink-0"
                    onClick={() => navigate(draft.resumePath)}
                  >
                    <CornerUpRight className="h-3.5 w-3.5" />
                    Resume
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                        <TableCell className="w-32 font-medium cursor-pointer" onClick={() => navigate(getRecordNavPath(record))}>
                          <div>
                            <div>{record.petName}</div>
                            <div className="text-xs font-mono text-muted-foreground">{record.patientId}</div>
                          </div>
                        </TableCell>
                        <TableCell className="w-36 cursor-pointer" onClick={() => navigate(getRecordNavPath(record))}>
                          {record.patientName}
                        </TableCell>
                        <TableCell className="w-40 cursor-pointer" onClick={() => navigate(getRecordNavPath(record))}>
                          {record.species}
                        </TableCell>
                        <TableCell className="w-28 cursor-pointer" onClick={() => navigate(getRecordNavPath(record))}>
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="w-32 cursor-pointer" onClick={() => navigate(getRecordNavPath(record))}>
                          {record.veterinarian}
                        </TableCell>
                        <TableCell className="w-24 cursor-pointer" onClick={() => navigate(getRecordNavPath(record))}>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-28 cursor-pointer" onClick={() => navigate(getRecordNavPath(record))}>
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
                            <div className="mt-3 pt-3 border-t flex items-center gap-2">
                              <Button
                                size="sm"
                                className="gap-1.5"
                                onClick={() => navigate(getRecordNavPath(record))}
                              >
                                <CornerUpRight className="h-3.5 w-3.5" />
                                {["in-consultation","ongoing","in-triage","triaged","waiting"].includes(record.status)
                                  ? "Resume Consultation"
                                  : "View Full Record"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => navigate(`/patients/${record.patientId}/chart`)}
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                Patient Chart
                              </Button>
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

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 space-y-3">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="font-medium">No clinical records found</p>
            {searchQuery || selectedStatus !== "all" ? (
              <p className="text-sm text-muted-foreground">Try clearing the search or filter.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Records appear here once a patient has been checked in and a consultation has started.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </Button>
                  <Button size="sm" onClick={() => navigate("/records/new")}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    New Record
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>;
}

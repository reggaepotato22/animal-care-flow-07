import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { differenceInDays, format, isSameDay } from "date-fns";
import { PatientHeader } from "@/components/PatientHeader";
import { AdmissionRequestDialog } from "@/components/AdmissionRequestDialog";
import { useEncounter } from "@/contexts/EncounterContext";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import { getPatients, updatePatient } from "@/lib/patientStore";
import { loadStoredAppointments, saveAppointment, broadcastAppointmentUpdate } from "@/lib/appointmentStore";
import { useRole } from "@/contexts/RoleContext";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NewVisitDialog } from "@/components/NewVisitDialog";
import { DischargeSummaryDialog } from "@/components/DischargeSummaryDialog";
import { PostMortemReportDialog } from "@/components/PostMortemReportDialog";
import { EditPatientDialog } from "@/components/EditPatientDialog";
import { ArrowLeft, Calendar, MapPin, Phone, Heart, Edit, Trash2, FileText, Pill, Stethoscope, Activity, MoreVertical, FileSearch, ChevronDown, AlertTriangle, Clock, TestTube, Mail, MessageSquare, User, Building2, MapPinIcon, DollarSign, CheckCircle, Circle, AlertCircle, XCircle, Hospital, ArrowUpRight, Plus } from "lucide-react";
import { getHospChannelName } from "@/lib/hospitalizationStore";

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { has } = useRole();
  const { toast } = useToast();
  const { encounters, getActiveEncounterForPatient, updateEncounterStatus } = useEncounter();
  const { setPatientStatus, setStep, checkIn } = useWorkflowContext();
  const [updateCount, setUpdateCount] = useState(0);

  const patient = useMemo(() => {
    return getPatients().find(p => p.id === id || p.patientId === id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, updateCount]);

  const handlePatientUpdate = (updatedPatient: any) => {
    updatePatient(updatedPatient.id, updatedPatient);
    setUpdateCount(c => c + 1);
  };

  const wf = useWorkflow({ patientId: patient?.id });

  const handleEncounterCheckIn = (encId: string) => {
    if (!patient) return;
    updateEncounterStatus(encId, "IN_TRIAGE");
    checkIn(patient.id, {
      name: patient.name,
      owner: (patient as any).owner || "",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "Walk-in",
      checkedInAt: new Date().toISOString(),
    });
    toast({ title: "✓ Checked In", description: `${patient.name} is now in the Triage queue.` });
    setUpdateCount(c => c + 1);
  };

  const handleStatusChange = (newStatus: string) => {
    if (id) {
      setPatientStatus(id, newStatus as any);
    }
  };

  const handleRefer = () => {
    if (!id) return;
    navigate(`/patients/${id}/refer`);
  };

  const handleNewVisit = () => {
    if (!patient) return;
    const now = new Date();
    const appt = {
      id: `walkin-${Date.now()}`,
      petName: patient.name,
      ownerName: (patient as any).owner || "",
      ownerPhone: (patient as any).phone || "",
      ownerEmail: (patient as any).email || "",
      date: now.toISOString(),
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      type: "Walk-in",
      vet: "",
      status: "SCHEDULED" as const,
      patientId: patient.id,
      duration: 30,
      createdAt: now.toISOString(),
    };
    saveAppointment(appt);
    broadcastAppointmentUpdate();
    navigate(`/?walkin=${patient.id}`);
  };

  const handleDeceased = () => {
    if (!id) return;
    const enc = getActiveEncounterForPatient(id);
    if (enc) updateEncounterStatus(enc.id, "DISCHARGED");
    setPatientStatus(id, "Deceased");
    setStep(id, "COMPLETED");
    try {
      const stored: any[] = JSON.parse(localStorage.getItem("acf_clinical_records") ?? "[]");
      stored.unshift({ type: "deceased", patientId: id, petName: patient?.name, createdAt: new Date().toISOString(), status: "Deceased" });
      localStorage.setItem("acf_clinical_records", JSON.stringify(stored));
      new BroadcastChannel(getHospChannelName()).postMessage({ type: "patient_deceased", patientId: id });
    } catch {}
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: { type: "warning", message: `${patient?.name ?? "Patient"} marked as deceased`, patientId: id },
    }));
    toast({ title: "Record Updated", description: `${patient?.name ?? "Patient"} has been marked as deceased.` });
  };

  const hasAppointmentToday = useMemo(() => {
    if (!patient) return false;
    const appointments = loadStoredAppointments();
    const today = new Date();
    return appointments.some(
      (apt) => apt.patientId === patient.id && isSameDay(new Date(apt.date), today)
    );
  }, [patient]);

  const activeEncounter = useMemo(() => {
    if (!patient) return null;
    return encounters.find(enc => enc.patientId === patient.id && ["WAITING", "IN_TRIAGE", "TRIAGED", "IN_CONSULTATION", "IN_SURGERY", "RECOVERY"].includes(enc.status));
  }, [encounters, patient]);

  const allEncounters = useMemo(() => {
    if (!patient) return [];
    const live = encounters
      .filter(enc => enc.patientId === patient.id)
      .map(enc => ({
        id: enc.id,
        date: new Date(enc.startTime).toLocaleDateString(),
        time: new Date(enc.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(enc.startTime).getTime(),
        type: "Visit",
        reason: enc.reason || "General Visit",
        status: enc.status,
        personnel: enc.veterinarian || "Not assigned",
        notes: enc.chiefComplaint,
        isLive: true,
        isActive: ["WAITING", "IN_TRIAGE", "TRIAGED", "IN_CONSULTATION", "IN_SURGERY", "RECOVERY"].includes(enc.status)
      }));

    const historical = (patient.medicalHistory || []).map(mh => {
      // Parse "2024-01-15" and "10:30 AM"
      const dateParts = mh.date.split("-");
      const [time, period] = mh.time.split(" ");
      const [hours, minutes] = time.split(":");
      let hour = parseInt(hours);
      if (period === "PM" && hour < 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
      
      const timestamp = new Date(
        parseInt(dateParts[0]), 
        parseInt(dateParts[1]) - 1, 
        parseInt(dateParts[2]), 
        hour, 
        parseInt(minutes)
      ).getTime();

      return {
        id: mh.id,
        date: mh.date,
        time: mh.time,
        timestamp,
        type: mh.type,
        reason: mh.description || mh.type,
        status: mh.status,
        personnel: mh.personnel,
        role: mh.role,
        notes: mh.notes,
        isLive: false,
        isActive: false
      };
    });

    return [...live, ...historical].sort((a, b) => b.timestamp - a.timestamp);
  }, [encounters, patient]);

  const clinicalReminders = useMemo(() => {
    if (!patient) return [];
    const reminders: Array<{
      id: string;
      type: "critical" | "warning" | "info";
      title: string;
      detail: string;
    }> = [];

    const today = new Date();

    (patient.vaccinations || []).forEach((vax, index) => {
      const dueDate = new Date(vax.due);
      const daysUntil = differenceInDays(dueDate, today);
      if (daysUntil <= 30) {
        reminders.push({
          id: `vax-${index}`,
          type: daysUntil < 0 ? "critical" : "warning",
          title: `${vax.name} vaccine ${daysUntil < 0 ? "overdue" : "due soon"}`,
          detail:
            daysUntil < 0
              ? `Overdue by ${Math.abs(daysUntil)} days (due ${vax.due}).`
              : `Due in ${daysUntil} days (due ${vax.due}).`,
        });
      }
    });

    if (patient.nextAppointment) {
      const nextDate = new Date(patient.nextAppointment);
      const daysUntil = differenceInDays(nextDate, today);
      if (daysUntil <= 14) {
        reminders.push({
          id: "follow-up",
          type: "info",
          title: "Upcoming follow-up appointment",
          detail: `Scheduled for ${patient.nextAppointment} (${daysUntil} days).`,
        });
      }
    }

    const ageNumber = Number((patient.age || "").replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(ageNumber) && ageNumber >= 7) {
      reminders.push({
        id: "senior",
        type: "info",
        title: "Senior wellness screening",
        detail: "Recommend annual senior wellness panel and monitoring.",
      });
    }

    if (patient.allergies && patient.allergies.length > 0) {
      reminders.push({
        id: "allergies",
        type: "warning",
        title: "Allergy precautions",
        detail: `Documented allergies: ${patient.allergies.join(", ")}.`,
      });
    }

    return reminders;
  }, [patient]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Patient Not Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          The patient record you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate("/patients")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy": return "bg-success text-success-foreground";
      case "treatment": return "bg-warning text-warning-foreground";
      case "critical": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getEncounterTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "checkup": return <Activity className="h-4 w-4" />;
      case "vaccination": return <Stethoscope className="h-4 w-4" />;
      case "surgery": return <Heart className="h-4 w-4" />;
      case "procedure": return <TestTube className="h-4 w-4" />;
      case "emergency": return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getEncounterStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "active": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/patients")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(patient.status)}>
                {patient.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate(`/patients/${patient.id}/journey`)}>
            <Activity className="mr-2 h-4 w-4" />
            Patient Journey
          </Button>
          <PermissionGuard permission="can_edit_medical_records" fallback={null} hide>
            <Button variant="destructive" className="hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </PermissionGuard>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions
                <MoreVertical className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {has("can_edit_patients") && (
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <EditPatientDialog patient={patient} onPatientUpdate={handlePatientUpdate}>
                    <div className="flex items-center w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Patient
                    </div>
                  </EditPatientDialog>
                </DropdownMenuItem>
              )}
              {has("can_edit_medical_records") && (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={handleNewVisit}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    New Visit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <DischargeSummaryDialog patientId={patient.id}>
                      <div className="flex items-center w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Discharge Patient
                      </div>
                    </DischargeSummaryDialog>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <AdmissionRequestDialog
                      patientData={{
                        patientId: patient.id,
                        patientName: patient.owner,
                        petName: patient.name,
                        species: patient.species,
                      }}
                    >
                      <div className="flex items-center w-full">
                        <Hospital className="mr-2 h-4 w-4" />
                        Hospitalize Patient
                      </div>
                    </AdmissionRequestDialog>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onSelect={handleRefer}
                  >
                    <div className="flex items-center w-full">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Refer Patient
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <PostMortemReportDialog
                      patientData={{
                        id: patient.id,
                        name: patient.name,
                        species: patient.species,
                        breed: patient.breed
                      }}
                    >
                      <div className="flex items-center w-full" onClick={handleDeceased}>
                        <FileSearch className="mr-2 h-4 w-4" />
                        Mark as Deceased
                      </div>
                    </PostMortemReportDialog>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PatientHeader
        patient={patient}
        onStatusChipClass={getStatusColor}
        encounters={encounters.filter(enc => enc.patientId === patient.id)}
        onUpdateStatus={handleStatusChange}
        encounter={activeEncounter}
        onPatientUpdate={handlePatientUpdate}
      />

      {/* Behavioral / Special Handling Warnings */}
      {((patient as any).behavioralWarnings as Array<{text:string;level:"low"|"medium"|"high"}>|undefined)?.filter(w => w.text).map((w, i) => (
        <div key={i} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium border ${
          w.level === "high" ? "bg-red-50 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-700 dark:text-red-300"
          : w.level === "medium" ? "bg-orange-50 border-orange-300 text-orange-800 dark:bg-orange-950/30 dark:border-orange-700 dark:text-orange-300"
          : "bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-300"
        }`}>
          <AlertTriangle className={`h-4 w-4 shrink-0 ${w.level==="high"?"text-red-500":w.level==="medium"?"text-orange-500":"text-blue-500"}`} />
          <span className="font-semibold">Special Handling:</span>
          <span>{w.text}</span>
          <span className={`ml-auto shrink-0 uppercase text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded ${
            w.level==="high"?"bg-red-100 text-red-700":w.level==="medium"?"bg-orange-100 text-orange-700":"bg-blue-100 text-blue-700"
          }`}>{w.level} risk</span>
        </div>
      ))}

      {/* Encounters List */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Encounters & Medical History
          </CardTitle>
          <div className="flex items-center gap-2">
            <NewVisitDialog>
              <Button size="sm" className="h-8" disabled={hasAppointmentToday} title={hasAppointmentToday ? "Patient has an appointment today. Please check-in from the appointments page." : ""}>
                <Plus className="h-4 w-4 mr-1" />
                New Visit
              </Button>
            </NewVisitDialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {allEncounters.length > 0 ? (
              allEncounters.map((enc) => (
                <div 
                  key={enc.id} 
                  className={`p-4 transition-colors hover:bg-muted/50 cursor-pointer ${enc.isActive ? 'bg-primary/5 border-l-4 border-l-primary shadow-sm' : ''}`}
                  onClick={() => navigate(enc.isLive ? `/records/${enc.id}` : `/patients/${patient.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${enc.isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {enc.isLive ? <Stethoscope className="h-4 w-4" /> : getEncounterTypeIcon(enc.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{enc.reason}</h4>
                          {enc.isActive && (
                            <Badge variant="default" className="bg-primary text-primary-foreground animate-pulse text-[10px] h-4 px-1">
                              ACTIVE
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">{enc.date}</span>
                          <span>•</span>
                          <span>{enc.time}</span>
                          <span>•</span>
                          <span className="font-mono">{enc.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getEncounterStatusColor(enc.status === "DISCHARGED" || enc.status === "Completed" ? "Completed" : "Active")}>
                        {enc.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {enc.isLive ? `Vet: ${enc.personnel}` : `${enc.personnel} (${(enc as any).role || 'Staff'})`}
                      </span>
                      {enc.isLive && enc.status === "WAITING" && has("can_register_patients") && (
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90"
                          onClick={(e) => { e.stopPropagation(); handleEncounterCheckIn(enc.id); }}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Check In
                        </Button>
                      )}
                    </div>
                  </div>
                  {enc.notes && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1 ml-11">
                      <span className="font-medium text-foreground/80">{enc.isLive ? "Complaint:" : "Notes:"}</span> {enc.notes}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No clinical encounters or medical history found for this patient.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {has("can_view_records") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-veterinary-teal" />
              <span>Clinical Decision Support</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinicalReminders.length > 0 ? (
              <div className="space-y-3">
                {clinicalReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      reminder.type === "critical"
                        ? "border-destructive bg-destructive/10"
                        : reminder.type === "warning"
                        ? "border-warning bg-warning/10"
                        : "border-primary bg-primary/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{reminder.title}</p>
                        <p className="text-xs text-muted-foreground">{reminder.detail}</p>
                      </div>
                      <Badge
                        variant={
                          reminder.type === "critical"
                            ? "destructive"
                            : reminder.type === "warning"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {reminder.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active reminders at this time.</p>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Owner Information */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-veterinary-teal" />
              <span>Owner Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-veterinary-teal to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                {patient.owner ? patient.owner.split(' ').map(n => n[0]).join('') : "U"}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">{patient.owner || "Unknown Owner"}</h3>
                  <Badge variant={patient.ownerType === "Organization" ? "secondary" : "default"}>
                    {patient.ownerType === "Organization" ? <Building2 className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                    {patient.ownerType || "Individual"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span className="font-mono font-medium text-primary">ID: {patient.ownerId || "N/A"}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Contact Details
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{patient.phone || "No phone recorded"}</span>
                      <span className="text-xs text-muted-foreground ml-2">Primary</span>
                    </div>
                  </div>
                  {patient.phone && (
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${patient.phone}`}>
                          <Phone className="h-3 w-3" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`sms:${patient.phone}`}>
                          <MessageSquare className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {patient.email && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{patient.email}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${patient.email}`}>
                        <Mail className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {patient.preferredContact === "Phone" && <Phone className="h-3 w-3 text-muted-foreground" />}
                    {patient.preferredContact === "Email" && <Mail className="h-3 w-3 text-muted-foreground" />}
                    {patient.preferredContact === "SMS" && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Preferred: <span className="font-medium">{patient.preferredContact || "Not specified"}</span>
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2" />
                Address Information
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Physical Address</span>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">{patient.address || "No address recorded"}</div>
                      <div className="text-muted-foreground">{patient.city || ""}, {patient.postalCode || ""}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-veterinary-teal" />
              <span>Recent Visits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {allEncounters.length > 0 ? (
              allEncounters.slice(0, 5).map((enc, index) => (
                <Card key={index} className={`border-l-4 ${enc.isActive ? 'border-l-primary' : 'border-l-veterinary-teal'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{enc.reason}</span>
                          {enc.isActive && <Badge variant="default" className="text-[10px] h-4 px-1 bg-primary animate-pulse">ACTIVE</Badge>}
                          <Badge variant="outline">{enc.date}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">By: {enc.personnel}</p>
                        {enc.notes && <p className="text-sm">{enc.notes}</p>}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{enc.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No recent visits recorded
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-veterinary-teal" />
                <span>Vitals Overview</span>
              </CardTitle>
              <Button size="sm">
                <Activity className="mr-2 h-4 w-4" />
                Record New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.vitals && patient.vitals.length > 0 ? (
              <div className="grid gap-4">
                {patient.vitals.map((vital, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline">{vital.date}</Badge>
                        <Badge 
                          variant={
                            vital.bloodPressure === "Normal" ? "default" :
                            vital.bloodPressure === "Slightly Elevated" ? "secondary" : "destructive"
                          }
                        >
                          {vital.bloodPressure}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">Temp</span>
                          <span className="font-medium">{vital.temperature}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">HR</span>
                          <span className="font-medium">{vital.heartRate}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">Resp</span>
                          <span className="font-medium">{vital.respiratoryRate}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">Weight</span>
                          <span className="font-medium">{vital.weight}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">BP</span>
                          <span className="font-medium">{vital.bloodPressure}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No vital signs recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Pill className="h-5 w-5 text-veterinary-teal" />
                <span>Vaccinations</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.vaccinations && patient.vaccinations.length > 0 ? (
              patient.vaccinations.map((vaccine, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{vaccine.name}</h4>
                        <p className="text-xs text-muted-foreground">Last: {vaccine.date}</p>
                      </div>
                      <Badge variant={new Date(vaccine.due) < new Date() ? "destructive" : "default"} className="text-xs">
                        Due: {vaccine.due}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No vaccination records found
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Pill className="h-5 w-5 text-veterinary-teal" />
                <span>Medications</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.medications && patient.medications.length > 0 ? (
              patient.medications.map((medication, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="p-3">
                    <div>
                      <h4 className="font-semibold text-sm">{medication.name}</h4>
                      <p className="text-xs text-muted-foreground">Dosage: {medication.dosage}</p>
                      <p className="text-xs text-muted-foreground">Prescribed: {medication.prescribed}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No current medications
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

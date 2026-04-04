import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Building2, User, Stethoscope, Phone, Mail, MapPin, AlertTriangle, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getPatients } from "@/lib/patientStore";
import { useEncounter } from "@/contexts/EncounterContext";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import { getHospChannelName } from "@/lib/hospitalizationStore";
import { upsertClinicalRecord, broadcastClinicalRecordUpdate } from "@/lib/clinicalRecordStore";

const SPECIALTIES = [
  "General Practice",
  "Internal Medicine",
  "General Surgery",
  "Orthopedic Surgery",
  "Neurology / Neurosurgery",
  "Cardiology",
  "Dermatology",
  "Oncology",
  "Ophthalmology",
  "Dentistry / Oral Surgery",
  "Diagnostic Imaging / Radiology",
  "Emergency & Critical Care",
  "Exotic / Avian Medicine",
  "Behavioral Medicine",
  "Reproduction / Theriogenology",
  "Other",
];

const URGENCY_LEVELS = [
  { value: "routine", label: "Routine", cls: "bg-green-100 text-green-700 border-green-200" },
  { value: "urgent", label: "Urgent", cls: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "emergency", label: "Emergency", cls: "bg-red-100 text-red-700 border-red-200" },
];

export default function ReferPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getActiveEncounterForPatient, updateEncounterStatus } = useEncounter();
  const { setPatientStatus, setStep } = useWorkflowContext();

  const patient = useMemo(() => getPatients().find(p => p.id === id || p.patientId === id), [id]);

  const [form, setForm] = useState({
    referredTo: "",
    referralHospital: "",
    specialty: "",
    referralDoctor: "",
    urgency: "routine",
    referralPhone: "",
    referralEmail: "",
    referralAddress: "",
    clinicalSummary: "",
    reasonForReferral: "",
    additionalNotes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const isValid = form.specialty && form.reasonForReferral && form.referralHospital;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !patient) return;

    const referral = {
      id: `ref-${Date.now()}`,
      type: "referral",
      patientId: id,
      petName: patient.name,
      ownerName: patient.owner,
      createdAt: new Date().toISOString(),
      status: "Referred",
      ...form,
    };

    try {
      upsertClinicalRecord({
        ...referral,
        id: referral.id,
        encounterId: referral.id,
        savedAt: new Date().toISOString(),
        data: referral,
      });
      broadcastClinicalRecordUpdate();
      new BroadcastChannel(getHospChannelName()).postMessage({ type: "patient_referred", patientId: id });
    } catch {}

    const enc = getActiveEncounterForPatient(id);
    if (enc) updateEncounterStatus(enc.id, "DISCHARGED");
    setPatientStatus(id, "Referred");
    setStep(id, "COMPLETED");

    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: "info",
        message: `${patient.name} referred to ${form.referralHospital || "external specialist"}`,
        patientId: id,
      },
    }));

    toast({ title: "Referral Submitted", description: `${patient.name} has been referred to ${form.referralHospital}.` });
    setSubmitted(true);
  };

  if (!patient) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 text-center">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/patients")}>Back to Patients</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Card className="text-center py-10">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Referral Submitted</h2>
            <p className="text-muted-foreground max-w-sm">
              {patient.name} has been referred to <strong>{form.referralHospital}</strong>
              {form.referralDoctor ? ` — ${form.referralDoctor}` : ""}.
              The patient status has been updated to <Badge variant="outline" className="bg-sky-100 text-sky-700 border-sky-200">Referred</Badge>.
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => navigate(`/patients/${id}`)}>Back to Patient</Button>
              <Button onClick={() => navigate("/patients")}>All Patients</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const urgencyCfg = URGENCY_LEVELS.find(u => u.value === form.urgency);

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/patients/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-sky-600" />
            Refer Patient
          </h1>
          <p className="text-sm text-muted-foreground">Submit a referral to another hospital or specialist</p>
        </div>
      </div>

      {/* Patient Info */}
      <Card className="border border-border/60">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base">{patient.name}</span>
                <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{patient.patientId}</span>
                <Badge variant="outline" className={patient.status === "healthy" ? "bg-green-50 text-green-700 border-green-200 text-xs" : "bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"}>{patient.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{patient.species} • {patient.breed} • {patient.age} • Owner: {patient.owner}</p>
            </div>
          </div>
          {/* Alerts row */}
          {((patient as any).allergies?.length > 0 || (patient as any).behavioralWarnings?.some((w: any) => w.text)) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(patient as any).allergies?.map((a: string, i: number) => (
                <Badge key={i} variant="destructive" className="text-xs">{a}</Badge>
              ))}
              {(patient as any).behavioralWarnings?.filter((w: any) => w.text).map((w: any, i: number) => (
                <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${
                  w.level === "high" ? "bg-red-50 text-red-700 border-red-200" :
                  w.level === "medium" ? "bg-orange-50 text-orange-700 border-orange-200" :
                  "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  <AlertTriangle className="h-3 w-3" />{w.text}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Receiving Facility */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Receiving Facility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="referralHospital">Hospital / Clinic Name <span className="text-destructive">*</span></Label>
                <Input id="referralHospital" placeholder="e.g. City Veterinary Specialists" value={form.referralHospital} onChange={set("referralHospital")} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="specialty">Specialty / Department <span className="text-destructive">*</span></Label>
                <Select value={form.specialty} onValueChange={v => setForm(prev => ({ ...prev, specialty: v }))}>
                  <SelectTrigger id="specialty">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="referralDoctor">Referring to Doctor</Label>
                <Input id="referralDoctor" placeholder="Dr. Jane Smith" value={form.referralDoctor} onChange={set("referralDoctor")} />
              </div>
              <div className="space-y-1.5">
                <Label>Urgency Level</Label>
                <div className="flex gap-2">
                  {URGENCY_LEVELS.map(u => (
                    <button
                      key={u.value}
                      type="button"
                      className={`flex-1 text-xs font-semibold px-3 py-2 rounded-md border transition-all ${
                        form.urgency === u.value
                          ? u.cls + " ring-2 ring-offset-1 ring-current"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                      onClick={() => setForm(prev => ({ ...prev, urgency: u.value }))}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="referralPhone" className="flex items-center gap-1.5"><Phone className="h-3 w-3" />Phone</Label>
                <Input id="referralPhone" placeholder="+1 555 000 0000" value={form.referralPhone} onChange={set("referralPhone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="referralEmail" className="flex items-center gap-1.5"><Mail className="h-3 w-3" />Email</Label>
                <Input id="referralEmail" type="email" placeholder="clinic@example.com" value={form.referralEmail} onChange={set("referralEmail")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="referralAddress" className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />Address</Label>
                <Input id="referralAddress" placeholder="123 Main St, City" value={form.referralAddress} onChange={set("referralAddress")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Clinical Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reasonForReferral">Reason for Referral <span className="text-destructive">*</span></Label>
              <Textarea
                id="reasonForReferral"
                placeholder="Describe why this patient needs to be referred…"
                className="min-h-[80px]"
                value={form.reasonForReferral}
                onChange={set("reasonForReferral")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinicalSummary">Clinical Summary</Label>
              <Textarea
                id="clinicalSummary"
                placeholder="Relevant history, current medications, recent test results, working diagnosis…"
                className="min-h-[100px]"
                value={form.clinicalSummary}
                onChange={set("clinicalSummary")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                placeholder="Any other information for the receiving clinician…"
                className="min-h-[60px]"
                value={form.additionalNotes}
                onChange={set("additionalNotes")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary bar */}
        {urgencyCfg && (
          <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${urgencyCfg.cls}`}>
            <Clock className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{urgencyCfg.label} Referral</span>
            {form.specialty && <><span className="opacity-50">•</span><span>{form.specialty}</span></>}
            {form.referralHospital && <><span className="opacity-50">•</span><span>{form.referralHospital}</span></>}
            {form.referralDoctor && <><span className="opacity-50">•</span><span>{form.referralDoctor}</span></>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/patients/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid} className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Submit Referral
          </Button>
        </div>
      </form>
    </div>
  );
}

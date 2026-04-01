import { useState, useEffect, useCallback, ElementType } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Navigation2, WifiOff, Sun, ArrowLeft,
  ChevronRight, CheckCircle2, Stethoscope, Receipt,
  Truck, User, Loader2, RefreshCw, Thermometer, Activity, Mic2, PawPrint,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VitalsPad, VitalsData } from "@/components/field/VitalsPad";
import { ProcedureChips, FIELD_PROCEDURES } from "@/components/field/ProcedureChips";
import { VoiceNoteInput } from "@/components/field/VoiceNoteInput";
import { MpesaFlow } from "@/components/field/MpesaFlow";
import { getPatients } from "@/lib/patientStore";

// ── Types ──────────────────────────────────────────────────────────────────
type Step = "journey" | "patient" | "exam" | "billing" | "success";
type GpsStatus = "idle" | "locating" | "done" | "error";

interface Journey { status: GpsStatus; distance: number; transportFee: number; address: string }

// ── Constants ──────────────────────────────────────────────────────────────
// Demo clinic location (Nairobi, Kenya) — replace with clinic settings
const CLINIC_LAT = -1.2921;
const CLINIC_LON = 36.8219;
const KES_PER_KM = 50;          // transport rate
const CONSULT_FEE = 1500;        // baseline consultation
const PROCEDURE_PRICE = 800;     // price per procedure chip

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toR = (d: number) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const formatKES = (n: number) =>
  `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Step labels ────────────────────────────────────────────────────────────
const STEPS: { id: Step; label: string; icon: ElementType }[] = [
  { id: "journey", label: "Journey",  icon: Truck },
  { id: "patient", label: "Patient",  icon: User },
  { id: "exam",    label: "Exam",     icon: Stethoscope },
  { id: "billing", label: "Billing",  icon: Receipt },
];

// ── Offline banner ─────────────────────────────────────────────────────────
function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-xs font-semibold">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Offline — data saving locally, will sync when reconnected</span>
      <RefreshCw className="h-3.5 w-3.5 ml-auto animate-spin" />
    </div>
  );
}

// ── Progress stepper ───────────────────────────────────────────────────────
function StepBar({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center px-4 py-3 gap-0">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className={cn(
              "flex flex-col items-center gap-0.5 min-w-[48px]",
            )}>
              <div className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all",
                done   ? "bg-primary border-primary text-primary-foreground" :
                active ? "bg-primary/10 border-primary text-primary" :
                         "bg-muted border-border text-muted-foreground"
              )}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground"
              )}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all",
                i < idx ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Journey step ───────────────────────────────────────────────────────────
function JourneyStep({ journey, onStart, onContinue }: {
  journey: Journey;
  onStart: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 px-4 pb-4">
      <div className="text-center pt-4 pb-2">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Navigation2 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Start Field Journey</h2>
        <p className="text-sm text-muted-foreground mt-1">
          GPS will calculate distance from clinic &amp; add transport fee to bill
        </p>
      </div>

      {journey.status === "idle" && (
        <button onClick={onStart}
          className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-lg font-bold
                     flex items-center justify-center gap-3 active:scale-98 shadow-lg shadow-primary/30">
          <MapPin className="h-6 w-6" />
          Start Journey
        </button>
      )}

      {journey.status === "locating" && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm font-medium">Acquiring GPS location…</p>
          <p className="text-xs text-muted-foreground">Please allow location access</p>
        </div>
      )}

      {(journey.status === "done" || journey.status === "error") && (
        <div className="space-y-4">
          {journey.status === "done" ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Farm Location</p>
                  <p className="font-semibold text-sm mt-0.5">{journey.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-background border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{journey.distance.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">km from clinic</p>
                </div>
                <div className="rounded-xl bg-background border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{formatKES(journey.transportFee)}</p>
                  <p className="text-xs text-muted-foreground">transport fee</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive font-medium">Could not get GPS location.</p>
              <button onClick={onStart} className="mt-2 text-xs underline text-primary">Try again</button>
            </div>
          )}
        </div>
      )}

      {(journey.status === "done" || journey.status === "error") && (
        <button onClick={onContinue}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base
                     flex items-center justify-center gap-2 active:scale-98">
          {journey.status === "error" ? "Continue without GPS" : "Continue"}
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <button onClick={onContinue}
        className="text-sm text-muted-foreground text-center underline">
        Skip (clinic visit)
      </button>
    </div>
  );
}

// ── Patient step ───────────────────────────────────────────────────────────
function PatientStep({ selected, onSelect, onContinue }: {
  selected: string | null;
  onSelect: (id: string, name: string) => void;
  onContinue: () => void;
}) {
  const patients = getPatients().slice(0, 20);
  const [query, setQuery] = useState("");
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.owner?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div>
        <h2 className="text-lg font-bold mt-4">Select Patient</h2>
        <p className="text-sm text-muted-foreground">Who are we seeing today?</p>
      </div>

      <input
        type="search"
        placeholder="Search patient or owner…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full h-12 px-4 rounded-xl border border-input bg-background text-sm"
      />

      <div className="space-y-2 max-h-[45vh] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-sm text-center text-muted-foreground py-6">No patients found</p>
        )}
        {filtered.map(p => (
          <button key={p.id} onClick={() => onSelect(p.id, p.name)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-98",
              selected === p.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40"
            )}>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <PawPrint className="h-5 w-5 text-primary/70" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground truncate">{p.owner} · {p.species}</p>
            </div>
            {selected === p.id && <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />}
          </button>
        ))}
      </div>

      {patients.length === 0 && (
        <p className="text-xs text-center text-muted-foreground">
          No patients yet — generate mock data from dashboard first
        </p>
      )}

      <button onClick={onContinue} disabled={!selected}
        className={cn(
          "w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-98",
          selected
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
        )}>
        Continue to Exam <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// ── Exam step ──────────────────────────────────────────────────────────────
function ExamStep({ patientName, vitals, onVitalChange, procedures, onProceduresChange,
  voiceNote, onVoiceNoteChange, onContinue }: {
  patientName: string;
  vitals: VitalsData;
  onVitalChange: (k: keyof VitalsData, v: string) => void;
  procedures: string[];
  onProceduresChange: (p: string[]) => void;
  voiceNote: string;
  onVoiceNoteChange: (t: string) => void;
  onContinue: () => void;
}) {
  const [section, setSection] = useState<"vitals" | "procedures" | "notes">("vitals");
  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="mt-4">
        <h2 className="text-lg font-bold">Quick Exam</h2>
        <p className="text-sm text-muted-foreground">{patientName}</p>
      </div>

      {/* Section tabs */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted p-1">
        {(["vitals", "procedures", "notes"] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={cn(
              "py-2 rounded-lg text-xs font-semibold capitalize transition-all",
              section === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}>
            <span className="inline-flex items-center gap-1.5">
              {s === "vitals" ? <><Thermometer className="h-3.5 w-3.5" />Vitals</> : s === "procedures" ? <><Activity className="h-3.5 w-3.5" />Procedures</> : <><Mic2 className="h-3.5 w-3.5" />Notes</>}
            </span>
          </button>
        ))}
      </div>

      {section === "vitals" && (
        <VitalsPad vitals={vitals} onChange={onVitalChange} />
      )}

      {section === "procedures" && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">Tap all that apply:</p>
          <ProcedureChips selected={procedures} onChange={onProceduresChange} />
        </div>
      )}

      {section === "notes" && (
        <VoiceNoteInput
          value={voiceNote}
          onChange={onVoiceNoteChange}
          placeholder="Tap microphone to dictate progress notes…"
        />
      )}

      <button onClick={onContinue}
        className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base
                   flex items-center justify-center gap-2 active:scale-98 mt-2
                   shadow-lg shadow-primary/30">
        Proceed to Billing <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// ── Success step ───────────────────────────────────────────────────────────
function SuccessStep({ patientName, onDone }: { patientName: string; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-6">
      <div className="h-28 w-28 rounded-full bg-emerald-100 dark:bg-emerald-950/50
                      flex items-center justify-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Discharge Successful</h2>
        <p className="text-base font-semibold">{patientName}</p>
        <p className="text-sm text-muted-foreground">Clinical record saved · Payment confirmed · Receipt sent</p>
      </div>
      <button onClick={onDone}
        className="w-full max-w-xs h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-98">
        Start New Visit
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function FieldMode() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("journey");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [sunlight, setSunlight] = useState(false);

  const [journey, setJourney] = useState<Journey>({
    status: "idle", distance: 0, transportFee: 0, address: "",
  });
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [vitals, setVitals] = useState<VitalsData>({
    temperature: "", weight: "", heartRate: "", respiratoryRate: "",
  });
  const [procedures, setProcedures] = useState<string[]>([]);
  const [voiceNote, setVoiceNote] = useState("");

  // Online/offline
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Sunlight mode: toggle .sunlight class on root
  useEffect(() => {
    document.documentElement.classList.toggle("sunlight", sunlight);
    return () => document.documentElement.classList.remove("sunlight");
  }, [sunlight]);

  // GPS journey start
  const startJourney = useCallback(() => {
    setJourney(j => ({ ...j, status: "locating" }));
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const dist = haversine(CLINIC_LAT, CLINIC_LON, latitude, longitude);
        const fee = Math.round(dist * KES_PER_KM);
        setJourney({
          status: "done",
          distance: parseFloat(dist.toFixed(1)),
          transportFee: fee,
          address: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
        });
      },
      () => setJourney(j => ({ ...j, status: "error" })),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  const handleVitalChange = useCallback((k: keyof VitalsData, v: string) => {
    setVitals(prev => ({ ...prev, [k]: v }));
  }, []);

  // Build billing lines
  const billLines = [
    { label: "Consultation Fee", amount: CONSULT_FEE },
    ...(journey.transportFee > 0
      ? [{ label: `Transport (${journey.distance} km @ KES ${KES_PER_KM}/km)`, amount: journey.transportFee }]
      : []),
    ...procedures.map(id => {
      const proc = FIELD_PROCEDURES.find(p => p.id === id);
      return { label: proc?.label ?? id, amount: PROCEDURE_PRICE };
    }),
  ];

  const reset = () => {
    setStep("journey");
    setJourney({ status: "idle", distance: 0, transportFee: 0, address: "" });
    setPatientId(null); setPatientName(""); setProcedures([]);
    setVitals({ temperature: "", weight: "", heartRate: "", respiratoryRate: "" });
    setVoiceNote("");
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-background text-foreground",
      sunlight && "sunlight"
    )}>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/dashboard")}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="font-bold text-sm leading-none">Field Mode</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">InnoVetPro · Vet in the Field</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Online indicator */}
            <div className={cn(
              "h-2 w-2 rounded-full",
              isOnline ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
            )} title={isOnline ? "Online" : "Offline"} />
            {/* Sunlight mode toggle */}
            <button onClick={() => setSunlight(s => !s)}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-colors",
                sunlight ? "bg-yellow-400 text-black" : "hover:bg-muted text-muted-foreground"
              )}
              title="Toggle Sunlight Mode">
              <Sun className="h-5 w-5" />
            </button>
          </div>
        </div>
        <OfflineBanner online={isOnline} />
        {step !== "success" && <StepBar current={step} />}
      </header>

      {/* ── Step content ── */}
      <div className="flex-1 overflow-y-auto">
        {step === "journey" && (
          <JourneyStep
            journey={journey}
            onStart={startJourney}
            onContinue={() => setStep("patient")}
          />
        )}
        {step === "patient" && (
          <PatientStep
            selected={patientId}
            onSelect={(id, name) => { setPatientId(id); setPatientName(name); }}
            onContinue={() => setStep("exam")}
          />
        )}
        {step === "exam" && (
          <ExamStep
            patientName={patientName || "Unknown Patient"}
            vitals={vitals}
            onVitalChange={handleVitalChange}
            procedures={procedures}
            onProceduresChange={setProcedures}
            voiceNote={voiceNote}
            onVoiceNoteChange={setVoiceNote}
            onContinue={() => setStep("billing")}
          />
        )}
        {step === "billing" && (
          <div className="px-4 pb-4">
            <div className="mt-4 mb-5">
              <h2 className="text-lg font-bold">Payment</h2>
              <p className="text-sm text-muted-foreground">{patientName || "Patient"}</p>
            </div>
            <MpesaFlow
              lines={billLines}
              patientName={patientName || "Patient"}
              onSuccess={() => setStep("success")}
            />
          </div>
        )}
        {step === "success" && (
          <SuccessStep patientName={patientName || "Patient"} onDone={reset} />
        )}
      </div>
    </div>
  );
}

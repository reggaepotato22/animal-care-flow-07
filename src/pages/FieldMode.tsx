import { useState, useEffect, useCallback, useRef, ElementType } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  MapPin, Navigation2, WifiOff, Sun, ArrowLeft, Mic, Waves, ChevronRight,
  CheckCircle2, Stethoscope, Receipt, Truck, User, Loader2, RefreshCw,
  Thermometer, Activity, Mic2, PawPrint, DatabaseZap, Home, Users, CreditCard,
  CloudRain, Sun as SunIcon, Cloud, Smartphone, X, Send, FileText, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { VitalsPad, VitalsData } from "@/components/field/VitalsPad";
import { ProcedureChips, FIELD_PROCEDURES } from "@/components/field/ProcedureChips";
import { VoiceNoteInput } from "@/components/field/VoiceNoteInput";
import { MpesaFlow } from "@/components/field/MpesaFlow";
import { getPatients } from "@/lib/patientStore";
import { seedMockData } from "@/lib/dataSeed";
import { NotificationBell } from "@/components/NotificationBell";
import { summarizeVetNote, formatAsSOAP } from "@/lib/aiSummarizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useRole } from "@/contexts/RoleContext";
import { broadcast } from "@/lib/realtimeEngine";

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
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-center text-muted-foreground">No patients yet</p>
          <button
            onClick={() => { seedMockData(); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-98 shadow-md shadow-primary/30">
            <DatabaseZap className="h-4 w-4" />
            Generate Demo Data
          </button>
          <p className="text-xs text-muted-foreground/70">Fills the app with sample patients &amp; records</p>
        </div>
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

// ═══════════════════════════════════════════════════════════════════════════
// Web Speech API Type Declarations
// ═══════════════════════════════════════════════════════════════════════════
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE FIELD MODULE — NEW COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── Species emoji helper ────────────────────────────────────────────────────
function getSpeciesEmoji(species: string): string {
  const map: Record<string, string> = {
    cow: "🐄", cattle: "🐄", bull: "🐂", heifer: "🐄", calf: "🐂",
    goat: "🐐", sheep: "🐑", lamb: "🐑",
    dog: "🐕", puppy: "🐕",
    cat: "🐈", kitten: "🐈",
    pig: "🐖", piglet: "🐖",
    horse: "🐎", foal: "🐎",
    donkey: "🫏",
    chicken: "🐔", hen: "🐔", rooster: "🐓",
    duck: "🦆", turkey: "🦃", rabbit: "🐇",
  };
  return map[species.toLowerCase()] || "🐾";
}

// ── Weather emoji placeholder ────────────────────────────────────────────
function getWeatherEmoji(): string {
  const emojis = ["☀️", "⛅", "☁️", "🌧️"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

// ── Stats Card Component ─────────────────────────────────────────────────────
function StatsCard({ label, value, trend, icon: Icon, color }: {
  label: string; value: string; trend?: string; icon: typeof Home; color: string;
}) {
  return (
    <div className={cn(
      "flex-shrink-0 w-36 rounded-2xl p-4 border shadow-sm",
      "bg-card border-border"
    )}>
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {trend && (
        <p className="text-[10px] text-emerald-600 font-medium mt-1">{trend}</p>
      )}
    </div>
  );
}

// ── Waveform Animation Component ────────────────────────────────────────────
function WaveformAnimation({ isRecording }: { isRecording: boolean }) {
  if (!isRecording) return null;
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-primary rounded-full"
          animate={{
            height: [8, 24, 8],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// ── AI Dictation Panel ─────────────────────────────────────────────────────
function DictationPanel({ 
  onSummarize, 
  onSaveSOAP,
  patientName 
}: { 
  onSummarize?: (summary: ReturnType<typeof summarizeVetNote>) => void;
  onSaveSOAP?: (soap: ReturnType<typeof formatAsSOAP>) => void;
  patientName?: string;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [summary, setSummary] = useState<ReturnType<typeof summarizeVetNote> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setIsSupported(false);
    }
  }, []);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-KE,sw-KE";
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      setTranscript(prev => prev + final + interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (isRecording) recognition.start();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript("");
    setSummary(null);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleSummarize = () => {
    if (!transcript.trim()) return;
    const result = summarizeVetNote(transcript);
    setSummary(result);
    onSummarize?.(result);
  };

  const handleSaveSOAP = () => {
    if (!summary) return;
    const soap = formatAsSOAP(summary);
    onSaveSOAP?.(soap);
    // Reset after save
    setTranscript("");
    setSummary(null);
  };

  if (!isSupported) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Speech recognition not supported. Try Chrome or Edge browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mic Button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          data-tutorial="dictate-btn"
          className={cn(
            "h-20 w-20 rounded-full flex items-center justify-center transition-all",
            "shadow-lg",
            isRecording 
              ? "bg-red-500 text-white animate-pulse shadow-red-500/30" 
              : "bg-primary text-primary-foreground shadow-primary/30 hover:scale-105"
          )}
        >
          <Mic className="h-8 w-8" />
        </button>
        <p className="text-xs text-muted-foreground text-center">
          {isRecording ? "Recording... Tap to stop" : "Tap to dictate in English or Kiswahili"}
        </p>
      </div>

      {/* Waveform */}
      <WaveformAnimation isRecording={isRecording} />

      {/* Transcript Area */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted rounded-xl p-3"
        >
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Transcription</p>
          <p className="text-sm">{transcript}</p>
        </motion.div>
      )}

      {/* Action Buttons */}
      {transcript && !summary && (
        <Button 
          onClick={handleSummarize}
          className="w-full h-14 gap-2"
          variant="outline"
        >
          <Sparkles className="h-5 w-5" />
          Summarize with AI
        </Button>
      )}

      {/* Summary Preview */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">AI Summary</p>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Complaint:</span>
              <p className="font-medium">{summary.complaint}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Diagnosis:</span>
              <p className="font-medium">{summary.diagnosis}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Treatment:</span>
              <p className="font-medium">{summary.treatment}</p>
            </div>
            {summary.followUpDate && (
              <div>
                <span className="text-muted-foreground text-xs">Follow-up:</span>
                <p className="font-medium">{summary.followUpDate}</p>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSaveSOAP}
            className="w-full h-14 gap-2"
          >
            <FileText className="h-5 w-5" />
            Save as SOAP Note
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ── M-Pesa Payment Sheet ───────────────────────────────────────────────────
function MpesaPaymentSheet({ 
  patientId, 
  patientName,
  clientPhone,
  amount,
  onSuccess 
}: { 
  patientId: string;
  patientName: string;
  clientPhone?: string;
  amount: number;
  onSuccess?: () => void;
}) {
  const [phone, setPhone] = useState(clientPhone || "");
  const [desc, setDesc] = useState(`Vet services for ${patientName}`);
  const [status, setStatus] = useState<"idle" | "sending" | "pending" | "success">("idle");
  const { role } = useRole();

  const handleSendSTK = async () => {
    setStatus("sending");
    
    // Simulate STK push
    await new Promise(r => setTimeout(r, 2000));
    
    setStatus("pending");
    
    // Create pending invoice in billingStore
    const { createInvoice } = await import("@/lib/billingStore");
    const invoice = createInvoice({
      patientId,
      petName: patientName,
      clientName: "Field Client",
      clientPhone: phone,
      services: [desc],
      total: amount,
      status: "pending",
    });
    
    // Broadcast event
    broadcast({
      type: "BILLING_LOCKED",
      payload: { 
        invoiceId: invoice.id, 
        patientName, 
        amount,
        phone,
        mpesaPending: true 
      },
      actorRole: role || "Vet",
      actorName: "Field Vet",
    });
    
    // Simulate success after delay
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => onSuccess?.(), 1500);
    }, 4000);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base gap-2"
        >
          <Smartphone className="h-6 w-6" />
          Request M-Pesa Payment
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto pb-8">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            M-Pesa Payment
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4 mt-4">
          {status === "idle" && (
            <>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-emerald-700">
                  KES {amount.toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600">Amount to pay</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold">Phone Number</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="254712345678"
                    className="h-14 text-lg"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold">Description</label>
                  <Input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Payment description"
                    className="h-14"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSendSTK}
                disabled={!phone || phone.length < 10}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg"
              >
                <Send className="h-5 w-5 mr-2" />
                Send STK Push
              </Button>
            </>
          )}
          
          {status === "sending" && (
            <div className="py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
              <p className="font-semibold">Sending STK push...</p>
              <p className="text-sm text-muted-foreground">Check your phone for the prompt</p>
            </div>
          )}
          
          {status === "pending" && (
            <div className="py-8 text-center">
              <div className="h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto mb-4" />
              <p className="font-semibold">Awaiting M-Pesa confirmation...</p>
              <p className="text-sm text-muted-foreground">Please complete the payment on your phone</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <p className="text-xl font-bold text-emerald-600">Payment Confirmed!</p>
              <p className="text-sm text-muted-foreground">KES {amount.toLocaleString()} received</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Bottom Navigation ───────────────────────────────────────────────────────
function BottomNav({ activeTab, onTabChange, lastSync }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  lastSync: string;
}) {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "patients", label: "Patients", icon: Users },
    { id: "dictate", label: "Dictate", icon: Mic },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "sync", label: "Sync", icon: RefreshCw },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-sm mx-auto flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 px-3 py-1 relative"
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] transition-colors",
                isActive ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full"
                />
              )}
              {tab.id === "sync" && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      {/* Last sync indicator */}
      <div className="text-center pb-1">
        <span className="text-[9px] text-muted-foreground">Last sync: {lastSync}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW MOBILE FIELD MODE — Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function FieldMode() {
  const navigate = useNavigate();
  const { role } = useRole();
  
  // State
  const [activeTab, setActiveTab] = useState("home");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [clinicName, setClinicName] = useState("InnoVet Pro Clinic");
  const [lastSync, setLastSync] = useState(format(new Date(), "HH:mm"));
  
  // Patient selection
  const [selectedPatient, setSelectedPatient] = useState<ReturnType<typeof getPatients>[0] | null>(null);
  
  // Dictation summary
  const [lastSummary, setLastSummary] = useState<ReturnType<typeof summarizeVetNote> | null>(null);

  // Load clinic name
  useEffect(() => {
    const name = localStorage.getItem("acf_clinic_name");
    if (name) setClinicName(name);
  }, []);

  // Online/offline listener
  useEffect(() => {
    const on = () => { setIsOnline(true); setLastSync(format(new Date(), "HH:mm")); };
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Load patients
  const patients = useMemo(() => getPatients().slice(0, 20), []);
  const todayVisits = 3; // Mock data
  const pendingFollowups = 5; // Mock data

  // Handle sync
  const handleSync = () => {
    setLastSync(format(new Date(), "HH:mm"));
    // Broadcast sync event
    broadcast({
      type: "SYNC_COMPLETED",
      payload: { timestamp: new Date().toISOString() },
      actorRole: role || "Vet",
      actorName: "Field Vet",
    });
  };

  // Handle save SOAP from dictation
  const handleSaveSOAP = async (soap: ReturnType<typeof formatAsSOAP>) => {
    if (!selectedPatient) return;
    
    // Save to clinical records
    const { upsertClinicalRecord } = await import("@/lib/clinicalRecordStore");
    upsertClinicalRecord({
      encounterId: `field-${Date.now()}`,
      patientId: selectedPatient.id,
      petName: selectedPatient.name,
      ownerName: selectedPatient.owner,
      veterinarian: "Field Vet",
      status: "complete",
      savedAt: new Date().toISOString(),
      data: {
        soap,
        source: "field_mode_dictation",
        recordedVia: "ai_speech"
      }
    });
    
    // Show success
    setActiveTab("home");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Mobile Container ── */}
      <div className="max-w-sm mx-auto">
        
        {/* ── HEADER ── */}
        <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm">Field Mode</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
          
          {/* Clinic info row */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span className="font-medium truncate max-w-[120px]">{clinicName}</span>
            <div className="flex items-center gap-2">
              <span>{format(new Date(), "EEE, MMM d")}</span>
              <span>{getWeatherEmoji()}</span>
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="p-4 space-y-5">
          
          {/* QUICK STATS ROW */}
          {activeTab === "home" && (
            <>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                <StatsCard 
                  label="Farm Visits" 
                  value={todayVisits.toString()} 
                  trend="+2 today"
                  icon={Truck}
                  color="bg-primary"
                />
                <StatsCard 
                  label="Patients Seen" 
                  value={patients.length.toString()}
                  trend="Active"
                  icon={Users}
                  color="bg-blue-500"
                />
                <StatsCard 
                  label="Follow-ups" 
                  value={pendingFollowups.toString()}
                  trend="Pending"
                  icon={CheckCircle2}
                  color="bg-amber-500"
                />
              </div>

              {/* PATIENT CARD LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">Patients</h2>
                  {patients.length === 0 && (
                    <button 
                      onClick={() => seedMockData()}
                      className="text-xs text-primary font-medium"
                    >
                      + Generate demo
                    </button>
                  )}
                </div>
                
                {patients.length === 0 ? (
                  <div className="text-center py-8 bg-muted rounded-2xl">
                    <PawPrint className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No patients yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patients.map((patient) => (
                      <motion.div
                        key={patient.id}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "rounded-2xl bg-card shadow-md p-4 border-2 transition-colors",
                          selectedPatient?.id === patient.id 
                            ? "border-primary" 
                            : "border-transparent"
                        )}
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-4xl shrink-0">
                            {getSpeciesEmoji(patient.species)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold truncate">{patient.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {patient.owner}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                                {patient.species}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                                Last: {patient.lastVisit || "Never"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Swipe hint */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                          <span className="text-[10px] text-muted-foreground">
                            → Swipe for quick actions
                          </span>
                          <Button 
                            onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); setActiveTab("dictate"); }}
                            className="h-10 px-4 text-sm font-bold"
                          >
                            Start Visit
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* DICTATE TAB */}
          {activeTab === "dictate" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">AI Dictation</h2>
                {selectedPatient && (
                  <span className="text-sm text-muted-foreground">
                    {selectedPatient.name}
                  </span>
                )}
              </div>
              
              <DictationPanel 
                patientName={selectedPatient?.name}
                onSummarize={setLastSummary}
                onSaveSOAP={handleSaveSOAP}
              />
              
              {selectedPatient && (
                <div className="pt-4 border-t border-border">
                  <MpesaPaymentSheet
                    patientId={selectedPatient.id}
                    patientName={selectedPatient.name}
                    clientPhone={selectedPatient.phone}
                    amount={1500}
                    onSuccess={() => setActiveTab("home")}
                  />
                </div>
              )}
            </div>
          )}

          {/* PATIENTS TAB */}
          {activeTab === "patients" && (
            <div className="space-y-3">
              <h2 className="font-bold text-lg">All Patients</h2>
              {patients.map((patient) => (
                <div 
                  key={patient.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  onClick={() => { setSelectedPatient(patient); setActiveTab("home"); }}
                >
                  <div className="text-3xl">{getSpeciesEmoji(patient.species)}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">{patient.owner}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">Recent Payments</h2>
              <div className="bg-emerald-50 rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold text-emerald-700">KES 4,500</p>
                <p className="text-sm text-emerald-600 mt-1">Today's collections</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                  <div>
                    <p className="font-medium">Bella (Dog)</p>
                    <p className="text-xs text-muted-foreground">M-Pesa • 10:30 AM</p>
                  </div>
                  <span className="font-bold text-emerald-600">KES 1,500</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                  <div>
                    <p className="font-medium">Cow #142</p>
                    <p className="text-xs text-muted-foreground">Cash • 09:15 AM</p>
                  </div>
                  <span className="font-bold">KES 3,000</span>
                </div>
              </div>
            </div>
          )}

          {/* SYNC TAB */}
          {activeTab === "sync" && (
            <div className="space-y-4 text-center py-8">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <RefreshCw className="h-10 w-10 text-primary" />
              </div>
              <h2 className="font-bold text-xl">Sync Data</h2>
              <p className="text-sm text-muted-foreground px-4">
                Sync your field visits and patient records with the main clinic system
              </p>
              <div className="space-y-2 pt-4">
                <p className="text-xs text-muted-foreground">Last sync: {lastSync}</p>
                <Button 
                  onClick={handleSync}
                  className="w-full h-14 gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  Sync Now
                </Button>
              </div>
              <div className="pt-4 text-xs text-muted-foreground space-y-1">
                <p>Status: {isOnline ? "🟢 Online" : "🟠 Offline"}</p>
                <p>Records pending: 0</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── BOTTOM NAV ── */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          if (tab === "sync") handleSync();
          setActiveTab(tab);
        }}
        lastSync={lastSync}
      />
    </div>
  );
}

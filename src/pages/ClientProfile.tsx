// ═══════════════════════════════════════════════════════════════════════════
// ClientProfile — InnoVetPro · God-Tier Minimalist Command Center
// Borderless depth · Glass comms · Framer Motion · Brand icons
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, Mail, MapPin, Star, AlertTriangle,
  Wallet, PawPrint, Send, Check, CheckCheck, Clock, Zap,
  Stethoscope, FlaskConical, CreditCard, RefreshCcw, Bell, FileText,
  Syringe, Scissors, Plus, Edit, User, Heart, Search, X,
  Activity, TrendingUp, Shield, Command, ChevronRight,
  Sparkles, Calendar, ExternalLink,
} from "lucide-react";
import {
  getClientById, getLinksForClient, getCommEvents, getTimeline,
  addCommEvent, upsertClient, seedDemoClients,
  type Client, type CommEvent, type TimelineEvent, type ClientPatientLink,
  type CommEventType,
} from "@/lib/clientStore";
import { getPatients } from "@/lib/patientStore";
import { formatKES } from "@/lib/kenya";

// ─── Brand SVG Icons ──────────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
function GmailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M2 6.5A2.5 2.5 0 014.5 4h15A2.5 2.5 0 0122 6.5v11a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 17.5V6.5z" stroke="#EA4335" strokeWidth="1.5"/>
      <path d="M2 7l10 7 10-7" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function SmsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="currentColor" fillOpacity="0.12"/>
      <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const LIFECYCLE = {
  "new":        { label: "New Client",  dot: "bg-sky-400",     badge: "bg-sky-500/10 text-sky-500" },
  "active":     { label: "Active",      dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-500" },
  "dormant":    { label: "Dormant",     dot: "bg-zinc-400",    badge: "bg-zinc-500/10 text-zinc-500" },
  "high-value": { label: "High Value",  dot: "bg-violet-500",  badge: "bg-violet-500/10 text-violet-500" },
  "at-risk":    { label: "At Risk",     dot: "bg-red-500",     badge: "bg-red-500/10 text-red-500" },
} as const;

const TL_CFG = {
  visit:   { icon: Stethoscope,   accent: "text-emerald-500", bg: "bg-emerald-500/10" },
  lab:     { icon: FlaskConical,  accent: "text-blue-500",    bg: "bg-blue-500/10" },
  comm:    { icon: Zap,           accent: "text-violet-500",  bg: "bg-violet-500/10" },
  payment: { icon: CreditCard,    accent: "text-emerald-500", bg: "bg-emerald-500/10" },
  refund:  { icon: RefreshCcw,    accent: "text-orange-500",  bg: "bg-orange-500/10" },
  vaccine: { icon: Syringe,       accent: "text-pink-500",    bg: "bg-pink-500/10" },
  surgery: { icon: Scissors,      accent: "text-red-500",     bg: "bg-red-500/10" },
  note:    { icon: FileText,      accent: "text-zinc-400",    bg: "bg-zinc-500/10" },
  alert:   { icon: Bell,          accent: "text-amber-500",   bg: "bg-amber-500/10" },
} as const;

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐕", cat: "🐈", bird: "🦜", rabbit: "🐇",
  reptile: "🦎", fish: "🐟", hamster: "🐹", horse: "🐴",
};

const avatarPalette = [
  "from-violet-500 to-indigo-600", "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",     "from-amber-500 to-orange-500",
  "from-sky-500 to-blue-600",      "from-fuchsia-500 to-purple-600",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarGrad(id: string) { return avatarPalette[(id.charCodeAt(id.length - 1) || 0) % avatarPalette.length]; }
function initials(name: string) { return name.split(" ").slice(0, 2).map(n => n[0] ?? "").join("").toUpperCase(); }
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 1) return "Just now"; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday"; if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}
function MsgTick({ status }: { status: string }) {
  if (status === "read")      return <CheckCheck className="h-3 w-3 text-sky-300" strokeWidth={2} />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3 text-white/50" strokeWidth={2} />;
  if (status === "sent")      return <Check className="h-3 w-3 text-white/50" strokeWidth={2} />;
  if (status === "failed")    return <X className="h-3 w-3 text-red-400" strokeWidth={2} />;
  return <Clock className="h-3 w-3 text-white/30" strokeWidth={2} />;
}

// ─── Command Palette ──────────────────────────────────────────────────────────

interface CmdAction { label: string; icon: React.ElementType; action: () => void; kbd?: string }
function CommandPalette({ open, onClose, actions }: { open: boolean; onClose: () => void; actions: CmdAction[] }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setQ(""); setTimeout(() => ref.current?.focus(), 50); } }, [open]);
  const filtered = actions.filter(a => a.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-lg rounded-2xl bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]">
              <Search className="h-4 w-4 text-zinc-500 shrink-0" strokeWidth={1.5} />
              <input ref={ref} value={q} onChange={e => setQ(e.target.value)}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.07] text-zinc-500 ring-1 ring-white/10">ESC</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto py-1.5">
              {filtered.length === 0 && <p className="text-center text-sm text-zinc-600 py-8">No results</p>}
              {filtered.map((a, i) => (
                <motion.button key={i} whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                  onClick={() => { a.action(); onClose(); }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left">
                  <span className="p-1.5 rounded-xl bg-white/[0.06]">
                    <a.icon className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
                  </span>
                  <span className="flex-1 text-zinc-200 font-medium">{a.label}</span>
                  {a.kbd && <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-500 ring-1 ring-white/[0.08]">{a.kbd}</kbd>}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Profile Panel (Left) ─────────────────────────────────────────────────────

function ProfilePanel({ client, links, onEdit, onCmd }: {
  client: Client; links: ClientPatientLink[];
  onEdit: () => void; onCmd: () => void;
}) {
  const lc = LIFECYCLE[client.lifecycleStatus] ?? LIFECYCLE["new"];
  const isAtRisk = client.lifecycleStatus === "at-risk";
  const isHV = client.lifecycleStatus === "high-value";

  const commCols = [
    { ch: "whatsapp", Icon: WhatsAppIcon, active: true,                              color: "text-emerald-500", bg: "bg-emerald-500/10", label: "WhatsApp" },
    { ch: "email",   Icon: GmailIcon,    active: client.commPreferences.emailOptIn, color: "text-red-500",     bg: "bg-red-500/10",     label: "Gmail" },
    { ch: "sms",     Icon: SmsIcon,      active: client.commPreferences.smsOptIn,   color: "text-indigo-500",  bg: "bg-indigo-500/10",  label: "SMS" },
    { ch: "phone",   Icon: Phone,        active: client.commPreferences.callOptIn,  color: "text-sky-500",     bg: "bg-sky-500/10",     label: "Call" },
  ];

  return (
    <aside className="flex flex-col gap-5">
      {/* Identity */}
      <div className="rounded-2xl bg-card shadow-lg shadow-black/[0.06] dark:shadow-black/25 p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="relative">
            <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${avatarGrad(client.id)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
              {initials(client.name)}
            </div>
            <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card ${lc.dot}${isAtRisk ? " animate-pulse" : ""}`} />
          </div>
          <div className="flex gap-1">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onCmd}
              className="p-2 rounded-xl hover:bg-muted transition-colors" title="⌘K">
              <Command className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onEdit}
              className="p-2 rounded-xl hover:bg-muted transition-colors">
              <Edit className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </motion.button>
          </div>
        </div>

        <h2 className="font-bold text-xl tracking-tight">{client.name}</h2>
        <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${lc.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${lc.dot}${isAtRisk ? " animate-pulse" : ""}`} />
          {lc.label}
          {isHV && <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />}
        </div>

        <div className="mt-5 space-y-3">
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group">
              <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                <Phone className="h-3.5 w-3.5 group-hover:text-primary transition-colors" strokeWidth={1.5} />
              </div>
              <span className="font-medium">{client.phone}</span>
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group">
              <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                <Mail className="h-3.5 w-3.5 group-hover:text-primary transition-colors" strokeWidth={1.5} />
              </div>
              <span className="truncate">{client.email}</span>
            </a>
          )}
          {client.address && (
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
              </div>
              <span className="leading-snug pt-1.5">{client.address}{client.city ? `, ${client.city}` : ""}</span>
            </div>
          )}
        </div>

        {client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-5 pt-5 border-t border-border/30">
            {client.tags.map(t => (
              <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted/60 text-muted-foreground">
                {t === "VIP" && <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />}
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Financial — Fintech style */}
      <div className="rounded-2xl bg-card shadow-lg shadow-black/[0.06] dark:shadow-black/25 p-6">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} /> Financial
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Total Spend</p>
            <p className="text-3xl font-bold tracking-tight text-emerald-500">{formatKES(client.totalSpend)}</p>
          </div>
          <div className="h-px bg-border/30" />
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Outstanding</p>
              <p className={`text-xl font-bold ${client.outstandingBalance > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                {formatKES(client.outstandingBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground mb-0.5">Patients</p>
              <p className="text-xl font-bold">{links.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(client.behavioralFlags.length > 0 || isAtRisk) && (
        <div className="rounded-2xl bg-amber-500/5 ring-1 ring-amber-500/20 p-5">
          <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} /> Alerts
          </p>
          <div className="space-y-2">
            {isAtRisk && (
              <div className="flex items-center gap-2.5 text-xs text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                Engagement at risk — schedule follow-up
              </div>
            )}
            {client.behavioralFlags.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comms — brand icons */}
      <div className="rounded-2xl bg-card shadow-lg shadow-black/[0.06] dark:shadow-black/25 p-5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5" strokeWidth={1.5} /> Channels
        </p>
        <div className="grid grid-cols-2 gap-2">
          {commCols.map(({ ch, Icon, active, color, bg, label }) => {
            const isPref = client.commPreferences.preferredChannel === ch;
            return (
              <motion.div key={ch} whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-2 p-2.5 rounded-xl transition-all cursor-default ${active ? `${bg} ${color}` : "bg-muted/30 text-muted-foreground/40"}`}>
                <Icon className={`h-4 w-4 shrink-0 ${active ? color : ""}`} />
                <span className="text-xs font-semibold">{label}</span>
                {isPref && <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 ml-auto" />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ─── Timeline Event (vertical spine) ─────────────────────────────────────────

function TimelineItem({ ev, isLast }: { ev: TimelineEvent; isLast: boolean }) {
  const cfg = TL_CFG[ev.type as keyof typeof TL_CFG] ?? TL_CFG.note;
  const Icon = cfg.icon;
  return (
    <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
      className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && <div className="absolute left-4 top-9 bottom-0 w-px bg-gradient-to-b from-border/50 to-transparent pointer-events-none" />}
      <div className={`relative h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-background ${cfg.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${cfg.accent}`} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{ev.title}</p>
            {ev.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ev.description}</p>}
            {ev.patientName && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1.5">
                <PawPrint className="h-2.5 w-2.5" strokeWidth={1.5} /> {ev.patientName}
              </span>
            )}
          </div>
          <div className="text-right shrink-0 space-y-1">
            <p className="text-[10px] text-muted-foreground whitespace-nowrap">{relTime(ev.timestamp)}</p>
            {ev.amount !== undefined && (
              <p className={`text-xs font-bold ${ev.type === "refund" ? "text-orange-500" : "text-emerald-500"}`}>
                {ev.type === "refund" ? "−" : "+"}{formatKES(ev.amount)}
              </p>
            )}
            {ev.status && (
              <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                ev.status === "completed" || ev.status === "paid" ? "bg-emerald-500/10 text-emerald-500" :
                ev.status === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
              }`}>{ev.status}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Center Panel — Framer Motion Tabs ───────────────────────────────────────

function CenterPanel({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [tab, setTab] = useState<"timeline" | "comms">("timeline");
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [commEvents, setCommEvents] = useState<CommEvent[]>([]);
  const [channel, setChannel] = useState<CommEventType>("sms");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [tlFilter, setTlFilter] = useState("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    setTimeline(getTimeline(clientId));
    setCommEvents(getCommEvents(clientId));
  }, [clientId]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (tab === "comms") bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [commEvents, tab]);

  const filteredTl = useMemo(() =>
    tlFilter === "all" ? timeline : timeline.filter(e => e.type === tlFilter),
    [timeline, tlFilter]
  );

  function sendMsg() {
    if (!message.trim()) return;
    addCommEvent({ clientId, type: channel, direction: "outbound", content: message.trim(), subject: subject || undefined, status: "sent", createdBy: "Staff" });
    setMessage(""); setSubject(""); refresh();
  }

  const channelMeta = [
    { id: "sms" as CommEventType,      Icon: SmsIcon,      activeBg: "bg-indigo-500",  label: "SMS" },
    { id: "email" as CommEventType,    Icon: GmailIcon,    activeBg: "bg-red-500",     label: "Gmail" },
    { id: "whatsapp" as CommEventType, Icon: WhatsAppIcon, activeBg: "bg-emerald-500", label: "WhatsApp" },
    { id: "call" as CommEventType,     Icon: Phone,        activeBg: "bg-sky-500",     label: "Call" },
  ];

  return (
    <div className="rounded-2xl bg-card shadow-lg shadow-black/[0.06] dark:shadow-black/25 overflow-hidden flex flex-col">
      {/* Tab bar with motion underline */}
      <div className="flex items-center border-b border-border/20 px-1 bg-muted/10">
        {[{ id: "timeline", label: "Event Stream", icon: Activity }, { id: "comms", label: "Communications", icon: Zap }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`relative flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium transition-colors ${tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t.label}
            {tab === t.id && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
          </button>
        ))}
        <div className="ml-auto pr-4 text-[11px] text-muted-foreground">
          {tab === "timeline" ? `${filteredTl.length} events` : `${commEvents.length} messages`}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "timeline" && (
          <motion.div key="tl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }} className="flex flex-col">
            <div className="flex items-center gap-1.5 px-5 py-3 overflow-x-auto border-b border-border/20 bg-muted/10">
              {["all", "visit", "lab", "payment", "vaccine", "comm"].map(f => (
                <motion.button key={f} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setTlFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    tlFilter === f ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}>
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </motion.button>
              ))}
            </div>
            <ScrollArea className="h-[520px]">
              <div className="p-5">
                {filteredTl.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                      <Activity className="h-7 w-7 opacity-30" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium">No events yet</p>
                    <p className="text-xs opacity-50 mt-1">Events appear as the patient journey progresses</p>
                  </div>
                ) : filteredTl.map((ev, i) => <TimelineItem key={ev.id} ev={ev} isLast={i === filteredTl.length - 1} />)}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {tab === "comms" && (
          <motion.div key="comms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }} className="flex flex-col h-[580px]">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/20 bg-muted/10">
              {channelMeta.map(({ id, Icon, activeBg, label }) => (
                <motion.button key={id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setChannel(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    channel === id ? `${activeBg} text-white shadow-sm` : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}>
                  <Icon className={`h-3.5 w-3.5 ${channel === id ? "text-white" : ""}`} />
                  {label}
                </motion.button>
              ))}
            </div>
            <ScrollArea className="flex-1 px-5 py-4">
              {commEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <div className="h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
                    <Zap className="h-6 w-6 opacity-30" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs opacity-50 mt-1">Send your first message to {clientName}</p>
                </div>
              ) : commEvents.map(ev => (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex mb-3 ${ev.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
                    ev.direction === "outbound"
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm shadow-lg shadow-indigo-500/20"
                      : "bg-muted/70 text-foreground rounded-tl-sm"
                  }`}>
                    {ev.subject && <p className={`text-[10px] font-semibold mb-1 ${ev.direction === "outbound" ? "text-white/60" : "text-muted-foreground"}`}>{ev.subject}</p>}
                    <p className="text-sm leading-relaxed">{ev.content}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1.5">
                      <span className={`text-[9px] ${ev.direction === "outbound" ? "text-white/50" : "text-muted-foreground"}`}>{relTime(ev.createdAt)}</span>
                      {ev.direction === "outbound" && (
                        <span className="flex items-center gap-0.5 text-[9px] text-white/50">
                          <MsgTick status={ev.status} />
                          {ev.status === "read" ? "Read" : ev.status === "delivered" ? "Delivered" : "Sent"}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={bottomRef} />
            </ScrollArea>
            <div className="p-4 border-t border-border/20 bg-muted/10">
              {channel === "email" && (
                <Input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Subject…" className="mb-2 text-sm h-8 bg-background/60 border-border/40" />
              )}
              <div className="flex gap-2 items-end">
                <Textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder={`Message ${clientName} via ${channelMeta.find(c => c.id === channel)?.label ?? channel}…`}
                  className="resize-none text-sm min-h-[52px] max-h-32 bg-background/60 border-border/40 flex-1"
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMsg(); }} />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={sendMsg}
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                  <Send className="h-4 w-4" strokeWidth={1.5} />
                </motion.button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 pl-1">⌘↵ to send</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Patient Mini Card ────────────────────────────────────────────────────────

function PatientMiniCard({ link, patient, onNewRecord, onView }: {
  link: ClientPatientLink; patient: any;
  onNewRecord: (id: string) => void; onView: (id: string) => void;
}) {
  const emoji = SPECIES_EMOJI[(patient?.species ?? "").toLowerCase()] ?? "🐾";
  const grad = avatarPalette[(link.patientId.charCodeAt(link.patientId.length - 1) || 3) % avatarPalette.length];
  return (
    <motion.div whileHover={{ y: -2 }}
      className="rounded-2xl bg-card shadow-md shadow-black/[0.05] dark:shadow-black/20 overflow-hidden">
      <div className={`h-1 w-full bg-gradient-to-r ${grad}`} />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-xl shadow-sm shrink-0`}>
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm truncate">{link.patientName}</p>
              {link.isPrimaryCommsTarget && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">PRIMARY</span>}
            </div>
            <p className="text-xs text-muted-foreground capitalize">{patient?.species ?? "Unknown"}{patient?.breed ? ` · ${patient.breed}` : ""}</p>
          </div>
        </div>
        <div className="space-y-1.5 mb-3">
          {link.lastVisit && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" strokeWidth={1.5} /> Last visit</span>
              <span className="font-medium">{new Date(link.lastVisit).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}</span>
            </div>
          )}
          {link.nextVaccinesDue && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Syringe className="h-3 w-3" strokeWidth={1.5} /> Vaccines due</span>
              <span className="font-medium text-amber-500">{new Date(link.nextVaccinesDue).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" strokeWidth={1.5} /> Responsibility</span>
            <span className="font-medium">{link.financialResponsibilityShare}%</span>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => onNewRecord(link.patientId)}
            className="flex-1 h-8 text-xs font-semibold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-1.5 shadow-sm">
            <Stethoscope className="h-3.5 w-3.5" strokeWidth={1.5} /> New Record
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => onView(link.patientId)}
            className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyHousehold({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={onAdd}
      className="w-full rounded-2xl border-2 border-dashed border-border/40 hover:border-primary/40 bg-transparent hover:bg-primary/[0.02] transition-all p-8 flex flex-col items-center gap-3 group">
      <div className="h-14 w-14 rounded-2xl bg-muted/40 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
        <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Register a Patient</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">Link a new patient to this client</p>
      </div>
    </motion.button>
  );
}

// ─── Right Panel — Household ──────────────────────────────────────────────────

function HouseholdPanel({ clientId, links, navigate }: {
  clientId: string; links: ClientPatientLink[];
  navigate: (path: string) => void;
}) {
  const patients = useMemo(() => getPatients(), []);
  const enriched = useMemo(() =>
    links.map(l => ({ link: l, patient: patients.find(p => p.id === l.patientId || (p as any).patientId === l.patientId) ?? null })),
    [links, patients]
  );
  const roleColors: Record<string, string> = {
    owner:             "text-indigo-500 bg-indigo-500/10",
    caretaker:         "text-teal-500 bg-teal-500/10",
    emergency_contact: "text-red-500 bg-red-500/10",
    billing_only:      "text-zinc-500 bg-zinc-500/10",
  };

  return (
    <aside className="flex flex-col gap-4">
      <div className="rounded-2xl bg-card shadow-lg shadow-black/[0.06] dark:shadow-black/25 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-border/20">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-500" strokeWidth={1.5} /> Household · {links.length}
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/patients/add")}
            className="h-6 w-6 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-primary/10 transition-colors">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          </motion.button>
        </div>
        <div className="p-4 space-y-4">
          {enriched.length === 0
            ? <EmptyHousehold onAdd={() => navigate("/patients/add")} />
            : enriched.map(({ link, patient }) => (
                <div key={link.id}>
                  <PatientMiniCard link={link} patient={patient}
                    onNewRecord={pid => navigate(`/records/new?patientId=${pid}`)}
                    onView={pid => navigate(`/patients/${pid}`)} />
                  <div className="flex items-center mt-1.5 px-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${roleColors[link.role] ?? roleColors.owner}`}>
                      {link.role.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {links.length > 0 && (
        <div className="rounded-2xl bg-card shadow-lg shadow-black/[0.06] dark:shadow-black/25 p-5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" strokeWidth={1.5} /> Relationship Map
          </p>
          <div className="space-y-2.5">
            {["owner", "caretaker", "emergency_contact", "billing_only"].map(role => {
              const count = links.filter(l => l.role === role).length;
              if (!count) return null;
              return (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize">{role.replace("_", " ")}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[role] ?? ""}`}>
                    {count} patient{count !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditClientDialog({ client, open, onClose, onSave }: {
  client: Client; open: boolean;
  onClose: () => void; onSave: (c: Client) => void;
}) {
  const [form, setForm] = useState({ name: client.name, email: client.email, phone: client.phone, address: client.address, city: client.city, notes: client.notes });
  const [status, setStatus] = useState(client.lifecycleStatus);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [k]: e.target.value }));
  function save() { onSave(upsertClient({ ...client, ...form, lifecycleStatus: status })); onClose(); }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          {[
            { label: "Full Name", key: "name" as const },
            { label: "Phone",     key: "phone" as const },
            { label: "Email",     key: "email" as const },
            { label: "Address",   key: "address" as const },
            { label: "City",      key: "city" as const },
          ].map(({ label, key }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input value={form[key]} onChange={set(key)} className="h-8 text-sm" />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(LIFECYCLE) as Array<keyof typeof LIFECYCLE>).map(s => (
                <motion.button key={s} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setStatus(s as any)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {LIFECYCLE[s].label}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea value={form.notes} onChange={set("notes")} className="resize-none min-h-[60px] text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="h-8 text-sm">Cancel</Button>
          <Button onClick={save} className="h-8 text-sm">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [links, setLinks] = useState<ClientPatientLink[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const reload = useCallback(() => {
    if (!id) return;
    const c = getClientById(id);
    if (!c) { setNotFound(true); return; }
    setClient(c); setLinks(getLinksForClient(id));
  }, [id]);

  useEffect(() => { seedDemoClients(); reload(); }, [reload]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(v => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const cmdActions: CmdAction[] = useMemo(() => !client ? [] : [
    { label: "Send SMS",           icon: Zap,        action: () => navigate(`/clients/${client.id}#comms`), kbd: "S" },
    { label: "Send Email",         icon: Mail,       action: () => navigate(`/clients/${client.id}#comms`) },
    { label: "Call Client",        icon: Phone,      action: () => window.open(`tel:${client.phone}`) },
    { label: "Edit Client",        icon: Edit,       action: () => setEditOpen(true), kbd: "E" },
    { label: "New Patient Record", icon: Stethoscope,action: () => navigate("/records/new") },
    { label: "Register Patient",   icon: PawPrint,   action: () => navigate("/patients/add") },
    { label: "All Clients",        icon: User,       action: () => navigate("/clients"), kbd: "B" },
    { label: "View Billing",       icon: Wallet,     action: () => navigate("/billing") },
  ], [client, navigate]);

  if (notFound) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
      <User className="h-10 w-10 opacity-30" strokeWidth={1.5} />
      <p className="text-sm font-medium">Client not found</p>
      <Button variant="outline" size="sm" onClick={() => navigate("/clients")}>
        <ArrowLeft className="h-4 w-4 mr-1.5" strokeWidth={1.5} /> Back to Clients
      </Button>
    </div>
  );

  if (!client) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate("/clients")}
            className="hover:text-foreground transition-colors flex items-center gap-1.5 font-medium">
            <User className="h-3.5 w-3.5" strokeWidth={1.5} /> Clients
          </button>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" strokeWidth={1.5} />
          <span className="text-foreground font-semibold">{client.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all">
            <Command className="h-3 w-3" strokeWidth={1.5} /> Palette
            <kbd className="text-[9px] font-mono ml-0.5 px-1 rounded bg-muted">⌘K</kbd>
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/patients/add")}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Register Patient
          </motion.button>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_290px] gap-6 items-start">
        <ProfilePanel client={client} links={links} onEdit={() => setEditOpen(true)} onCmd={() => setCmdOpen(true)} />
        <CenterPanel clientId={client.id} clientName={client.name} />
        <HouseholdPanel clientId={client.id} links={links} navigate={navigate} />
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} actions={cmdActions} />
      <EditClientDialog
        client={client} open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={saved => { setClient(saved); toast.success("Client updated"); }}
      />
    </div>
  );
}

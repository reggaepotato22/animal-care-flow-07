// ═══════════════════════════════════════════════════════════════════════════
// Clients — InnoVetPro CRM Command Center
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search, Plus, Users, TrendingUp, AlertTriangle, Star, PhoneCall,
  MessageSquare, Mail, ChevronRight, Wallet, PawPrint, Clock,
  Activity, Zap, Shield, SlidersHorizontal, X,
} from "lucide-react";
import {
  getClients, createClient, seedDemoClients,
  type Client, type LifecycleStatus,
} from "@/lib/clientStore";
import { formatKES } from "@/lib/kenya";

// ─── Config ───────────────────────────────────────────────────────────────────

const LC: Record<LifecycleStatus, { label: string; dot: string; pill: string }> = {
  "new":        { label: "New",        dot: "bg-sky-400",     pill: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800" },
  "active":     { label: "Active",     dot: "bg-emerald-400", pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" },
  "dormant":    { label: "Dormant",    dot: "bg-zinc-400",    pill: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700" },
  "high-value": { label: "High Value", dot: "bg-violet-500",  pill: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800" },
  "at-risk":    { label: "At Risk",    dot: "bg-red-500",     pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800" },
};

const avatarPalette = [
  "from-violet-500 to-indigo-600", "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",     "from-amber-500 to-orange-500",
  "from-sky-500 to-blue-600",      "from-fuchsia-500 to-purple-600",
];
function avatarGrad(id: string) {
  return avatarPalette[(id.charCodeAt(id.length - 1) || 0) % avatarPalette.length];
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0] ?? "").join("").toUpperCase();
}
function relTime(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}

// ─── Client Row ───────────────────────────────────────────────────────────────

function ClientRow({ client, onClick }: { client: Client; onClick: () => void }) {
  const lc = LC[client.lifecycleStatus] ?? LC.new;
  const isAtRisk = client.lifecycleStatus === "at-risk";
  const isHighValue = client.lifecycleStatus === "high-value";

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-4 px-4 py-3.5 border-b border-border/40 hover:bg-muted/40 cursor-pointer transition-all
        ${isAtRisk ? "border-l-2 border-l-red-400" : isHighValue ? "border-l-2 border-l-violet-400" : "border-l-2 border-l-transparent"}`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${avatarGrad(client.id)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
          {initials(client.name)}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${lc.dot} ${isAtRisk ? "animate-pulse" : ""}`} />
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-x-4 items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{client.name}</p>
            {isHighValue && <Star className="h-3 w-3 text-amber-500 shrink-0" />}
            {isAtRisk && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded-full border border-red-200 dark:border-red-800/50 shrink-0">
                <AlertTriangle className="h-2.5 w-2.5 animate-pulse" /> AT RISK
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {client.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <PhoneCall className="h-2.5 w-2.5" /> {client.phone}
              </span>
            )}
            {client.city && (
              <span className="text-xs text-muted-foreground hidden sm:block">{client.city}</span>
            )}
          </div>
        </div>

        {/* Right-side data */}
        <div className="flex items-center gap-6 shrink-0">
          {/* Spend */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-emerald-600">{formatKES(client.totalSpend)}</span>
            {client.outstandingBalance > 0 && (
              <span className="text-[10px] font-medium text-red-500 flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" /> {formatKES(client.outstandingBalance)} due
              </span>
            )}
          </div>
          {/* Lifecycle badge */}
          <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${lc.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${lc.dot} ${isAtRisk ? "animate-pulse" : ""}`} />
            {lc.label}
          </span>
          {/* Updated */}
          <span className="text-xs text-muted-foreground hidden lg:block whitespace-nowrap">{relTime(client.updatedAt)}</span>
          {/* Arrow */}
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
}

// ─── New Client Dialog ────────────────────────────────────────────────────────

const BLANK = {
  name: "", email: "", phone: "", address: "", city: "Nairobi",
  lifecycleStatus: "new" as LifecycleStatus,
};

function NewClientDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  function save() {
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);
    createClient({
      ...form,
      alternatePhone: "",
      commPreferences: { smsOptIn: true, emailOptIn: !!form.email, callOptIn: true, preferredChannel: "sms" },
      behavioralFlags: [], tags: [],
      totalSpend: 0, outstandingBalance: 0, notes: "",
    });
    setTimeout(() => { setSaving(false); setForm(BLANK); onCreated(); onClose(); }, 400);
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Add New Client
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {[
            { key: "name" as const, label: "Full Name *", placeholder: "e.g. Amara Wanjiku" },
            { key: "phone" as const, label: "Phone *", placeholder: "+254 7XX XXX XXX" },
            { key: "email" as const, label: "Email", placeholder: "name@email.com" },
            { key: "address" as const, label: "Address", placeholder: "123 Ngong Road" },
            { key: "city" as const, label: "City", placeholder: "Nairobi" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input value={form[key]} onChange={set(key)} placeholder={placeholder} className="h-8 text-sm" />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-8 text-sm">Cancel</Button>
          <Button onClick={save} disabled={saving || !form.name.trim() || !form.phone.trim()} className="h-8 text-sm">
            {saving ? "Saving…" : "Create Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Clients() {
  const navigate = useNavigate();
  const [rawClients, setRawClients] = useState<Client[]>(() => { seedDemoClients(); return getClients(); });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LifecycleStatus | "all">("all");
  const [newOpen, setNewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  function reload() { setRawClients(getClients()); }

  const filtered = useMemo(() => {
    let list = rawClients;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter(c => c.lifecycleStatus === statusFilter);
    return list;
  }, [rawClients, search, statusFilter]);

  const stats = useMemo(() => ({
    total:       rawClients.length,
    active:      rawClients.filter(c => c.lifecycleStatus === "active").length,
    highValue:   rawClients.filter(c => c.lifecycleStatus === "high-value").length,
    atRisk:      rawClients.filter(c => c.lifecycleStatus === "at-risk").length,
    outstanding: rawClients.reduce((s, c) => s + c.outstandingBalance, 0),
    revenue:     rawClients.reduce((s, c) => s + c.totalSpend, 0),
  }), [rawClients]);

  const STATUS_FILTERS: { value: LifecycleStatus | "all"; label: string }[] = [
    { value: "all", label: "All Clients" },
    { value: "active", label: "Active" },
    { value: "new", label: "New" },
    { value: "high-value", label: "High Value" },
    { value: "at-risk", label: "At Risk" },
    { value: "dormant", label: "Dormant" },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client CRM</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Relationship-first client management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"
            onClick={() => navigate("/patients/add")}>
            <PawPrint className="h-3.5 w-3.5" /> Register Patient
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setNewOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Client
          </Button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Clients",  value: stats.total,                    icon: Users,         accent: "text-primary" },
          { label: "Active",         value: stats.active,                   icon: Activity,      accent: "text-emerald-600" },
          { label: "High Value",     value: stats.highValue,                icon: Star,          accent: "text-violet-600" },
          { label: "At Risk",        value: stats.atRisk,                   icon: AlertTriangle, accent: "text-red-500" },
          { label: "Outstanding",    value: formatKES(stats.outstanding),   icon: Wallet,        accent: "text-orange-500" },
          { label: "Total Revenue",  value: formatKES(stats.revenue),       icon: TrendingUp,    accent: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon className={`h-3.5 w-3.5 ${s.accent}`} />
              <span className="text-[11px] font-medium text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-lg font-bold leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Filter bar ── */}
      <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients by name, phone, city…"
            className="border-0 shadow-none h-7 text-sm bg-transparent focus-visible:ring-0 p-0 placeholder:text-muted-foreground/60"
          />
          {search && (
            <button onClick={() => setSearch("")} className="p-1 rounded-lg hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
              ${showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-muted/60 border-border/50 text-muted-foreground hover:text-foreground"}`}>
            <SlidersHorizontal className="h-3 w-3" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-1.5 flex-wrap px-4 py-2.5 border-b border-border/40 bg-muted/20">
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                  ${statusFilter === f.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted/60 border-border/50 text-muted-foreground hover:text-foreground"}`}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Column header ── */}
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/20 border-b border-border/40">
          <div className="w-10 shrink-0" />
          <div className="flex-1 grid grid-cols-[1fr_auto] gap-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Client</span>
            <div className="flex items-center gap-6 shrink-0">
              <span className="hidden md:block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Revenue</span>
              <span className="hidden sm:block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-24 text-center">Status</span>
              <span className="hidden lg:block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-20 text-right">Updated</span>
              <div className="w-4" />
            </div>
          </div>
        </div>

        {/* ── Client rows ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">No clients found</p>
            <p className="text-xs opacity-60 mt-1">
              {search ? "Try a different search term" : "Add your first client to get started"}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map(c => (
              <ClientRow key={c.id} client={c} onClick={() => navigate(`/clients/${c.id}`)} />
            ))}
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 bg-muted/20 border-t border-border/40 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing <strong>{filtered.length}</strong> of <strong>{rawClients.length}</strong> clients
            </span>
            <div className="flex items-center gap-2">
              {stats.atRisk > 0 && (
                <button onClick={() => setStatusFilter("at-risk")}
                  className="flex items-center gap-1 text-xs text-red-600 hover:underline">
                  <AlertTriangle className="h-3 w-3 animate-pulse" />
                  {stats.atRisk} at-risk client{stats.atRisk !== 1 ? "s" : ""} need attention
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <NewClientDialog open={newOpen} onClose={() => setNewOpen(false)} onCreated={reload} />
    </div>
  );
}

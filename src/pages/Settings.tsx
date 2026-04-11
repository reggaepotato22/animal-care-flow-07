// ═══════════════════════════════════════════════════════════════════════════
// Infinity Settings — InnoVetPro · Comprehensive tabbed configuration hub
// ═══════════════════════════════════════════════════════════════════════════
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  MessageSquare,
  Building2,
  Workflow,
  ShieldCheck,
  Palette,
  Database,
  Trash2,
  AlertTriangle,
  Users,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  X,
  Link,
  Key,
  Clock,
  Hash,
  Zap,
  Fingerprint,
  ChevronRight,
  Info,
} from "lucide-react";
import { useAppearance } from "@/contexts/AppearanceContext";
import { clearCache, resetSamplePatients } from "@/lib/patientStore";
import { clearAllData } from "@/lib/dataSeed";

// ─── Brand icons ──────────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ─── Masked API Key Input ─────────────────────────────────────────────────────
function MaskedInput({ label, placeholder, storageKey, hint }: { label: string; placeholder: string; storageKey: string; hint?: string }) {
  const [show, setShow] = useState(false);
  const [val, setVal] = useState(() => { try { return localStorage.getItem(storageKey) ?? ""; } catch { return ""; } });
  const [copied, setCopied] = useState(false);
  function save(v: string) { setVal(v); try { localStorage.setItem(storageKey, v); } catch {} }
  function copy() { navigator.clipboard.writeText(val); setCopied(true); setTimeout(() => setCopied(false), 1800); }
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input type={show ? "text" : "password"} value={val} onChange={e => save(e.target.value)}
            placeholder={placeholder} className="h-9 pr-9 font-mono text-xs" />
          <button onClick={() => setShow(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        {val && (
          <button onClick={copy} className="h-9 w-9 shrink-0 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Tag Editor (for custom status enums) ────────────────────────────────────
function TagEditor({ label, storageKey, defaults }: { label: string; storageKey: string; defaults: string[] }) {
  const [tags, setTags] = useState<string[]>(() => {
    try { const r = localStorage.getItem(storageKey); return r ? JSON.parse(r) : defaults; } catch { return defaults; }
  });
  const [draft, setDraft] = useState("");
  function add() {
    if (!draft.trim() || tags.includes(draft.trim())) return;
    const next = [...tags, draft.trim()]; setTags(next); setDraft("");
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }
  function remove(t: string) {
    const next = tags.filter(x => x !== t); setTags(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-lg border border-border bg-background/60">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {t}
            <button onClick={() => remove(t)} className="hover:text-red-500 transition-colors"><X className="h-2.5 w-2.5" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add status..." className="h-8 text-xs flex-1"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Button size="sm" variant="outline" onClick={add} className="h-8 px-3 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHdr({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5 text-primary" style={{ width: "1.125rem", height: "1.125rem" }} />
      </div>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accentColor, setAccentColor, borderRadius, setBorderRadius } = useAppearance();
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [kesEnabled, setKesEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("acf_kes_enabled") ?? "true"); } catch { return true; }
  });
  const [vatEnabled, setVatEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("acf_vat_enabled") ?? "false"); } catch { return false; }
  });
  const [apptSlot, setApptSlot] = useState(() => localStorage.getItem("acf_appt_slot") ?? "30");
  const [clinicName, setClinicName] = useState(() => localStorage.getItem("acf_clinic_name") ?? "InnoVetPro Clinic");
  const [vatRate, setVatRate] = useState(() => localStorage.getItem("acf_vat_rate") ?? "16");
  const [signature, setSignature] = useState(() => localStorage.getItem("acf_email_signature") ?? "Best regards,\nThe InnoVetPro Team");
  const [emailTemplate, setEmailTemplate] = useState(() =>
    localStorage.getItem("acf_email_template") ??
    "Hi {{client_name}},\n\nThis is a reminder that {{patient_name}}'s appointment is scheduled for {{date}} at {{time}}.\n\nPlease reply to confirm.\n\n{{signature}}"
  );
  const persist = (key: string, val: string) => { try { localStorage.setItem(key, val); } catch {} };

  function handleClearCache() {
    clearCache(); setClearCacheDialogOpen(false);
    toast({ title: "Cache Cleared", description: "Temporary data cleared. Patient records preserved." });
  }
  function handleClearAllData() {
    clearAllData(); setClearAllDialogOpen(false);
    toast({ title: "All Data Cleared", description: "The page will reload.", variant: "destructive" });
    setTimeout(() => window.location.reload(), 1500);
  }
  function handleResetSamplePatients() {
    resetSamplePatients();
    toast({ title: "Sample Patients Reset", description: "5 sample patients recreated." });
  }

  const ACCENT_COLORS: { id: string; label: string; cls: string }[] = [
    { id: "green",  label: "Emerald",  cls: "bg-emerald-500" },
    { id: "teal",   label: "Teal",     cls: "bg-teal-500" },
    { id: "blue",   label: "Ocean",    cls: "bg-blue-500" },
    { id: "purple", label: "Violet",   cls: "bg-purple-500" },
    { id: "orange", label: "Amber",    cls: "bg-orange-500" },
    { id: "rose",   label: "Rose",     cls: "bg-rose-500" },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
            <SettingsIcon className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Infinity Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Clinic configuration · Communications · Workflow</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="communications" className="space-y-6">
        {/* Tab Bar */}
        <TabsList className="grid grid-cols-6 w-full h-auto p-1 bg-muted/60 rounded-xl gap-1">
          {[
            { value: "communications", label: "Comms",     icon: MessageSquare },
            { value: "clinic",         label: "Clinic",    icon: Building2 },
            { value: "workflow",       label: "Workflow",  icon: Workflow },
            { value: "security",       label: "Security",  icon: ShieldCheck },
            { value: "appearance",     label: "Appearance",icon: Palette },
            { value: "data",           label: "Data",      icon: Database },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Communications ── */}
        <TabsContent value="communications" className="space-y-6">
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-6">
              <SectionHdr icon={WhatsAppIcon} title="WhatsApp Business API" desc="Connect Meta's Cloud API to send appointment reminders and discharge summaries." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MaskedInput label="Business Account ID" placeholder="1234567890" storageKey="acf_wa_account_id" hint="Meta Business Manager → WhatsApp → Account ID" />
                <MaskedInput label="Access Token" placeholder="EAAxxxxx..." storageKey="acf_wa_token" hint="Permanent token from System User" />
                <MaskedInput label="Phone Number ID" placeholder="9876543210" storageKey="acf_wa_phone_id" />
                <MaskedInput label="Webhook Verify Token" placeholder="my-secret-token" storageKey="acf_wa_webhook" hint="Set the same value in Meta Developer Console" />
              </div>
              <Separator />
              <SectionHdr icon={Zap} title="Twilio SMS" desc="Fallback SMS gateway for clients without WhatsApp." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MaskedInput label="Account SID" placeholder="ACxxxxxxxx..." storageKey="acf_twilio_sid" />
                <MaskedInput label="Auth Token" placeholder="your_auth_token" storageKey="acf_twilio_token" />
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Number</Label>
                  <Input placeholder="+1234567890" defaultValue={localStorage.getItem("acf_twilio_from") ?? ""}
                    onChange={e => persist("acf_twilio_from", e.target.value)} className="h-9 font-mono text-xs" />
                </div>
              </div>
              <Separator />
              <SectionHdr icon={Key} title="Email Signature" desc="Auto-appended to all outbound emails via the Communications panel." />
              <Textarea value={signature} onChange={e => { setSignature(e.target.value); persist("acf_email_signature", e.target.value); }}
                className="min-h-[80px] text-sm font-mono resize-none" />
              <SectionHdr icon={Info} title="Email Template" desc="Use {{client_name}}, {{patient_name}}, {{date}}, {{time}}, {{signature}} as variables." />
              <Textarea value={emailTemplate} onChange={e => { setEmailTemplate(e.target.value); persist("acf_email_template", e.target.value); }}
                className="min-h-[130px] text-sm font-mono resize-none" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Clinic Profile ── */}
        <TabsContent value="clinic" className="space-y-6">
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-6">
              <SectionHdr icon={Building2} title="Clinic Identity" desc="Your public-facing clinic information." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clinic Name</Label>
                  <Input value={clinicName} onChange={e => { setClinicName(e.target.value); persist("acf_clinic_name", e.target.value); }} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</Label>
                  <Input placeholder="+254 700 000 000" defaultValue={localStorage.getItem("acf_clinic_phone") ?? ""}
                    onChange={e => persist("acf_clinic_phone", e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
                  <Input type="email" placeholder="hello@innovetpro.clinic" defaultValue={localStorage.getItem("acf_clinic_email") ?? ""}
                    onChange={e => persist("acf_clinic_email", e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</Label>
                  <Input placeholder="123 Veterinary Lane, Nairobi" defaultValue={localStorage.getItem("acf_clinic_address") ?? ""}
                    onChange={e => persist("acf_clinic_address", e.target.value)} className="h-9" />
                </div>
              </div>
              <Separator />
              <SectionHdr icon={Hash} title="Financial Settings" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">KES Currency</p>
                    <p className="text-xs text-muted-foreground">Display all amounts in Kenyan Shillings</p>
                  </div>
                  <Switch checked={kesEnabled} onCheckedChange={v => { setKesEnabled(v); persist("acf_kes_enabled", String(v)); }} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">VAT / Tax</p>
                    <p className="text-xs text-muted-foreground">Apply VAT to all invoices</p>
                  </div>
                  <Switch checked={vatEnabled} onCheckedChange={v => { setVatEnabled(v); persist("acf_vat_enabled", String(v)); }} />
                </div>
                {vatEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5 overflow-hidden">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">VAT Rate (%)</Label>
                    <div className="flex gap-2 items-center">
                      <Input type="number" min="0" max="100" value={vatRate}
                        onChange={e => { setVatRate(e.target.value); persist("acf_vat_rate", e.target.value); }}
                        className="h-9 w-28" />
                      <span className="text-sm text-muted-foreground">% applied to all invoices</span>
                    </div>
                  </motion.div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">KRA PIN</Label>
                  <Input placeholder="P000000000A" defaultValue={localStorage.getItem("acf_kra_pin") ?? ""}
                    onChange={e => persist("acf_kra_pin", e.target.value)} className="h-9 font-mono" />
                </div>
              </div>
              <Separator />
              <SectionHdr icon={Building2} title="Clinic Logo" desc="Logo appears on invoices, discharge summaries, and the client portal." />
              <div className="border-2 border-dashed border-border/50 rounded-xl p-8 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer"
                onClick={() => toast({ title: "Logo Upload", description: "Upload via Settings > Appearance to use the full branding editor." })}>
                <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Building2 className="h-7 w-7 opacity-40" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload logo</p>
                  <p className="text-xs opacity-60 mt-0.5">PNG or SVG · Max 2MB · Recommended 400×120px</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Workflow ── */}
        <TabsContent value="workflow" className="space-y-6">
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-6">
              <SectionHdr icon={Workflow} title="Appointment Settings" />
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Default Slot Duration</Label>
                <Select value={apptSlot} onValueChange={v => { setApptSlot(v); persist("acf_appt_slot", v); }}>
                  <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Used in the Appointment Calendar as the default grid interval.</p>
              </div>
              <Separator />
              <SectionHdr icon={Clock} title="Custom Patient Statuses" desc="These appear in triage, hospitalization, and clinical workflows." />
              <TagEditor label="Triage Statuses" storageKey="acf_triage_statuses"
                defaults={["Arrived", "Waiting", "In Exam", "In Surgery", "Recovery", "Ready for Discharge"]} />
              <TagEditor label="Hospitalization Statuses" storageKey="acf_hosp_statuses"
                defaults={["Admitted", "Monitoring", "In Treatment", "Stable", "Critical", "Discharge Pending"]} />
              <Separator />
              <SectionHdr icon={Workflow} title="Advanced Workflow" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Allow Skip Triage</p>
                  <p className="text-xs text-muted-foreground">Receptionists can move patients directly to consultation</p>
                </div>
                <Switch defaultChecked={(() => { try { return JSON.parse(localStorage.getItem("boravet_workflow_settings") ?? "{}").allow_skip_triage ?? false; } catch { return false; } })()}
                  onCheckedChange={v => {
                    try {
                      const raw = localStorage.getItem("boravet_workflow_settings");
                      const prev = raw ? JSON.parse(raw) : {};
                      localStorage.setItem("boravet_workflow_settings", JSON.stringify({ ...prev, allow_skip_triage: v }));
                      window.dispatchEvent(new StorageEvent("storage", { key: "boravet_workflow_settings" }));
                    } catch {}
                  }} />
              </div>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/workflow-settings")}>
                <Workflow className="h-3.5 w-3.5" /> Open Full Workflow Settings <ChevronRight className="h-3.5 w-3.5 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security & Links ── */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-6">
              <SectionHdr icon={Link} title="Client Portal Links" desc="Generate magic upload links for clients, labs, and specialists." />
              <Button className="gap-2" onClick={() => navigate("/generate-link")}>
                <Link className="h-4 w-4" strokeWidth={1.5} />
                Open Magic Link Generator
                <ChevronRight className="h-3.5 w-3.5 ml-auto" />
              </Button>
              <Separator />
              <SectionHdr icon={Fingerprint} title="Staff Roles & Permissions" desc="Configure what each role can see and do in InnoVetPro." />
              <div className="space-y-2">
                {["SuperAdmin", "Vet", "Nurse", "Receptionist", "Pharmacist", "Lab Technician"].map(role => (
                  <div key={role} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium">{role}</span>
                    </div>
                    <button onClick={() => navigate("/staff")} className="text-[11px] text-primary font-semibold hover:underline">
                      Manage
                    </button>
                  </div>
                ))}
              </div>
              <Separator />
              <SectionHdr icon={ShieldCheck} title="Security" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Session Timeout</p>
                    <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Select defaultValue={localStorage.getItem("acf_session_timeout") ?? "60"}
                    onValueChange={v => persist("acf_session_timeout", v)}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Audit Logging</p>
                    <p className="text-xs text-muted-foreground">Record all data changes for compliance</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 mt-1" onClick={() => navigate("/audit")}>
                  <ShieldCheck className="h-3.5 w-3.5" /> View Audit Trail <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appearance ── */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-6">
              <SectionHdr icon={Palette} title="Accent Color" desc="Primary brand color used throughout the UI." />
              <div className="flex flex-wrap gap-3">
                {ACCENT_COLORS.map(({ id, label, cls }) => (
                  <motion.button key={id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setAccentColor(id as any)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${accentColor === id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100"}`}>
                    <div className={`h-8 w-8 rounded-full ${cls} shadow-sm`} />
                    <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                  </motion.button>
                ))}
              </div>
              <Separator />
              <SectionHdr icon={Palette} title="Border Radius" desc="Controls the roundness of cards, buttons, and inputs." />
              <div className="flex flex-wrap gap-2">
                {(["none","sm","md","lg","full"] as const).map(r => (
                  <motion.button key={r} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setBorderRadius(r)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${borderRadius === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {r === "none" ? "None" : r === "full" ? "Pill" : r.toUpperCase()}
                  </motion.button>
                ))}
              </div>
              <Separator />
              <SectionHdr icon={Palette} title="Glass Intensity" desc="Glassmorphism strength on the Communications panel and modals." />
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "off",    label: "Off",      cls: "bg-muted/80" },
                  { id: "subtle", label: "Subtle",   cls: "bg-muted/60 backdrop-blur-sm" },
                  { id: "medium", label: "Medium",   cls: "bg-muted/40 backdrop-blur-md" },
                  { id: "strong", label: "Strong",   cls: "bg-muted/20 backdrop-blur-xl" },
                ].map(({ id, label, cls }) => {
                  const stored = localStorage.getItem("acf_glass_intensity") ?? "medium";
                  return (
                    <motion.button key={id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => persist("acf_glass_intensity", id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${stored === id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {label}
                    </motion.button>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/appearance")}>
                <Palette className="h-3.5 w-3.5" /> Open Full Appearance Settings <ChevronRight className="h-3.5 w-3.5 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Data Management ── */}
        <TabsContent value="data" className="space-y-6">
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-6">
              <SectionHdr icon={Database} title="Data Management" desc="Manage cached data, sample records, and full resets." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-orange-500" />
                    <p className="font-medium text-sm">Clear Cache</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Removes temporary data while preserving patient records.</p>
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setClearCacheDialogOpen(true)}>Clear Cache</Button>
                </div>
                <div className="rounded-xl border border-border/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <p className="font-medium text-sm">Reset Sample Patients</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Recreate the 5 demo patients with fresh data.</p>
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleResetSamplePatients}>Reset Patients</Button>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.02] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <p className="font-medium text-sm text-red-600 dark:text-red-400">Clear All Data</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Permanently deletes ALL data. Cannot be undone.</p>
                  <Button variant="destructive" size="sm" className="w-full text-xs" onClick={() => setClearAllDialogOpen(true)}>Clear Everything</Button>
                </div>
              </div>
              <Separator />
              <SectionHdr icon={ChevronRight} title="Quick Links" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Communications",     href: "/settings/communications" },
                  { label: "Workflow Settings",   href: "/workflow-settings" },
                  { label: "Appearance",          href: "/appearance" },
                  { label: "Notifications",       href: "/admin/notifications" },
                  { label: "Generate Upload Link",href: "/generate-link" },
                  { label: "Audit Trails",        href: "/audit" },
                ].map(({ label, href }) => (
                  <button key={href} onClick={() => navigate(href)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/50 hover:bg-muted/40 transition-colors text-sm text-left">
                    <span className="font-medium">{label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Clear Cache Dialog */}
      <Dialog open={clearCacheDialogOpen} onOpenChange={setClearCacheDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-orange-500" /> Clear Cache?</DialogTitle>
            <DialogDescription>Clears temporary data while preserving all patient records.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearCacheDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleClearCache}>Clear Cache</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /> Clear All Data?</DialogTitle>
            <DialogDescription className="text-red-600/80">Permanently deletes ALL data. This cannot be undone. Page will reload.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearAllDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearAllData}>Yes, Clear Everything</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

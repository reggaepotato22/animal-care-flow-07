import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowRight, CheckCircle2, Users, ClipboardList,
  Pill, ReceiptText, BarChart3, Shield,
  Star, Activity, Stethoscope, Menu, X,
  Heart, Syringe, Quote, Clock, Lock,
} from "lucide-react";

// ── Lead capture ─────────────────────────────────────────────────────────────
const ACCESS_KEY    = "innovetpro_access_requests";

// Formspree  → owner notifications (env var overrides, hardcoded as safe fallback)
const FORMSPREE     = (import.meta.env.VITE_FORMSPREE_ENDPOINT as string | undefined)
                    || "https://formspree.io/f/xjgpwzzq";

// EmailJS    → branded confirmation to submitter
const EJS_SERVICE   = (import.meta.env.VITE_EMAILJS_SERVICE_ID  as string | undefined) || "service_ghes6jc";
const EJS_KEY       = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string | undefined) || "SGqjlLe6QR5y6JYHm";
const EJS_CONFIRM   = (import.meta.env.VITE_EMAILJS_CONFIRM_TPL as string | undefined) || "template_lowkwr4";

function saveLocal(email: string, phone: string) {
  const prev = JSON.parse(localStorage.getItem(ACCESS_KEY) || "[]");
  localStorage.setItem(ACCESS_KEY, JSON.stringify([...prev, { email, phone, at: new Date().toISOString() }]));
}

async function submitRequest(email: string, phone: string): Promise<void> {
  saveLocal(email, phone);
  const timestamp = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
  const errors: string[] = [];

  // ── 1. Formspree → notify BOTH owners ───────────────────────────────────
  if (FORMSPREE) {
    try {
      const res = await fetch(FORMSPREE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          phone,
          timestamp,
          subject:  "🐾 New InnoVetPro Access Request",
          message:  `Access request received on ${timestamp}\n\nEmail: ${email}\nPhone: ${phone}`,
          _replyto: email,
          _cc:      "andrewmandieka@gmail.com",
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        errors.push(d.error ?? "Notification failed");
      }
    } catch {
      errors.push("Could not reach notification service");
    }
  }

  // ── 2. EmailJS → branded confirmation to the submitter ──────────────────
  if (EJS_SERVICE && EJS_KEY && EJS_CONFIRM) {
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EJS_SERVICE,
          template_id: EJS_CONFIRM,
          user_id: EJS_KEY,
          template_params: { email, email_address: email, phone_number: phone, submission_time: timestamp },
        }),
      });
      if (!res.ok) errors.push("Confirmation email failed");
    } catch {
      errors.push("Could not reach confirmation service");
    }
  }

  // Only hard-fail if Formspree was configured but errored (means env is set but broken)
  if (errors.length && FORMSPREE) {
    throw new Error(errors.join(" · "));
  }
}

// ── Data ─────────────────────────────────────────────────────────────
const TICKER = [
  "Patient Intake", "Clinical Workflows", "Pharmacy Management", "Smart Billing",
  "Lab & Diagnostics", "Multi-Role Access", "Live Queue Board", "Audit Trails",
  "Hospitalization", "Prescription Management", "PDF Records", "Appointment Scheduling",
];

const FEATURES = [
  { icon: Users,         title: "Patient Intake",        desc: "Register new patients or check in existing ones with a streamlined receptionist flow." },
  { icon: Stethoscope,   title: "Clinical Workflow",     desc: "Attendant vitals → Vet examination → Pharmacist dispensing, all in one guided flow." },
  { icon: Pill,          title: "Pharmacy & Inventory",  desc: "Real-time medication dispensing with automatic inventory deduction and low-stock alerts." },
  { icon: ReceiptText,   title: "Smart Billing",         desc: "Auto-generate invoices at discharge. Mark visits complete and archive in one click." },
  { icon: BarChart3,     title: "Reports & Analytics",   desc: "Full audit trails, revenue reports, and clinic performance analytics at a glance." },
  { icon: Shield,        title: "Role-Based Access",     desc: "Fine-grained permissions for Receptionist, Vet, Nurse, Pharmacist, and SuperAdmin." },
  { icon: ClipboardList, title: "Lab & Diagnostics",     desc: "Order tests, track results, and attach lab reports directly to patient records." },
  { icon: Activity,      title: "Live Patient Queue",    desc: "Real-time queue board showing every patient’s current stage from intake to discharge." },
  { icon: Heart,         title: "Patient Journey",       desc: "Full history of every visit, medication, diagnosis and outcome in one timeline view." },
  { icon: Syringe,       title: "Treatment Tracking",    desc: "Log treatments, injections, and care plans. Link to prescriptions automatically." },
  { icon: Clock,         title: "Appointments",          desc: "Schedule, reschedule, and send iCal invites. Integrates directly with the queue." },
  { icon: Lock,          title: "Secure & Private",      desc: "Data isolated per clinic account. Role-restricted views ensure confidentiality." },
];

const WORKFLOW = [
  { num: "01", role: "Receptionist",         color: "bg-amber-500",  icon: Users,       desc: "Register or check in a patient. Assign to today's queue with a single click." },
  { num: "02", role: "Nurse / Veterinarian", color: "bg-blue-500",   icon: Stethoscope, desc: "Record vitals, perform examination, write diagnosis notes, and issue e-prescriptions." },
  { num: "03", role: "Pharmacist & Billing", color: "bg-[#56B246]",  icon: Pill,        desc: "Dispense medication, update inventory, generate invoice, and close the visit." },
];

const STATS = [
  { num: "10K+",  label: "Patients Managed" },
  { num: "500+",  label: "Clinics Onboarded" },
  { num: "5",     label: "Staff Roles" },
  { num: "99.9%", label: "Uptime SLA" },
];

const TESTIMONIALS = [
  { name: "Dr. Sarah Mitchell",  role: "Chief Veterinarian",  clinic: "Greenfield Animal Hospital", quote: "InnoVetPro transformed how we run our clinic. The workflow automation alone saves us 2+ hours every single day.", stars: 5 },
  { name: "James Okafor",        role: "Practice Manager",    clinic: "CityVet Clinic",             quote: "The role-based access is brilliant. Each staff member sees exactly what they need \u2014 no clutter, no confusion.", stars: 5 },
  { name: "Dr. Amara Diallo",    role: "Head of Surgery",     clinic: "PetCare Medical Centre",     quote: "From intake to discharge the flow is completely seamless. I can’t imagine going back to our old paper system.", stars: 5 },
];

// ── Decorative components ────────────────────────────────────────────────
function PawPrint({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor" aria-hidden>
      <ellipse cx="30" cy="22" rx="9" ry="11" />
      <ellipse cx="70" cy="22" rx="9" ry="11" />
      <ellipse cx="14" cy="48" rx="7" ry="9" />
      <ellipse cx="86" cy="48" rx="7" ry="9" />
      <path d="M50 38 C24 38 18 58 18 70 C18 82 30 88 50 88 C70 88 82 82 82 70 C82 58 76 38 50 38Z" />
    </svg>
  );
}

function MockAppWindow() {
  const patients = [
    { name: "Max — Golden Retriever",  status: "In Exam",   color: "bg-blue-500" },
    { name: "Luna — Persian Cat",      status: "Surgery",   color: "bg-purple-500" },
    { name: "Rocky — German Shepherd", status: "Ready",     color: "bg-[#56B246]" },
    { name: "Mia — Ragdoll Cat",       status: "Waiting",   color: "bg-amber-500" },
    { name: "Bruno — Labrador",        status: "Triage",    color: "bg-red-400" },
  ];
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.12] bg-[#0f1e21] shadow-2xl shadow-black/60 w-full">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0a1517] border-b border-white/[0.06]">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#56B246]/70" />
        <div className="ml-3 flex-1 bg-white/[0.05] rounded h-4 flex items-center px-2">
          <span className="text-[9px] text-white/20">innovetpro.com/dashboard</span>
        </div>
      </div>
      {/* App header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d1a1c] border-b border-white/[0.05]">
        <span className="text-xs font-bold text-white">InnoVetPro</span>
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 bg-[#56B246]/20 rounded-full" />
          <div className="h-6 w-6 bg-white/[0.06] rounded-full" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {[
          { label: "Total Patients", value: "1,247", color: "#56B246" },
          { label: "In Clinic Today", value: "18",   color: "#60a5fa" },
          { label: "Discharged",     value: "9",    color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.04] rounded-xl p-2.5">
            <div className="text-[8px] text-white/35 mb-1 uppercase tracking-wider">{s.label}</div>
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      {/* Patient list */}
      <div className="px-3 pb-3 space-y-1">
        <div className="text-[9px] text-white/25 uppercase tracking-widest px-1 pb-1">Live Queue</div>
        {patients.map(p => (
          <div key={p.name} className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] rounded-lg px-3 py-2 transition-colors">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-white/[0.07] flex items-center justify-center">
                <span className="text-[9px] text-white/40">🐾</span>
              </div>
              <span className="text-[11px] text-white/80">{p.name}</span>
            </div>
            <span className={cn("text-[9px] font-bold text-white px-2 py-0.5 rounded-full", p.color)}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Access form ───────────────────────────────────────────────────────────────
function AccessForm({ center = false }: { center?: boolean }) {
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [done,    setDone]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !phone.trim()) return;
    setLoading(true); setError("");
    try {
      await submitRequest(email.trim(), phone.trim());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className={cn(
      "rounded-2xl px-6 py-5 bg-[#56B246]/10 border border-[#56B246]/30 space-y-2",
      center && "text-center max-w-md mx-auto"
    )}>
      <div className={cn("flex items-center gap-2", center && "justify-center")}>
        <CheckCircle2 className="h-5 w-5 text-[#56B246] shrink-0" />
        <span className="font-bold text-white text-sm">Request received — check your inbox!</span>
      </div>
      <p className="text-xs text-white/50 leading-relaxed">
        We've sent a confirmation to <strong className="text-white/80">{email}</strong>.
        Our team will review your request and send your access credentials within{" "}
        <span className="text-[#56B246] font-semibold">24 hours</span>.
      </p>
    </div>
  );

  const inputCls = "bg-white/[0.07] border-white/15 text-white placeholder:text-white/30 focus-visible:ring-[#56B246] focus-visible:border-[#56B246] h-11";

  return (
    <div className={cn("w-full space-y-2", center && "max-w-md mx-auto")}>
      <form onSubmit={submit} className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="email" required placeholder="Email address"
            value={email} onChange={e => setEmail(e.target.value)}
            className={inputCls}
          />
          <Input
            type="tel" required placeholder="Phone number"
            value={phone} onChange={e => setPhone(e.target.value)}
            className={cn(inputCls, "w-40 shrink-0")}
          />
        </div>
        <Button type="submit" disabled={loading}
          className="w-full bg-[#56B246] hover:bg-[#56B246]/90 text-white font-semibold h-11 gap-1.5"
        >
          {loading ? "Sending your request…" : <>Request Access Credentials <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
      {error && <p className={cn("text-xs text-red-400", center && "text-center")}>{error}</p>}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate     = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0b1517] text-white font-sans antialiased overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] backdrop-blur-xl bg-[#0b1517]/75">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <AppLogo imgHeight={36} showText textClassName="text-base font-bold text-white" />
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            {([["features","Features"],["workflow","How It Works"],["testimonials","Reviews"],["access","Get Access"]] as [string,string][]).map(([id,label]) => (
              <button key={id} onClick={() => goTo(id)} className="hover:text-white transition-colors">{label}</button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5"
              onClick={() => navigate("/login/demo")}>
              <Lock className="h-3.5 w-3.5" /> Sign In
            </Button>
            <Button size="sm" className="bg-[#56B246] hover:bg-[#56B246]/90 text-white font-semibold gap-1.5"
              onClick={() => goTo("access")}>
              Request Access <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <button className="md:hidden text-white/60 hover:text-white" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#0b1517] px-6 py-4 space-y-3 text-sm">
            {([["features","Features"],["workflow","How It Works"],["access","Get Access"]] as [string,string][]).map(([id,label]) => (
              <button key={id} onClick={() => goTo(id)} className="block text-left text-white/60 hover:text-white">{label}</button>
            ))}
            <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
              <Button variant="outline" size="sm" className="flex-1 border-white/20 text-white bg-transparent"
                onClick={() => navigate("/login/demo")}>Sign In</Button>
              <Button size="sm" className="flex-1 bg-[#56B246] text-white" onClick={() => goTo("access")}>Get Access</Button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Video bg — add /hero-bg.mp4 to public/ for a real vet video */}
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.10 }}>
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1517] via-[#0b1517]/95 to-[#0f1f22]/90 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-[#56B246]/[0.06] rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/[0.04] rounded-full blur-[100px]" />
        </div>

        {/* Decorative paw prints */}
        <PawPrint className="absolute top-32 left-8 w-20 h-20 text-[#56B246]/[0.06] rotate-12 pointer-events-none" />
        <PawPrint className="absolute bottom-24 left-20 w-12 h-12 text-[#56B246]/[0.04] -rotate-6 pointer-events-none" />
        <PawPrint className="absolute top-48 right-12 w-16 h-16 text-[#56B246]/[0.05] rotate-45 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left — text */}
          <div>
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-[#56B246]/15 border border-[#56B246]/25">
              <div className="h-1.5 w-1.5 rounded-full bg-[#56B246] animate-pulse" />
              <span className="text-[11px] text-[#56B246] font-semibold uppercase tracking-[0.18em]">Veterinary Management Platform</span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.06] tracking-tight mb-6">
              The Smarter Way<br />to Run Your{" "}
              <span className="relative">
                <span className="text-[#56B246]">Clinic</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8 Q50 2 100 8 Q150 14 198 6" stroke="#56B246" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5"/>
                </svg>
              </span>
            </h1>

            <p className="text-base text-white/45 leading-relaxed mb-8 max-w-xl">
              InnoVetPro brings together patient intake, clinical workflows, pharmacy,
              billing, and reporting — built exclusively for modern veterinary practices.
            </p>

            <div className="mb-5">
              <AccessForm />
            </div>
            <p className="text-xs text-white/25">Credentials sent within 24 hrs · No credit card required</p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5">
                <div className="flex">{[0,1,2,3,4].map(i => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
                <span className="text-xs text-white font-semibold">4.9 / 5</span>
                <span className="text-[10px] text-white/30">· 2.6K+ clinics</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5">
                <Activity className="h-4 w-4 text-[#56B246]" />
                <span className="text-xs text-white/70"><span className="text-white font-bold">1,240+</span> patients today</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-white/70">99.9% uptime</span>
              </div>
            </div>
          </div>

          {/* Right — mock app window */}
          <div className="relative lg:block">
            <div className="absolute -inset-4 bg-[#56B246]/[0.04] rounded-3xl blur-2xl" />
            <div className="relative">
              <MockAppWindow />
              {/* Floating notification card */}
              <div className="absolute -bottom-6 -left-6 bg-[#111e21] border border-[#56B246]/30 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#56B246]/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-[#56B246]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Patient Checked In</div>
                  <div className="text-[10px] text-white/35">Rocky — German Shepherd · Just now</div>
                </div>
              </div>
              {/* Floating vitals card */}
              <div className="absolute -top-5 -right-5 bg-[#111e21] border border-blue-500/20 rounded-2xl px-4 py-3 shadow-xl">
                <div className="text-[10px] text-white/35 mb-1">Vitals Recorded</div>
                <div className="text-xs font-bold text-white">Temp: 38.5°C · HR: 78 bpm</div>
                <div className="flex items-center gap-1 mt-1">
                  <Heart className="h-3 w-3 text-red-400 fill-current" />
                  <span className="text-[10px] text-red-400">Normal range</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="border-y border-white/[0.06] bg-white/[0.02] py-4 overflow-hidden relative">
        <div className="flex gap-12 whitespace-nowrap animate-[marquee_30s_linear_infinite]">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="text-sm font-semibold text-white/30 shrink-0 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#56B246] shrink-0" />{item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#56B246] text-[11px] uppercase tracking-[0.2em] font-semibold mb-3">Complete Platform</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black">Everything Your Clinic Needs</h2>
            <p className="text-white/35 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              From the first check-in to the final invoice — every step of the veterinary workflow covered.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#56B246]/30 rounded-2xl p-6 transition-all duration-300 cursor-default hover:-translate-y-0.5">
                <div className="h-11 w-11 rounded-xl bg-[#56B246]/12 flex items-center justify-center mb-4 group-hover:bg-[#56B246]/20 transition-colors">
                  <Icon className="h-5 w-5 text-[#56B246]" />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
                <p className="text-xs text-white/38 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section id="workflow" className="py-28 px-6 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#56B246] text-[11px] uppercase tracking-[0.2em] font-semibold mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-black">From Check-In to Discharge</h2>
            <p className="text-white/35 mt-4 text-sm max-w-lg mx-auto">Three seamless role-handoffs. Every patient moves through the same intelligent workflow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WORKFLOW.map((step, i) => (
              <div key={step.num} className="relative group">
                {i < WORKFLOW.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-3 z-10">
                    <ArrowRight className="h-5 w-5 text-white/15" />
                  </div>
                )}
                <div className="bg-white/[0.04] border border-white/[0.07] group-hover:border-white/[0.12] rounded-2xl p-8 h-full transition-all duration-300">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", step.color)}>
                      <step.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] text-white/25 font-semibold uppercase tracking-widest">Step {step.num}</div>
                      <div className="font-bold text-white text-sm">{step.role}</div>
                    </div>
                  </div>
                  <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
                  <div className="text-7xl font-black text-white/[0.03] absolute bottom-4 right-5 leading-none select-none">{step.num}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" className="bg-[#56B246] hover:bg-[#56B246]/90 text-white font-bold px-12 gap-2"
              onClick={() => goTo("access")}>
              Request Access to Explore <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 px-6 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {STATS.map(({ num, label }) => (
            <div key={label}>
              <div className="text-4xl md:text-5xl font-black text-white mb-2 leading-none">
                <span className="text-[#56B246]">{num.replace(/[0-9]+/,"")}</span>
                <span>{num.replace(/[^0-9.]+/g,"")}</span>
                <span className="text-[#56B246]">{num.match(/[^0-9.]+$/)?.[0] ?? ""}</span>
              </div>
              <div className="text-[11px] text-white/30 uppercase tracking-wider font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#56B246] text-[11px] uppercase tracking-[0.2em] font-semibold mb-3">Trusted by Clinics</p>
            <h2 className="text-3xl md:text-4xl font-black">What Clinics Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, clinic, quote, stars }) => (
              <div key={name} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-7 flex flex-col gap-5">
                <Quote className="h-6 w-6 text-[#56B246]/40" />
                <p className="text-sm text-white/60 leading-relaxed flex-1 italic">“{quote}”</p>
                <div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: stars }).map((_,i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="font-bold text-white text-sm">{name}</div>
                  <div className="text-xs text-white/35 mt-0.5">{role} · {clinic}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUEST ACCESS ── */}
      <section id="access" className="py-28 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#56B246]/[0.05] rounded-full blur-[120px]" />
          <PawPrint className="absolute bottom-10 right-20 w-32 h-32 text-[#56B246]/[0.03] rotate-12" />
          <PawPrint className="absolute top-10 left-10 w-20 h-20 text-white/[0.02] -rotate-6" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative">
          <Badge className="mb-6 bg-[#56B246]/15 text-[#56B246] border-[#56B246]/30 text-[11px] uppercase tracking-[0.18em] font-semibold px-4 py-1.5 rounded-full">
            Get Started Today
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight">
            Ready to Elevate<br />
            <span className="text-[#56B246]">Your Clinic?</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-md mx-auto">
            Login credentials are available upon request. Submit your details and our team
            will personally review and send you access within 24 hours.
          </p>
          <AccessForm center />
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-white/25">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#56B246]" />No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#56B246]" />Private & secure</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#56B246]" />24-hr response</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            <div className="max-w-xs">
              <AppLogo imgHeight={32} showText textClassName="text-sm font-bold text-white" className="mb-3" />
              <p className="text-xs text-white/30 leading-relaxed">Intelligent veterinary management software built for clinics that care about efficiency and exceptional patient outcomes.</p>
            </div>
            <div className="grid grid-cols-2 gap-10 text-sm">
              <div>
                <div className="text-white/50 font-semibold mb-3 text-xs uppercase tracking-wider">Product</div>
                {[["features","Features"],["workflow","How It Works"],["access","Request Access"]].map(([id,label]) => (
                  <button key={id} onClick={() => goTo(id)} className="block text-white/30 hover:text-white/60 mb-2 text-xs transition-colors">{label}</button>
                ))}
              </div>
              <div>
                <div className="text-white/50 font-semibold mb-3 text-xs uppercase tracking-wider">Access</div>
                <button onClick={() => navigate("/login/demo")} className="block text-white/30 hover:text-white/60 mb-2 text-xs transition-colors">Sign In</button>
                <button onClick={() => navigate("/signup")} className="block text-white/30 hover:text-white/60 mb-2 text-xs transition-colors">Create Account</button>
                <button onClick={() => navigate("/login/demo")} className="block text-white/30 hover:text-white/60 mb-2 text-xs transition-colors">Demo Clinic</button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/20">© {new Date().getFullYear()} InnoVetPro · Veterinary Management System</p>
            <p className="text-xs text-white/20">All credentials provided personally upon request.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

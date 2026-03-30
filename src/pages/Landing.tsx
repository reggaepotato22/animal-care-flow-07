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
} from "lucide-react";

// ── Lead capture ─────────────────────────────────────────────────────────────
const ACCESS_KEY   = "innovetpro_access_requests";
const EJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID   as string | undefined;
const EJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY    as string | undefined;
const EJS_NOTIFY   = import.meta.env.VITE_EMAILJS_NOTIFY_TPL   as string | undefined;
const EJS_CONFIRM  = import.meta.env.VITE_EMAILJS_CONFIRM_TPL  as string | undefined;

function saveLocal(email: string, phone: string) {
  const prev = JSON.parse(localStorage.getItem(ACCESS_KEY) || "[]");
  localStorage.setItem(ACCESS_KEY, JSON.stringify([...prev, { email, phone, at: new Date().toISOString() }]));
}

async function ejsSend(templateId: string, params: Record<string, string>) {
  if (!EJS_SERVICE || !EJS_KEY) return;
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service_id: EJS_SERVICE, template_id: templateId, user_id: EJS_KEY, template_params: params }),
  });
  if (!res.ok) throw new Error("Email delivery failed — please try again.");
}

async function submitRequest(email: string, phone: string): Promise<void> {
  saveLocal(email, phone);
  const timestamp = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

  // 1 — Notify owners
  if (EJS_NOTIFY) {
    await ejsSend(EJS_NOTIFY, {
      from_email: email,
      phone,
      timestamp,
      notify_emails: "andygosystems@gmail.com, andrewmandieka@gmail.com",
    });
  }

  // 2 — Branded confirmation back to submitter
  if (EJS_CONFIRM) {
    await ejsSend(EJS_CONFIRM, { to_email: email, phone, timestamp });
  }
}

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Users,         title: "Patient Intake",        desc: "Register new patients or check in existing ones with a streamlined receptionist flow." },
  { icon: Stethoscope,   title: "Clinical Workflow",     desc: "Attendant vitals → Vet examination → Pharmacist dispensing, all in one guided flow." },
  { icon: Pill,          title: "Pharmacy & Inventory",  desc: "Real-time medication dispensing with automatic inventory deduction and low-stock alerts." },
  { icon: ReceiptText,   title: "Smart Billing",         desc: "Auto-generate invoices at discharge. Mark visits complete and archive in one click." },
  { icon: BarChart3,     title: "Reports & Audit",       desc: "Full audit trails, revenue reports, and clinic performance analytics." },
  { icon: Shield,        title: "Role-Based Access",     desc: "Fine-grained permissions for Receptionist, Vet, Nurse, Pharmacist, and SuperAdmin." },
  { icon: ClipboardList, title: "Lab & Diagnostics",     desc: "Order tests, track results, and attach lab reports directly to patient records." },
  { icon: Activity,      title: "Live Patient Progress", desc: "Real-time queue board showing every patient's current stage from intake to discharge." },
];

const WORKFLOW = [
  { num: "01", role: "Receptionist",         color: "bg-amber-500",  desc: "Register or check in a patient. Assign to today's queue with a single click." },
  { num: "02", role: "Nurse / Veterinarian", color: "bg-blue-500",   desc: "Record vitals, perform examination, write diagnosis notes, and issue e-prescriptions." },
  { num: "03", role: "Pharmacist & Billing", color: "bg-[#56B246]",  desc: "Dispense medication, update inventory, generate invoice, and close the visit." },
];

const STATS = [
  { num: "10K+",  label: "Patients Managed" },
  { num: "500+",  label: "Clinics Onboarded" },
  { num: "5",     label: "Staff Roles" },
  { num: "99.9%", label: "Uptime SLA" },
];

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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate        = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0b1517] text-white font-sans antialiased">

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] backdrop-blur-md bg-[#0b1517]/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <AppLogo imgHeight={34} showText textClassName="text-base font-bold text-white" />

          <div className="hidden md:flex items-center gap-8 text-sm text-white/55">
            {[["features","Features"],["workflow","How It Works"],["access","Request Access"]].map(([id,label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors">
                {label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => navigate("/login")}>Sign In</Button>
            <Button size="sm"
              className="bg-[#56B246] hover:bg-[#56B246]/90 text-white font-semibold"
              onClick={() => scrollTo("access")}>
              Request Access
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-white/60 hover:text-white" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#0b1517] px-6 py-4 flex flex-col gap-4 text-sm">
            {[["features","Features"],["workflow","How It Works"],["access","Request Access"]].map(([id,label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-left text-white/60 hover:text-white">{label}</button>
            ))}
            <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
              <Button variant="outline" size="sm" className="flex-1 border-white/20 text-white bg-transparent hover:bg-white/10"
                onClick={() => navigate("/login")}>Sign In</Button>
              <Button size="sm" className="flex-1 bg-[#56B246] hover:bg-[#56B246]/90 text-white"
                onClick={() => scrollTo("access")}>Get Access</Button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#56B246]/[0.07] rounded-full blur-[130px]" />
          <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[90px]" />
        </div>

        <div className="max-w-4xl mx-auto relative text-center">
          <Badge className="mb-7 bg-[#56B246]/15 text-[#56B246] border-[#56B246]/30 text-[11px] uppercase tracking-[0.18em] font-semibold px-4 py-1.5 rounded-full">
            Veterinary Management Platform
          </Badge>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight mb-6">
            Streamline Your{" "}
            <span className="text-[#56B246]">Entire</span>
            <br />Veterinary Practice
          </h1>

          <p className="text-lg text-white/45 leading-relaxed max-w-2xl mx-auto mb-10">
            InnoVetPro unifies patient intake, clinical workflows, pharmacy,
            billing, and reporting into one intelligent platform built for
            modern veterinary clinics.
          </p>

          <div className="max-w-lg mx-auto mb-4">
            <AccessForm />
          </div>
          <p className="text-xs text-white/25">
            Credentials available upon request · No credit card required
          </p>

          {/* Floating stat cards */}
          <div className="flex flex-wrap justify-center gap-4 mt-16">
            <div className="bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-2xl px-6 py-4 flex items-center gap-4">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-2xl font-black text-white">4.9</span>
                </div>
                <div className="text-[11px] text-white/35 mt-0.5">2.6K+ Clinics Served</div>
              </div>
            </div>

            <div className="bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-2xl px-6 py-4">
              <div className="text-[11px] text-white/35 mb-1 flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-[#56B246]" /> Live Patients Today
              </div>
              <div className="text-2xl font-black text-white">
                <span className="text-[#56B246]">↑</span> 1,240+
              </div>
            </div>

            <div className="bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-2xl px-6 py-4">
              <div className="text-[11px] text-white/35 mb-1.5">Roles Supported</div>
              <div className="text-2xl font-black text-white mb-1.5">5 Roles</div>
              <div className="flex gap-1">
                {[["R","Receptionist"],["V","Vet"],["N","Nurse"],["P","Pharmacist"],["A","Admin"]].map(([abbr]) => (
                  <span key={abbr} className="text-[9px] bg-[#56B246]/20 text-[#56B246] px-1.5 py-0.5 rounded font-bold">
                    {abbr}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 bg-white/[0.018]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#56B246] text-[11px] uppercase tracking-[0.2em] font-semibold mb-3">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-black">Everything Your Clinic Needs</h2>
            <p className="text-white/35 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              From the first check-in to the final invoice — every step of the
              veterinary workflow in one unified system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="group bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-[#56B246]/25 rounded-2xl p-6 transition-all duration-300 cursor-default">
                <div className="h-10 w-10 rounded-xl bg-[#56B246]/15 flex items-center justify-center mb-4 group-hover:bg-[#56B246]/25 transition-colors">
                  <Icon className="h-5 w-5 text-[#56B246]" />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section id="workflow" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#56B246] text-[11px] uppercase tracking-[0.2em] font-semibold mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-black">The Complete Clinic Workflow</h2>
            <p className="text-white/35 mt-4 text-sm">Role-based guidance from intake to discharge.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#56B246]/40 via-white/5 to-[#56B246]/40" />

            {WORKFLOW.map((step, i) => (
              <div key={step.num} className="relative bg-white/[0.04] border border-white/[0.07] rounded-2xl p-8 text-center overflow-hidden">
                <div className="text-6xl font-black text-white/[0.04] absolute top-3 right-5 leading-none select-none">
                  {step.num}
                </div>
                <div className={cn("inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold text-white mb-5", step.color)}>
                  {step.role}
                </div>
                <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
                {i < WORKFLOW.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-white/15 absolute -right-3 top-1/2 -translate-y-1/2 hidden md:block z-10" />
                )}
              </div>
            ))}
          </div>

          {/* CTA under workflow */}
          <div className="mt-10 text-center">
            <Button
              size="lg"
              className="bg-[#56B246] hover:bg-[#56B246]/90 text-white font-bold px-10 gap-2"
              onClick={() => scrollTo("access")}
            >
              See It Live <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-3 text-xs text-white/25">Request access to explore the interactive demo clinic</p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6 border-y border-white/[0.06] bg-white/[0.018]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ num, label }) => (
            <div key={label}>
              <div className="text-4xl md:text-5xl font-black text-white mb-1">{num}</div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── REQUEST ACCESS ── */}
      <section id="access" className="py-28 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#56B246]/[0.06] rounded-full blur-[100px]" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative">
          <Badge className="mb-6 bg-[#56B246]/15 text-[#56B246] border-[#56B246]/30 text-[11px] uppercase tracking-[0.18em] font-semibold px-4 py-1.5 rounded-full">
            Get Started Today
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black mb-5">
            Ready to Transform<br />Your Clinic?
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-md mx-auto">
            Login credentials for the InnoVetPro database system are available upon request.
            Provide your email to receive an instant access key.
          </p>
          <AccessForm center />
          <p className="mt-4 text-xs text-white/25">
            Your information is never shared with third parties.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <AppLogo imgHeight={28} showText textClassName="text-sm font-bold text-white" />
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} InnoVetPro · Veterinary Management System
          </p>
          <div className="flex gap-6 text-xs text-white/35">
            <button onClick={() => navigate("/login")} className="hover:text-white/70 transition-colors">Sign In</button>
            <button onClick={() => navigate("/signup")} className="hover:text-white/70 transition-colors">Create Account</button>
            <button onClick={() => navigate("/login/demo")} className="hover:text-white/70 transition-colors">Demo Clinic</button>
          </div>
        </div>
      </footer>

    </div>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

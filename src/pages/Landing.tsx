import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Users, ClipboardList,
  Pill, ReceiptText, BarChart3, Shield,
  Star, Activity, Stethoscope, Menu, X,
  Heart, Quote, Lock,
  Smartphone, Wifi, MapPin, HeadphonesIcon,
  Brain, Zap, TrendingDown, Play, ChevronRight, Building2,
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
  "Clinical Notes", "AI Diagnostics", "KES Billing", "Patient Intake",
  "Pharmacy Management", "Multi-Role Access", "Live Queue Board", "Audit Trails",
  "Hospitalization", "Prescription Management", "PDF Records", "Appointment Scheduling",
  "Lab & Diagnostics", "Field Vet Mode", "Offline Sync", "M-Pesa Ready",
];

const HERO_PRODUCTS = [
  {
    icon: ClipboardList,
    iconBg: "bg-[#56B246]/15",
    iconColor: "text-[#56B246]",
    title: "Clinical Notes & SOAP",
    desc: "AI-assisted SOAP notes, e-prescriptions, and diagnosis logging — structured for every veterinary workflow from intake to discharge.",
    tags: ["AI-Assisted", "SOAP Notes", "e-Prescriptions", "Diagnosis Logging"],
  },
  {
    icon: Brain,
    iconBg: "bg-indigo-500/15",
    iconColor: "text-indigo-400",
    title: "AI Diagnostics Engine",
    desc: "Intelligent pattern recognition across vitals, lab results, and clinical history. Surface insights faster with an AI co-pilot built for veterinary medicine.",
    tags: ["Vitals Analysis", "Lab Interpretation", "AI Co-pilot", "Pattern Recognition"],
  },
  {
    icon: ReceiptText,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    title: "Kenyan-Localized Billing",
    desc: "KES-denominated invoices, M-Pesa integration, multi-branch billing, and real-time revenue dashboards designed for Kenyan veterinary practice.",
    tags: ["KES Currency", "M-Pesa Ready", "Multi-Branch", "Revenue Reports"],
  },
];

const FEATURES = [
  { icon: Users,         title: "Patient Intake",       desc: "Register or check in patients with a streamlined receptionist flow." },
  { icon: Stethoscope,   title: "Clinical Workflow",    desc: "Vitals → Examination → Dispensing, all in one guided role-handoff." },
  { icon: Pill,          title: "Pharmacy & Inventory", desc: "Real-time dispensing with auto inventory deduction and low-stock alerts." },
  { icon: BarChart3,     title: "Reports & Analytics",  desc: "Full audit trails, revenue reports, and performance analytics at a glance." },
  { icon: Shield,        title: "Role-Based Access",    desc: "Fine-grained permissions for every role from Receptionist to SuperAdmin." },
  { icon: ClipboardList, title: "Lab & Diagnostics",    desc: "Order tests, track results, and attach lab reports directly to patient records." },
  { icon: Activity,      title: "Live Patient Queue",   desc: "Real-time queue showing every patient's stage from intake to discharge." },
  { icon: Heart,         title: "Patient Journey",      desc: "Full history of every visit, medication, and diagnosis in one timeline view." },
];

const WORKFLOW = [
  { num: "01", role: "Receptionist",         color: "bg-amber-500",  icon: Users,       desc: "Register or check in a patient. Assign to today's queue with a single click." },
  { num: "02", role: "Nurse / Veterinarian", color: "bg-blue-500",   icon: Stethoscope, desc: "Record vitals, perform examination, write SOAP notes, and issue e-prescriptions." },
  { num: "03", role: "Pharmacist & Billing", color: "bg-[#56B246]",  icon: Pill,        desc: "Dispense medication, update inventory, generate KES invoice, and close the visit." },
];

const STATS = [
  { num: "10K+",  label: "Patients Managed",  icon: Users,    accent: "text-[#56B246]" },
  { num: "500+",  label: "Clinics Onboarded", icon: Activity, accent: "text-blue-400" },
  { num: "5",     label: "Staff Roles",        icon: Shield,   accent: "text-violet-400" },
  { num: "99.9%", label: "Uptime SLA",         icon: Zap,      accent: "text-amber-400" },
];

const TESTIMONIALS = [
  { name: "Dr. Sarah Mitchell", role: "Chief Veterinarian", clinic: "Greenfield Animal Hospital", quote: "InnoVetPro transformed how we run our clinic. The workflow automation alone saves us 2+ hours every single day.", stars: 5 },
  { name: "James Okafor",       role: "Practice Manager",   clinic: "CityVet Clinic",             quote: "The role-based access is brilliant. Each staff member sees exactly what they need — no clutter, no confusion.", stars: 5 },
  { name: "Dr. Amara Diallo",   role: "Head of Surgery",    clinic: "PetCare Medical Centre",     quote: "From intake to discharge the flow is completely seamless. I can't imagine going back to our old paper system.", stars: 5 },
];

const EFFICIENCY = [
  { icon: Zap,          stat: "90%",  label: "faster discharge",     desc: "Automated billing and handoff workflows eliminate manual paperwork bottlenecks at closing." },
  { icon: BarChart3,    stat: "3×",   label: "more data visibility", desc: "Real-time dashboards surface performance metrics that were invisible in paper-based systems." },
  { icon: TrendingDown, stat: "40%",  label: "lower admin overhead", desc: "Role-specific views remove irrelevant clutter — every user sees only what they need to act on." },
  { icon: Brain,        stat: "24/7", label: "AI co-pilot active",   desc: "Continuous AI monitoring of vitals trends and lab patterns for every patient in the system." },
];

const MOBILITY = [
  { icon: Smartphone,      title: "Mobile-Optimised Interface", desc: "Responsive layout designed for tablets and phones. Record vitals and notes in the field." },
  { icon: Wifi,            title: "Offline-First Data Sync",    desc: "Continue working without internet. Actions queue locally and sync when reconnected." },
  { icon: MapPin,          title: "Multi-Location Support",     desc: "Manage satellite branches and outreach sites from one centralised dashboard." },
  { icon: HeadphonesIcon,  title: "24/7 Technical Support",     desc: "Our East Africa support team is available around the clock — phone, chat, or email." },
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
                <PawPrint className="h-3 w-3 text-white/30" />
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

// ── Scroll-reveal helper ─────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}>
      {children}
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => { logout(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // ── SEO: title + meta description + JSON-LD schema ──────────────────────
  useEffect(() => {
    document.title = "InnoVetPro — AI Veterinary Software Kenya | Practice Management";
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = "InnoVetPro is the leading AI Veterinary Software in Kenya. Cloud veterinary billing (KES), clinical notes, AI diagnostics, and practice management for modern clinics.";
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "InnoVetPro",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web, iOS, Android",
          "description": "AI-powered veterinary practice management software for Kenya and East Africa.",
          "url": "https://innovetpro.com",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KES" },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "2600" },
        },
        {
          "@type": "Organization",
          "name": "InnoVetPro",
          "url": "https://innovetpro.com",
          "logo": "https://innovetpro.com/logo.png",
          "contactPoint": { "@type": "ContactPoint", "contactType": "customer support", "areaServed": "KE" },
        },
      ],
    };
    let script = document.getElementById("innovetpro-schema") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "innovetpro-schema"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(schema);
    return () => { document.getElementById("innovetpro-schema")?.remove(); };
  }, []);

  const [mobileOpen, setMobileOpen] = useState(false);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const FOOTER_COLS = [
    {
      heading: "Products",
      items: [
        { label: "Clinical Notes", action: () => goTo("product") },
        { label: "AI Diagnostics", action: () => goTo("product") },
        { label: "KES Billing",    action: () => goTo("product") },
        { label: "Field Vet Mode", action: () => goTo("mobility") },
      ],
    },
    {
      heading: "Industries",
      items: [
        { label: "Small Animal Clinics",   action: () => goTo("access") },
        { label: "Large Animal / Farm",    action: () => goTo("access") },
        { label: "Wildlife Conservation",  action: () => goTo("access") },
        { label: "Mobile Clinics",         action: () => goTo("mobility") },
      ],
    },
    {
      heading: "Company",
      items: [
        { label: "Sign In",        action: () => navigate("/login") },
        { label: "Request Access", action: () => goTo("access") },
        { label: "How It Works",   action: () => goTo("workflow") },
        { label: "Reviews",        action: () => goTo("testimonials") },
      ],
    },
  ];

  const NAV_ITEMS: [string, string][] = [
    ["product", "Product"], ["efficiency", "Why InnoVetPro"],
    ["mobility", "Field Vet"], ["testimonials", "Reviews"], ["access", "Request Access"],
  ];

  return (
    <div className="min-h-screen bg-[#080e10] text-white font-sans antialiased overflow-x-hidden">

      {/* ── NAV — Glassmorphism ── */}
      <nav aria-label="Main navigation"
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-2xl bg-[#080e10]/60 border-b border-white/[0.06]"
        style={{ WebkitBackdropFilter: "blur(24px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <AppLogo imgHeight={34} showText textClassName="text-sm font-bold text-white" />
          <div className="hidden md:flex items-center gap-8 text-sm text-white/40">
            {NAV_ITEMS.map(([id, label]) => (
              <button key={id} onClick={() => goTo(id)}
                className="hover:text-white transition-colors duration-200 relative group py-1">
                {label}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[#56B246] group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm"
              className="text-white/45 hover:text-white hover:bg-white/[0.06] gap-1.5 text-xs"
              onClick={() => navigate("/login")}>
              <Lock className="h-3.5 w-3.5" strokeWidth={1.5} /> Sign In
            </Button>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button size="sm"
                className="bg-[#56B246] hover:bg-[#4ca33d] text-white font-semibold gap-1.5 text-xs shadow-lg shadow-[#56B246]/20"
                onClick={() => goTo("access")}>
                Request Access <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          </div>
          <button className="md:hidden text-white/55 hover:text-white" aria-label="Toggle menu"
            onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-white/[0.06] bg-[#080e10]/95 px-6 py-4 space-y-3 text-sm">
              {NAV_ITEMS.map(([id, label]) => (
                <button key={id} onClick={() => goTo(id)} className="block text-left text-white/50 hover:text-white transition-colors">{label}</button>
              ))}
              <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                <Button variant="outline" size="sm" className="flex-1 border-white/20 text-white bg-transparent text-xs" onClick={() => navigate("/login")}>Sign In</Button>
                <Button size="sm" className="flex-1 bg-[#56B246] text-white text-xs font-semibold" onClick={() => goTo("access")}>Request Access</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section aria-label="Hero" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <video autoPlay muted loop playsInline aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.07]"
          style={{ willChange: "transform" }}>
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Glassmorphism orbs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/3 w-[700px] h-[700px] bg-[#56B246]/[0.07] rounded-full blur-[160px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/[0.05] rounded-full blur-[120px]" />
          <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-[#56B246]/[0.04] rounded-full blur-[80px]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#080e10]/50 via-transparent to-[#080e10] pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-[#56B246]/10 border border-[#56B246]/20">
              <div className="h-1.5 w-1.5 rounded-full bg-[#56B246] animate-pulse" />
              <span className="text-[11px] text-[#56B246] font-semibold uppercase tracking-[0.2em]">AI Veterinary Software · Kenya</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl lg:text-6xl xl:text-[72px] font-black leading-[1.04] tracking-tight mb-6">
              Smarter Veterinary<br />
              <span className="text-[#56B246]">Operations.</span><br />
              <span className="text-white/75">Powered by AI.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base text-white/40 leading-relaxed mb-10 max-w-lg">
              Modernizing practice management from the ground up — faster decisions, clearer
              insights, and Kenyan-localized billing built for how you actually work.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-3 mb-10">
              <AccessForm />
              <div className="flex items-center gap-3 pt-1">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => goTo("product")}
                  className="flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors group">
                  <span className="h-8 w-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors shrink-0">
                    <Play className="h-3 w-3 text-white ml-0.5" aria-hidden="true" />
                  </span>
                  Watch Demo
                </motion.button>
                <span className="text-white/12">|</span>
                <p className="text-xs text-white/20">No credit card · 24-hr response · KES billing included</p>
              </div>
            </motion.div>

            {/* Trust badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap gap-2">
              {[
                { icon: Star,           text: "4.9 / 5",  sub: "2.6K+ clinics",     color: "text-amber-400", fill: true },
                { icon: Activity,       text: "1,240+",   sub: "patients today",    color: "text-[#56B246]" },
                { icon: Shield,         text: "99.9%",    sub: "uptime SLA",        color: "text-blue-400" },
                { icon: HeadphonesIcon, text: "24/7",     sub: "EA support",        color: "text-purple-400" },
              ].map(({ icon: Icon, text, sub, color, fill }) => (
                <div key={sub} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-2.5">
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", color, fill && "fill-amber-400")} aria-hidden="true" />
                  <span className="text-xs text-white font-semibold">{text}</span>
                  <span className="text-[10px] text-white/22">{sub}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — mock app window */}
          <motion.div initial={{ opacity: 0, x: 40, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative hidden lg:block">
            <div className="absolute -inset-6 bg-[#56B246]/[0.05] rounded-3xl blur-3xl" aria-hidden="true" />
            <div className="relative">
              <MockAppWindow />
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-[#0f1c20]/95 backdrop-blur-xl border border-[#56B246]/25 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#56B246]/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-[#56B246]" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Patient Checked In</div>
                  <div className="text-[10px] text-white/30">Rocky — German Shepherd · Just now</div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.5 }}
                className="absolute -top-5 -right-5 bg-[#0f1c20]/95 backdrop-blur-xl border border-indigo-500/20 rounded-2xl px-4 py-3 shadow-2xl">
                <div className="text-[10px] text-white/30 mb-1">AI Diagnostics</div>
                <div className="text-xs font-bold text-white">Temp: 38.5°C · HR: 78 bpm</div>
                <div className="flex items-center gap-1 mt-1">
                  <Brain className="h-3 w-3 text-[#56B246]" aria-hidden="true" />
                  <span className="text-[10px] text-[#56B246]">Normal — no concerns</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="border-y border-white/[0.05] bg-[#080e10] py-4 overflow-hidden" aria-hidden="true">
        <div className="flex gap-14 whitespace-nowrap animate-[marquee_35s_linear_infinite]">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="text-xs font-semibold text-white/20 shrink-0 flex items-center gap-2.5">
              <span className="h-1 w-1 rounded-full bg-[#56B246]" />{item}
            </span>
          ))}
        </div>
      </div>

      {/* ── PRODUCT SUITE ── */}
      <section id="product" aria-labelledby="product-heading" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-[#56B246] text-[11px] uppercase tracking-[0.22em] font-semibold mb-3">Single Connected System</p>
            <h2 id="product-heading" className="text-3xl md:text-5xl font-black tracking-tight">Everything. Unified. Intelligent.</h2>
            <p className="text-white/35 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              From first check-in to final invoice — every step of the veterinary workflow in one platform.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {HERO_PRODUCTS.map((p, i) => (
              <FadeUp key={p.title} delay={i * 0.08}>
                <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-[#56B246]/25 p-8 overflow-hidden transition-colors duration-300 cursor-default h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#56B246]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-5", p.iconBg)}>
                    <p.icon className={cn("h-6 w-6", p.iconColor)} aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{p.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{p.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {p.tags.map(t => (
                      <span key={t} className="text-[10px] font-semibold text-white/28 bg-white/[0.05] px-2.5 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.04}>
                <motion.div whileHover={{ y: -2 }}
                  className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1] rounded-xl p-5 transition-all duration-200 cursor-default h-full">
                  <div className="h-9 w-9 rounded-xl bg-[#56B246]/10 flex items-center justify-center mb-3.5 group-hover:bg-[#56B246]/18 transition-colors">
                    <f.icon className="h-4 w-4 text-[#56B246]" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-white/32 leading-relaxed">{f.desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section id="workflow" aria-labelledby="workflow-heading" className="py-32 px-6 bg-white/[0.012]">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-[#56B246] text-[11px] uppercase tracking-[0.22em] font-semibold mb-3">How It Works</p>
            <h2 id="workflow-heading" className="text-3xl md:text-5xl font-black">From Check-In to Discharge</h2>
            <p className="text-white/35 mt-4 text-sm max-w-md mx-auto">Three seamless role-handoffs. Every patient moves through the same intelligent workflow.</p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WORKFLOW.map((step, i) => (
              <FadeUp key={step.num} delay={i * 0.1}>
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="relative group bg-white/[0.035] hover:bg-white/[0.055] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-8 h-full transition-colors duration-300 overflow-hidden cursor-default">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", step.color)}>
                      <step.icon className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-[10px] text-white/25 font-semibold uppercase tracking-widest">Step {step.num}</div>
                      <div className="font-bold text-white text-sm">{step.role}</div>
                    </div>
                  </div>
                  <p className="text-sm text-white/42 leading-relaxed">{step.desc}</p>
                  <div className="text-7xl font-black text-white/[0.025] absolute bottom-4 right-5 leading-none select-none" aria-hidden="true">{step.num}</div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
          <FadeUp className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="bg-[#56B246] hover:bg-[#4ca33d] text-white font-bold px-10 gap-2 shadow-lg shadow-[#56B246]/20"
                onClick={() => goTo("access")}>
                Request Access <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => goTo("product")}
              className="flex items-center gap-2 text-sm text-white/38 hover:text-white transition-colors">
              <Play className="h-4 w-4" aria-hidden="true" /> Watch Demo
            </motion.button>
          </FadeUp>
        </div>
      </section>

      {/* ── EFFICIENCY ── */}
      <section id="efficiency" aria-labelledby="efficiency-heading" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeUp>
              <p className="text-[#56B246] text-[11px] uppercase tracking-[0.22em] font-semibold mb-4">The InnoVetPro Efficiency Edge</p>
              <h2 id="efficiency-heading" className="text-3xl md:text-5xl font-black leading-tight mb-6">
                Efficient Clinics<br /><span className="text-[#56B246]">Operate Smarter.</span>
              </h2>
              <p className="text-white/38 text-sm leading-relaxed mb-10 max-w-lg">
                InnoVetPro turns clinic data into decisions. Practices using InnoVetPro see measurable
                reductions in billing overhead, faster discharge cycles, and real-time performance visibility.
              </p>
              <div className="space-y-5">
                {EFFICIENCY.map((e, i) => (
                  <motion.div key={e.stat}
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[#56B246]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <e.icon className="h-5 w-5 text-[#56B246]" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-2xl font-black text-white">{e.stat}</span>
                        <span className="text-xs text-[#56B246] font-semibold">{e.label}</span>
                      </div>
                      <p className="text-xs text-white/32 leading-relaxed">{e.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="grid grid-cols-2 gap-3">
                {STATS.map(({ num, label, icon: Icon, accent }) => (
                  <motion.div key={label} whileHover={{ scale: 1.03 }}
                    className="bg-white/[0.035] hover:bg-white/[0.055] border border-white/[0.06] rounded-2xl p-6 text-center transition-colors duration-200 cursor-default">
                    <Icon className={cn("h-5 w-5 mx-auto mb-3", accent)} aria-hidden="true" />
                    <div className="text-3xl font-black text-white leading-none mb-1">{num}</div>
                    <div className="text-[11px] text-white/28 uppercase tracking-wider font-medium">{label}</div>
                  </motion.div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── FIELD-VET MOBILITY ── */}
      <section id="mobility" aria-labelledby="mobility-heading" className="py-32 px-6 bg-white/[0.012]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeUp className="space-y-6">
            <p className="text-[#56B246] text-[11px] uppercase tracking-[0.22em] font-semibold">Field Veterinary Mobility</p>
            <h2 id="mobility-heading" className="text-3xl md:text-4xl font-black leading-tight">
              Works Wherever<br /><span className="text-[#56B246]">You Practise</span>
            </h2>
            <p className="text-white/38 text-sm leading-relaxed max-w-lg">
              Farm rounds, wildlife conservation, mobile clinics — InnoVetPro's local-first architecture
              keeps you functional even offline. Data syncs automatically when you reconnect.
            </p>
            <div className="space-y-5">
              {MOBILITY.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#56B246]/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-[#56B246]" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-0.5">{title}</div>
                    <div className="text-xs text-white/33 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
          <FadeUp delay={0.15}>
            <div className="relative">
              <div className="absolute -inset-6 bg-[#56B246]/[0.04] rounded-3xl blur-3xl" aria-hidden="true" />
              <div className="relative rounded-2xl border border-white/[0.07] bg-[#0d1a1c] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#56B246]/20 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-[#56B246]" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Field Visit — Naivasha Farm</div>
                    <div className="text-[10px] text-white/28">Offline mode · 3 records pending sync</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
                    <span className="text-[10px] text-amber-400 font-semibold">Offline</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { pet: "Daisy — Holstein Cow",  action: "Vitals recorded",    saved: true },
                    { pet: "Herd B — 12 Cattle",    action: "Vaccination logged", saved: true },
                    { pet: "Rufus — Farm Dog",       action: "Wound assessment",   saved: false },
                  ].map(r => (
                    <div key={r.pet} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2.5">
                      <div>
                        <div className="text-xs text-white/80 font-medium">{r.pet}</div>
                        <div className="text-[10px] text-white/28">{r.action}</div>
                      </div>
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full",
                        r.saved ? "bg-[#56B246]/20 text-[#56B246]" : "bg-amber-500/20 text-amber-400")}>
                        {r.saved ? "Saved" : "Queued"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <div className="rounded-xl border border-[#56B246]/20 bg-[#56B246]/[0.06] px-3 py-2.5 flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-[#56B246]" aria-hidden="true" />
                    <span className="text-xs text-white/55">
                      <span className="text-[#56B246] font-semibold">Auto-sync ready</span> · Will upload when connected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" aria-labelledby="testimonials-heading" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-[#56B246] text-[11px] uppercase tracking-[0.22em] font-semibold mb-3">Trusted by Clinics</p>
            <h2 id="testimonials-heading" className="text-3xl md:text-5xl font-black">What Clinics Are Saying</h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, clinic, quote, stars }, i) => (
              <FadeUp key={name} delay={i * 0.1}>
                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="group bg-white/[0.035] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#56B246]/20 rounded-2xl p-7 flex flex-col gap-5 transition-colors duration-300 cursor-default h-full">
                  <div className="flex items-start justify-between">
                    <Quote className="h-7 w-7 text-[#56B246]/35 group-hover:text-[#56B246]/60 transition-colors" aria-hidden="true" />
                    <div className="flex gap-0.5" aria-label={`${stars} out of 5 stars`}>
                      {Array.from({ length: stars }).map((_, j) => (
                        <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-white/48 leading-relaxed flex-1 italic">"{quote}"</p>
                  <div className="flex items-center gap-3 border-t border-white/[0.06] pt-4">
                    <div className="h-9 w-9 rounded-full bg-[#56B246]/20 flex items-center justify-center shrink-0" aria-hidden="true">
                      <span className="text-xs font-bold text-[#56B246]">{name.split(" ").map(n => n[0]).join("").slice(0,2)}</span>
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{name}</div>
                      <div className="text-xs text-white/28">{role} · {clinic}</div>
                    </div>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING UPON REQUEST ── */}
      <section id="pricing-info" aria-labelledby="pricing-heading" className="py-20 px-6 border-y border-white/[0.05] bg-white/[0.012]">
        <FadeUp className="max-w-4xl mx-auto text-center">
          <p className="text-[#56B246] text-[11px] uppercase tracking-[0.22em] font-semibold mb-3">Pricing</p>
          <h2 id="pricing-heading" className="text-2xl md:text-3xl font-black mb-4">Pricing Upon Request</h2>
          <p className="text-white/33 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            We tailor access packages to the size and needs of your clinic. No hidden fees.
            No long-term lock-in. Get a personalised quote by submitting your details below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { label: "Single Clinic",    icon: Stethoscope, desc: "Small to mid-size practices" },
              { label: "Multi-Branch",     icon: Building2,   desc: "Group practices & chains" },
              { label: "Enterprise / NGO", icon: Shield,      desc: "Large networks & wildlife orgs" },
            ].map(({ label, icon: Icon, desc }) => (
              <motion.button key={label} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => goTo("access")}
                className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-[#56B246]/30 rounded-xl p-5 text-center transition-colors duration-200">
                <Icon className="h-6 w-6 text-[#56B246] mx-auto mb-2.5" aria-hidden="true" />
                <div className="text-sm font-bold text-white mb-1">{label}</div>
                <div className="text-[11px] text-white/28">{desc}</div>
                <div className="mt-3 text-xs text-[#56B246] font-semibold flex items-center justify-center gap-1">
                  Inquire <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </div>
              </motion.button>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* ── REQUEST ACCESS ── */}
      <section id="access" aria-labelledby="access-heading" className="py-32 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#56B246]/[0.06] rounded-full blur-[140px]" />
        </div>
        <FadeUp className="max-w-xl mx-auto text-center relative">
          <p className="text-[#56B246] text-[11px] uppercase tracking-[0.22em] font-semibold mb-4">Get Started Today</p>
          <h2 id="access-heading" className="text-4xl md:text-5xl font-black mb-5 leading-tight">
            Ready to Elevate<br /><span className="text-[#56B246]">Your Clinic?</span>
          </h2>
          <p className="text-white/33 text-sm leading-relaxed mb-10 max-w-md mx-auto">
            Submit your details and our team will personally review and send access credentials within 24 hours.
          </p>
          <AccessForm center />
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-white/20">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#56B246]" aria-hidden="true" />No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#56B246]" aria-hidden="true" />Private &amp; secure</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#56B246]" aria-hidden="true" />24-hr response</span>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ── */}
      <footer aria-label="Site footer" className="border-t border-white/[0.06] py-16 px-6 bg-[#060c0e]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <AppLogo imgHeight={30} showText textClassName="text-sm font-bold text-white" className="mb-4" />
              <p className="text-xs text-white/22 leading-relaxed mb-5 max-w-xs">
                AI-powered veterinary management software built for East African clinics that care about efficiency and exceptional outcomes.
              </p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button size="sm" className="bg-[#56B246] hover:bg-[#4ca33d] text-white font-semibold gap-1.5 text-xs"
                  onClick={() => goTo("access")}>
                  Request Access <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            </div>
            {FOOTER_COLS.map(col => (
              <div key={col.heading}>
                <div className="text-white/35 font-semibold mb-4 text-xs uppercase tracking-wider">{col.heading}</div>
                {col.items.map(({ label, action }) => (
                  <button key={label} onClick={action}
                    className="block text-white/22 hover:text-white/55 mb-2.5 text-xs transition-colors text-left">{label}</button>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/16">© {new Date().getFullYear()} InnoVetPro · AI Veterinary Software Kenya</p>
            <p className="text-xs text-white/16">Billing in KES · GDPR-aligned · 99.9% uptime</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

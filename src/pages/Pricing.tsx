import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Check, X, Zap, Building2, Network, ArrowRight, Shield, HeadphonesIcon,
  Star, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BillingPeriod = "monthly" | "annual";

interface Plan {
  id: string;
  name: string;
  icon: React.ElementType;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  highlight: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaVariant: "default" | "outline";
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    monthlyPrice: 4500,
    annualPrice: 3750,
    description: "Solo practitioners, mobile vets, and small clinics transitioning away from paper records.",
    highlight: false,
    cta: "Start 14-Day Free Trial",
    ctaVariant: "outline",
    features: [
      { text: "Up to 2 users (1 Vet + 1 Receptionist)", included: true },
      { text: "Pet & client database", included: true },
      { text: "Standard appointment scheduling", included: true },
      { text: "Basic billing & invoicing", included: true },
      { text: "Standard email support", included: true },
      { text: "Inventory & pharmacy management", included: false },
      { text: "Automated SMS/Email reminders", included: false },
      { text: "Lab results tracking & attachment", included: false },
      { text: "Multi-branch management", included: false },
      { text: "Dedicated account manager", included: false },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    icon: Building2,
    badge: "Most Popular",
    monthlyPrice: 12000,
    annualPrice: 10000,
    description: "Busy established clinics with multiple doctors, a dispensary, and higher daily foot traffic.",
    highlight: true,
    cta: "Start 14-Day Free Trial",
    ctaVariant: "default",
    features: [
      { text: "Up to 10 users", included: true },
      { text: "Everything in Starter, plus:", included: true },
      { text: "Inventory & pharmacy management", included: true },
      { text: "Automated appointment & vaccination reminders (SMS/Email)", included: true },
      { text: "Lab results tracking & attachment", included: true },
      { text: "Financial reporting & analytics", included: true },
      { text: "Priority support", included: true },
      { text: "Multi-branch management", included: false },
      { text: "Dedicated account manager", included: false },
      { text: "Custom integrations (KRA eTIMS)", included: false },
    ],
  },
  {
    id: "clinic-chain",
    name: "Clinic Chain",
    icon: Network,
    badge: "Enterprise",
    monthlyPrice: 35000,
    annualPrice: 29167,
    description: "Large veterinary hospitals, 24-hour facilities, and multi-branch practices across Kenya.",
    highlight: false,
    cta: "Contact Sales",
    ctaVariant: "outline",
    features: [
      { text: "Unlimited users", included: true },
      { text: "Everything in Professional, plus:", included: true },
      { text: "Multi-branch data syncing & central management", included: true },
      { text: "Advanced role-based access control", included: true },
      { text: "Custom integrations (KRA eTIMS, accounting software)", included: true },
      { text: "Dedicated account manager & on-site training", included: true },
      { text: "24/7 phone & chat support", included: true },
      { text: "SLA guarantees", included: true },
      { text: "Custom reporting & API access", included: true },
      { text: "White-glove onboarding", included: true },
    ],
  },
];

const FAQS = [
  { q: "How do I get access?", a: "After choosing a plan, you receive a unique Access Token. Enter it on the sign-in page alongside your credentials to activate your clinic's subscription." },
  { q: "Is there a demo I can try?", a: "Yes — use the demo token DEMO-INNOVETPRO-2024 on the sign-in page for full unlimited access to the demo clinic." },
  { q: "Can I switch plans later?", a: "Absolutely. Contact us to upgrade or downgrade at any time. Billing is prorated for annual plans." },
  { q: "Where is my data stored?", a: "All data is stored securely and encrypted at rest in certified data centres in East Africa." },
  { q: "Do you support offline use?", a: "InnoVetPro works in low-connectivity environments with local-first data sync that pushes when you're back online." },
  { q: "What payment methods do you accept?", a: "M-Pesa (Paybill/Till), bank transfer, and corporate invoicing for Clinic Chain plans." },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  const handleCta = (plan: Plan) => {
    if (plan.id === "clinic-chain") {
      toast({ title: "Sales team notified", description: "We'll reach out within 1 business day to schedule a demo." });
      return;
    }
    navigate("/register");
    setCheckoutPlan(plan.id);
    setTimeout(() => {
      toast({
        title: `${plan.name} trial activated!`,
        description: "Your 14-day free trial has started. Redirecting to setup…",
      });
      setCheckoutPlan(null);
      navigate("/login");
    }, 1800);
  };

  const price = (plan: Plan) =>
    billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
              <circle cx="16" cy="16" r="15" fill="hsl(111 43% 49%)" />
              <path d="M10 16 L16 10 L22 16 M16 10 L16 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>InnoVetPro</span>
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Home</Button>
            <Button size="sm" onClick={() => navigate("/login")}>Log In</Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        {/* ── Hero ── */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Plans for every clinic
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From solo vets to multi-branch chains — InnoVetPro scales with your practice.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 rounded-full border bg-muted/40 p-1 text-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 rounded-full transition-all font-medium ${billing === "monthly" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-4 py-1.5 rounded-full transition-all font-medium flex items-center gap-1.5 ${billing === "annual" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Annual
              <Badge className="bg-emerald-500 text-white text-[10px] h-4 px-1.5">2 Months Free</Badge>
            </button>
          </div>
        </div>

        {/* ── Plan Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isLoading = checkoutPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 space-y-6 flex flex-col ${
                  plan.highlight
                    ? "border-primary shadow-xl shadow-primary/10 bg-gradient-to-b from-primary/5 to-background scale-[1.02]"
                    : "border-border bg-card"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={plan.highlight ? "bg-primary text-white px-3" : "bg-secondary text-secondary-foreground px-3"}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${plan.highlight ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`h-5 w-5 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className="font-bold text-lg">{plan.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div>
                  <div className="flex items-end gap-1">
                    <span className="text-xs font-semibold text-muted-foreground mb-1.5 mr-0.5">KSh</span>
                    <span className="text-4xl font-bold">{price(plan).toLocaleString("en-KE")}</span>
                    <span className="text-muted-foreground text-sm mb-1">/mo</span>
                  </div>
                  {billing === "annual" && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">KSh {(plan.monthlyPrice * 12).toLocaleString("en-KE")} billed annually — 2 months free</p>
                  )}
                </div>

                <Button
                  className={`w-full gap-2 ${plan.highlight ? "" : ""}`}
                  variant={plan.ctaVariant}
                  onClick={() => handleCta(plan)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Activating…
                    </span>
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <ul className="space-y-2.5 text-sm flex-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className={`flex items-start gap-2 ${feat.included ? "" : "opacity-40"}`}>
                      {feat.included
                        ? <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        : <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── Trust badges ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "SOC 2 Type II", desc: "Your data is encrypted in transit and at rest, with annual third-party security audits." },
            { icon: HeadphonesIcon, title: "24/7 Support", desc: "Professional plan customers get 8-hour response SLAs. Clinic Chain gets dedicated phone support." },
            { icon: Star, title: "14-Day Free Trial", desc: "No credit card required. Full feature access for 14 days on all plans." },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="text-center">
              <CardContent className="pt-6 space-y-2">
                <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          {FAQS.map((faq, i) => (
            <div key={i} className="border rounded-xl overflow-hidden">
              <button
                className="w-full flex justify-between items-center px-5 py-4 text-left text-sm font-medium hover:bg-muted/30 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {faq.q}
                {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground border-t bg-muted/10">{faq.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* ── CTA Footer ── */}
        <div className="rounded-2xl border bg-gradient-to-r from-primary/10 to-emerald-500/10 p-10 text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to modernise your clinic?</h2>
          <p className="text-muted-foreground">Join veterinary practices across Kenya using InnoVetPro. Start your 14-day free trial today.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" onClick={() => navigate("/login")} className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/")}>
              Learn More
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

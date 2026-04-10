import { useState, useEffect } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn, KeyRound, Mail, FlaskConical, Building2, CheckCircle2 } from "lucide-react";
import { validateToken, setActiveToken, type AccessToken } from "@/lib/tokenStore";
import { logActivity } from "@/lib/activityStore";
import { seedDemoStaffProfiles } from "@/lib/staffProfileStore";
import { cn } from "@/lib/utils";

export default function Login() {
  const { logout, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tokenCode, setTokenCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [detectedToken, setDetectedToken] = useState<AccessToken | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const redirectTo = from && from !== "/" && from !== "/select-profile" ? from : "/select-profile";

  // Always log out the moment this page mounts
  useEffect(() => {
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDemo = detectedToken?.isDemo ?? false;
  const isProduction = detectedToken !== null && !isDemo;

  const handleTokenChange = (val: string) => {
    const upper = val.toUpperCase();
    setTokenCode(upper);
    setError("");
    if (upper.length >= 8) {
      setDetectedToken(validateToken(upper));
    } else {
      setDetectedToken(null);
    }
  };

  const autofillDemo = () => {
    handleTokenChange("DEMO-INNOVETPRO-2024");
    setEmail("demo@vetcare.demo");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const accessToken = validateToken(tokenCode);
    if (!accessToken) {
      logActivity({ type: "token_invalid", title: "Invalid access token", detail: `Token: ${tokenCode.slice(0, 8)}…`, email, tokenCode });
      setError("Invalid or expired access token. Please check and try again.");
      return;
    }

    logActivity({
      type: "token_validated",
      title: "Access token validated",
      detail: `Plan: ${accessToken.plan} · Clinic: ${accessToken.clinicName}`,
      email, tokenCode: accessToken.code, tokenPlan: accessToken.plan, clinicName: accessToken.clinicName,
    });

    const ok = loginWithToken(email, accessToken);
    if (ok) {
      setActiveToken(accessToken);
      // Seed demo staff profiles + clear any existing profile lock so they go through /select-profile
      seedDemoStaffProfiles();
      try { localStorage.removeItem("acf_profile_locked"); localStorage.removeItem("acf_active_profile"); } catch {}
      logActivity({
        type: "login", title: "User signed in",
        detail: `${accessToken.clinicName} · ${accessToken.plan} plan`,
        email, tokenCode: accessToken.code, tokenPlan: accessToken.plan, clinicName: accessToken.clinicName,
      });
      navigate(redirectTo, { replace: true });
    } else {
      logActivity({ type: "login_failed", title: "Sign in failed", email });
      setError("Sign in failed. Please try again.");
    }
  };

  // Dynamic accent for glass card ring and badge
  const accent = isDemo
    ? { ring: "ring-1 ring-amber-400/40",  btnCls: "bg-amber-500 hover:bg-amber-600 text-white",       badge: "bg-amber-400/20 text-amber-300 border-amber-400/30",   hint: "text-amber-400" }
    : isProduction
    ? { ring: "ring-1 ring-primary/50",    btnCls: "bg-primary hover:bg-primary/90 text-primary-foreground", badge: "bg-primary/20 text-emerald-300 border-primary/30", hint: "text-primary" }
    : { ring: "",                           btnCls: "bg-primary hover:bg-primary/90 text-primary-foreground", badge: "",                                                hint: "text-primary" };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: "hsl(190 19% 7%)" }}>

      {/* Decorative gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-56 -right-40 w-[700px] h-[700px] rounded-full bg-primary/20 blur-[160px]" />
        <div className="absolute -bottom-56 -left-40 w-[600px] h-[600px] rounded-full bg-teal-600/10 blur-[140px]" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 rounded-full bg-primary/8 blur-[100px]" />
        {/* Subtle grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="lg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#lg)" />
        </svg>
      </div>

      <div className="relative w-full max-w-[420px] space-y-7">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-2">
            <AppLogo imgHeight={52} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Inno<span className="text-primary">vet</span>Pro
          </h1>
          <p className="text-[11px] text-white/35 uppercase tracking-[0.3em] font-medium">
            Veterinary Management System
          </p>
        </div>

        {/* Glass sign-in card */}
        <div className={cn(
          "rounded-3xl border border-white/[0.10] bg-white/[0.06] backdrop-blur-xl shadow-2xl p-7 space-y-5",
          accent.ring
        )}>
          {/* Card header */}
          <div className="space-y-1">
            <h2 className="text-white text-lg font-semibold flex items-center gap-2">
              {isDemo
                ? <><FlaskConical className="h-4 w-4 text-amber-400" /> Demo Environment</>
                : isProduction
                ? <><Building2 className="h-4 w-4 text-primary" /> Production Clinic</>
                : <><LogIn className="h-4 w-4 text-white/60" /> Sign In to Your Clinic</>
              }
            </h2>
            <p className="text-white/40 text-xs">
              {isDemo
                ? "Shared sandbox — any email works."
                : isProduction
                ? `${detectedToken!.clinicName} · ${detectedToken!.plan} plan`
                : "Enter your access code to identify your clinic."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2 bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {/* Token / Access Code */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                <KeyRound className="h-3 w-3" /> Access Code
              </label>
              <Input
                id="token"
                type="text"
                placeholder="e.g. DEMO-INNOVETPRO-2024"
                value={tokenCode}
                onChange={(e) => handleTokenChange(e.target.value)}
                autoComplete="off"
                className="h-10 font-mono tracking-wider uppercase bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/20 focus:border-primary/60 focus:ring-primary/30"
                required
              />
              {detectedToken && (
                <div className="flex items-center gap-2 pt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", accent.badge)}>
                    {isDemo ? "Demo Account" : "Production Account"}
                  </span>
                  <span className="text-[10px] text-white/35 truncate">
                    {detectedToken.clinicName} · {detectedToken.plan}
                  </span>
                </div>
              )}
              {tokenCode.length >= 8 && !detectedToken && (
                <p className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Code not recognised. Check for typos.
                </p>
              )}
              {!tokenCode && (
                <p className="text-[10px] text-white/30">
                  Exploring?{" "}
                  <button type="button" onClick={autofillDemo} className={cn("font-semibold hover:underline", accent.hint)}>
                    Use the demo code
                  </button>
                </p>
              )}
              {isDemo && (
                <p className="text-[10px] text-white/30">
                  <span className={cn("font-semibold", accent.hint)}>Demo code detected.</span>{" "}
                  You can use any email below.
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Clinic Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder={isDemo ? "demo@vetcare.demo" : "you@yourclinic.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-10 bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/20 focus:border-primary/60 focus:ring-primary/30"
                required
              />
            </div>

            <Button
              type="submit"
              className={cn("w-full h-11 gap-2 border-0 font-semibold text-sm rounded-xl transition-all duration-300", accent.btnCls)}
            >
              <LogIn className="h-4 w-4" />
              {isDemo ? "Sign In to Demo" : isProduction ? "Sign In to Clinic" : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-xs text-white/30">
            No access code?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Request Access
            </Link>
          </p>
          
          {/* Watch Demo CTA */}
          <button
            onClick={autofillDemo}
            className="w-full h-11 gap-2 border border-white/20 hover:border-primary/50 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center"
          >
            <FlaskConical className="h-4 w-4" />
            Watch Demo →
          </button>
        </div>

      </div>
    </div>
  );
}

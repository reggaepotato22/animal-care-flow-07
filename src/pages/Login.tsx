import { useState, useEffect } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, LogIn, KeyRound, Mail, FlaskConical, Building2, CheckCircle2 } from "lucide-react";
import { validateToken, setActiveToken, type AccessToken } from "@/lib/tokenStore";
import { logActivity } from "@/lib/activityStore";
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
  const redirectTo = from && from !== "/" ? from : "/dashboard";

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

  // Dynamic theming based on detected token type
  const accent = isDemo
    ? { ring: "ring-amber-400/40", border: "border-amber-300 dark:border-amber-700/60", bg: "bg-amber-50/30 dark:bg-amber-900/10", btn: "bg-amber-500 hover:bg-amber-600 text-white", badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300", hint: "text-amber-700 dark:text-amber-400" }
    : isProduction
    ? { ring: "ring-emerald-400/40", border: "border-emerald-300 dark:border-emerald-700/60", bg: "bg-emerald-50/20 dark:bg-emerald-900/10", btn: "bg-primary hover:bg-primary/90 text-primary-foreground", badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300", hint: "text-emerald-700 dark:text-emerald-400" }
    : { ring: "", border: "border-border", bg: "", btn: "bg-primary hover:bg-primary/90 text-primary-foreground", badge: "", hint: "" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">

        {/* Logo */}
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center mb-1">
            <AppLogo imgHeight={56} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "hsl(190,19%,13%)" }}>
            Inno<span className="text-primary">vet</span>Pro
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
            Veterinary Management System
          </p>
        </div>

        {/* Sign-in card */}
        <Card className={cn("shadow-lg transition-all duration-300", accent.border, accent.bg, detectedToken ? `ring-2 ${accent.ring}` : "")}>
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-lg flex items-center gap-2">
              {isDemo
                ? <><FlaskConical className="h-4 w-4 text-amber-500" /> Sign In — Demo Environment</>
                : isProduction
                ? <><Building2 className="h-4 w-4 text-emerald-600" /> Sign In — Production Account</>
                : <><LogIn className="h-4 w-4" /> Sign In</>
              }
            </CardTitle>
            <CardDescription className="text-xs">
              {isDemo
                ? "You're using a demo token. This is a shared sandbox environment."
                : isProduction
                ? `Production account detected — ${detectedToken!.clinicName} · ${detectedToken!.plan} plan.`
                : "Enter your access token below. The system will identify your account type automatically."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              {/* Token input */}
              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-xs font-medium flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3" /> Access Token
                </Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Enter your access token…"
                  value={tokenCode}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  autoComplete="off"
                  className="h-9 font-mono tracking-wider uppercase"
                  required
                />

                {/* Live detection result */}
                {detectedToken && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <Badge variant="outline" className={cn("text-[10px] px-2", accent.badge)}>
                      {isDemo ? "Demo Account" : "Production Account"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {detectedToken.clinicName} · {detectedToken.plan}
                    </span>
                  </div>
                )}
                {tokenCode.length >= 8 && !detectedToken && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Token not recognised. Check for typos.
                  </p>
                )}

                {/* Demo autofill hint — only shown when no token typed yet */}
                {!tokenCode && (
                  <p className="text-[10px] text-muted-foreground">
                    Exploring?{" "}
                    <button type="button" onClick={autofillDemo} className={cn("font-semibold hover:underline", accent.hint || "text-primary")}>
                      Use the demo token
                    </button>
                  </p>
                )}

                {/* Demo extra hint when demo token detected */}
                {isDemo && (
                  <p className="text-[10px] text-muted-foreground">
                    <span className={cn("font-semibold", accent.hint)}>Demo token detected.</span>{" "}
                    You can use any email below.
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isDemo ? "demo@vetcare.demo" : "you@yourclinic.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-9"
                  required
                />
              </div>

              <Button type="submit" className={cn("w-full h-9 gap-2 border-0 transition-colors duration-300", accent.btn)}>
                <LogIn className="h-4 w-4" />
                {isDemo ? "Sign In to Demo" : isProduction ? "Sign In to Clinic" : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-4">
              No token yet?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Request Access
              </Link>
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

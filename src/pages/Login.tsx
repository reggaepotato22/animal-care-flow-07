import { useState, useEffect } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, LogIn, KeyRound, Mail, FlaskConical, Building2, CheckCircle2, User, Lock, Eye, EyeOff } from "lucide-react";
import { validateToken, setActiveToken, type AccessToken } from "@/lib/tokenStore";
import { logActivity } from "@/lib/activityStore";
import { cn } from "@/lib/utils";

export default function Login() {
  const { logout, loginWithToken, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Shared
  const [mode, setMode] = useState<"token" | "staff">("token");
  const [error, setError] = useState("");

  // Token mode
  const [tokenCode, setTokenCode] = useState("");
  const [email, setEmail] = useState("");
  const [detectedToken, setDetectedToken] = useState<AccessToken | null>(null);

  // Staff mode
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const accessToken = validateToken(tokenCode);
    if (!accessToken) {
      logActivity({ type: "token_invalid", title: "Invalid access token", detail: `Token: ${tokenCode.slice(0, 8)}…`, email, tokenCode });
      setError("Invalid or expired access token. Please check and try again.");
      return;
    }
    logActivity({ type: "token_validated", title: "Access token validated", detail: `Plan: ${accessToken.plan} · Clinic: ${accessToken.clinicName}`, email, tokenCode: accessToken.code, tokenPlan: accessToken.plan, clinicName: accessToken.clinicName });
    const ok = loginWithToken(email, accessToken);
    if (ok) {
      setActiveToken(accessToken);
      logActivity({ type: "login", title: "User signed in", detail: `${accessToken.clinicName} · ${accessToken.plan} plan`, email, tokenCode: accessToken.code, tokenPlan: accessToken.plan, clinicName: accessToken.clinicName });
      navigate(redirectTo, { replace: true });
    } else {
      logActivity({ type: "login_failed", title: "Sign in failed", email });
      setError("Sign in failed. Please try again.");
    }
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = login(staffEmail, staffPassword);
    if (ok) {
      logActivity({ type: "login", title: "Staff signed in", email: staffEmail });
      navigate(redirectTo, { replace: true });
    } else {
      logActivity({ type: "login_failed", title: "Staff sign in failed", email: staffEmail });
      setError("Incorrect email or password. Contact your clinic administrator if you need help.");
    }
  };

  const tokenAccent = isDemo
    ? { ring: "ring-amber-400/40", border: "border-amber-300 dark:border-amber-700/60", bg: "bg-amber-50/30 dark:bg-amber-900/10", btn: "bg-amber-500 hover:bg-amber-600 text-white", badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300" }
    : isProduction
    ? { ring: "ring-emerald-400/40", border: "border-emerald-300 dark:border-emerald-700/60", bg: "bg-emerald-50/20 dark:bg-emerald-900/10", btn: "bg-primary hover:bg-primary/90 text-primary-foreground", badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300" }
    : { ring: "", border: "border-border", bg: "", btn: "bg-primary hover:bg-primary/90 text-primary-foreground", badge: "" };

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
        <Card className={cn(
          "shadow-lg transition-all duration-300",
          mode === "token"
            ? cn(tokenAccent.border, tokenAccent.bg, detectedToken ? `ring-2 ${tokenAccent.ring}` : "")
            : "border-border"
        )}>
          <CardContent className="pt-5 pb-5">
            <Tabs value={mode} onValueChange={(v) => { setMode(v as "token" | "staff"); setError(""); setDetectedToken(null); setTokenCode(""); }}>
              <TabsList className="w-full mb-5">
                <TabsTrigger value="token" className="flex-1 gap-1.5 text-xs">
                  <KeyRound className="h-3 w-3" /> Access Token
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex-1 gap-1.5 text-xs">
                  <User className="h-3 w-3" /> Staff Login
                </TabsTrigger>
              </TabsList>

              {/* ── TOKEN TAB ── */}
              <TabsContent value="token" className="mt-0 space-y-4">
                <div className="mb-1">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    {isDemo
                      ? <><FlaskConical className="h-4 w-4 text-amber-500" /> Demo Environment</>
                      : isProduction
                      ? <><Building2 className="h-4 w-4 text-emerald-600" />{detectedToken!.clinicName} — Production</>
                      : <><LogIn className="h-4 w-4" /> Sign In with Access Token</>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isDemo
                      ? "Shared sandbox — explore all features freely."
                      : isProduction
                      ? `${detectedToken!.plan} plan · Enter your clinic email below.`
                      : "Enter the token provided by your clinic administrator or InnoVetPro."}
                  </p>
                </div>

                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}

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
                    {detectedToken && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <Badge variant="outline" className={cn("text-[10px] px-2", tokenAccent.badge)}>
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
                    {isDemo && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Demo token detected — any email address works below.
                      </p>
                    )}
                  </div>

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

                  <Button type="submit" className={cn("w-full h-9 gap-2 border-0 transition-colors duration-300", tokenAccent.btn)}>
                    <LogIn className="h-4 w-4" />
                    {isDemo ? "Enter Demo" : isProduction ? "Sign In to Clinic" : "Sign In"}
                  </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground pt-1">
                  No token yet?{" "}
                  <Link to="/signup" className="text-primary font-medium hover:underline">Request Access</Link>
                  {" · "}
                  <Link to="/login/demo" className="text-muted-foreground hover:text-primary hover:underline">Try Demo →</Link>
                </p>
              </TabsContent>

              {/* ── STAFF TAB ── */}
              <TabsContent value="staff" className="mt-0 space-y-4">
                <div className="mb-1">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary" /> Staff Account Login
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sign in with your clinic email and password as provisioned by your administrator.
                  </p>
                </div>

                <form onSubmit={handleStaffSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="staff-email" className="text-xs font-medium flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> Email Address
                    </Label>
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="you@yourclinic.com"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      autoComplete="email"
                      className="h-9"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="staff-password" className="text-xs font-medium flex items-center gap-1.5">
                      <Lock className="h-3 w-3" /> Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="staff-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        autoComplete="current-password"
                        className="h-9 pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword
                          ? <EyeOff className="h-3.5 w-3.5" />
                          : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-9 gap-2">
                    <LogIn className="h-4 w-4" /> Sign In
                  </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground pt-1">
                  Credentials are provided by your clinic administrator.
                  <br />No account yet?{" "}
                  <Link to="/signup" className="text-primary font-medium hover:underline">Request Access</Link>
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

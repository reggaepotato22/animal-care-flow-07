import { useState, useEffect } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn, FlaskConical, KeyRound, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateToken, setActiveToken } from "@/lib/tokenStore";
import { logActivity } from "@/lib/activityStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const { loginWithToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const redirectTo = (from && from !== "/") ? from : "/dashboard";

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const accessToken = validateToken(token);
    if (!accessToken) {
      logActivity({
        type: "token_invalid",
        title: "Invalid access token entered",
        detail: `Token: ${token.slice(0, 8)}… · Email: ${email}`,
        email,
        tokenCode: token,
      });
      setError("Invalid or expired Access Token. Check your token and try again.");
      return;
    }

    logActivity({
      type: "token_validated",
      title: "Access token validated",
      detail: `Plan: ${accessToken.plan} · Clinic: ${accessToken.clinicName}`,
      email,
      tokenCode: accessToken.code,
      tokenPlan: accessToken.plan,
      clinicName: accessToken.clinicName,
    });

    const ok = loginWithToken(email);
    if (ok) {
      setActiveToken(accessToken);
      logActivity({
        type: "login",
        title: "User signed in",
        detail: `${accessToken.clinicName} · ${accessToken.plan} plan`,
        email,
        tokenCode: accessToken.code,
        tokenPlan: accessToken.plan,
        clinicName: accessToken.clinicName,
      });
      navigate(redirectTo, { replace: true });
    } else {
      logActivity({ type: "login_failed", title: "Sign in failed", email });
      setError("Sign in failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="text-center space-y-2">
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

        {/* Sign in card */}
        <Card className="shadow-lg border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your Access Token and clinic email address to sign in.
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

              {/* Access Token */}
              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-xs font-medium flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3" /> Access Token
                </Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="e.g. DEMO-INNOVETPRO-2024"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  autoComplete="off"
                  className="h-9 font-mono tracking-wider uppercase"
                  required
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Your token is provided when you subscribe.{" "}
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Demo token:
                  </span>{" "}
                  <button
                    type="button"
                    className="font-mono font-semibold text-primary hover:underline"
                    onClick={() => setToken("DEMO-INNOVETPRO-2024")}
                  >
                    DEMO-INNOVETPRO-2024
                  </button>
                </p>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@yourclinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-9"
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Demo email:{" "}
                  <button
                    type="button"
                    className="font-mono font-semibold text-primary hover:underline"
                    onClick={() => setEmail("demo@vetcare.demo")}
                  >
                    demo@vetcare.demo
                  </button>
                </p>
              </div>

              <Button type="submit" className="w-full h-9 gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-4">
              No account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Create your clinic account
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Demo shortcut */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-dashed border-muted-foreground/30" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-background px-3 text-muted-foreground">or try the demo</span>
          </div>
        </div>

        <Card className={cn("border-amber-200 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-800/40 shadow-sm")}>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Demo Clinic</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  One-click access with full sample data. No token needed.
                </p>
              </div>
            </div>
            <Link to="/login/demo" className="block">
              <Button variant="outline" className="w-full h-9 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 font-medium">
                Enter Demo Clinic
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

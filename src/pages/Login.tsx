import { useState, useEffect } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn, KeyRound, Mail, FlaskConical } from "lucide-react";
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

        {/* Sign in card — amber/yellow demo highlight */}
        <Card className="shadow-lg border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-900/10">
          {/* Demo badge strip */}
          <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 dark:bg-amber-600 rounded-t-lg">
            <FlaskConical className="h-4 w-4 text-amber-900 dark:text-amber-100 shrink-0" />
            <span className="text-xs font-bold tracking-wide text-amber-900 dark:text-amber-100 uppercase">
              Demo Access — InnoVetPro Demo Environment
            </span>
          </div>

          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your Access Token and email. All logins access the shared demo environment.
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
                  className="h-9 font-mono tracking-wider uppercase bg-white dark:bg-background"
                  required
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Demo token: </span>
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
                  className="h-9 bg-white dark:bg-background"
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Demo email: </span>
                  <button
                    type="button"
                    className="font-mono font-semibold text-primary hover:underline"
                    onClick={() => setEmail("demo@vetcare.demo")}
                  >
                    demo@vetcare.demo
                  </button>
                </p>
              </div>

              <Button type="submit" className="w-full h-9 gap-2 bg-amber-500 hover:bg-amber-600 text-white border-0">
                <LogIn className="h-4 w-4" />
                Sign In to Demo
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

      </div>
    </div>
  );
}

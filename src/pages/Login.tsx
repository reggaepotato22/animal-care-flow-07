import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, LogIn, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (login(email, password)) {
      navigate(from, { replace: true });
    } else {
      setError("Invalid email or password. If using the demo clinic, click \"Enter Demo Clinic\" below.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        {/* InnoVetPro Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            {/* Cat */}
            <svg width="18" height="22" viewBox="0 0 10 14" fill="none" className="text-primary">
              <path d="M1 5C1 3 2 1 5 1C8 1 9 3 9 5C9 8 7.5 10 5 10C2.5 10 1 8 1 5Z" fill="currentColor" opacity="0.7"/>
              <path d="M1 2L2.5 4M9 2L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M3 11L3 13M7 11L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {/* Rabbit */}
            <svg width="14" height="24" viewBox="0 0 9 16" fill="none" className="text-primary">
              <path d="M2 5C2 3 3 1.5 4.5 1.5C6 1.5 7 3 7 5C7 7.5 6 9 4.5 9C3 9 2 7.5 2 5Z" fill="currentColor" opacity="0.8"/>
              <path d="M2.5 2L2 0.5M6.5 2L7 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M2.5 10L2 13M6.5 10L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {/* Dog */}
            <svg width="22" height="22" viewBox="0 0 13 14" fill="none" className="text-primary">
              <path d="M2 6C2 3.5 3.5 1.5 6.5 1.5C9.5 1.5 11 3.5 11 6C11 9 9 11 6.5 11C4 11 2 9 2 6Z" fill="currentColor"/>
              <path d="M10.5 2L12 1M2.5 3L1 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M3.5 12L3 13.5M9.5 12L10 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "hsl(190,19%,13%)" }}>
            Inno<span className="text-primary">vet</span>Pro
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
            Veterinary Management System
          </p>
        </div>

        {/* Real account sign in */}
        <Card className="shadow-lg border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </CardTitle>
            <CardDescription className="text-xs">
              Use your registered clinic account credentials.
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
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-9">
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

        {/* Demo account — clearly separate */}
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
                  Explore all features with pre-loaded sample data. No sign-up needed.
                </p>
              </div>
            </div>
            <div className="rounded-md bg-amber-100/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2 text-xs font-mono space-y-0.5">
              <div><span className="text-muted-foreground">Email:</span> <span className="font-semibold">demo@vetcare.demo</span></div>
              <div><span className="text-muted-foreground">Password:</span> <span className="font-semibold">demo123</span></div>
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

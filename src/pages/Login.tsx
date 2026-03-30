import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, LogIn, FlaskConical, Stethoscope } from "lucide-react";
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

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary">VetCare Pro</h1>
          <p className="text-muted-foreground text-sm">Veterinary Practice Management</p>
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

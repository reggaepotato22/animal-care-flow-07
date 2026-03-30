import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info } from "lucide-react";
import { getDemoCredentials, subscribeToDemoCredentials } from "@/lib/authStore";

export default function DemoLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoCreds, setDemoCreds] = useState(() => getDemoCredentials());
  const { loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  useEffect(() => {
    const unsub = subscribeToDemoCredentials(() => setDemoCreds(getDemoCredentials()));
    return () => unsub();
  }, []);

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (loginDemo(email, password)) {
      navigate(from, { replace: true });
    } else {
      setError("Invalid demo email or password.");
    }
  };

  const fillDemo = () => {
    const creds = getDemoCredentials();
    setEmail(creds.email);
    setPassword(creds.password);
    setError("");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
              <Info className="h-3.5 w-3.5 mr-1" />
              Demo Access
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <svg width="12" height="16" viewBox="0 0 10 14" fill="none" className="text-primary">
              <path d="M1 5C1 3 2 1 5 1C8 1 9 3 9 5C9 8 7.5 10 5 10C2.5 10 1 8 1 5Z" fill="currentColor" opacity="0.7"/>
              <path d="M1 2L2.5 4M9 2L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M3 11L3 13M7 11L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <svg width="10" height="18" viewBox="0 0 9 16" fill="none" className="text-primary">
              <path d="M2 5C2 3 3 1.5 4.5 1.5C6 1.5 7 3 7 5C7 7.5 6 9 4.5 9C3 9 2 7.5 2 5Z" fill="currentColor" opacity="0.8"/>
              <path d="M2.5 2L2 0.5M6.5 2L7 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M2.5 10L2 13M6.5 10L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <svg width="16" height="16" viewBox="0 0 13 14" fill="none" className="text-primary">
              <path d="M2 6C2 3.5 3.5 1.5 6.5 1.5C9.5 1.5 11 3.5 11 6C11 9 9 11 6.5 11C4 11 2 9 2 6Z" fill="currentColor"/>
              <path d="M10.5 2L12 1M2.5 3L1 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M3.5 12L3 13.5M9.5 12L10 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="font-bold text-2xl tracking-tight" style={{ color: "hsl(190,19%,13%)" }}>
              Inno<span className="text-primary">vet</span>Pro
            </span>
          </div>
          <CardDescription className="text-base">
            Sign in to the shared demo clinic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium mb-1">Demo Environment</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Demo data is isolated in the Demo Clinic account.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={demoCreds.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full">
                Sign in (Demo)
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={fillDemo}>
                Fill demo credentials
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Demo: <strong>{demoCreds.email}</strong> / <strong>{demoCreds.password}</strong>
            </p>
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                Back to normal sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


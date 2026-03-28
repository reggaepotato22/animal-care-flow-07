import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth, DEMO_CREDENTIALS } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      setError("Invalid email or password. Use the demo credentials below.");
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError("");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
              <Info className="h-3.5 w-3.5 mr-1" />
              Demo Environment
            </Badge>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">VetCare Pro</CardTitle>
          <CardDescription className="text-base">
            This is a demo application. You can use the demo credentials or create a new demo account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium mb-1">Demo Access</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Explore all features including patient management, clinical records, and hospital workflows.
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
                placeholder="demo@vetcare.demo"
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
                Sign in
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={fillDemo}>
                Fill demo credentials
              </Button>
            </div>
          </form>
          <div className="mt-8 pt-6 border-t">
            <p className="text-center text-sm font-medium text-slate-900 mb-4">
              Don't have a demo account?
            </p>
            <Link to="/signup">
              <Button type="button" variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 h-11 font-semibold">
                Sign up for Demo Account
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Demo: <strong>{DEMO_CREDENTIALS.email}</strong> / <strong>{DEMO_CREDENTIALS.password}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

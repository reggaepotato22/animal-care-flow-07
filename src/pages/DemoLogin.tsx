import { useEffect, useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Wand2 } from "lucide-react";
import { getDemoCredentials, subscribeToDemoCredentials } from "@/lib/authStore";

export default function DemoLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoCreds, setDemoCreds] = useState(() => getDemoCredentials());
  const { loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const redirectTo = (from && from !== "/") ? from : "/dashboard";

  useEffect(() => {
    const unsub = subscribeToDemoCredentials(() => setDemoCreds(getDemoCredentials()));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (loginDemo(email, password)) {
      navigate(redirectTo, { replace: true });
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
          <div className="flex items-center justify-center mb-2">
            <AppLogo imgHeight={72} showText={false} />
          </div>
          <CardDescription className="text-base">
            Sign in to the demo clinic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 border-primary/40 text-primary hover:bg-primary/5 font-medium gap-2"
            onClick={fillDemo}
          >
            <Wand2 className="h-4 w-4" />
            Autofill demo credentials
          </Button>
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
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t">
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

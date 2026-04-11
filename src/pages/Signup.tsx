import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Building2, UserCircle, Mail, Phone, KeyRound, CheckCircle2, ChevronDown, ChevronUp, SendHorizonal, Rocket, FlaskConical, Bell } from "lucide-react";
import { validateToken, type AccessToken, DEMO_TOKEN_CODE } from "@/lib/tokenStore";
import { submitAccessRequest } from "@/lib/accessRequestStore";
import { useAuth } from "@/contexts/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [clinicName, setClinicName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenCode, setTokenCode] = useState("");
  const [detectedToken, setDetectedToken] = useState<AccessToken | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTokenChange = (val: string) => {
    const upper = val.toUpperCase();
    setTokenCode(upper);
    setTokenError("");
    if (upper.length >= 8) {
      const found = validateToken(upper);
      setDetectedToken(found);
      if (upper.length > 8 && !found) setTokenError("Token not recognised — it may be invalid or expired.");
    } else {
      setDetectedToken(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!clinicName.trim() || !name.trim() || !email.trim()) {
      setError("Please fill in Clinic Name, Your Name and Email.");
      return;
    }

    if (showTokenInput && tokenCode && !detectedToken) {
      setError("The token you entered is invalid. Please correct it or remove it to submit without a token.");
      return;
    }

    setLoading(true);

    // Always record the access request
    submitAccessRequest({
      clinicName: clinicName.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      message: message.trim(),
      hasToken: showTokenInput && !!detectedToken,
      tokenCode: detectedToken ? detectedToken.code : "",
      tokenPlan: detectedToken ? detectedToken.plan : "",
      tokenIsDemo: detectedToken ? detectedToken.isDemo : false,
    });

    // Notify admins of the new request
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: "info",
        message: `New access request from ${clinicName.trim()} (${email.trim()})`,
        targetRoles: ["SuperAdmin"],
      },
    }));

    // If a valid token was provided → log in immediately and go to dashboard
    if (detectedToken) {
      const ok = loginWithToken(email.trim().toLowerCase(), detectedToken);
      if (ok) {
        navigate("/dashboard", { replace: true });
        return;
      }
    }

    setLoading(false);
    setSubmitted(true);
  };

  // "Start Demo" — log in with the shared demo token immediately
  const handleStartDemo = () => {
    const demoToken = validateToken(DEMO_TOKEN_CODE);
    if (!demoToken) return;
    const ok = loginWithToken(email.trim().toLowerCase() || "demo@innovetpro.com", demoToken);
    if (ok) navigate("/dashboard", { replace: true });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardContent className="pt-8 pb-6 px-6 space-y-5 text-center">
              <div className="flex items-center justify-center mb-1">
                <AppLogo imgHeight={44} showText textClassName="text-xl font-bold" />
              </div>
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Request Submitted!</h1>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  Your access request for <strong>{clinicName}</strong> has been received.
                  We'll review it and send credentials to <strong>{email}</strong>.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Typical response time: <span className="font-semibold">1–2 business days</span>
                </p>
              </div>

              {/* Notification reminder */}
              <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2.5 text-left">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  You'll receive an email notification at <strong>{email}</strong> once your account is approved and ready.
                </p>
              </div>

              {/* Start demo immediately */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Want to explore InnoVetPro right now?</p>
                <Button
                  className="w-full gap-2 bg-primary hover:bg-primary/90"
                  onClick={handleStartDemo}
                >
                  <FlaskConical className="h-4 w-4" />
                  Start Free Demo — Use Platform Now
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Full-featured demo environment. No token required.
                </p>
              </div>

              <div className="pt-1 border-t">
                <Link to="/login" className="text-sm text-primary hover:underline font-medium">
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-2">
            <AppLogo imgHeight={44} showText textClassName="text-xl font-bold" />
          </div>
          <CardTitle className="text-xl font-bold">Request Access</CardTitle>
          <CardDescription>
            Fill in your details and we'll get you set up on InnoVetPro.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">
                Clinic / Practice Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clinicName"
                  placeholder="e.g. Nairobi Animal Hospital"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Your Full Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Dr. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@yourclinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+254 700 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="message"
                placeholder="Tell us about your clinic, number of vets, any specific needs…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Token toggle */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTokenInput((s) => !s)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  I already have an access token
                </span>
                {showTokenInput ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {showTokenInput && (
                <div className="px-4 pb-4 pt-1 border-t space-y-2 bg-muted/20">
                  <Label htmlFor="tokenCode" className="text-xs font-medium flex items-center gap-1.5">
                    <KeyRound className="h-3 w-3" /> Access Token Code
                  </Label>
                  <Input
                    id="tokenCode"
                    type="text"
                    placeholder="e.g. STR-XXXX-XXXX or DEMO-INNOVETPRO-2024"
                    value={tokenCode}
                    onChange={(e) => handleTokenChange(e.target.value)}
                    autoComplete="off"
                    className="h-9 font-mono tracking-wider uppercase bg-white dark:bg-background"
                  />
                  {tokenError && (
                    <p className="text-[11px] text-destructive">{tokenError}</p>
                  )}
                  {detectedToken && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <Badge
                        variant="outline"
                        className={
                          detectedToken.isDemo
                            ? "text-[10px] px-2 bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300"
                            : "text-[10px] px-2 bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }
                      >
                        {detectedToken.isDemo ? "Demo Account" : "Production Account"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {detectedToken.clinicName} · {detectedToken.plan} plan
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    If you have been assigned a token, enter it here. The system will automatically detect whether it's for a Production or Demo account.
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
              {detectedToken ? "Submit & Sign In" : "Submit Access Request"}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Already have access?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

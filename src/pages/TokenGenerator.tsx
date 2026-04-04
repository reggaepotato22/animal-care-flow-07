import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  KeyRound, Copy, CheckCheck, Trash2, ArrowLeft, PlusCircle, Shield,
} from "lucide-react";
import {
  generateToken, loadAllTokens, revokeToken, PLAN_LABELS, PLAN_MAX_USERS, DEMO_TOKEN_CODE,
  type TokenPlan, type AccessToken,
} from "@/lib/tokenStore";
import { toast } from "sonner";

const PLAN_COLORS: Record<TokenPlan, string> = {
  demo:          "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300",
  starter:       "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300",
  professional:  "bg-primary/10 text-primary border-primary/30",
  "clinic-chain":"bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300",
};

const PLAN_PRICES: Record<Exclude<TokenPlan, "demo">, string> = {
  starter:        "KSh 4,500/mo",
  professional:   "KSh 12,000/mo",
  "clinic-chain": "KSh 35,000+/mo",
};

function TokenRow({ token, onRevoke }: { token: AccessToken; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(token.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = token.expiresAt ? new Date(token.expiresAt) < new Date() : false;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-sm tracking-wider">{token.code}</span>
          <Badge variant="outline" className={`text-[10px] px-2 ${PLAN_COLORS[token.plan]}`}>
            {PLAN_LABELS[token.plan]}
          </Badge>
          {isExpired && <Badge variant="destructive" className="text-[10px] px-2">Expired</Badge>}
          {token.isDemo && <Badge className="text-[10px] px-2 bg-amber-500 text-white">Master Demo</Badge>}
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5">
          <span>{token.clinicName}</span>
          <span>
            {typeof token.maxUsers === "number" ? `${token.maxUsers} users` : "Unlimited users"}
          </span>
          <span>Created {new Date(token.createdAt).toLocaleDateString("en-KE")}</span>
          {token.expiresAt && (
            <span>Expires {new Date(token.expiresAt).toLocaleDateString("en-KE")}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={copy} className="h-8 gap-1.5 text-xs">
          {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        {!token.isDemo && (
          <Button size="sm" variant="ghost" onClick={onRevoke} className="h-8 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function TokenGenerator() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Exclude<TokenPlan, "demo">>("starter");
  const [clinicName, setClinicName] = useState("");
  const [expiryDays, setExpiryDays] = useState("365");
  const [lastGenerated, setLastGenerated] = useState<AccessToken | null>(null);
  const [refresh, setRefresh] = useState(0);

  const tokens = loadAllTokens();

  const handleGenerate = () => {
    if (!clinicName.trim()) { toast.error("Enter a clinic name first"); return; }
    const days = parseInt(expiryDays, 10);
    const token = generateToken(plan, clinicName, isNaN(days) || days <= 0 ? undefined : days);
    setLastGenerated(token);
    setRefresh(r => r + 1);
    toast.success("Token generated successfully");
  };

  const handleRevoke = (code: string) => {
    revokeToken(code);
    setRefresh(r => r + 1);
    toast.success("Token revoked");
  };

  const demoToken: AccessToken = {
    code: DEMO_TOKEN_CODE,
    plan: "demo",
    clinicName: "InnoVetPro Demo Clinic",
    maxUsers: "unlimited",
    features: ["all"],
    createdAt: new Date().toISOString(),
    expiresAt: null,
    isDemo: true,
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Token Generator</h1>
              <Badge variant="outline" className="text-[10px]">Admin Tool</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Generate & manage InnoVetPro access tokens per subscription plan.
            </p>
          </div>
        </div>

        {/* Generator form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-primary" />
              Generate New Token
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Subscription Plan</Label>
                <Select value={plan} onValueChange={(v) => setPlan(v as Exclude<TokenPlan, "demo">)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter — {PLAN_PRICES.starter} · {PLAN_MAX_USERS.starter} users</SelectItem>
                    <SelectItem value="professional">Professional — {PLAN_PRICES.professional} · {PLAN_MAX_USERS.professional} users</SelectItem>
                    <SelectItem value="clinic-chain">Clinic Chain — {PLAN_PRICES["clinic-chain"]} · Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Validity (days)</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days (trial)</SelectItem>
                    <SelectItem value="365">1 year (annual)</SelectItem>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="0">No expiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Clinic Name</Label>
              <Input
                placeholder="e.g. Nairobi Animal Hospital"
                value={clinicName}
                onChange={e => setClinicName(e.target.value)}
                className="h-9"
              />
            </div>
            <Button onClick={handleGenerate} className="w-full sm:w-auto gap-2">
              <KeyRound className="h-4 w-4" />
              Generate Token
            </Button>

            {lastGenerated && (
              <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">New Token Generated</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="font-mono text-lg font-bold tracking-widest">{lastGenerated.code}</code>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => {
                    navigator.clipboard.writeText(lastGenerated.code);
                    toast.success("Copied to clipboard");
                  }}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Plan: <strong>{PLAN_LABELS[lastGenerated.plan]}</strong> ·
                  Clinic: <strong>{lastGenerated.clinicName}</strong> ·
                  Users: <strong>{typeof lastGenerated.maxUsers === "number" ? lastGenerated.maxUsers : "Unlimited"}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            All Tokens ({tokens.length + 1})
          </h2>

          {/* Master demo token — always shown first */}
          <TokenRow key="demo" token={demoToken} onRevoke={() => {}} />

          {tokens.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">No custom tokens generated yet.</p>
          )}
          {tokens.map(t => (
            <TokenRow key={t.code} token={t} onRevoke={() => handleRevoke(t.code)} />
          ))}
        </div>
      </div>
    </div>
  );
}

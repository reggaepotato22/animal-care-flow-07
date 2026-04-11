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
  FlaskConical, Building2, CheckCircle2, XCircle, Clock, Mail, Phone,
} from "lucide-react";
import {
  generateToken, generateDemoToken, loadAllTokens, revokeToken,
  PLAN_LABELS, PLAN_MAX_USERS, DEMO_TOKEN_CODE,
  type TokenPlan, type AccessToken,
} from "@/lib/tokenStore";
import {
  getAccessRequests, updateRequestStatus, deleteAccessRequest,
  type AccessRequest,
} from "@/lib/accessRequestStore";
import { toast } from "sonner";

type GeneratePlan = Exclude<TokenPlan, "demo"> | "demo";

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

const ACCOUNT_TYPE_BADGE = {
  demo:       "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300",
  production: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const REQUEST_STATUS_META: Record<AccessRequest["status"], { label: string; icon: React.ReactNode; cls: string }> = {
  pending:  { label: "Pending",  icon: <Clock className="h-3 w-3" />,        cls: "bg-muted text-muted-foreground border-border" },
  approved: { label: "Approved", icon: <CheckCircle2 className="h-3 w-3" />, cls: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300" },
  rejected: { label: "Rejected", icon: <XCircle className="h-3 w-3" />,      cls: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300" },
};

function TokenRow({ token, onRevoke }: { token: AccessToken; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(token.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = token.expiresAt ? new Date(token.expiresAt) < new Date() : false;
  const isMasterDemo = token.code === DEMO_TOKEN_CODE;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-sm tracking-wider">{token.code}</span>
          <Badge variant="outline" className={`text-[10px] px-2 ${PLAN_COLORS[token.plan]}`}>
            {PLAN_LABELS[token.plan]}
          </Badge>
          <Badge variant="outline" className={`text-[10px] px-2 ${token.isDemo ? ACCOUNT_TYPE_BADGE.demo : ACCOUNT_TYPE_BADGE.production}`}>
            {token.isDemo ? "Demo" : "Production"}
          </Badge>
          {isExpired && <Badge variant="destructive" className="text-[10px] px-2">Expired</Badge>}
          {isMasterDemo && <Badge className="text-[10px] px-2 bg-amber-500 text-white">Master</Badge>}
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
        {!isMasterDemo && (
          <Button size="sm" variant="ghost" onClick={onRevoke} className="h-8 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function RequestRow({
  req,
  onApprove,
  onReject,
  onDelete,
}: {
  req: AccessRequest;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const meta = REQUEST_STATUS_META[req.status];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{req.name}</span>
            <Badge variant="outline" className={`text-[10px] px-2 flex items-center gap-1 ${meta.cls}`}>
              {meta.icon}{meta.label}
            </Badge>
            {req.hasToken && (
              <Badge
                variant="outline"
                className={`text-[10px] px-2 ${req.tokenIsDemo ? ACCOUNT_TYPE_BADGE.demo : ACCOUNT_TYPE_BADGE.production}`}
              >
                {req.tokenIsDemo ? "Demo Token" : "Production Token"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" /> {req.clinicName}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {new Date(req.submittedAt).toLocaleDateString("en-KE")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {req.email}</span>
        {req.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {req.phone}</span>}
        {req.hasToken && (
          <span className="flex items-center gap-1 sm:col-span-2">
            <KeyRound className="h-3 w-3" />
            Token: <code className="font-mono font-semibold">{req.tokenCode}</code>
            {req.tokenPlan && <span className="text-[10px]">· {req.tokenPlan}</span>}
          </span>
        )}
        {req.message && (
          <span className="sm:col-span-2 italic">"{req.message}"</span>
        )}
      </div>

      {req.status === "pending" && (
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={onApprove}>
            <CheckCircle2 className="h-3 w-3" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10" onClick={onReject}>
            <XCircle className="h-3 w-3" /> Reject
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
      {req.status !== "pending" && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" /> Remove
          </Button>
        </div>
      )}
    </div>
  );
}

export default function TokenGenerator() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<GeneratePlan>("starter");
  const [clinicName, setClinicName] = useState("");
  const [expiryDays, setExpiryDays] = useState("365");
  const [lastGenerated, setLastGenerated] = useState<AccessToken | null>(null);
  const [refresh, setRefresh] = useState(0);

  const tokens = loadAllTokens();
  const requests = getAccessRequests();

  const handleGenerate = () => {
    if (!clinicName.trim()) { toast.error("Enter a clinic name first"); return; }
    const days = parseInt(expiryDays, 10);
    const expiry = isNaN(days) || days <= 0 ? undefined : days;

    let token: AccessToken;
    if (plan === "demo") {
      token = generateDemoToken(clinicName, expiry);
    } else {
      token = generateToken(plan, clinicName, expiry);
    }
    setLastGenerated(token);
    setRefresh(r => r + 1);
    toast.success("Token generated successfully");
  };

  const handleRevoke = (code: string) => {
    revokeToken(code);
    setRefresh(r => r + 1);
    toast.success("Token revoked");
  };

  const handleApprove = (id: string) => {
    updateRequestStatus(id, "approved");
    setRefresh(r => r + 1);
    toast.success("Request approved");
  };

  const handleReject = (id: string) => {
    updateRequestStatus(id, "rejected");
    setRefresh(r => r + 1);
    toast.error("Request rejected");
  };

  const handleDeleteRequest = (id: string) => {
    deleteAccessRequest(id);
    setRefresh(r => r + 1);
    toast.success("Request removed");
  };

  const masterDemoToken: AccessToken = {
    code: DEMO_TOKEN_CODE,
    plan: "demo",
    clinicName: "InnoVetPro Demo Clinic",
    maxUsers: "unlimited",
    features: ["all"],
    createdAt: new Date().toISOString(),
    expiresAt: null,
    isDemo: true,
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

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
              Generate & manage InnoVetPro access tokens. Production and Demo.
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
                <Label className="text-xs font-medium">Plan / Account Type</Label>
                <Select value={plan} onValueChange={(v) => setPlan(v as GeneratePlan)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">
                      <span className="flex items-center gap-1.5">
                        <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
                        Demo — Full access · Shared demo env
                      </span>
                    </SelectItem>
                    <SelectItem value="starter">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                        Starter — {PLAN_PRICES.starter} · {PLAN_MAX_USERS.starter} users
                      </span>
                    </SelectItem>
                    <SelectItem value="professional">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        Professional — {PLAN_PRICES.professional} · {PLAN_MAX_USERS.professional} users
                      </span>
                    </SelectItem>
                    <SelectItem value="clinic-chain">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-purple-500" />
                        Clinic Chain — {PLAN_PRICES["clinic-chain"]} · Unlimited
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {plan === "demo" && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    Demo tokens grant access to the shared demo environment.
                  </p>
                )}
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
              <Label className="text-xs font-medium">Clinic / Organisation Name</Label>
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
              <div className={`rounded-xl border-2 p-4 space-y-2 ${lastGenerated.isDemo ? "border-amber-400/60 bg-amber-50/50 dark:bg-amber-900/10" : "border-primary/40 bg-primary/5"}`}>
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${lastGenerated.isDemo ? "text-amber-700 dark:text-amber-400" : "text-primary"}`}>
                    New Token Generated
                  </p>
                  <Badge variant="outline" className={`text-[10px] px-2 ${lastGenerated.isDemo ? ACCOUNT_TYPE_BADGE.demo : ACCOUNT_TYPE_BADGE.production}`}>
                    {lastGenerated.isDemo ? "Demo Account" : "Production Account"}
                  </Badge>
                </div>
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

          <TokenRow key="master-demo" token={masterDemoToken} onRevoke={() => {}} />

          {tokens.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">No custom tokens generated yet.</p>
          )}
          {tokens.map(t => (
            <TokenRow key={t.code} token={t} onRevoke={() => handleRevoke(t.code)} />
          ))}
        </div>

        {/* Access Requests */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Access Requests
            </h2>
            {pendingCount > 0 && (
              <Badge className="text-[10px] px-2 bg-primary text-primary-foreground">
                {pendingCount} pending
              </Badge>
            )}
          </div>

          {requests.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">
              No access requests yet. Requests submitted via the Sign Up page appear here.
            </p>
          )}
          {requests.map(r => (
            <RequestRow
              key={r.id}
              req={r}
              onApprove={() => handleApprove(r.id)}
              onReject={() => handleReject(r.id)}
              onDelete={() => handleDeleteRequest(r.id)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

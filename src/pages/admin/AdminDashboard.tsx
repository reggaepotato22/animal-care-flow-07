import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2, UserCheck, Bell, Shield, KeyRound, LogIn, LogOut,
  AlertTriangle, RefreshCw, Trash2, Activity, Users, CheckCircle,
  XCircle, Clock,
} from "lucide-react";
import {
  loadAllActivities, clearActivities, ACTIVITY_META,
  type ActivityEvent,
} from "@/lib/activityStore";
import { loadAllTokens, DEMO_TOKEN_CODE, PLAN_LABELS } from "@/lib/tokenStore";
import { format, formatDistanceToNow } from "date-fns";

const adminLinks = [
  { name: "Accounts",      href: "/admin/accounts",      icon: Building2, description: "Clinic accounts, plans, lifecycle" },
  { name: "Users",         href: "/admin/users",          icon: UserCheck, description: "User management and permissions" },
  { name: "Notifications", href: "/admin/notifications",  icon: Bell,      description: "System notifications and alerts" },
  { name: "Token Manager", href: "/tokensag",             icon: KeyRound,  description: "Generate and manage access tokens" },
];

function activityIcon(type: ActivityEvent["type"]) {
  switch (type) {
    case "login":                  return <LogIn className="h-3.5 w-3.5" />;
    case "login_failed":           return <XCircle className="h-3.5 w-3.5" />;
    case "token_validated":        return <CheckCircle className="h-3.5 w-3.5" />;
    case "token_invalid":          return <AlertTriangle className="h-3.5 w-3.5" />;
    case "logout":                 return <LogOut className="h-3.5 w-3.5" />;
    case "patient_added":          return <Users className="h-3.5 w-3.5" />;
    case "payment_received":       return <CheckCircle className="h-3.5 w-3.5" />;
    default:                       return <Activity className="h-3.5 w-3.5" />;
  }
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const meta = ACTIVITY_META[event.type];
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
        {activityIcon(event.type)}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground leading-tight">{event.title}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${meta.color} border-current/30`}>
            {meta.label}
          </Badge>
          {event.tokenPlan && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
              {PLAN_LABELS[event.tokenPlan as keyof typeof PLAN_LABELS] ?? event.tokenPlan}
            </Badge>
          )}
        </div>
        {event.detail && (
          <p className="text-xs text-muted-foreground truncate">{event.detail}</p>
        )}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {event.email && <span className="font-mono">{event.email}</span>}
          {event.tokenCode && (
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
              {event.tokenCode.length > 20 ? `${event.tokenCode.slice(0, 20)}…` : event.tokenCode}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-[10px] text-muted-foreground hidden sm:block">
        {format(new Date(event.timestamp), "HH:mm:ss")}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const tokens = loadAllTokens();

  const refresh = useCallback(() => {
    setActivities(loadAllActivities());
    setLastRefresh(new Date());
  }, []);

  // Initial load + listen for new activity events from this tab or others
  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("acf:activity", handler);
    // Auto-refresh every 10 seconds for cross-tab events written to storage
    const interval = setInterval(refresh, 10_000);
    return () => {
      window.removeEventListener("acf:activity", handler);
      clearInterval(interval);
    };
  }, [refresh]);

  // Stats
  const totalLogins   = activities.filter(a => a.type === "login").length;
  const failedLogins  = activities.filter(a => a.type === "login_failed" || a.type === "token_invalid").length;
  const uniqueEmails  = new Set(activities.filter(a => a.email).map(a => a.email)).size;
  const activeTokens  = tokens.length + 1; // +1 for demo token

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-muted-foreground">
            System-wide activity, token management, and clinic oversight.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live
        </Badge>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Logins",    value: totalLogins,   icon: LogIn,        color: "text-emerald-600" },
          { label: "Failed Attempts", value: failedLogins,  icon: XCircle,      color: "text-red-600" },
          { label: "Unique Users",    value: uniqueEmails,  icon: Users,        color: "text-blue-600" },
          { label: "Active Tokens",   value: activeTokens,  icon: KeyRound,     color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nav cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminLinks.map((item) => (
          <Card
            key={item.href}
            className="cursor-pointer transition-all hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm"
            onClick={() => navigate(item.href)}
          >
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs mb-3">{item.description}</CardDescription>
              <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); navigate(item.href); }}>
                Open
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Live Activity Feed
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                All system events — token validations, sign-ins, patient activity, billing. Auto-refreshes every 10 s.
                <span className="ml-2 text-muted-foreground/70">
                  Last updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={refresh}>
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                onClick={() => { clearActivities(); refresh(); }}
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Activity className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No activity recorded yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Events will appear here as users sign in and interact with the system.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[480px]">
              <div className="px-5">
                {activities.map(event => (
                  <ActivityRow key={event.id} event={event} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Token summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" />
              Access Tokens ({tokens.length + 1})
            </CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => navigate("/tokensag")}>
              <KeyRound className="h-3 w-3" />
              Manage Tokens
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {/* Demo token always first */}
            <div className="flex items-center gap-3 px-5 py-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold">{DEMO_TOKEN_CODE}</span>
                  <Badge className="text-[10px] bg-amber-500 text-white px-1.5">Master Demo</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">InnoVetPro Demo Clinic · Unlimited users · No expiry</p>
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px]">Active</Badge>
            </div>
            {tokens.map(t => (
              <div key={t.code} className="flex items-center gap-3 px-5 py-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <KeyRound className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold">{t.code}</span>
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30 px-1.5">
                      {PLAN_LABELS[t.plan]}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {t.clinicName} · {typeof t.maxUsers === "number" ? `${t.maxUsers} users` : "Unlimited"} ·{" "}
                    {t.expiresAt ? `Expires ${format(new Date(t.expiresAt), "dd MMM yyyy")}` : "No expiry"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${t.expiresAt && new Date(t.expiresAt) < new Date() ? "text-red-600 border-red-300" : "text-emerald-600 border-emerald-300"}`}
                >
                  {t.expiresAt && new Date(t.expiresAt) < new Date() ? "Expired" : "Active"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Admin Portal
          </CardTitle>
          <CardDescription className="text-xs">
            Restricted to administrators only. Token Manager at{" "}
            <button className="font-mono text-primary hover:underline" onClick={() => navigate("/tokensag")}>/tokensag</button>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

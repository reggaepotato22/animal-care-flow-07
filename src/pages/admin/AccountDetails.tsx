import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { DEMO_ACCOUNT_ID, getAccounts, getPlan, PLANS, type Account, type AccountLifecycle, type AccountMode, updateAccount } from "@/lib/accountStore";
import { appendAccountAudit, getAccountAudit } from "@/lib/accountAuditStore";
import { DEFAULT_DEMO_CREDENTIALS, getDemoCredentials, resetDemoCredentials, setDemoCredentials, subscribeToDemoCredentials } from "@/lib/authStore";
import { getDashboardAccessOverrides, setDashboardAccessOverride, subscribeToDashboardAccessOverrides } from "@/lib/dashboardAccessStore";
import { ROLE_PERMISSIONS, type Role } from "@/lib/rbac";

const LIFECYCLES: AccountLifecycle[] = ["trial", "active", "suspended", "canceled"];
const SUB_STATUSES = ["trialing", "active", "past_due", "canceled", "unpaid"] as const;
const ALL_ROLES: Role[] = ["SuperAdmin", "Vet", "Nurse", "Receptionist", "Pharmacist"];

export default function AccountDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const account = useMemo(() => {
    if (!id) return null;
    return getAccounts().find(a => a.id === id) ?? null;
  }, [id]);

  const [name, setName] = useState(account?.name ?? "");
  const [ownerEmail, setOwnerEmail] = useState(account?.ownerEmail ?? "");
  const [timezone, setTimezone] = useState(account?.settings.timezone ?? "UTC");
  const [locale, setLocale] = useState(account?.settings.locale ?? "en");
  const [retention, setRetention] = useState(String(account?.settings.dataRetentionDays ?? 365));
  const [demoEmail, setDemoEmail] = useState(() => getDemoCredentials().email);
  const [demoPassword, setDemoPassword] = useState(() => getDemoCredentials().password);
  const [dashOverrides, setDashOverrides] = useState(() => (account ? getDashboardAccessOverrides(account.id) : {}));

  const audit = useMemo(() => {
    if (!account) return [];
    return getAccountAudit(account.id);
  }, [account]);

  useEffect(() => {
    if (!account) return;
    setDashOverrides(getDashboardAccessOverrides(account.id));
    const unsub = subscribeToDashboardAccessOverrides(
      () => setDashOverrides(getDashboardAccessOverrides(account.id)),
      account.id
    );
    return () => unsub();
  }, [account]);

  useEffect(() => {
    const unsub = subscribeToDemoCredentials(() => {
      const creds = getDemoCredentials();
      setDemoEmail(creds.email);
      setDemoPassword(creds.password);
    });
    return () => unsub();
  }, []);

  if (!account) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Account Not Found</h1>
        <Button variant="outline" onClick={() => navigate("/admin/accounts")}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  const plan = getPlan(account.planId);

  const saveBasics = () => {
    const next = updateAccount(account.id, {
      name: name.trim() || account.name,
      ownerEmail: ownerEmail.trim() || undefined,
    });
    if (!next) return;
    appendAccountAudit({
      accountId: next.id,
      action: "ACCOUNT_UPDATED",
      actor: "System Admin",
      detail: "Updated account profile",
    });
    toast({ title: "Saved", description: "Account profile updated" });
  };

  const saveSettings = () => {
    const days = Number(retention);
    const next = updateAccount(account.id, {
      settings: {
        timezone: timezone.trim() || "UTC",
        locale: locale.trim() || "en",
        dataRetentionDays: Number.isFinite(days) && days > 0 ? days : 365,
      },
    });
    if (!next) return;
    appendAccountAudit({
      accountId: next.id,
      action: "SETTINGS_UPDATED",
      actor: "System Admin",
      detail: "Updated account settings",
    });
    toast({ title: "Saved", description: "Account settings updated" });
  };

  const setLifecycle = (lifecycle: AccountLifecycle) => {
    const next = updateAccount(account.id, { lifecycle });
    if (!next) return;
    appendAccountAudit({
      accountId: next.id,
      action: lifecycle === "suspended" ? "ACCOUNT_SUSPENDED" : lifecycle === "canceled" ? "ACCOUNT_CANCELED" : "ACCOUNT_UPDATED",
      actor: "System Admin",
      detail: `Lifecycle set to ${lifecycle}`,
    });
    toast({ title: "Updated", description: `Lifecycle set to ${lifecycle}` });
  };

  const setPlan = (planId: string) => {
    const next = updateAccount(account.id, { planId });
    if (!next) return;
    appendAccountAudit({
      accountId: next.id,
      action: "PLAN_CHANGED",
      actor: "System Admin",
      detail: `Plan changed to ${getPlan(planId)?.name ?? planId}`,
    });
    toast({ title: "Updated", description: "Plan updated" });
  };

  const upsertSubscription = (status: typeof SUB_STATUSES[number]) => {
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const next = updateAccount(account.id, {
      subscription: {
        id: account.subscription?.id ?? `sub-${Date.now()}`,
        provider: account.subscription?.provider ?? "manual",
        status,
        planId: account.planId,
        currentPeriodStart: account.subscription?.currentPeriodStart ?? start,
        currentPeriodEnd: account.subscription?.currentPeriodEnd ?? end,
        cancelAtPeriodEnd: account.subscription?.cancelAtPeriodEnd ?? false,
      },
    });
    if (!next) return;
    appendAccountAudit({
      accountId: next.id,
      action: "SUBSCRIPTION_UPDATED",
      actor: "System Admin",
      detail: `Subscription status set to ${status}`,
    });
    toast({ title: "Updated", description: "Subscription updated" });
  };

  const generateDemoPassword = () => {
    const rand = Math.random().toString(36).slice(2);
    const rand2 = Math.random().toString(36).slice(2);
    setDemoPassword(`${rand}${rand2}`.slice(0, 14));
    toast({ title: "Password generated", description: "Save to apply." });
  };

  const saveDemoCreds = () => {
    const email = demoEmail.trim().toLowerCase();
    if (!email || !demoPassword) {
      toast({ title: "Email and password required", variant: "destructive" });
      return;
    }
    setDemoCredentials({ email, password: demoPassword });
    appendAccountAudit({
      accountId: DEMO_ACCOUNT_ID,
      action: "SETTINGS_UPDATED",
      actor: "System Admin",
      detail: "Updated demo login credentials",
    });
    toast({ title: "Saved", description: "Demo login credentials updated" });
  };

  const resetDemoCreds = () => {
    resetDemoCredentials();
    appendAccountAudit({
      accountId: DEMO_ACCOUNT_ID,
      action: "SETTINGS_UPDATED",
      actor: "System Admin",
      detail: "Reset demo login credentials to defaults",
    });
    toast({ title: "Reset", description: "Demo login credentials reset to defaults" });
  };

  const effectiveDashPerm = (role: Role, perm: "can_view_weekly_revenue" | "can_view_active_staff") => {
    const override = (dashOverrides as any)?.[role]?.[perm];
    if (typeof override === "boolean") return override;
    return ROLE_PERMISSIONS[role].includes(perm as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
          <p className="text-muted-foreground">Account ID: <span className="font-mono">{account.id}</span></p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/accounts")}>Back</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle & Plan</CardTitle>
            <CardDescription>Controls access, billing state, and plan entitlements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mode</span>
              <Badge variant="outline">{account.mode}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Lifecycle</span>
              <Select value={account.lifecycle} onValueChange={(v) => setLifecycle(v as AccountLifecycle)}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIFECYCLES.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Select value={account.planId} onValueChange={(v) => setPlan(v)}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.filter(p => p.mode === account.mode).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              {plan ? (plan.priceCentsMonthly === 0 ? "Free" : `KSh ${(plan.priceCentsMonthly / 100).toLocaleString("en-KE")}/mo`) : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Billing status and renewal period (manual stub).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Provider</span>
              <Badge variant="outline">{account.subscription?.provider ?? "manual"}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Status</span>
              <Select value={account.subscription?.status ?? "trialing"} onValueChange={(v) => upsertSubscription(v as any)}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUB_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Period: {account.subscription?.currentPeriodStart ? new Date(account.subscription.currentPeriodStart).toLocaleDateString() : "—"}{" "}
              → {account.subscription?.currentPeriodEnd ? new Date(account.subscription.currentPeriodEnd).toLocaleDateString() : "—"}
            </div>
          </CardContent>
        </Card>

        {account.id === DEMO_ACCOUNT_ID && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Demo Login Credentials
                <Badge variant="outline">Shared</Badge>
              </CardTitle>
              <CardDescription>Controls the demo sign-in credentials shown on /login.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Email</div>
                <Input value={demoEmail} onChange={(e) => setDemoEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Password</div>
                <Input value={demoPassword} onChange={(e) => setDemoPassword(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveDemoCreds}>Save</Button>
                <Button variant="outline" onClick={generateDemoPassword}>Generate Password</Button>
                <Button variant="outline" onClick={resetDemoCreds}>Reset to Default</Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Default: <span className="font-medium">{DEFAULT_DEMO_CREDENTIALS.email}</span> /{" "}
                <span className="font-medium">{DEFAULT_DEMO_CREDENTIALS.password}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account Profile</CardTitle>
            <CardDescription>Clinic and owner metadata.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Clinic Name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Owner Email</div>
              <Input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
            </div>
            <Button onClick={saveBasics}>Save Profile</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Account-level configuration and compliance defaults.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Timezone</div>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Locale</div>
            <Input value={locale} onChange={(e) => setLocale(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Retention (days)</div>
            <Input value={retention} onChange={(e) => setRetention(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={saveSettings} className="w-full">Save Settings</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Access</CardTitle>
          <CardDescription>Control who can view revenue and staffing widgets.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Weekly Revenue</TableHead>
                  <TableHead>Active Staff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_ROLES.map((r) => (
                  <TableRow key={r}>
                    <TableCell className="font-medium">{r}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={effectiveDashPerm(r, "can_view_weekly_revenue")}
                          onCheckedChange={(v) => {
                            setDashboardAccessOverride(r, "can_view_weekly_revenue", !!v, account.id);
                            appendAccountAudit({
                              accountId: account.id,
                              action: "SETTINGS_UPDATED",
                              actor: "System Admin",
                              detail: `Dashboard permission can_view_weekly_revenue for ${r}: ${v ? "enabled" : "disabled"}`,
                            });
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={effectiveDashPerm(r, "can_view_active_staff")}
                          onCheckedChange={(v) => {
                            setDashboardAccessOverride(r, "can_view_active_staff", !!v, account.id);
                            appendAccountAudit({
                              accountId: account.id,
                              action: "SETTINGS_UPDATED",
                              actor: "System Admin",
                              detail: `Dashboard permission can_view_active_staff for ${r}: ${v ? "enabled" : "disabled"}`,
                            });
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Audit</CardTitle>
          <CardDescription>Account-level audit trail and compliance changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{e.action}</Badge></TableCell>
                    <TableCell className="text-sm">{e.actor}</TableCell>
                    <TableCell className="text-sm">{e.detail}</TableCell>
                  </TableRow>
                ))}
                {audit.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No account events recorded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

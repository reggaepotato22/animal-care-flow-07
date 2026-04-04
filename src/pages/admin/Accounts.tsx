import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "@/contexts/AccountContext";
import { createAccount, deleteAccount, getPlan, PLANS, type Account, type AccountLifecycle, type AccountMode, updateAccount } from "@/lib/accountStore";
import { appendAccountAudit } from "@/lib/accountAuditStore";

const LIFECYCLES: AccountLifecycle[] = ["trial", "active", "suspended", "canceled"];
const MODES: AccountMode[] = ["demo", "live"];

export default function Accounts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accounts, activeAccountId, setActiveAccount, refreshAccounts } = useAccount();

  const [newName, setNewName] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newMode, setNewMode] = useState<AccountMode>("demo");

  const sorted = useMemo(() => {
    return [...accounts].sort((a, b) => {
      if (a.id === activeAccountId) return -1;
      if (b.id === activeAccountId) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [accounts, activeAccountId]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) {
      toast({ title: "Clinic name is required", variant: "destructive" });
      return;
    }
    const acct = createAccount({ name, ownerEmail: newOwnerEmail.trim() || undefined, mode: newMode });
    appendAccountAudit({
      accountId: acct.id,
      action: "ACCOUNT_CREATED",
      actor: "System Admin",
      detail: `Created account "${acct.name}" (${acct.mode})`,
    });
    refreshAccounts();
    toast({ title: "Account created", description: acct.name });
    setNewName("");
    setNewOwnerEmail("");
    setNewMode("demo");
  };

  const lifecycleBadge = (lifecycle: AccountLifecycle) => {
    if (lifecycle === "active") return "bg-green-100 text-green-800 border-green-200";
    if (lifecycle === "trial") return "bg-blue-100 text-blue-800 border-blue-200";
    if (lifecycle === "suspended") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const modeBadge = (mode: AccountMode) => {
    return mode === "demo"
      ? "bg-slate-100 text-slate-800 border-slate-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const changeLifecycle = (account: Account, lifecycle: AccountLifecycle) => {
    const updated = updateAccount(account.id, { lifecycle });
    if (!updated) return;
    appendAccountAudit({
      accountId: updated.id,
      action: lifecycle === "suspended" ? "ACCOUNT_SUSPENDED" : lifecycle === "canceled" ? "ACCOUNT_CANCELED" : "ACCOUNT_UPDATED",
      actor: "System Admin",
      detail: `Lifecycle set to ${lifecycle}`,
    });
    refreshAccounts();
  };

  const changePlan = (account: Account, planId: string) => {
    const updated = updateAccount(account.id, { planId });
    if (!updated) return;
    appendAccountAudit({
      accountId: updated.id,
      action: "PLAN_CHANGED",
      actor: "System Admin",
      detail: `Plan changed to ${getPlan(planId)?.name ?? planId}`,
    });
    refreshAccounts();
  };

  const removeAccount = (account: Account) => {
    deleteAccount(account.id);
    toast({ title: "Account removed", description: account.name });
    refreshAccounts();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Management</h1>
        <p className="text-muted-foreground">
          Manage clinic accounts, lifecycle states, plans, and compliance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Clinic Account</CardTitle>
          <CardDescription>
            Creates a new account (clinic) with its own isolated data namespace.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Clinic name" />
          <Input value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} placeholder="Owner email (optional)" />
          <Select value={newMode} onValueChange={(v) => setNewMode(v as AccountMode)}>
            <SelectTrigger>
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              {MODES.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreate}>Create Account</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            Set the active account to preview isolated clinic data in the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Lifecycle</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((a) => {
                  const plan = getPlan(a.planId);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={modeBadge(a.mode)}>{a.mode}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={a.lifecycle} onValueChange={(v) => changeLifecycle(a, v as AccountLifecycle)}>
                          <SelectTrigger className="h-8 w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LIFECYCLES.map(l => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={a.planId} onValueChange={(v) => changePlan(a, v)}>
                          <SelectTrigger className="h-8 w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLANS.filter(p => p.mode === a.mode).map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground mt-1">
                          {plan ? (plan.priceCentsMonthly === 0 ? "Free" : `KSh ${(plan.priceCentsMonthly / 100).toLocaleString("en-KE")}/mo`) : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {a.id === activeAccountId ? (
                          <Badge className={lifecycleBadge(a.lifecycle)}>Active</Badge>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setActiveAccount(a.id)}>
                            Set Active
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/admin/accounts/${a.id}`)}>
                          Details
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={a.mode === "demo"}
                          onClick={() => removeAccount(a)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No accounts found
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

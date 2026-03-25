import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  UserCheck, Stethoscope, Activity, Pill, CheckCheck,
  ChevronUp, ChevronDown, Save, RotateCcw, Settings2, ShieldCheck, Info, DollarSign,
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import type { WorkflowStepId } from "@/config/workflow";
import { defaultWorkflow } from "@/config/workflow";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { logChange } from "@/lib/audit";
import { loadRoleLabels, saveRoleLabels } from "@/lib/hospitalizationStore";

// ─── Step metadata ─────────────────────────────────────────────────────────────

const STEP_META: Record<WorkflowStepId, {
  icon: React.ElementType;
  color: string;
  ownedBy: string[];
  description: string;
}> = {
  REGISTERED:   { icon: UserCheck,   color: "text-muted-foreground", ownedBy: ["Receptionist", "SuperAdmin"],            description: "Patient arrival, identity check, and check-in registration." },
  TRIAGE:       { icon: Stethoscope, color: "text-amber-600",        ownedBy: ["Nurse", "Vet", "SuperAdmin"],            description: "Initial vitals, chief complaint, risk flags, and triage level assignment." },
  CONSULTATION: { icon: Activity,    color: "text-blue-600",         ownedBy: ["Vet", "SuperAdmin"],                     description: "Full clinical examination, diagnosis, and treatment plan." },
  PHARMACY:     { icon: Pill,        color: "text-purple-600",       ownedBy: ["Pharmacist", "Vet", "SuperAdmin"],       description: "Medication dispensing, prescription fulfilment, and counselling." },
  COMPLETED:    { icon: CheckCheck,  color: "text-emerald-600",      ownedBy: ["Receptionist", "Vet", "SuperAdmin"],     description: "Billing, discharge summary, and visit closure." },
};

// ─── Role-specific settings definitions ───────────────────────────────────────

type SettingEntry = { key: string; label: string; description: string; type: "toggle" | "text" };

const ROLE_SETTINGS: Record<string, { step: WorkflowStepId; title: string; settings: SettingEntry[] }> = {
  Receptionist: {
    step: "REGISTERED",
    title: "Check-in Settings",
    settings: [
      { key: "require_phone",   label: "Require phone number",      description: "Enforce phone number during check-in.",      type: "toggle" },
      { key: "require_id",      label: "Require owner ID",          description: "Verify owner ID document on arrival.",        type: "toggle" },
      { key: "auto_notify",     label: "Auto-notify triage team",   description: "Send instant notification to triage on check-in.", type: "toggle" },
      { key: "waiting_area",    label: "Waiting area label",        description: "Custom label shown on the waiting area sign.", type: "text"   },
    ],
  },
  Nurse: {
    step: "TRIAGE",
    title: "Triage Settings",
    settings: [
      { key: "default_triage_level", label: "Default triage level",       description: "Pre-fill triage level (1–5) on new intake.", type: "text"   },
      { key: "require_vitals",       label: "Require all vital signs",     description: "Block completion until all vitals are filled.", type: "toggle" },
      { key: "require_chief",        label: "Require chief complaint",     description: "Chief complaint is mandatory before saving.",  type: "toggle" },
      { key: "auto_assign_vet",      label: "Auto-assign available vet",   description: "Automatically assign an available veterinarian.", type: "toggle" },
    ],
  },
  Vet: {
    step: "CONSULTATION",
    title: "Consultation Settings",
    settings: [
      { key: "require_diagnosis",  label: "Require diagnosis",          description: "Block record save until a diagnosis is entered.", type: "toggle" },
      { key: "require_rx",         label: "Require prescription",       description: "Force a prescription entry on every record.",     type: "toggle" },
      { key: "show_triage_notes",  label: "Show triage notes",          description: "Display triage intake notes in consultation view.", type: "toggle" },
      { key: "default_vet",        label: "Default veterinarian name",  description: "Pre-fill the veterinarian field with this name.",  type: "text"   },
    ],
  },
  Pharmacist: {
    step: "PHARMACY",
    title: "Pharmacy Settings",
    settings: [
      { key: "check_stock",    label: "Check stock before dispensing", description: "Block dispensing if inventory is below threshold.", type: "toggle" },
      { key: "low_stock_warn", label: "Low-stock warning threshold",   description: "Number of units remaining to trigger a warning.",   type: "text"   },
      { key: "print_label",    label: "Print medication label",        description: "Auto-print a medication label after dispensing.",   type: "toggle" },
    ],
  },
  SuperAdmin: {
    step: "REGISTERED",
    title: "Global Workflow Settings",
    settings: [
      { key: "allow_skip_triage",  label: "Allow skipping triage",    description: "Permit vets to bypass triage and go straight to consultation.", type: "toggle" },
      { key: "audit_all_steps",    label: "Audit all step changes",   description: "Write an audit trail entry on every workflow step change.",      type: "toggle" },
      { key: "broadcast_channel",  label: "Broadcast channel name",   description: "BroadcastChannel name used for real-time sync.",                 type: "text"   },
    ],
  },
};

// ─── Currency config ───────────────────────────────────────────────────────────

export type CurrencyCode = "KES" | "USD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", locale: "en-KE" },
  { code: "USD", symbol: "$",   name: "US Dollar",       locale: "en-US" },
];

const CURRENCY_KEY = "boravet_currency";

export function getActiveCurrency(): CurrencyConfig {
  try {
    const code = localStorage.getItem(CURRENCY_KEY) as CurrencyCode | null;
    return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
  } catch { return CURRENCIES[0]; }
}

export function formatCurrency(amount: number, currency?: CurrencyConfig): string {
  const cfg = currency ?? getActiveCurrency();
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency", currency: cfg.code, minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Storage helpers ───────────────────────────────────────────────────────────

const SETTINGS_KEY = "boravet_workflow_settings";

function loadSettings(): Record<string, string | boolean> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSettings(s: Record<string, string | boolean>) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkflowSettings() {
  const { role, has } = useRole();
  const { workflow, setWorkflowOrder } = useWorkflowContext();
  const { toast } = useToast();

  const isSuperAdmin = role === "SuperAdmin";

  // Currency state
  const [activeCurrency, setActiveCurrencyState] = useState<CurrencyCode>(
    () => getActiveCurrency().code
  );

  const handleCurrencyChange = (code: CurrencyCode) => {
    setActiveCurrencyState(code);
    try { localStorage.setItem(CURRENCY_KEY, code); } catch {}
    toast({ title: `Currency set to ${CURRENCIES.find(c => c.code === code)?.name}` });
  };

  // Local order for drag-sorting (SuperAdmin only)
  const [order, setOrder] = useState<WorkflowStepId[]>(() => workflow.map(s => s.id as WorkflowStepId));

  // Role-specific settings
  const [settings, setSettings] = useState<Record<string, string | boolean>>(loadSettings);

  // Role display label configuration (SuperAdmin)
  const DEFAULT_ROLE_LABELS: Record<string, string> = {
    Nurse:        "Attendant",
    Receptionist: "Receptionist",
    Vet:          "Veterinarian",
    Pharmacist:   "Pharmacist",
    SuperAdmin:   "Super Admin",
  };
  const [roleLabels, setRoleLabels] = useState<Record<string, string>>(() => {
    const stored = loadRoleLabels();
    return { ...DEFAULT_ROLE_LABELS, ...stored };
  });

  const handleRoleLabelChange = (role: string, value: string) => {
    setRoleLabels(prev => ({ ...prev, [role]: value }));
  };

  const saveRoleLabelConfig = () => {
    saveRoleLabels(roleLabels);
    toast({ title: "Role labels saved", description: "Labels updated across the application." });
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setOrder(next);
  };

  const saveOrder = () => {
    setWorkflowOrder(order);
    logChange({
      entityType: "System",
      entityId:   "workflow-order",
      field:      "Workflow Order",
      previousValue: workflow.map(s => s.id).join(" → "),
      newValue:      order.join(" → "),
      changedBy:     role,
      reason:        "Manual reorder via Workflow Settings",
    });
    toast({ title: "Workflow order saved", description: order.join(" → ") });
  };

  const resetOrder = () => {
    const def = defaultWorkflow.map(s => s.id as WorkflowStepId);
    setOrder(def);
    setWorkflowOrder(def);
    toast({ title: "Workflow reset to defaults" });
  };

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  };

  // Determine which role settings to show
  const roleKey = (role === "Nurse") ? "Nurse" : role;
  const roleConfig = ROLE_SETTINGS[roleKey] ?? ROLE_SETTINGS["Receptionist"];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-primary" />
          Workflow Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure the patient workflow for your role. SuperAdmin can reorder stages and manage all settings.
        </p>
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border text-sm">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span>Logged in as <span className="font-semibold">{role}</span></span>
        <Badge variant="outline" className="ml-auto text-xs">{roleConfig.title}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Workflow stage overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Current Workflow Stages
            </CardTitle>
            <CardDescription className="text-xs">
              {isSuperAdmin ? "Drag to reorder — use arrows to move stages up or down." : "Read-only. SuperAdmin can reorder stages."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(isSuperAdmin ? order : workflow.map(s => s.id as WorkflowStepId)).map((stepId, idx) => {
              const meta  = STEP_META[stepId];
              const step  = workflow.find(s => s.id === stepId) ?? defaultWorkflow.find(s => s.id === stepId);
              const Icon  = meta?.icon ?? Activity;
              const isOwned = meta?.ownedBy.includes(role) ?? false;

              return (
                <div
                  key={stepId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    isOwned ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"
                  )}
                >
                  <div className={cn("flex items-center justify-center h-8 w-8 rounded-full bg-background border", meta?.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{step?.label ?? stepId}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{meta?.description}</p>
                  </div>
                  {isOwned && (
                    <Badge variant="outline" className="text-[9px] px-1.5 shrink-0">Your stage</Badge>
                  )}
                  {isSuperAdmin && (
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost" size="icon"
                        className="h-5 w-5"
                        disabled={idx === 0}
                        onClick={() => moveStep(idx, -1)}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-5 w-5"
                        disabled={idx === order.length - 1}
                        onClick={() => moveStep(idx, 1)}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {isSuperAdmin && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={saveOrder}>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save Order
                </Button>
                <Button size="sm" variant="outline" onClick={resetOrder}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Role-specific settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              {roleConfig.title}
            </CardTitle>
            <CardDescription className="text-xs">
              Settings specific to your role's workflow stage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roleConfig.settings.map((s, i) => (
              <div key={s.key}>
                {i > 0 && <Separator className="mb-4" />}
                {s.type === "toggle" ? (
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5 flex-1">
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                    <Switch
                      checked={settings[s.key] === true || settings[s.key] === "true"}
                      onCheckedChange={(v) => updateSetting(s.key, v)}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">{s.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                    <Input
                      className="h-8 text-sm"
                      value={(settings[s.key] as string) ?? ""}
                      onChange={(e) => updateSetting(s.key, e.target.value)}
                      placeholder={`Enter ${s.label.toLowerCase()}…`}
                    />
                  </div>
                )}
              </div>
            ))}

            <Separator />

            <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted/40 rounded-lg">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p>Settings are saved locally to your browser. In a production environment these would sync with the server and apply across all devices.</p>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                saveSettings(settings);
                toast({ title: "Settings saved", description: `${roleConfig.title} updated.` });
              }}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Currency Settings (visible to all roles) ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Currency Settings
          </CardTitle>
          <CardDescription className="text-xs">
            Select the currency used throughout the system. Default is Kenyan Shilling (KSh).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {CURRENCIES.map(cur => (
              <button
                key={cur.code}
                onClick={() => handleCurrencyChange(cur.code)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-sm transition-all",
                  activeCurrency === cur.code
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <span className="text-lg font-bold text-primary">{cur.symbol}</span>
                <div className="text-left">
                  <p className="font-semibold">{cur.name}</p>
                  <p className="text-xs text-muted-foreground">{cur.code}</p>
                </div>
                {activeCurrency === cur.code && (
                  <Badge variant="outline" className="text-[9px] ml-1 border-primary text-primary">Active</Badge>
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted/40 rounded-lg">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>KSh (Kenyan Shilling) is the default currency. USD is available as an option. Currency applies to all billing, invoices, and financial displays.</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Role Label Configuration (SuperAdmin only) ── */}
      {isSuperAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Role Display Names
            </CardTitle>
            <CardDescription className="text-xs">
              Customise how each role is labelled throughout the app. E.g. rename "Nurse" to "Attendant".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(roleLabels).map(([roleKey, labelValue]) => (
                <div key={roleKey} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{roleKey}</label>
                  <Input
                    className="h-8 text-sm"
                    value={labelValue}
                    onChange={e => handleRoleLabelChange(roleKey, e.target.value)}
                    placeholder={roleKey}
                  />
                </div>
              ))}
            </div>
            <Button size="sm" onClick={saveRoleLabelConfig}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Role Labels
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SuperAdmin: All role settings */}
      {isSuperAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              All Role Configurations
            </CardTitle>
            <CardDescription className="text-xs">
              As SuperAdmin you can review and edit settings for every role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(ROLE_SETTINGS).filter(([r]) => r !== "SuperAdmin").map(([roleKey, cfg]) => {
                const meta = STEP_META[cfg.step];
                const Icon = meta?.icon ?? Activity;
                return (
                  <div key={roleKey} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", meta?.color)} />
                      <p className="text-sm font-semibold">{roleKey}</p>
                      <Badge variant="outline" className="ml-auto text-[9px]">{cfg.title}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {cfg.settings.map(s => (
                        <div key={s.key} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate flex-1">{s.label}</span>
                          {s.type === "toggle" ? (
                            <Switch
                              className="scale-75"
                              checked={settings[s.key] === true || settings[s.key] === "true"}
                              onCheckedChange={(v) => updateSetting(s.key, v)}
                            />
                          ) : (
                            <Input
                              className="h-6 text-xs w-24 ml-2"
                              value={(settings[s.key] as string) ?? ""}
                              onChange={(e) => updateSetting(s.key, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

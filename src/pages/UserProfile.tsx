import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { ROLE_PERMISSIONS, type Role } from "@/lib/rbac";
import { getAccountScopedKey } from "@/lib/accountStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User, Mail, Shield, Bell, Palette, Settings, LogOut,
  CheckCircle, Lock, Stethoscope, ClipboardList, UserCheck,
  Package, Save, ChevronRight, Link, Printer, Workflow,
  CalendarDays, RefreshCw, Unlink, Wifi, WifiOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { clearAllData, seedMockData } from "@/lib/dataSeed";

const ROLE_META: Record<Role, { icon: React.ElementType; color: string; description: string }> = {
  SuperAdmin:    { icon: Shield,        color: "text-purple-600",  description: "Full system access — manage all users, settings, and data." },
  Vet:           { icon: Stethoscope,   color: "text-blue-600",    description: "Clinical staff — create records, prescribe, and manage consultations." },
  Nurse:         { icon: UserCheck,     color: "text-teal-600",    description: "Attendant — triage and clinical support — assess patients and update records." },
  Receptionist:  { icon: ClipboardList, color: "text-orange-600",  description: "Front-desk staff — register patients, book appointments, and handle billing." },
  Pharmacist:    { icon: Package,       color: "text-green-600",   description: "Pharmacy staff — dispense medication and manage inventory." },
};

const PERM_LABELS: Record<string, string> = {
  can_edit_medical_records: "Edit Medical Records",
  can_view_audit:            "View Audit Log",
  can_manage_users:          "Manage Users",
  can_manage_inventory:      "Manage Inventory",
  can_access_billing:        "Access Billing",
  can_triage:                "Perform Triage",
  can_view_records:          "View Clinical Records",
  can_prescribe:             "Prescribe Medication",
  can_dispense:              "Dispense Medication",
  can_register_patients:     "Register Patients",
  can_view_patients:         "View Patients",
  can_edit_patients:         "Edit Patient Info",
  can_view_weekly_revenue:   "View Weekly Revenue",
  can_view_active_staff:     "View Active Staff",
};

const NOTIF_BASE  = "acf_profile_notifications";
const GCAL_BASE   = "acf_gcal_sync";
const PNAME_BASE  = "acf_profile_name";

function notifKey()  { return getAccountScopedKey(NOTIF_BASE); }
function gcalKey()   { return getAccountScopedKey(GCAL_BASE); }
function pnameKey()  { return getAccountScopedKey(PNAME_BASE); }

interface GCalPrefs {
  connected: boolean;
  email: string;
  syncAppointments: boolean;
  syncReminders: boolean;
  lastSynced: string | null;
}

function loadGCalPrefs(): GCalPrefs {
  try {
    const raw = localStorage.getItem(gcalKey());
    if (raw) return JSON.parse(raw) as GCalPrefs;
  } catch {}
  return { connected: false, email: "", syncAppointments: true, syncReminders: true, lastSynced: null };
}

function saveGCalPrefs(prefs: GCalPrefs) {
  localStorage.setItem(gcalKey(), JSON.stringify(prefs));
}

function loadNotifPrefs() {
  try {
    const raw = localStorage.getItem(notifKey());
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {}
  return { checkin: true, triage: true, consultation: true, discharge: true, emergency: true };
}

export default function UserProfile() {
  const navigate   = useNavigate();
  const { user, logout } = useAuth();
  const { role, setRole } = useRole();
  const { toast } = useToast();

  // Editable display name — per-account
  const [displayName, setDisplayName] = useState<string>(() => {
    return localStorage.getItem(pnameKey()) || user?.name || "Demo User";
  });
  const [editingName, setEditingName] = useState(false);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState(loadNotifPrefs);
  const [gCal, setGCal] = useState<GCalPrefs>(loadGCalPrefs);
  const [syncing, setSyncing] = useState(false);

  const handleGCalConnect = () => {
    const demoEmail = user?.email ?? "vet@clinic.demo";
    const updated: GCalPrefs = { ...gCal, connected: true, email: demoEmail, lastSynced: new Date().toISOString() };
    setGCal(updated);
    saveGCalPrefs(updated);
    toast({ title: "Google Calendar Connected", description: `Syncing appointments to ${demoEmail}` });
  };

  const handleGCalDisconnect = () => {
    const updated: GCalPrefs = { ...gCal, connected: false, email: "", lastSynced: null };
    setGCal(updated);
    saveGCalPrefs(updated);
    toast({ title: "Google Calendar Disconnected", description: "Calendar sync has been disabled.", variant: "destructive" });
  };

  const handleGCalSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const updated: GCalPrefs = { ...gCal, lastSynced: new Date().toISOString() };
      setGCal(updated);
      saveGCalPrefs(updated);
      setSyncing(false);
      toast({ title: "Calendar Synced", description: "All appointments have been synced to Google Calendar." });
    }, 1800);
  };

  const handleGCalToggle = (key: keyof GCalPrefs, val: boolean) => {
    const updated = { ...gCal, [key]: val };
    setGCal(updated);
    saveGCalPrefs(updated);
  };

  const permissions = ROLE_PERMISSIONS[role];
  const roleMeta    = ROLE_META[role];
  const RoleIcon    = roleMeta.icon;

  const handleSaveName = () => {
    localStorage.setItem(pnameKey(), displayName);
    setEditingName(false);
    toast({ title: "Name updated", description: `Display name set to "${displayName}".` });
  };

  const handleNotifToggle = (key: string, val: boolean) => {
    const updated = { ...notifPrefs, [key]: val };
    setNotifPrefs(updated);
    localStorage.setItem(notifKey(), JSON.stringify(updated));
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account info, role, and notification preferences.
        </p>
      </div>

      {/* Identity card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="h-8 text-sm max-w-[220px]"
                    onKeyDown={e => e.key === "Enter" && handleSaveName()}
                    autoFocus
                  />
                  <Button size="sm" className="h-8 gap-1" onClick={handleSaveName}>
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingName(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{displayName}</p>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    onClick={() => setEditingName(true)}
                  >
                    Edit
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </div>
            </div>
          </div>

          <Separator />

          {/* Role display */}
          <div className="flex items-start gap-3">
            <div className={cn("mt-0.5 shrink-0", roleMeta.color)}>
              <RoleIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{role}</p>
                <Badge variant="outline" className="text-[10px] capitalize">{role}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{roleMeta.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Your Permissions
          </CardTitle>
          <CardDescription className="text-xs">
            What you can do with the <strong>{role}</strong> role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(PERM_LABELS).map(([key, label]) => {
              const has = permissions.includes(key as never);
              return (
                <div key={key} className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                  has ? "bg-primary/5 text-foreground" : "bg-muted/30 text-muted-foreground"
                )}>
                  <CheckCircle className={cn("h-3.5 w-3.5 shrink-0", has ? "text-primary" : "text-muted-foreground/40")} />
                  {label}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-xs">
            Choose which workflow events you want to be notified about.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "checkin",      label: "Patient Check-in",      desc: "When a patient arrives and is checked in" },
            { key: "triage",       label: "Triage Updates",        desc: "When triage starts or completes" },
            { key: "consultation", label: "Consultation Updates",  desc: "When a consultation begins or ends" },
            { key: "discharge",    label: "Discharge",             desc: "When a patient is discharged" },
            { key: "emergency",    label: "Emergency Alerts",      desc: "Critical/emergency patient notifications" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={!!notifPrefs[item.key]}
                onCheckedChange={val => handleNotifToggle(item.key, val)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Google Calendar Sync */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Google Calendar Sync
          </CardTitle>
          <CardDescription className="text-xs">
            Sync your clinic appointments with Google Calendar for reminders and scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection status */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border",
            gCal.connected ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10" : "border-border bg-muted/20"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn("p-1.5 rounded-full", gCal.connected ? "bg-green-100 dark:bg-green-900/30" : "bg-muted")}>
                {gCal.connected
                  ? <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                  : <WifiOff className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {gCal.connected ? "Connected" : "Not connected"}
                </p>
                {gCal.connected && (
                  <p className="text-xs text-muted-foreground">{gCal.email}</p>
                )}
                {gCal.connected && gCal.lastSynced && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Last synced: {new Date(gCal.lastSynced).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {gCal.connected && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleGCalSync}
                  disabled={syncing}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
                  {syncing ? "Syncing…" : "Sync Now"}
                </Button>
              )}
              {gCal.connected ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={handleGCalDisconnect}
                >
                  <Unlink className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleGCalConnect}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Connect Google Calendar
                </Button>
              )}
            </div>
          </div>

          {/* Sync options (only when connected) */}
          {gCal.connected && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sync Options</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sync Appointments</p>
                  <p className="text-xs text-muted-foreground">Add booked appointments as Google Calendar events</p>
                </div>
                <Switch
                  checked={gCal.syncAppointments}
                  onCheckedChange={v => handleGCalToggle("syncAppointments", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Appointment Reminders</p>
                  <p className="text-xs text-muted-foreground">Receive Google Calendar reminders before appointments</p>
                </div>
                <Switch
                  checked={gCal.syncReminders}
                  onCheckedChange={v => handleGCalToggle("syncReminders", v)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Grid - Like /settings page */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: "generate-link", name: "Generate Upload Link", desc: "Create secure upload links for owners, labs, and specialists", icon: Link, href: "/generate-link" },
            { id: "appearance", name: "Appearance", desc: "Customize the look and feel of your clinic portal", icon: Palette, href: "/appearance" },
            { id: "workflow", name: "Workflow Settings", desc: "Configure clinical workflows and automation", icon: Workflow, href: "/workflow-settings" },
            { id: "printing", name: "Printing & Forms", desc: "Configure print templates and physical forms", icon: Printer, href: "/settings/printing" },
          ].map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(item.href)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                      <item.icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Demo Data</CardTitle>
          <CardDescription className="text-xs">
            Generate sample data for demos or clear the system back to an empty state.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
            onClick={() => {
              toast({
                title: "Generating mock data",
                description: "Seeding patients, staff, roles, and appointments…",
              });
              window.setTimeout(() => {
                seedMockData();
              }, 250);
            }}
          >
            Generate Mock Data
          </Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => {
              toast({
                title: "Clearing data",
                description: "Removing all stored data and resetting the app…",
              });
              window.setTimeout(() => {
                clearAllData();
              }, 250);
            }}
          >
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardContent className="pt-6">
          <Button variant="destructive" className="gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

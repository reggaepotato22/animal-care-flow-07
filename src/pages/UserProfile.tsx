import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import { ROLE_PERMISSIONS, type Role } from "@/lib/rbac";
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
  Package, Save, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
};

const NOTIF_KEY = "acf_profile_notifications";

function loadNotifPrefs() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {}
  return { checkin: true, triage: true, consultation: true, discharge: true, emergency: true };
}

export default function UserProfile() {
  const navigate   = useNavigate();
  const { user, logout } = useAuth();
  const { role, setRole } = useRole();
  const { toast } = useToast();

  // Editable display name (persisted in localStorage)
  const [displayName, setDisplayName] = useState<string>(() => {
    return localStorage.getItem("acf_profile_name") || user?.name || "Demo User";
  });
  const [editingName, setEditingName] = useState(false);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState(loadNotifPrefs);

  const permissions = ROLE_PERMISSIONS[role];
  const roleMeta    = ROLE_META[role];
  const RoleIcon    = roleMeta.icon;

  const handleSaveName = () => {
    localStorage.setItem("acf_profile_name", displayName);
    setEditingName(false);
    toast({ title: "Name updated", description: `Display name set to "${displayName}".` });
  };

  const handleNotifToggle = (key: string, val: boolean) => {
    const updated = { ...notifPrefs, [key]: val };
    setNotifPrefs(updated);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
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

      {/* Quick settings links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
          {[
            { label: "Appearance",        desc: "Theme, accent colour, border radius", route: "/appearance", icon: Palette },
            { label: "Workflow Settings", desc: "Steps order, currency, role options",  route: "/workflow-settings", icon: Settings },
          ].map(item => (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className="w-full flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
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

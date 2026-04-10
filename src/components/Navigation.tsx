import { useState, useEffect } from "react";
import { AppLogo } from "@/components/AppLogo";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Users2,
  ScrollText,
  Shield,
  Calendar,
  FlaskConical as Beaker,
  Hospital,
  Scissors,
  Stethoscope,
  Package,
  Activity,
  CreditCard,
  FileText,
  Settings2,
  Palette,
  Mail,
  BarChart,
  ClipboardList,
  Truck,
  LogOut,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useAccount } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";
import { hasFeature } from "@/lib/accountStore";
import { useNavigate } from "react-router-dom";

// ─── Workflow Navigation (left sidebar) ───────────────────────────────────────
const navigationItems = [
  { name: "Dashboard",           href: "/dashboard",              icon: LayoutDashboard },
  { name: "Registered Patients", href: "/patients",               icon: ClipboardList },
  { name: "Clients (CRM)",       href: "/clients",                icon: Users2 },
  { name: "Appointments",        href: "/appointments",           icon: Calendar },
  { name: "Triage",              href: "/triage",                 icon: Activity },
  { name: "Labs",                href: "/labs",                   icon: Beaker },
  { name: "Hospitalization",     href: "/hospitalization",        icon: Hospital },
  { name: "Surgery Board",       href: "/surgeries",              icon: Scissors },
  { name: "Treatments",          href: "/treatments",             icon: Stethoscope },
  { name: "Inventory",           href: "/inventory",              icon: Package },
  { name: "Billing",             href: "/billing",                icon: CreditCard },
  { name: "Postmortem",          href: "/postmortem",             icon: FileText },
  { name: "Reports",             href: "/reports",                icon: BarChart },
  { name: "Audit Trails",        href: "/audit",                  icon: ScrollText },
  { name: "Live Feed",           href: "/admin/live-feed",        icon: Radio },
  { name: "Staff Management",    href: "/staff",                  icon: UsersIcon },
  { name: "Field Mode",          href: "/field",                  icon: Truck },
];

// ─── Settings Navigation (top-right profile dropdown) ─────────────────────────
export const settingsItems = [
  { name: "Settings",        href: "/settings",               icon: Settings2 },
];

function InnoVetProLogo({ collapsed }: { collapsed: boolean }) {
  return collapsed
    ? <AppLogo imgHeight={28} />
    : <AppLogo imgHeight={32} showText showTagline textClassName="text-base text-sidebar-foreground" />;
}

const WORKFLOW_SETTINGS_KEY = "boravet_workflow_settings";

function getSkipTriageSetting(): boolean {
  try {
    const raw = localStorage.getItem(WORKFLOW_SETTINGS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.allow_skip_triage === true;
  } catch { return false; }
}

interface NavigationProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Navigation({ mobileOpen = false, onMobileClose }: NavigationProps) {
  // Auto-collapse on tablet (< 1280px), expanded on desktop
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1280 : false
  );
  const [skipTriage, setSkipTriage] = useState(getSkipTriageSetting);
  const { has, unlockProfile } = useRole();
  const { activeAccount } = useAccount();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === WORKFLOW_SETTINGS_KEY) setSkipTriage(getSkipTriageSetting());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <nav className={cn(
      "flex flex-col h-screen overflow-hidden",
      "bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]",
      // Mobile: fixed overlay drawer, slides in/out
      "fixed inset-y-0 left-0 z-[9990]",
      "transition-transform duration-300 ease-in-out",
      mobileOpen ? "translate-x-0" : "-translate-x-full",
      // md+: static in layout flow, always visible
      "md:relative md:inset-auto md:z-auto md:translate-x-0",
      "md:shrink-0 md:transition-all md:duration-300",
      // Width: mobile fixed, md+ responsive to collapsed
      "w-72",
      collapsed ? "md:w-16" : "md:w-64"
    )}>
      {/* Logo Header */}
      <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center justify-between">
          {!collapsed && <InnoVetProLogo collapsed={false} />}
          {collapsed && <InnoVetProLogo collapsed={true} />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-[hsl(var(--sidebar-accent))] shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        {navigationItems
          .filter((item) => {
            if (item.name === "Field Mode")          return has("can_triage");
            if (item.name === "Audit Trails")        return has("can_view_audit") && hasFeature("audit_logs", activeAccount);
            if (item.name === "Live Feed")           return has("can_view_audit"); // SuperAdmin only
            if (item.name === "Reports")             return has("can_view_audit") && hasFeature("audit_logs", activeAccount);
            if (item.name === "Clinic Settings")     return has("can_manage_users");
            if (item.name === "Staff Management")    return has("can_manage_users");
            if (item.name === "Inventory")           return has("can_manage_inventory") && hasFeature("inventory", activeAccount);
            if (item.name === "Billing")             return has("can_access_billing");
            if (item.name === "Triage")              return !skipTriage && has("can_triage");
            if (item.name === "Labs")                return has("can_view_records") && hasFeature("labs", activeAccount);
            if (item.name === "Hospitalization")     return has("can_view_records") && hasFeature("hospitalization", activeAccount);
            if (item.name === "Treatments")          return has("can_view_records") && hasFeature("clinical_records", activeAccount);
            if (item.name === "Postmortem")          return has("can_view_records");
            if (item.name === "Registered Patients") return has("can_view_patients");
            if (item.name === "Appointments")        return has("can_view_patients") && hasFeature("appointments", activeAccount);
            return true;
          })
          .map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/dashboard"}
              onClick={onMobileClose}
              data-tutorial={
                item.name === "Registered Patients" ? "nav-registered-patients" :
                item.name === "Billing"             ? "nav-billing" :
                item.name === "Inventory"           ? "nav-inventory" :
                item.name === "Triage"              ? "triage-page" :
                undefined
              }
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 relative group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-[hsl(var(--sidebar-foreground))]/70 hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]",
                  collapsed && "justify-center px-2"
                )
              }
            >
              <span className={cn("flex items-center justify-center shrink-0", collapsed ? "w-5" : "min-w-[40px]")}>
                <item.icon style={{ width: "1.125rem", height: "1.125rem" }} />
              </span>
              {!collapsed && <span className="truncate">{item.name}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))] space-y-1">
        <NavLink
          to="/admin"
          className={({ isActive }) => cn(
            "flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all",
            isActive
              ? "bg-primary/20 text-primary"
              : "text-[hsl(var(--sidebar-foreground))]/50 hover:text-[hsl(var(--sidebar-foreground))]/80 hover:bg-[hsl(var(--sidebar-accent))]",
            collapsed && "justify-center"
          )}
        >
          <span className={cn("flex items-center justify-center shrink-0", collapsed ? "w-5" : "min-w-[40px]")}>
            <Shield style={{ width: "1rem", height: "1rem" }} />
          </span>
          {!collapsed && <span>Admin portal</span>}
        </NavLink>
        <button
          onClick={() => {
            unlockProfile();
            logout();
            try {
              localStorage.removeItem("acf_profile_locked");
              localStorage.removeItem("acf_active_profile");
            } catch {}
            navigate("/login", { replace: true });
          }}
          className={cn(
            "w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all",
            "text-[hsl(var(--sidebar-foreground))]/40 hover:text-red-400 hover:bg-red-500/10",
            collapsed && "justify-center"
          )}
        >
          <span className={cn("flex items-center justify-center shrink-0", collapsed ? "w-5" : "min-w-[40px]")}>
            <LogOut style={{ width: "1rem", height: "1rem" }} />
          </span>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </nav>
  );
}

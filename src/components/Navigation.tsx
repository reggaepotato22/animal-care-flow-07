import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  ScrollText,
  Shield,
  Calendar,
  FlaskConical as Beaker,
  Hospital,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useAccount } from "@/contexts/AccountContext";
import { hasFeature } from "@/lib/accountStore";

const navigationItems = [
  { name: "Dashboard",           href: "/",                       icon: LayoutDashboard },
  { name: "Registered Patients", href: "/patients",               icon: ClipboardList },
  { name: "Appointments",        href: "/appointments",           icon: Calendar },
  { name: "Clinical Records",    href: "/records",                icon: ScrollText },
  { name: "Triage",              href: "/triage",                 icon: Activity },
  { name: "Labs",                href: "/labs",                   icon: Beaker },
  { name: "Hospitalization",     href: "/hospitalization",        icon: Hospital },
  { name: "Treatments",          href: "/treatments",             icon: Stethoscope },
  { name: "Inventory",           href: "/inventory",              icon: Package },
  { name: "Pharmacy",            href: "/inventory",              icon: Beaker },
  { name: "Billing",             href: "/billing",                icon: CreditCard },
  { name: "Postmortem",          href: "/postmortem",             icon: FileText },
  { name: "Staff Management",    href: "/staff",                  icon: UsersIcon },
  { name: "Reports",             href: "/reports",                icon: BarChart },
  { name: "Audit Trails",        href: "/audit",                  icon: ScrollText },
  { name: "Workflow Settings",   href: "/workflow-settings",      icon: Settings2 },
  { name: "Communications",      href: "/settings/communications",icon: Mail },
  { name: "Appearance",          href: "/appearance",             icon: Palette },
  { name: "Clinic Settings",     href: "/admin/settings",         icon: ScrollText },
];

function InnoVetProLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {/* Animal silhouette icon cluster */}
      <div className="shrink-0 flex items-end gap-0.5">
        {/* Cat */}
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="text-primary">
          <path d="M1 5C1 3 2 1 5 1C8 1 9 3 9 5C9 8 7.5 10 5 10C2.5 10 1 8 1 5Z" fill="currentColor" opacity="0.7"/>
          <path d="M1 2L2.5 4M9 2L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M3 11L3 13M7 11L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {/* Rabbit */}
        <svg width="9" height="16" viewBox="0 0 9 16" fill="none" className="text-primary">
          <path d="M2 5C2 3 3 1.5 4.5 1.5C6 1.5 7 3 7 5C7 7.5 6 9 4.5 9C3 9 2 7.5 2 5Z" fill="currentColor" opacity="0.8"/>
          <path d="M2.5 2L2 0.5M6.5 2L7 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M2.5 10L2 13M6.5 10L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {/* Dog */}
        <svg width="13" height="14" viewBox="0 0 13 14" fill="none" className="text-primary">
          <path d="M2 6C2 3.5 3.5 1.5 6.5 1.5C9.5 1.5 11 3.5 11 6C11 9 9 11 6.5 11C4 11 2 9 2 6Z" fill="currentColor"/>
          <path d="M10.5 2L12 1M2.5 3L1 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M3.5 12L3 13.5M9.5 12L10 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none min-w-0">
          <span className="font-bold text-base text-sidebar-foreground tracking-tight">
            Inno<span className="text-primary">vet</span>Pro
          </span>
          <span className="text-[9px] text-sidebar-foreground/50 uppercase tracking-widest font-medium truncate">
            Vet Management
          </span>
        </div>
      )}
    </div>
  );
}

export function Navigation() {
  const [collapsed, setCollapsed] = useState(false);
  const { has } = useRole();
  const { activeAccount } = useAccount();

  return (
    <nav className={cn(
      "transition-all duration-300 flex flex-col",
      "h-screen sticky top-0 shrink-0 overflow-hidden",
      "bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]",
      collapsed ? "w-16" : "w-64"
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
            if (item.name === "Clinical Records")    return has("can_view_records") && hasFeature("clinical_records", activeAccount);
            if (item.name === "Audit Trails")        return has("can_view_audit") && hasFeature("audit_logs", activeAccount);
            if (item.name === "Clinic Settings")     return has("can_manage_users");
            if (item.name === "Staff Management")    return has("can_manage_users");
            if (item.name === "Reports")             return has("can_view_audit") && hasFeature("audit_logs", activeAccount);
            if (item.name === "Workflow Settings")   return true;
            if (item.name === "Communications")      return has("can_manage_users");
            if (item.name === "Appearance")          return true;
            if (item.name === "Inventory")           return has("can_manage_inventory") && hasFeature("inventory", activeAccount);
            if (item.name === "Pharmacy")            return has("can_dispense") && hasFeature("inventory", activeAccount);
            if (item.name === "Billing")             return has("can_access_billing");
            if (item.name === "Triage")              return has("can_triage");
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
              end={item.href === "/"}
              data-tutorial={
                item.name === "Registered Patients" ? "nav-registered-patients" :
                item.name === "Billing" ? "nav-billing" : undefined
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
              <item.icon className={cn("h-4.5 w-4.5 shrink-0", !collapsed && "mr-3")} style={{ width: "1.125rem", height: "1.125rem" }} />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
      </div>

      {/* Admin Footer */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
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
          <Shield className={cn("h-4 w-4 shrink-0", !collapsed && "mr-2")} />
          {!collapsed && <span>Admin portal</span>}
        </NavLink>
      </div>
    </nav>
  );
}

import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Heart,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patient Oversight", href: "/patients", icon: Heart },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Clinical Records", href: "/records", icon: ScrollText },
  { name: "Triage", href: "/triage", icon: Activity },
  { name: "Labs", href: "/labs", icon: Beaker },
  { name: "Hospitalization", href: "/hospitalization", icon: Hospital },
  { name: "Treatments", href: "/treatments", icon: Stethoscope },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Pharmacy", href: "/inventory", icon: Beaker }, // Added Pharmacy (reusing inventory/beaker for now)
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Postmortem", href: "/postmortem", icon: FileText },
  { name: "Team Management", href: "/admin/staff", icon: UsersIcon },
  { name: "Audit Trails", href: "/audit", icon: ScrollText },
  { name: "Workflow Settings", href: "/workflow-settings", icon: Settings2 },
  { name: "Communications", href: "/settings/communications", icon: Mail },
  { name: "Appearance", href: "/appearance", icon: Palette },
  { name: "Clinic Settings", href: "/admin/settings", icon: ScrollText },
];

export function Navigation() {
  const [collapsed, setCollapsed] = useState(false);
  const { has } = useRole();

  return (
    <nav className={cn(
      "bg-card border-r border-border transition-all duration-300 flex flex-col",
      "h-screen sticky top-0 shrink-0 overflow-hidden",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center border border-primary/30">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">AnimalCare Flow</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        {navigationItems
          .filter((item) => {
            if (item.name === "Clinical Records") return has("can_view_records");
            if (item.name === "Audit Trails") return has("can_view_audit");
            if (item.name === "Clinic Settings") return has("can_manage_users");
            if (item.name === "Team Management") return has("can_manage_users");
            if (item.name === "Workflow Settings") return true; // All roles can access workflow settings
            if (item.name === "Communications") return has("can_manage_users");
            if (item.name === "Appearance") return true;
            if (item.name === "Inventory") return has("can_manage_inventory");
            if (item.name === "Pharmacy") return has("can_dispense");
            if (item.name === "Billing") return has("can_access_billing");
            if (item.name === "Triage") return has("can_triage");
            if (item.name === "Labs") return has("can_view_records");
            if (item.name === "Hospitalization") return has("can_view_records");
            if (item.name === "Treatments") return has("can_view_records");
            if (item.name === "Postmortem") return has("can_view_records");
            if (item.name === "Patient Oversight") return has("can_view_patients");
            if (item.name === "Appointments") return has("can_view_patients");
            return true;
          })
          .map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-3 text-sm font-medium transition-colors relative",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground border-r-2 border-primary"
                    : "text-muted-foreground",
                  collapsed && "justify-center px-2"
                )
              }
            >
              <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
      </div>
      <div className="p-4 border-t border-border">
        <NavLink
          to="/admin"
          className={cn(
            "flex items-center text-sm text-muted-foreground hover:text-foreground",
            collapsed && "justify-center"
          )}
        >
          <Shield className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && <span>Admin portal</span>}
        </NavLink>
      </div>
    </nav>
  );
}

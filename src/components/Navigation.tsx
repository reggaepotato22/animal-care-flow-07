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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patient Oversight", href: "/patients", icon: Heart },
  { name: "Team Management", href: "/admin/staff", icon: UsersIcon },
  { name: "Audit Trails", href: "/audit", icon: ScrollText },
  { name: "Clinic Settings", href: "/admin/settings", icon: ScrollText },
];

export function Navigation() {
  const [collapsed, setCollapsed] = useState(false);
  const { has } = useRole();

  return (
    <nav className={cn(
      "bg-card border-r border-border transition-all duration-300 flex flex-col",
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

      <div className="flex-1 py-4">
        {navigationItems
          .filter((item) => {
            if (item.name === "Audit Trails") return has("can_view_audit");
            if (item.name === "Clinic Settings") return has("can_manage_users");
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

import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  UserCog,
  UserCheck,
  BarChart,
  Bell,
  ChevronLeft,
  ChevronRight,
  Shield,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Staff", href: "/admin/staff", icon: UserCog },
  { name: "Users", href: "/admin/users", icon: UserCheck },
  { name: "Reports", href: "/admin/reports", icon: BarChart },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Templates", href: "/admin/notifications/templates", icon: FileText, isChild: true },
  { name: "Clinical Records", href: "/admin/records", icon: FileText },
];

export function AdminNavigation() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      className={cn(
        "bg-card border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">Admin</span>
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
        {adminNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center px-4 py-3 text-sm font-medium transition-colors relative",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground border-r-2 border-primary"
                  : "text-muted-foreground",
                collapsed && "justify-center px-2",
                item.isChild && !collapsed && "pl-10 text-xs"
              )
            }
          >
            <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </div>

      {!collapsed && (
        <div className="p-4 border-t border-border">
          <NavLink
            to="/"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <Heart className="h-4 w-4 mr-2" />
            Back to main app
          </NavLink>
        </div>
      )}
    </nav>
  );
}

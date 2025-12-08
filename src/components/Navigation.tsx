import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CreditCard,
  Package,
  UserCog,
  UserCheck,
  BarChart,
  Heart,
  ChevronLeft,
  ChevronRight,
  Hospital,
  Pill,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Patients",
    href: "/patients",
    icon: Heart,
  },
  {
    name: "Appointments",
    href: "/appointments",
    icon: Calendar,
  },
  {
    name: "Clinical Records",
    href: "/records",
    icon: FileText,
  },
  {
    name: "Labs",
    href: "/labs",
    icon: Package,
  },
  {
    name: "Post-Mortem",
    href: "/postmortem",
    icon: FileText,
  },
  {
    name: "Hospitalization",
    href: "/hospitalization",
    icon: Hospital,
  },
  {
    name: "Treatments",
    href: "/treatments",
    icon: Pill,
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Warehouse,
  },
  {
    name: "Staff",
    href: "/staff",
    icon: UserCog,
  },
  {
    name: "Users",
    href: "/users",
    icon: UserCheck,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart,
  },
];

export function Navigation() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav className={cn(
      "bg-card border-r border-border transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">VetCare</span>
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
        {navigationItems.map((item) => (
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
    </nav>
  );
}
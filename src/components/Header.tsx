import { Bell, Search as SearchIcon, User, LogOut, Sun, Moon, Leaf, SunMoon, Shield, CheckCheck, Trash2, Settings, Menu, ExternalLink, ChevronDown } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useRole } from "@/contexts/RoleContext";
import * as React from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { getActiveToken } from "@/lib/tokenStore";

interface HeaderProps {
  onMobileMenuOpen?: () => void;
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { role, setRole } = useRole();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [headerQuery, setHeaderQuery] = React.useState("");

  // Extract patientId from URL if present (e.g., /patients/1 or /patients/1/journey)
  const patientIdFromPath = React.useMemo(() => {
    const match = location.pathname.match(/\/patients\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-destructive bg-destructive/10';
      case 'warning':  return 'border-warning bg-warning/10';
      case 'success':  return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
      default:         return 'border-primary bg-primary/10';
    }
  };

  const isDev = getActiveToken()?.isDemo === true || process.env.NODE_ENV === 'development';

  const ROLE_LABELS: Record<string, string> = {
    SuperAdmin: "Super Admin",
    Vet: "Veterinarian",
    Nurse: "Attendant",
    Receptionist: "Receptionist",
    Pharmacist: "Pharmacist",
  };

  const ROLE_COLORS: Record<string, string> = {
    SuperAdmin: "bg-emerald-500 hover:bg-emerald-600",
    Vet: "bg-blue-600 hover:bg-blue-700",
    Nurse: "bg-amber-500 hover:bg-amber-600",
    Receptionist: "bg-sky-500 hover:bg-sky-600",
    Pharmacist: "bg-purple-500 hover:bg-purple-600",
  };

  const ROLES = [
    { value: "SuperAdmin", label: "Super Admin" },
    { value: "Vet", label: "Veterinarian" },
    { value: "Nurse", label: "Attendant" },
    { value: "Receptionist", label: "Receptionist" },
    { value: "Pharmacist", label: "Pharmacist" },
  ] as const;

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4 sticky top-0 z-30">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 shrink-0"
              onClick={onMobileMenuOpen}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Logo: visible on mobile (sidebar is hidden); hidden on md+ (sidebar shows it) */}
            <div className="md:hidden">
              <AppLogo imgHeight={28} showText textClassName="text-base font-bold" />
            </div>
            <div className="relative w-96 hidden lg:block">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search anything...  (Ctrl/Cmd + K)"
                className="pl-10"
                value={headerQuery}
                onChange={(e) => setHeaderQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-2">
            {/* Active user type badge with role switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold transition-colors ${
                    ROLE_COLORS[role] ?? "bg-gray-500 hover:bg-gray-600"
                  }`}
                  title="Switch role"
                >
                  <span>{ROLE_LABELS[role] ?? role}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ROLES.map((r) => (
                  <DropdownMenuItem
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`gap-2 text-sm ${role === r.value ? "font-semibold" : ""}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${ROLE_COLORS[r.value]?.split(" ")[0] ?? "bg-gray-400"}`} />
                    {r.label}
                    {role === r.value && <Shield className="h-3 w-3 ml-auto text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme switchers — hidden on mobile to save space */}
            <div className="hidden sm:flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setTheme("light")} title="Light">
                <Sun className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setTheme("dark")} title="Dark">
                <Moon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setTheme("zen")} title="Zen Green">
                <Leaf className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setTheme("high-contrast")} title="High Contrast">
                <SunMoon className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSearchOpen(true)} title="Search">
              <SearchIcon className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[340px] p-0">
                <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Bell className="h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">{unreadCount} new</Badge>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Mark all read" onClick={markAllRead}>
                      <CheckCheck className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Clear all" onClick={clearAll}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[380px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">No notifications yet</p>
                      <p className="text-xs mt-1">Workflow updates will appear here</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={cn(
                            "p-3 rounded-lg border-l-4 cursor-pointer hover:bg-muted/50 transition-colors",
                            getNotificationColor(n.type),
                            !n.read && "ring-1 ring-inset ring-primary/20"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-xs flex-1", !n.read && "font-semibold")}>{n.message}</p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          {n.step && (
                            <Badge variant="outline" className="text-[9px] mt-1 px-1.5 py-0 h-3.5">
                              {n.step}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-tutorial="header-profile">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name ?? "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <Shield className="h-4 w-4" />
                  Role: {role}
                </DropdownMenuItem>
                {isDev && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Demo Role Switch</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setRole("SuperAdmin")}>Switch to SuperAdmin</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRole("Vet")}>Switch to Vet</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRole("Nurse")}>Switch to Attendant</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRole("Receptionist")}>Switch to Receptionist</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRole("Pharmacist")}>Switch to Pharmacist</DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/workflow-settings")} className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2 text-muted-foreground">
                  <ExternalLink className="h-4 w-4" />
                  Admin Portal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {patientIdFromPath && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patient Workflow</span>
              <WorkflowProgress patientId={patientIdFromPath} className="flex-1 max-w-2xl" />
            </div>
          </div>
        )}
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} initialQuery={headerQuery} />
    </header>
  );
}

import { Bell, Search, User, AlertCircle } from "lucide-react";
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
import { formatDistanceToNow, subMinutes, subHours, subSeconds } from "date-fns";
import { useNavigate } from "react-router-dom";

// Mock notifications data - in a real app this would come from a context or API
const notifications = [
  { 
    id: 1, 
    message: "Rocky needs immediate attention", 
    type: "critical",
    timestamp: subMinutes(new Date(), 5)
  },
  { 
    id: 2, 
    message: "Inventory low: Heartworm medication", 
    type: "warning",
    timestamp: subHours(new Date(), 2)
  },
  { 
    id: 3, 
    message: "Patient Max - Lab results ready for review", 
    type: "info",
    timestamp: subMinutes(new Date(), 15)
  },
  { 
    id: 4, 
    message: "Emergency case arrived - Dr. Johnson requested", 
    type: "critical",
    timestamp: subSeconds(new Date(), 30)
  },
  { 
    id: 5, 
    message: "Vaccination due: Luna (Rabies)", 
    type: "warning",
    timestamp: subHours(new Date(), 4)
  },
];

export function Header() {
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => n.type === 'critical' || n.type === 'warning').length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-destructive bg-destructive/10';
      case 'warning':
        return 'border-warning bg-warning/10';
      default:
        return 'border-primary bg-primary/10';
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-primary">VetCare Pro</h1>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search patients, appointments, or records..."
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Notifications
                </span>
                <Badge variant="secondary" className="text-xs">
                  {notifications.length}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No notifications
                  </div>
                ) : (
                  <div className="p-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border-l-4 mb-2 cursor-pointer hover:bg-muted/50 transition-colors ${getNotificationColor(notification.type)}`}
                        onClick={() => navigate("/")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm flex-1">{notification.message}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={
                              notification.type === 'critical'
                                ? 'destructive'
                                : notification.type === 'warning'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {notification.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-sm"
                  onClick={() => navigate("/")}
                >
                  View All Notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
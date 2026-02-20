import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, UserCheck, BarChart, Bell, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { name: "Staff", href: "/admin/staff", icon: UserCog, description: "Manage staff and schedules" },
  { name: "Users", href: "/admin/users", icon: UserCheck, description: "User management and permissions" },
  { name: "Reports", href: "/admin/reports", icon: BarChart, description: "View and generate reports" },
  { name: "Notifications", href: "/admin/notifications", icon: Bell, description: "Notifications and alerts" },
  { name: "Clinical Records", href: "/admin/records", icon: FileText, description: "Clinical records and documents" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage staff, users, reports, notifications, and clinical records.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((item) => (
          <Card
            key={item.href}
            className="cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/30"
            onClick={() => navigate(item.href)}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{item.description}</CardDescription>
              <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); navigate(item.href); }}>
                Open
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Portal
          </CardTitle>
          <CardDescription>
            This area is restricted to administrators. Use the navigation or cards above to manage staff, users, reports, notifications, and clinical records.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, Heart } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
}

function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3 mr-1 text-success" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
          )}
          <span className={trend === "up" ? "text-success" : "text-destructive"}>
            {change}
          </span>
          <span className="ml-1">from last week</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const stats = [
    {
      title: "Total Patients",
      value: "2,847",
      change: "+12%",
      trend: "up" as const,
      icon: Heart,
    },
    {
      title: "Today's Appointments",
      value: "24",
      change: "+8%",
      trend: "up" as const,
      icon: Calendar,
    },
    {
      title: "Weekly Revenue",
      value: "$18,420",
      change: "+15%",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "Active Staff",
      value: "12",
      change: "0%",
      trend: "up" as const,
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
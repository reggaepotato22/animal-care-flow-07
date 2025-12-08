import { useState } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertCircle, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, subMinutes, subHours, subDays, subSeconds } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const Index = () => {
  const navigate = useNavigate();
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  
  // Mock data for recent activities
  const recentAppointments = [
    { id: "1", patient: "Max", owner: "Sarah Johnson", time: "9:00 AM", type: "Checkup" },
    { id: "2", patient: "Whiskers", owner: "Michael Chen", time: "10:30 AM", type: "Vaccination" },
    { id: "3", patient: "Luna", owner: "Emily Rodriguez", time: "2:00 PM", type: "Surgery" },
  ];

  // All alerts (including the ones shown in dashboard)
  const allAlerts = [
    { 
      id: 1, 
      message: "Rocky needs immediate attention", 
      type: "critical",
      timestamp: subMinutes(new Date(), 5) // 5 minutes ago
    },
    { 
      id: 2, 
      message: "Inventory low: Heartworm medication", 
      type: "warning",
      timestamp: subHours(new Date(), 2) // 2 hours ago
    },
    { 
      id: 3, 
      message: "Staff meeting scheduled for 3 PM", 
      type: "info",
      timestamp: subDays(new Date(), 1) // 1 day ago
    },
    { 
      id: 4, 
      message: "Patient Max - Lab results ready for review", 
      type: "info",
      timestamp: subMinutes(new Date(), 15) // 15 minutes ago
    },
    { 
      id: 5, 
      message: "Vaccination due: Luna (Rabies)", 
      type: "warning",
      timestamp: subHours(new Date(), 4) // 4 hours ago
    },
    { 
      id: 6, 
      message: "Emergency case arrived - Dr. Johnson requested", 
      type: "critical",
      timestamp: subSeconds(new Date(), 30) // 30 seconds ago
    },
    { 
      id: 7, 
      message: "Prescription refill requested: Buddy", 
      type: "info",
      timestamp: subHours(new Date(), 1) // 1 hour ago
    },
    { 
      id: 8, 
      message: "Equipment maintenance due: X-ray machine", 
      type: "warning",
      timestamp: subDays(new Date(), 2) // 2 days ago
    },
    { 
      id: 9, 
      message: "Follow-up appointment reminder: Charlie", 
      type: "info",
      timestamp: subHours(new Date(), 6) // 6 hours ago
    },
  ];

  // Show only first 3 alerts in dashboard
  const alerts = allAlerts.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at your veterinary clinic today.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={() => navigate(`/appointments/${appointment.id}`)}
                  className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{appointment.patient}</p>
                    <p className="text-sm text-muted-foreground">{appointment.owner}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{appointment.time}</p>
                    <Badge variant="outline">{appointment.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate("/appointments")}
            >
              View All Appointments
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'critical' 
                    ? 'border-destructive bg-destructive/10' 
                    : alert.type === 'warning'
                    ? 'border-warning bg-warning/10'
                    : 'border-primary bg-primary/10'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm flex-1">{alert.message}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setIsAlertsModalOpen(true)}
            >
              View All Alerts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* All Alerts Modal */}
      <Dialog open={isAlertsModalOpen} onOpenChange={setIsAlertsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              All Alerts & Notifications
            </DialogTitle>
            <DialogDescription>
              View and manage all system alerts and notifications
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {allAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No alerts available
                </div>
              ) : (
                allAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'critical' 
                        ? 'border-destructive bg-destructive/10' 
                        : alert.type === 'warning'
                        ? 'border-warning bg-warning/10'
                        : 'border-primary bg-primary/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={
                              alert.type === 'critical'
                                ? 'destructive'
                                : alert.type === 'warning'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {alert.type}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar, Clock, CheckCircle, AlertTriangle, Pill, Stethoscope,
  Syringe, FileText, Activity, Bone, Heart, Thermometer, Microscope,
  Camera, Download, ChevronRight, Info,
} from "lucide-react";
import { loadAttachments, loadLabOrders, type Attachment, type LabOrder } from "@/lib/attachmentStore";
import { format, isAfter, isBefore, startOfDay, addDays, addWeeks, addMonths } from "date-fns";

interface TimelineEvent {
  id: string;
  date: Date;
  type: "appointment" | "lab_result" | "vaccination" | "medication" | "procedure" | "imaging" | "note" | "upcoming";
  title: string;
  description: string;
  status: "completed" | "pending" | "upcoming" | "cancelled";
  icon: React.ComponentType<any>;
  color: string;
  metadata?: {
    urgency?: "routine" | "urgent" | "stat";
    testName?: string;
    labName?: string;
    caseId?: string;
    fileCount?: number;
  };
}

interface ClinicalTimelineProps {
  patientId: string;
  patientName: string;
}

export function ClinicalTimeline({ patientId, patientName }: ClinicalTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "3months" | "6months" | "year">("3months");

  useEffect(() => {
    const generateTimelineEvents = () => {
      const timelineEvents: TimelineEvent[] = [];
      const now = new Date();
      const periodStart = getPeriodStart(now, selectedPeriod);

      // Load actual data
      const attachments = loadAttachments(patientId);
      const labOrders = loadLabOrders(patientId);

      // Process lab orders
      labOrders.forEach(order => {
        const orderDate = new Date(order.orderedAt);
        if (isAfter(orderDate, periodStart)) {
          timelineEvents.push({
            id: `lab-order-${order.id}`,
            date: orderDate,
            type: "lab_result",
            title: `Lab Order: ${order.testName}`,
            description: `Sent to ${order.labName || "External Lab"} • Case #${order.caseId}`,
            status: order.status === "completed" ? "completed" : "pending",
            icon: Microscope,
            color: order.urgency === "stat" ? "text-red-600" : order.urgency === "urgent" ? "text-amber-600" : "text-blue-600",
            metadata: {
              urgency: order.urgency,
              testName: order.testName,
              labName: order.labName,
              caseId: order.caseId,
            },
          });

          // Add completion event if completed
          if (order.completedAt) {
            const completedDate = new Date(order.completedAt);
            if (isAfter(completedDate, periodStart)) {
              timelineEvents.push({
                id: `lab-completed-${order.id}`,
                date: completedDate,
                type: "lab_result",
                title: `Results Received: ${order.testName}`,
                description: `Results received from ${order.labName || "Lab"}`,
                status: "completed",
                icon: CheckCircle,
                color: "text-green-600",
                metadata: {
                  testName: order.testName,
                  labName: order.labName,
                },
              });
            }
          }
        }
      });

      // Process attachments
      attachments.forEach(attachment => {
        const uploadDate = new Date(attachment.uploadedAt);
        if (isAfter(uploadDate, periodStart)) {
          const isLab = attachment.category === "lab";
          const isImaging = attachment.category === "imaging";
          
          let eventType: TimelineEvent["type"] = "note";
          let icon = FileText;
          let color = "text-gray-600";
          
          if (isLab) {
            eventType = "lab_result";
            icon = Microscope;
            color = "text-purple-600";
          } else if (isImaging) {
            eventType = "imaging";
            icon = Camera;
            color = "text-indigo-600";
          }

          timelineEvents.push({
            id: `attachment-${attachment.id}`,
            date: uploadDate,
            type: eventType,
            title: `${isLab ? "Lab Result" : isImaging ? "Imaging" : "Document"}: ${attachment.fileName}`,
            description: `Uploaded by ${attachment.uploadedByName || "External"} • ${formatFileSize(attachment.fileSize)}`,
            status: "completed",
            icon,
            color,
          });
        }
      });

      // Add sample historical events for demonstration
      const historicalEvents = [
        {
          date: addDays(now, -14),
          type: "vaccination" as const,
          title: "Annual Vaccination",
          description: "DHPP + Rabies vaccines administered",
          icon: Syringe,
          color: "text-teal-600",
        },
        {
          date: addDays(now, -7),
          type: "appointment" as const,
          title: "Regular Check-up",
          description: "Routine wellness examination",
          icon: Stethoscope,
          color: "text-blue-600",
        },
        {
          date: addDays(now, -3),
          type: "procedure" as const,
          title: "Dental Cleaning",
          description: "Professional dental scaling and polishing",
          icon: Activity,
          color: "text-orange-600",
        },
      ];

      historicalEvents.forEach((event, index) => {
        if (isAfter(event.date, periodStart)) {
          timelineEvents.push({
            id: `historical-${index}`,
            date: event.date,
            type: event.type,
            title: event.title,
            description: event.description,
            status: "completed",
            icon: event.icon,
            color: event.color,
          });
        }
      });

      // Add upcoming events
      const upcomingEvents = [
        {
          date: addWeeks(now, 2),
          type: "upcoming" as const,
          title: "Follow-up Appointment",
          description: "Post-dental check and evaluation",
          icon: Calendar,
          color: "text-gray-400",
        },
        {
          date: addMonths(now, 1),
          type: "upcoming" as const,
          title: "Vaccination Due",
          description: "Bordetella vaccine renewal",
          icon: Syringe,
          color: "text-gray-400",
        },
        {
          date: addMonths(now, 3),
          type: "upcoming" as const,
          title: "Annual Bloodwork",
          description: "Preventative health screening",
          icon: Microscope,
          color: "text-gray-400",
        },
      ];

      upcomingEvents.forEach((event, index) => {
        timelineEvents.push({
          id: `upcoming-${index}`,
          date: event.date,
          type: event.type,
          title: event.title,
          description: event.description,
          status: "upcoming",
          icon: event.icon,
          color: event.color,
        });
      });

      // Sort events by date
      timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setEvents(timelineEvents);
    };

    generateTimelineEvents();
  }, [patientId, selectedPeriod]);

  const getPeriodStart = (date: Date, period: string): Date => {
    switch (period) {
      case "month":
        return addDays(date, -30);
      case "3months":
        return addDays(date, -90);
      case "6months":
        return addDays(date, -180);
      case "year":
        return addDays(date, -365);
      default:
        return addDays(date, -90);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "upcoming":
        return "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEventIcon = (event: TimelineEvent) => {
    const Icon = event.icon;
    return <Icon className={`h-5 w-5 ${event.color}`} />;
  };

  const groupedEvents = events.reduce((groups, event) => {
    const dateKey = format(event.date, "yyyy-MM-dd");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600" />
            Clinical Timeline
          </h3>
          <p className="text-sm text-muted-foreground">Visual history and upcoming events for {patientName}</p>
        </div>
        
        <div className="flex gap-2">
          {(["month", "3months", "6months", "year"] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === "month" ? "1M" : period === "3months" ? "3M" : period === "6months" ? "6M" : "1Y"}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

        {/* Events */}
        <div className="space-y-6">
          {sortedDates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events found in the selected period</p>
            </div>
          ) : (
            sortedDates.map((dateKey) => (
              <div key={dateKey} className="relative">
                {/* Date marker */}
                <div className="absolute left-4 w-5 h-5 bg-background border-2 border-border rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-border rounded-full"></div>
                </div>
                
                <div className="ml-12">
                  {/* Date header */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {format(new Date(dateKey), "EEEE, MMMM d, yyyy")}
                    </h4>
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-3">
                    {groupedEvents[dateKey].map((event) => (
                      <Card key={event.id} className={`shadow-sm ${event.status === "upcoming" ? "opacity-60" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getEventIcon(event)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-sm">{event.title}</h5>
                                <Badge variant="outline" className={getStatusColor(event.status)}>
                                  {event.status}
                                </Badge>
                                
                                {event.metadata?.urgency && (
                                  <Badge variant="outline" className={
                                    event.metadata.urgency === "stat" ? "bg-red-100 text-red-800" :
                                    event.metadata.urgency === "urgent" ? "bg-amber-100 text-amber-800" :
                                    "bg-gray-100 text-gray-800"
                                  }>
                                    {event.metadata.urgency.toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                              
                              {/* Additional metadata */}
                              {event.metadata && (
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {event.metadata.caseId && (
                                    <span className="text-muted-foreground">Case: #{event.metadata.caseId}</span>
                                  )}
                                  {event.metadata.labName && (
                                    <span className="text-muted-foreground">Lab: {event.metadata.labName}</span>
                                  )}
                                  {event.metadata.fileCount && (
                                    <span className="text-muted-foreground">{event.metadata.fileCount} files</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Actions */}
                              <div className="flex gap-2 mt-3">
                                {event.type === "lab_result" && event.status === "completed" && (
                                  <Button size="sm" variant="outline">
                                    <Download className="h-3 w-3 mr-1" />
                                    View Results
                                  </Button>
                                )}
                                {event.type === "imaging" && event.status === "completed" && (
                                  <Button size="sm" variant="outline">
                                    <Camera className="h-3 w-3 mr-1" />
                                    View Images
                                  </Button>
                                )}
                                {event.status === "pending" && (
                                  <Button size="sm" variant="outline">
                                    <Info className="h-3 w-3 mr-1" />
                                    Details
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              {format(event.date, "h:mm a")}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-3">Timeline Legend</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <Microscope className="h-3 w-3 text-purple-600" />
              <span>Lab Results</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="h-3 w-3 text-indigo-600" />
              <span>Imaging</span>
            </div>
            <div className="flex items-center gap-2">
              <Syringe className="h-3 w-3 text-teal-600" />
              <span>Vaccination</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

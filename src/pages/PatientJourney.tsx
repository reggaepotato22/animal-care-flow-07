import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
  ArrowLeft, Stethoscope, Pill, Activity, AlertTriangle, FileText, Clock, CheckCircle, 
  Microscope, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadLabOrders, loadAttachments, completeLabOrder, type LabOrder, type Attachment } from "@/lib/attachmentStore";
import { FileViewer } from "@/components/FileViewer";
import { format } from "date-fns";

type JourneyEvent = {
  id: string;
  date: string;
  type: "Visit" | "Injection" | "Lab" | "Surgery" | "Follow-up" | "Emergency" | "Lab Order";
  title: string;
  detail: string;
  status: "completed" | "active" | "pending" | "in-progress";
  metadata?: {
    orderId?: string;
    testType?: string;
    urgency?: string;
    attachmentIds?: string[];
  };
};

function icon(type: JourneyEvent["type"]) {
  switch (type) {
    case "Visit": return <Stethoscope className="h-4 w-4" />;
    case "Injection": return <Pill className="h-4 w-4" />;
    case "Lab": return <Activity className="h-4 w-4" />;
    case "Surgery": return <FileText className="h-4 w-4" />;
    case "Follow-up": return <Clock className="h-4 w-4" />;
    case "Emergency": return <AlertTriangle className="h-4 w-4" />;
    case "Lab Order": return <Microscope className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
}

function statusColor(status: JourneyEvent["status"]) {
  switch (status) {
    case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "active": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "in-progress": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "pending": return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    default: return "bg-gray-100 text-gray-800";
  }
}

export default function PatientJourney() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const patientId = id || "1";
  
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    eventId?: string;
    orderId?: string;
    title?: string;
  }>({ isOpen: false });

  // Load data
  useEffect(() => {
    const orders = loadLabOrders(patientId);
    setLabOrders(orders);
    
    const atts = loadAttachments(patientId);
    setAttachments(atts);
    
    // Convert lab orders to journey events
    const labEvents: JourneyEvent[] = orders.map(order => ({
      id: order.id,
      date: order.orderedAt,
      type: "Lab Order",
      title: order.testName,
      detail: `Ordered from ${order.labName || "External Lab"} • Case #${order.caseId}${order.notes ? ` • ${order.notes}` : ""}`,
      status: order.status === "completed" ? "completed" : order.status === "in_progress" ? "in-progress" : "pending",
      metadata: {
        orderId: order.id,
        testType: order.testType,
        urgency: order.urgency,
      },
    }));
    
    // Add mock historical events
    const mockEvents: JourneyEvent[] = [
      { id: "mock-1", date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), type: "Visit", title: "Annual Checkup", detail: "Vitals normal, vaccination due in 6 months", status: "completed" },
      { id: "mock-2", date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), type: "Injection", title: "Rabies Booster", detail: "No adverse reaction observed", status: "completed" },
    ];
    
    // Combine and sort by date (newest first)
    const allEvents = [...labEvents, ...mockEvents].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setEvents(allEvents);
  }, [patientId]);

  const handleMarkComplete = (eventId: string, orderId?: string, title?: string) => {
    setConfirmDialog({
      isOpen: true,
      eventId,
      orderId,
      title,
    });
  };

  const confirmMarkComplete = () => {
    const { orderId } = confirmDialog;
    
    if (orderId) {
      // Complete the lab order
      const success = completeLabOrder(orderId, [], "Marked complete from Patient Journey");
      if (success) {
        toast({ title: "Lab Order Completed", description: "The lab order has been marked as completed." });
        // Refresh events
        const orders = loadLabOrders(patientId);
        setLabOrders(orders);
        
        // Update events
        const labEvents: JourneyEvent[] = orders.map(order => ({
          id: order.id,
          date: order.orderedAt,
          type: "Lab Order",
          title: order.testName,
          detail: `Ordered from ${order.labName || "External Lab"} • Case #${order.caseId}${order.notes ? ` • ${order.notes}` : ""}`,
          status: order.status === "completed" ? "completed" : order.status === "in_progress" ? "in-progress" : "pending",
          metadata: {
            orderId: order.id,
            testType: order.testType,
            urgency: order.urgency,
          },
        }));
        
        const mockEvents: JourneyEvent[] = [
          { id: "mock-1", date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), type: "Visit", title: "Annual Checkup", detail: "Vitals normal, vaccination due in 6 months", status: "completed" },
          { id: "mock-2", date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), type: "Injection", title: "Rabies Booster", detail: "No adverse reaction observed", status: "completed" },
        ];
        
        setEvents([...labEvents, ...mockEvents].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    }
    
    setConfirmDialog({ isOpen: false });
  };

  const getLinkedAttachments = (orderId?: string) => {
    if (!orderId) return [];
    return attachments.filter(a => a.labOrderId === orderId);
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Patient Journey</h1>
            <p className="text-sm text-muted-foreground">Live Progress & Medical Timeline</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/patients/${patientId}`)}>
          <Stethoscope className="h-4 w-4 mr-2" />
          View Patient Record
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {events.filter(e => e.status === "pending" || e.status === "in-progress").length}
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {labOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">Lab Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {attachments.length}
            </div>
            <p className="text-xs text-muted-foreground">Attachments</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Timeline</CardTitle>
          <CardDescription>Complete history of visits, procedures, and lab orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-6">
              {events.map((event) => {
                const linkedAtts = getLinkedAttachments(event.metadata?.orderId);
                
                return (
                  <div key={event.id} className="relative">
                    <div className={`absolute -left-[9px] top-1 w-5 h-5 rounded-full border-2 border-background ${
                      event.status === "completed" ? "bg-green-500" : 
                      event.status === "in-progress" ? "bg-yellow-500" : "bg-gray-400"
                    }`} />
                    
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {icon(event.type)}
                          <span className="font-semibold">{event.title}</span>
                          <Badge variant="outline" className="text-xs">{event.type}</Badge>
                          {event.metadata?.urgency && (
                            <Badge className={
                              event.metadata.urgency === "stat" ? "bg-red-100 text-red-800" :
                              event.metadata.urgency === "urgent" ? "bg-amber-100 text-amber-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {event.metadata.urgency.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                        
                        <div className="text-sm">{event.detail}</div>
                        
                        {/* Linked Attachments */}
                        {linkedAtts.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Linked Files:</p>
                            <div className="flex flex-wrap gap-2">
                              {linkedAtts.map(att => (
                                <Button
                                  key={att.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAttachment(att);
                                    setIsViewerOpen(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  {att.fileName}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={statusColor(event.status)}>
                          {event.status}
                        </Badge>
                        
                        {event.type === "Lab Order" && event.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkComplete(event.id, event.metadata?.orderId, event.title)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {events.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog({ isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Completion</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark &quot;{confirmDialog.title || "this item"}&quot; as completed?
              <br /><br />
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Mark the lab order as completed</li>
                <li>Clear any pending notifications</li>
                <li>Update the patient record</li>
              </ul>
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false })}>
              Cancel
            </Button>
            <Button onClick={confirmMarkComplete} variant="default">
              <CheckCircle className="h-4 w-4 mr-2" />
              Yes, Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Viewer */}
      <FileViewer
        attachment={selectedAttachment}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </div>
  );
}


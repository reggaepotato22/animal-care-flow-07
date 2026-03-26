import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Microscope, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Filter, Search, Mail, ExternalLink, Calendar, Users,
} from "lucide-react";
import { loadLabOrders, subscribeToLabOrders, type LabOrder } from "@/lib/attachmentStore";
import { format, isAfter, addHours } from "date-fns";

interface LabQueueItem extends LabOrder {
  statusColor: string;
  statusIcon: React.ComponentType<any>;
  timeStatus: "overdue" | "warning" | "normal";
  timeColor: string;
}

export function LabQueueDashboard() {
  const [labOrders, setLabOrders] = useState<LabQueueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  // Load and process lab orders
  useEffect(() => {
    const processOrders = () => {
      const orders = loadLabOrders();
      const processed: LabQueueItem[] = orders.map(order => {
        // Determine status styling
        let statusColor = "";
        let statusIcon = Clock;
        
        switch (order.status) {
          case "pending":
            statusColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
            statusIcon = Clock;
            break;
          case "in_progress":
            statusColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
            statusIcon = RefreshCw;
            break;
          case "completed":
            statusColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            statusIcon = CheckCircle;
            break;
          case "cancelled":
            statusColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
            statusIcon = XCircle;
            break;
        }

        // Determine time status
        let timeStatus: "overdue" | "warning" | "normal" = "normal";
        let timeColor = "";
        
        if (order.status === "pending" && order.uploadExpiresAt) {
          const now = new Date();
          const expiresAt = new Date(order.uploadExpiresAt);
          const warningTime = addHours(expiresAt, -12); // 12 hours before expiry
          
          if (now > expiresAt) {
            timeStatus = "overdue";
            timeColor = "text-red-600 dark:text-red-400";
          } else if (now > warningTime) {
            timeStatus = "warning";
            timeColor = "text-amber-600 dark:text-amber-400";
          } else {
            timeColor = "text-green-600 dark:text-green-400";
          }
        } else if (order.status === "completed") {
          timeColor = "text-green-600 dark:text-green-400";
        } else {
          timeColor = "text-gray-600 dark:text-gray-400";
        }

        return {
          ...order,
          statusColor,
          statusIcon,
          timeStatus,
          timeColor,
        };
      });
      
      setLabOrders(processed);
    };

    processOrders();
    const unsub = subscribeToLabOrders(processOrders);
    return unsub;
  }, []);

  // Filter orders
  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = 
      order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.labName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.caseId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || order.urgency === urgencyFilter;
    const matchesTime = timeFilter === "all" || order.timeStatus === timeFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency && matchesTime;
  });

  // Get counts for summary
  const overdueCount = labOrders.filter(o => o.timeStatus === "overdue").length;
  const warningCount = labOrders.filter(o => o.timeStatus === "warning").length;
  const pendingCount = labOrders.filter(o => o.status === "pending").length;
  const completedCount = labOrders.filter(o => o.status === "completed").length;

  const StatusIcon = ({ order }: { order: LabQueueItem }) => {
    const Icon = order.statusIcon;
    return <Icon className="h-4 w-4" />;
  };

  const UrgencyBadge = ({ urgency }: { urgency: string }) => {
    const variants = {
      stat: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      urgent: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      routine: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    };
    
    return (
      <Badge variant="outline" className={variants[urgency as keyof typeof variants] || variants.routine}>
        {urgency.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Microscope className="h-6 w-6 text-teal-600" />
          Lab Queue Dashboard
        </h2>
        <p className="text-muted-foreground">Monitor and manage diagnostic test orders and result uploads</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Overdue</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-200">{overdueCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Warning</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">{warningCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Pending</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Completed</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-200">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients, tests, labs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="stat">STAT</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lab Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lab Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Real-time status of all diagnostic test orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Microscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No lab orders found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon order={order} />
                        <span className="font-medium">{order.testName}</span>
                        <Badge variant="outline" className={order.statusColor}>
                          {order.status.replace("_", " ")}
                        </Badge>
                        <UrgencyBadge urgency={order.urgency} />
                        <span className={`text-sm ${order.timeColor}`}>
                          {order.timeStatus === "overdue" && "⚠️ Overdue"}
                          {order.timeStatus === "warning" && "⏰ Expires Soon"}
                          {order.timeStatus === "normal" && "✓ On Track"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Patient:</span> {order.patientName}
                        </div>
                        <div>
                          <span className="font-medium">Lab:</span> {order.labName || "Not assigned"}
                        </div>
                        <div>
                          <span className="font-medium">Case ID:</span> #{order.caseId}
                        </div>
                        <div>
                          <span className="font-medium">Ordered:</span> {format(new Date(order.orderedAt), "MMM d, yyyy")}
                        </div>
                      </div>

                      {order.uploadExpiresAt && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Expires:</span> {format(new Date(order.uploadExpiresAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}

                      {order.completedAt && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          <span className="font-medium">Completed:</span> {format(new Date(order.completedAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {order.uploadToken && (
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Link
                        </Button>
                      )}
                      {order.timeStatus === "warning" && (
                        <Button size="sm" variant="outline">
                          <Mail className="h-3 w-3 mr-1" />
                          Follow Up
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

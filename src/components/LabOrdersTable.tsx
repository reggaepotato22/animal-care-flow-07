import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreVertical, Eye, Edit, FileText, Calendar, User, Plus } from "lucide-react";
import { LabResultsDialog } from "./LabResultsDialog";
import { LabOrderDetailsDialog } from "./LabOrderDetailsDialog";
import { AddLabResultsDialog } from "./AddLabResultsDialog";
import { toast } from "sonner";

interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  species: string;
  breed: string;
  orderDate: string;
  veterinarian: string;
  tests: string[];
  priority: "routine" | "urgent" | "stat";
  status: "pending" | "collected" | "in-progress" | "completed";
  specialInstructions?: string;
  diagnosis: string;
  collectedDate?: string;
  collectedBy?: string;
  sampleType?: string;
  resultDate?: string;
  results?: any;
}

interface LabOrdersTableProps {
  orders: LabOrder[];
  onResultsAdded?: (orderId: string, results: any) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "collected": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "in-progress": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "stat": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "urgent": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "routine": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export function LabOrdersTable({ orders, onResultsAdded }: LabOrdersTableProps) {
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setStatusUpdates(prev => ({ ...prev, [orderId]: newStatus }));
    toast.success(`Order ${orderId} status updated to ${newStatus}`);
  };

  const getCurrentStatus = (order: LabOrder) => {
    return statusUpdates[order.id] || order.status;
  };

  const handleRowClick = (order: LabOrder) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleResultsAdded = (orderId: string, results: any) => {
    if (onResultsAdded) {
      onResultsAdded(orderId, results);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lab Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Veterinarian</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const currentStatus = getCurrentStatus(order);
                
                return (
                  <TableRow 
                    key={order.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(order)}
                  >
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.patientName}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.species} • {order.breed}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.tests.slice(0, 2).map((test, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {test}
                          </Badge>
                        ))}
                        {order.tests.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{order.tests.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {order.veterinarian}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={currentStatus} 
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="collected">Collected</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {order.orderDate}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(order); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Order
                          </DropdownMenuItem>
                          {(currentStatus === "collected" || currentStatus === "in-progress") && (
                            <AddLabResultsDialog order={order} onResultsAdded={handleResultsAdded}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Results
                              </DropdownMenuItem>
                            </AddLabResultsDialog>
                          )}
                          {currentStatus === "completed" && (
                            <LabResultsDialog order={order}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()}>
                                <FileText className="mr-2 h-4 w-4" />
                                View Results
                              </DropdownMenuItem>
                            </LabResultsDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {orders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No lab orders found
            </div>
          )}
        </div>
      </CardContent>

      <LabOrderDetailsDialog 
        order={selectedOrder}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </Card>
  );
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Stethoscope, TestTube, AlertTriangle, FileText, Clock } from "lucide-react";

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

interface LabOrderDetailsDialogProps {
  order: LabOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function LabOrderDetailsDialog({ order, open, onOpenChange }: LabOrderDetailsDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Lab Order Details - {order.id}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('-', ' ').toUpperCase()}
              </Badge>
              <Badge className={getPriorityColor(order.priority)}>
                {order.priority.toUpperCase()} PRIORITY
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Order Date: {order.orderDate}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium text-lg">{order.patientName}</div>
                  <div className="text-sm text-muted-foreground">ID: {order.patientId}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Species:</span>
                    <div className="text-muted-foreground">{order.species}</div>
                  </div>
                  <div>
                    <span className="font-medium">Breed:</span>
                    <div className="text-muted-foreground">{order.breed}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Veterinarian & Clinical Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Clinical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Veterinarian:</span>
                  <div className="text-muted-foreground">{order.veterinarian}</div>
                </div>
                <div>
                  <span className="font-medium">Diagnosis/Reason:</span>
                  <div className="text-muted-foreground">{order.diagnosis}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tests Ordered */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Tests Ordered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {order.tests.map((test, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {test}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Special Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.specialInstructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">Order Created</div>
                    <div className="text-sm text-muted-foreground">
                      {order.orderDate} by {order.veterinarian}
                    </div>
                  </div>
                </div>

                {order.collectedDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Sample Collected</div>
                      <div className="text-sm text-muted-foreground">
                        {order.collectedDate} by {order.collectedBy}
                        {order.sampleType && ` • Sample Type: ${order.sampleType}`}
                      </div>
                    </div>
                  </div>
                )}

                {order.status === "in-progress" && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">In Progress</div>
                      <div className="text-sm text-muted-foreground">
                        Currently being processed
                      </div>
                    </div>
                  </div>
                )}

                {order.resultDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Results Available</div>
                      <div className="text-sm text-muted-foreground">
                        {order.resultDate}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Summary (if completed) */}
          {order.status === "completed" && order.results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Results Summary
                </CardTitle>
                <CardDescription>
                  Click "View Results" in the table for detailed results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Results are available for review. Use the "View Results" button in the Lab Orders table 
                  or Results tab for detailed analysis and interpretation.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
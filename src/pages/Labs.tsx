import { useState } from "react";
import { Plus, Search, Filter, Download, TestTube, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LabOrderDialog } from "@/components/LabOrderDialog";
import { LabResultsDialog } from "@/components/LabResultsDialog";
import { LabOrdersTable } from "@/components/LabOrdersTable";


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

// Mock lab orders data
const mockLabOrders: LabOrder[] = [
  {
    id: "LAB001",
    patientId: "P001",
    patientName: "Max",
    species: "Canine",
    breed: "Golden Retriever",
    orderDate: "2024-03-10",
    veterinarian: "Dr. Smith",
    tests: ["CBC", "Chemistry Panel", "Urinalysis"],
    priority: "routine",
    status: "completed",
    diagnosis: "Annual wellness examination",
    collectedDate: "2024-03-10",
    collectedBy: "Tech Sarah",
    sampleType: "Blood, Urine",
    resultDate: "2024-03-11",
    results: {
      CBC: { WBC: "8.2", RBC: "6.1", HGB: "14.2", HCT: "42.1" },
      Chemistry: { ALT: "45", BUN: "18", CREA: "1.1", GLU: "95" }
    }
  },
  {
    id: "LAB002",
    patientId: "P002", 
    patientName: "Luna",
    species: "Feline",
    breed: "Domestic Shorthair",
    orderDate: "2024-03-12",
    veterinarian: "Dr. Johnson",
    tests: ["Fecal Parasite Exam", "FeLV/FIV"],
    priority: "urgent",
    status: "in-progress",
    diagnosis: "Gastrointestinal upset",
    collectedDate: "2024-03-12",
    collectedBy: "Tech Mike",
    sampleType: "Fecal sample, Blood"
  },
  {
    id: "LAB003",
    patientId: "P003",
    patientName: "Rocky",
    species: "Canine", 
    breed: "German Shepherd",
    orderDate: "2024-03-13",
    veterinarian: "Dr. Brown",
    tests: ["Radiographs - Hip", "CBC"],
    priority: "stat",
    status: "collected",
    diagnosis: "Hip dysplasia evaluation",
    collectedDate: "2024-03-13",
    collectedBy: "Tech Lisa",
    sampleType: "Blood, X-ray"
  }
];

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

export default function Labs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [labOrders, setLabOrders] = useState<LabOrder[]>(mockLabOrders);

  const handleResultsAdded = (orderId: string, results: any) => {
    setLabOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: "completed" as const,
            resultDate: results.resultDate,
            results: results.results
          }
        : order
    ));
  };

  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.tests.some(test => test.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    pending: labOrders.filter(o => o.status === "pending").length,
    inProgress: labOrders.filter(o => o.status === "in-progress").length,
    completed: labOrders.filter(o => o.status === "completed").length,
    stat: labOrders.filter(o => o.priority === "stat").length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laboratory Management</h1>
          <p className="text-muted-foreground">
            Manage lab orders, track results, and monitor trends
          </p>
        </div>
        <LabOrderDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Lab Order
          </Button>
        </LabOrderDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting sample collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently being processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Results available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">STAT Orders</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stat}</div>
            <p className="text-xs text-muted-foreground">
              High priority orders
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Lab Orders</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name, order ID, or test type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="collected">Collected</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <LabOrdersTable orders={filteredOrders} onResultsAdded={handleResultsAdded} />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lab Results Management</CardTitle>
              <CardDescription>
                View, enter, and manage laboratory test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredOrders
                  .filter(order => order.status === "completed")
                  .map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{order.patientName}</span>
                            <Badge variant="outline">{order.id}</Badge>
                            <Badge className={getPriorityColor(order.priority)}>
                              {order.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.tests.join(", ")} • {order.resultDate}
                          </p>
                        </div>
                        <LabResultsDialog order={order}>
                          <Button size="sm">View Results</Button>
                        </LabResultsDialog>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
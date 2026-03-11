import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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
  diagnosis: string;
  results?: any;
  resultDate?: string;
}

interface LabResultsTrendsProps {
  orders: LabOrder[];
}

// Mock historical data for trending
const mockHistoricalData = [
  { date: "2024-01-15", ALT: 45, BUN: 18, CREA: 1.1, WBC: 8.2 },
  { date: "2024-02-12", ALT: 52, BUN: 20, CREA: 1.2, WBC: 8.8 },
  { date: "2024-03-11", ALT: 45, BUN: 18, CREA: 1.1, WBC: 8.2 },
];

const testVolumeData = [
  { month: "Jan", CBC: 25, Chemistry: 20, Urinalysis: 15, Radiology: 8 },
  { month: "Feb", CBC: 30, Chemistry: 25, Urinalysis: 18, Radiology: 12 },
  { month: "Mar", CBC: 28, Chemistry: 22, Urinalysis: 16, Radiology: 10 },
];

const normalRanges = {
  ALT: { min: 10, max: 100, unit: "U/L" },
  BUN: { min: 7, max: 27, unit: "mg/dL" },
  CREA: { min: 0.5, max: 1.8, unit: "mg/dL" },
  WBC: { min: 6.0, max: 17.0, unit: "10^3/μL" },
};

const getTrendIcon = (current: number, previous: number) => {
  if (current > previous) return <TrendingUp className="h-4 w-4 text-red-500" />;
  if (current < previous) return <TrendingDown className="h-4 w-4 text-green-500" />;
  return <Minus className="h-4 w-4 text-gray-500" />;
};

const getValueStatus = (value: number, testName: string) => {
  const range = normalRanges[testName as keyof typeof normalRanges];
  if (!range) return "normal";
  
  if (value < range.min) return "low";
  if (value > range.max) return "high";
  return "normal";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "low": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "normal": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export function LabResultsTrends({ orders }: LabResultsTrendsProps) {
  const completedOrders = orders.filter(order => order.status === "completed" && order.results);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lab Trends & Analytics</h2>
          <p className="text-muted-foreground">
            Visualize test results over time and analyze lab usage patterns
          </p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            <SelectItem value="P001">Max</SelectItem>
            <SelectItem value="P002">Luna</SelectItem>
            <SelectItem value="P003">Rocky</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lab Value Trends */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Lab Value Trends</CardTitle>
            <CardDescription>
              Track key laboratory values over time for early detection of health issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockHistoricalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ALT" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="BUN" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="CREA" stroke="#ffc658" strokeWidth={2} />
                <Line type="monotone" dataKey="WBC" stroke="#ff7300" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Test Volume Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Test Volume by Type</CardTitle>
            <CardDescription>
              Monthly breakdown of laboratory test requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={testVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="CBC" fill="#8884d8" />
                <Bar dataKey="Chemistry" fill="#82ca9d" />
                <Bar dataKey="Urinalysis" fill="#ffc658" />
                <Bar dataKey="Radiology" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Current Values Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Current Lab Values</CardTitle>
            <CardDescription>
              Latest results with trend indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(normalRanges).map(([testName, range]) => {
                const currentValue = mockHistoricalData[mockHistoricalData.length - 1][testName as keyof typeof mockHistoricalData[0]] as number;
                const previousValue = mockHistoricalData[mockHistoricalData.length - 2][testName as keyof typeof mockHistoricalData[0]] as number;
                const status = getValueStatus(currentValue, testName);
                
                return (
                  <div key={testName} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">{testName}</div>
                        <div className="text-sm text-muted-foreground">
                          Normal: {range.min}-{range.max} {range.unit}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(status)}>
                        {status}
                      </Badge>
                      <div className="text-right">
                        <div className="font-medium">
                          {currentValue} {range.unit}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          {getTrendIcon(currentValue, previousValue)}
                          <span className="text-muted-foreground">
                            vs {previousValue}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lab Orders Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lab Activity</CardTitle>
          <CardDescription>
            Summary of recent laboratory orders and completion rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-sm text-muted-foreground">Total Orders (30 days)</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {Math.round((completedOrders.length / orders.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {Math.round(orders.reduce((acc, order) => {
                  const orderDate = new Date(order.orderDate);
                  const now = new Date();
                  return acc + (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
                }, 0) / orders.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg. Turnaround (days)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
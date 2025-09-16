import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pill, Droplets, Utensils, Scissors, FlaskConical } from "lucide-react";

interface HospitalizationRecord {
  id: string;
  patientName: string;
  petName: string;
}

interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  route: string;
  type: "scheduled" | "prn";
  startDate: string;
  endDate?: string;
  status: "active" | "completed" | "discontinued";
}

interface IVFluid {
  id: string;
  type: string;
  rate: string;
  additives: string[];
  startTime: string;
  duration: string;
  status: "running" | "completed" | "discontinued";
}

interface Procedure {
  id: string;
  name: string;
  frequency: string;
  instructions: string;
  assignedTo: string;
  nextDue: string;
  status: "pending" | "completed" | "overdue";
}

interface LabTest {
  id: string;
  testName: string;
  scheduledDate: string;
  scheduledTime: string;
  orderedBy: string;
  priority: "routine" | "urgent" | "stat";
  status: "ordered" | "collected" | "processing" | "completed";
}

interface ClinicalOrdersProps {
  record: HospitalizationRecord;
}

export function ClinicalOrders({ record }: ClinicalOrdersProps) {
  const [medications] = useState<Medication[]>([
    {
      id: "M001",
      name: "Tramadol",
      dose: "2mg/kg",
      frequency: "Q8H",
      route: "PO",
      type: "scheduled",
      startDate: "2024-01-20",
      status: "active"
    },
    {
      id: "M002",
      name: "Buprenorphine",
      dose: "0.02mg/kg",
      frequency: "PRN",
      route: "IM",
      type: "prn",
      startDate: "2024-01-20",
      status: "active"
    }
  ]);

  const [ivFluids] = useState<IVFluid[]>([
    {
      id: "IV001",
      type: "LRS",
      rate: "5ml/kg/hr",
      additives: ["KCl 20mEq/L"],
      startTime: "2024-01-20 14:30",
      duration: "24 hours",
      status: "running"
    }
  ]);

  const [procedures] = useState<Procedure[]>([
    {
      id: "P001",
      name: "Wound care - surgical site",
      frequency: "Q8H",
      instructions: "Clean with saline, apply antibiotic ointment, redress",
      assignedTo: "Nursing staff",
      nextDue: "2024-01-21 06:00",
      status: "pending"
    }
  ]);

  const [labTests] = useState<LabTest[]>([
    {
      id: "L001",
      testName: "CBC with differential",
      scheduledDate: "2024-01-21",
      scheduledTime: "08:00",
      orderedBy: "Dr. Smith",
      priority: "routine",
      status: "ordered"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "running":
      case "pending":
      case "ordered":
        return "bg-info/10 text-info border-info/20";
      case "completed":
        return "bg-success/10 text-success border-success/20";
      case "discontinued":
      case "overdue":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "urgent":
        return "bg-warning/10 text-warning border-warning/20";
      case "stat":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <Tabs defaultValue="medications" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="medications">Medications</TabsTrigger>
        <TabsTrigger value="iv-fluids">IV Fluids</TabsTrigger>
        <TabsTrigger value="procedures">Procedures</TabsTrigger>
        <TabsTrigger value="lab-tests">Lab Tests</TabsTrigger>
      </TabsList>

      <TabsContent value="medications">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medications
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell>{med.dose}</TableCell>
                    <TableCell>{med.frequency}</TableCell>
                    <TableCell>{med.route}</TableCell>
                    <TableCell>
                      <Badge variant={med.type === "scheduled" ? "default" : "outline"}>
                        {med.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(med.status)}>
                        {med.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="iv-fluids">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                IV Fluids
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add IV Fluid
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fluid Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Additives</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ivFluids.map((fluid) => (
                  <TableRow key={fluid.id}>
                    <TableCell className="font-medium">{fluid.type}</TableCell>
                    <TableCell>{fluid.rate}</TableCell>
                    <TableCell>{fluid.additives.join(", ")}</TableCell>
                    <TableCell>{new Date(fluid.startTime).toLocaleString()}</TableCell>
                    <TableCell>{fluid.duration}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(fluid.status)}>
                        {fluid.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="procedures">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Procedures & Care Instructions
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Procedure
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedures.map((procedure) => (
                  <TableRow key={procedure.id}>
                    <TableCell className="font-medium">{procedure.name}</TableCell>
                    <TableCell>{procedure.frequency}</TableCell>
                    <TableCell className="max-w-xs truncate">{procedure.instructions}</TableCell>
                    <TableCell>{procedure.assignedTo}</TableCell>
                    <TableCell>{new Date(procedure.nextDue).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(procedure.status)}>
                        {procedure.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="lab-tests">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Scheduled Lab Tests
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Order Lab Test
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Scheduled Time</TableHead>
                  <TableHead>Ordered By</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.testName}</TableCell>
                    <TableCell>{new Date(test.scheduledDate).toLocaleDateString()}</TableCell>
                    <TableCell>{test.scheduledTime}</TableCell>
                    <TableCell>{test.orderedBy}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(test.priority)}>
                        {test.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
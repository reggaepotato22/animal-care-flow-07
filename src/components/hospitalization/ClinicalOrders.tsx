import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pill, Droplets, Utensils, Scissors, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([
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

  const [ivFluids, setIvFluids] = useState<IVFluid[]>([
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

  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: "",
    dose: "",
    frequency: "",
    route: "",
    type: "scheduled" as "scheduled" | "prn",
    status: "active" as "active" | "completed" | "discontinued"
  });

  const [isAddIVFluidOpen, setIsAddIVFluidOpen] = useState(false);
  const [newIVFluid, setNewIVFluid] = useState({
    type: "",
    rate: "",
    additives: "",
    duration: "",
    status: "running" as "running" | "completed" | "discontinued"
  });

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dose || !newMedication.frequency || !newMedication.route) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const medication: Medication = {
      id: `M${String(medications.length + 1).padStart(3, '0')}`,
      ...newMedication,
      startDate: new Date().toISOString().split('T')[0]
    };

    setMedications([...medications, medication]);
    setNewMedication({
      name: "",
      dose: "",
      frequency: "",
      route: "",
      type: "scheduled",
      status: "active"
    });
    setIsAddMedicationOpen(false);
    toast({
      title: "Medication added",
      description: `${medication.name} has been added successfully.`
    });
  };

  const handleAddIVFluid = () => {
    if (!newIVFluid.type || !newIVFluid.rate || !newIVFluid.duration) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const ivFluid: IVFluid = {
      id: `IV${String(ivFluids.length + 1).padStart(3, '0')}`,
      type: newIVFluid.type,
      rate: newIVFluid.rate,
      additives: newIVFluid.additives ? newIVFluid.additives.split(',').map(a => a.trim()) : [],
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      duration: newIVFluid.duration,
      status: newIVFluid.status
    };

    setIvFluids([...ivFluids, ivFluid]);
    setNewIVFluid({
      type: "",
      rate: "",
      additives: "",
      duration: "",
      status: "running"
    });
    setIsAddIVFluidOpen(false);
    toast({
      title: "IV fluid added",
      description: `${ivFluid.type} has been added successfully.`
    });
  };

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
              <Dialog open={isAddMedicationOpen} onOpenChange={setIsAddMedicationOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Medication</DialogTitle>
                    <DialogDescription>
                      Add a new medication order for {record.petName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="med-name">Medication Name *</Label>
                      <Input
                        id="med-name"
                        value={newMedication.name}
                        onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                        placeholder="e.g., Amoxicillin"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="dose">Dose *</Label>
                        <Input
                          id="dose"
                          value={newMedication.dose}
                          onChange={(e) => setNewMedication({...newMedication, dose: e.target.value})}
                          placeholder="e.g., 10mg/kg"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="frequency">Frequency *</Label>
                        <Input
                          id="frequency"
                          value={newMedication.frequency}
                          onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                          placeholder="e.g., Q8H, BID"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="route">Route *</Label>
                        <Input
                          id="route"
                          value={newMedication.route}
                          onChange={(e) => setNewMedication({...newMedication, route: e.target.value})}
                          placeholder="e.g., PO, IV, IM"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={newMedication.type} onValueChange={(value: "scheduled" | "prn") => setNewMedication({...newMedication, type: value})}>
                          <SelectTrigger id="type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="prn">PRN</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddMedicationOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMedication}>Add Medication</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
              <Dialog open={isAddIVFluidOpen} onOpenChange={setIsAddIVFluidOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add IV Fluid
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add IV Fluid</DialogTitle>
                    <DialogDescription>
                      Add a new IV fluid order for {record.petName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fluid-type">Fluid Type *</Label>
                      <Input
                        id="fluid-type"
                        value={newIVFluid.type}
                        onChange={(e) => setNewIVFluid({...newIVFluid, type: e.target.value})}
                        placeholder="e.g., LRS, 0.9% NaCl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="rate">Rate *</Label>
                        <Input
                          id="rate"
                          value={newIVFluid.rate}
                          onChange={(e) => setNewIVFluid({...newIVFluid, rate: e.target.value})}
                          placeholder="e.g., 5ml/kg/hr"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Duration *</Label>
                        <Input
                          id="duration"
                          value={newIVFluid.duration}
                          onChange={(e) => setNewIVFluid({...newIVFluid, duration: e.target.value})}
                          placeholder="e.g., 24 hours"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="additives">Additives (comma-separated)</Label>
                      <Input
                        id="additives"
                        value={newIVFluid.additives}
                        onChange={(e) => setNewIVFluid({...newIVFluid, additives: e.target.value})}
                        placeholder="e.g., KCl 20mEq/L, Vitamin B"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="iv-status">Status</Label>
                      <Select value={newIVFluid.status} onValueChange={(value: "running" | "completed" | "discontinued") => setNewIVFluid({...newIVFluid, status: value})}>
                        <SelectTrigger id="iv-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="running">Running</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="discontinued">Discontinued</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddIVFluidOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddIVFluid}>Add IV Fluid</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Upload, X, Flag, FileText, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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

// Mock lab test templates
const labTestTemplates = {
  "CBC": {
    parameters: ["WBC", "RBC", "HGB", "HCT", "PLT", "NEUT", "LYMPH", "MONO"],
    units: { WBC: "K/uL", RBC: "M/uL", HGB: "g/dL", HCT: "%", PLT: "K/uL", NEUT: "%", LYMPH: "%", MONO: "%" },
    normalRanges: {
      WBC: "6.0-17.0", RBC: "5.5-8.5", HGB: "12.0-18.0", HCT: "37-55",
      PLT: "200-500", NEUT: "60-77", LYMPH: "12-30", MONO: "3-10"
    }
  },
  "Chemistry Panel": {
    parameters: ["ALT", "AST", "BUN", "CREA", "GLU", "TP", "ALB", "ALKP"],
    units: { ALT: "U/L", AST: "U/L", BUN: "mg/dL", CREA: "mg/dL", GLU: "mg/dL", TP: "g/dL", ALB: "g/dL", ALKP: "U/L" },
    normalRanges: {
      ALT: "10-100", AST: "23-66", BUN: "7-27", CREA: "0.5-1.8",
      GLU: "74-143", TP: "5.2-8.2", ALB: "2.3-4.0", ALKP: "23-212"
    }
  },
  "Urinalysis": {
    parameters: ["Color", "Clarity", "SG", "pH", "Protein", "Glucose", "Ketones", "Blood"],
    units: { Color: "", Clarity: "", SG: "", pH: "", Protein: "mg/dL", Glucose: "mg/dL", Ketones: "mg/dL", Blood: "" },
    normalRanges: {
      Color: "Yellow", Clarity: "Clear", SG: "1.015-1.045", pH: "5.0-7.0",
      Protein: "Negative", Glucose: "Negative", Ketones: "Negative", Blood: "Negative"
    }
  }
};

// Mock orders data - in a real app this would come from an API
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
    status: "in-progress",
    diagnosis: "Annual wellness examination",
    collectedDate: "2024-03-10",
    collectedBy: "Tech Sarah",
    sampleType: "Blood, Urine"
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
    status: "collected",
    diagnosis: "Gastrointestinal upset",
    collectedDate: "2024-03-12",
    collectedBy: "Tech Mike",
    sampleType: "Fecal sample, Blood"
  }
];

export default function AddLabResults() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [interpretation, setInterpretation] = useState("");
  const [abnormalFlags, setAbnormalFlags] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    // In a real app, this would fetch the order from an API
    const foundOrder = mockLabOrders.find(o => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    }
  }, [orderId]);

  const handleValueChange = (testName: string, parameter: string, value: string) => {
    const key = `${testName}_${parameter}`;
    setResults(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFlagChange = (testName: string, parameter: string, flag: string) => {
    const key = `${testName}_${parameter}`;
    setAbnormalFlags(prev => ({
      ...prev,
      [key]: flag
    }));
  };

  const handleSaveResults = () => {
    if (!order) return;

    const resultsData = {
      orderId: order.id,
      resultDate: new Date().toISOString().split('T')[0],
      results,
      interpretation,
      abnormalFlags,
      attachments: attachments.map(f => f.name)
    };

    console.log('Saving results:', resultsData);
    toast.success("Lab results saved successfully!");
    navigate('/labs');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/labs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Labs
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Lab order not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/labs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Labs
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Lab Results</h1>
            <p className="text-muted-foreground">
              Enter results for lab order {order.id}
            </p>
          </div>
        </div>
        <Button onClick={handleSaveResults}>
          <Save className="mr-2 h-4 w-4" />
          Save Results
        </Button>
      </div>

      {/* Order Information */}
      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Patient</Label>
              <p className="text-sm">{order.patientName} ({order.species} - {order.breed})</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Veterinarian</Label>
              <p className="text-sm">{order.veterinarian}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Order Date</Label>
              <p className="text-sm">{order.orderDate}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Sample Type</Label>
              <p className="text-sm">{order.sampleType}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Diagnosis</Label>
              <p className="text-sm">{order.diagnosis}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Tests</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {order.tests.map((test, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {test}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Results</CardTitle>
          <CardDescription>
            Enter test results and mark any abnormal findings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="results" className="space-y-4">
            <TabsList>
              <TabsTrigger value="results">Test Results</TabsTrigger>
              <TabsTrigger value="interpretation">Interpretation</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-6">
              {order.tests.map((testName) => {
                const template = labTestTemplates[testName as keyof typeof labTestTemplates];
                
                return (
                  <div key={testName} className="space-y-4">
                    <h3 className="text-lg font-semibold">{testName}</h3>
                    
                    {template ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {template.parameters.map((parameter) => {
                          const key = `${testName}_${parameter}`;
                          const unit = template.units[parameter as keyof typeof template.units];
                          const normalRange = template.normalRanges[parameter as keyof typeof template.normalRanges];
                          
                          return (
                            <div key={parameter} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={key} className="text-sm font-medium">
                                  {parameter} {unit && `(${unit})`}
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={abnormalFlags[key] || ""}
                                    onValueChange={(value) => handleFlagChange(testName, parameter, value)}
                                  >
                                    <SelectTrigger className="w-24 h-8">
                                      <SelectValue placeholder="Flag" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Normal</SelectItem>
                                      <SelectItem value="H">High</SelectItem>
                                      <SelectItem value="L">Low</SelectItem>
                                      <SelectItem value="C">Critical</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {abnormalFlags[key] && (
                                    <Flag className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                              </div>
                              <Input
                                id={key}
                                value={results[key] || ""}
                                onChange={(e) => handleValueChange(testName, parameter, e.target.value)}
                                placeholder={`Normal: ${normalRange}`}
                                className="text-sm"
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Textarea
                        value={results[testName] || ""}
                        onChange={(e) => setResults(prev => ({ ...prev, [testName]: e.target.value }))}
                        placeholder="Enter test results..."
                        className="min-h-[100px]"
                      />
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="interpretation" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interpretation">Clinical Interpretation</Label>
                <Textarea
                  id="interpretation"
                  value={interpretation}
                  onChange={(e) => setInterpretation(e.target.value)}
                  placeholder="Enter clinical interpretation and notes..."
                  className="min-h-[200px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Upload Attachments</Label>
                  <div className="mt-2">
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Attached Files</Label>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
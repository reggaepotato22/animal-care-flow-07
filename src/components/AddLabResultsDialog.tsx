import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Save, Upload, AlertTriangle } from "lucide-react";
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

interface AddLabResultsDialogProps {
  order: LabOrder;
  onResultsAdded: (orderId: string, results: any) => void;
  children: React.ReactNode;
}

// Common lab test templates
const labTestTemplates = {
  "CBC": {
    "WBC": { unit: "K/μL", range: "5.0-16.0" },
    "RBC": { unit: "M/μL", range: "5.5-8.5" },
    "HGB": { unit: "g/dL", range: "12.0-18.0" },
    "HCT": { unit: "%", range: "37-55" },
    "PLT": { unit: "K/μL", range: "200-500" }
  },
  "Chemistry Panel": {
    "ALT": { unit: "U/L", range: "10-125" },
    "AST": { unit: "U/L", range: "0-50" },
    "BUN": { unit: "mg/dL", range: "7-27" },
    "CREA": { unit: "mg/dL", range: "0.5-1.8" },
    "GLU": { unit: "mg/dL", range: "74-143" },
    "CHOL": { unit: "mg/dL", range: "110-320" }
  },
  "Urinalysis": {
    "Specific Gravity": { unit: "", range: "1.001-1.065" },
    "pH": { unit: "", range: "5.0-8.5" },
    "Protein": { unit: "", range: "Negative-Trace" },
    "Glucose": { unit: "", range: "Negative" },
    "Ketones": { unit: "", range: "Negative" },
    "Blood": { unit: "", range: "Negative" }
  }
};

export function AddLabResultsDialog({ order, onResultsAdded, children }: AddLabResultsDialogProps) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [interpretation, setInterpretation] = useState("");
  const [abnormalFlags, setAbnormalFlags] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleValueChange = (testName: string, parameter: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [testName]: {
        ...prev[testName],
        [parameter]: value
      }
    }));
  };

  const handleFlagChange = (testName: string, parameter: string, flag: string) => {
    const key = `${testName}_${parameter}`;
    setAbnormalFlags(prev => ({
      ...prev,
      [key]: flag
    }));
  };

  const getParameterFlag = (testName: string, parameter: string) => {
    const key = `${testName}_${parameter}`;
    return abnormalFlags[key] || "normal";
  };

  const handleSaveResults = () => {
    const resultData = {
      results,
      interpretation,
      abnormalFlags,
      resultDate: new Date().toISOString().split('T')[0],
      enteredBy: "Current User", // In a real app, this would be the logged-in user
      attachments: attachments.map(f => f.name)
    };

    onResultsAdded(order.id, resultData);
    toast.success(`Lab results saved for order ${order.id}`);
    setOpen(false);
    
    // Reset form
    setResults({});
    setInterpretation("");
    setAbnormalFlags({});
    setAttachments([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Lab Results - {order.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Patient:</span> {order.patientName}
                </div>
                <div>
                  <span className="font-medium">Order Date:</span> {order.orderDate}
                </div>
                <div>
                  <span className="font-medium">Veterinarian:</span> {order.veterinarian}
                </div>
                <div>
                  <span className="font-medium">Sample Type:</span> {order.sampleType}
                </div>
              </div>
              <div className="mt-3">
                <span className="font-medium">Tests:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {order.tests.map((test, index) => (
                    <Badge key={index} variant="outline">{test}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="results" className="space-y-4">
            <TabsList>
              <TabsTrigger value="results">Test Results</TabsTrigger>
              <TabsTrigger value="interpretation">Interpretation</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              {order.tests.map(testName => {
                const template = labTestTemplates[testName as keyof typeof labTestTemplates];
                
                return (
                  <Card key={testName}>
                    <CardHeader>
                      <CardTitle className="text-lg">{testName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {template ? (
                        <div className="grid gap-4">
                          {Object.entries(template).map(([parameter, info]) => (
                            <div key={parameter} className="grid grid-cols-5 gap-3 items-center">
                              <Label className="font-medium">{parameter}</Label>
                              <Input
                                placeholder="Value"
                                value={results[testName]?.[parameter] || ""}
                                onChange={(e) => handleValueChange(testName, parameter, e.target.value)}
                              />
                              <div className="text-sm text-muted-foreground">
                                {info.unit} • Range: {info.range}
                              </div>
                              <Select 
                                value={getParameterFlag(testName, parameter)}
                                onValueChange={(value) => handleFlagChange(testName, parameter, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex justify-center">
                                {getParameterFlag(testName, parameter) !== "normal" && (
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Label htmlFor={`${testName}-result`}>Result</Label>
                          <Textarea
                            id={`${testName}-result`}
                            placeholder="Enter test results..."
                            value={results[testName]?.result || ""}
                            onChange={(e) => handleValueChange(testName, "result", e.target.value)}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="interpretation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Interpretation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Label htmlFor="interpretation">Veterinarian's Interpretation</Label>
                    <Textarea
                      id="interpretation"
                      placeholder="Enter clinical interpretation, notes, and recommendations..."
                      value={interpretation}
                      onChange={(e) => setInterpretation(e.target.value)}
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">Upload Files</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Supported formats: PDF, Images, Documents
                      </p>
                    </div>

                    {attachments.length > 0 && (
                      <div>
                        <Label>Attached Files</Label>
                        <div className="space-y-2 mt-2">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveResults}>
              <Save className="mr-2 h-4 w-4" />
              Save Results
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
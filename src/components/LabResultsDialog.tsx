import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const labResultSchema = z.object({
  interpretation: z.string().optional(),
  veterinarianNotes: z.string().optional(),
});

type LabResultFormData = z.infer<typeof labResultSchema>;

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
  interpretation?: string;
  veterinarianNotes?: string;
}

interface LabResultsDialogProps {
  children?: React.ReactNode;
  order: LabOrder;
}

const normalRanges = {
  WBC: { min: 6.0, max: 17.0, unit: "10^3/μL" },
  RBC: { min: 5.5, max: 8.5, unit: "10^6/μL" },
  HGB: { min: 12.0, max: 18.0, unit: "g/dL" },
  HCT: { min: 37.0, max: 55.0, unit: "%" },
  ALT: { min: 10, max: 100, unit: "U/L" },
  BUN: { min: 7, max: 27, unit: "mg/dL" },
  CREA: { min: 0.5, max: 1.8, unit: "mg/dL" },
  GLU: { min: 70, max: 143, unit: "mg/dL" },
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
    case "low": return "text-blue-600 dark:text-blue-400";
    case "high": return "text-red-600 dark:text-red-400";
    case "normal": return "text-green-600 dark:text-green-400";
    default: return "text-muted-foreground";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "low":
    case "high":
      return <AlertTriangle className="h-4 w-4" />;
    case "normal":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return null;
  }
};

export function LabResultsDialog({ children, order }: LabResultsDialogProps) {
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const form = useForm<LabResultFormData>({
    resolver: zodResolver(labResultSchema),
    defaultValues: {
      interpretation: order.interpretation || "",
      veterinarianNotes: order.veterinarianNotes || "",
    },
  });

  const onSubmit = (data: LabResultFormData) => {
    console.log("Lab result interpretation:", data);
    toast.success("Lab result interpretation saved!");
    setOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) uploaded`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lab Results - {order.patientName} (Order {order.id})</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Patient:</span> {order.patientName}
                </div>
                <div>
                  <span className="font-medium">Species:</span> {order.species}
                </div>
                <div>
                  <span className="font-medium">Order Date:</span> {order.orderDate}
                </div>
                <div>
                  <span className="font-medium">Veterinarian:</span> {order.veterinarian}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Tests:</span> {order.tests.join(", ")}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Diagnosis:</span> {order.diagnosis}
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

            <TabsContent value="results">
              {order.results ? (
                <div className="space-y-4">
                  {/* CBC Results */}
                  {order.results.CBC && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Complete Blood Count (CBC)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Test</TableHead>
                              <TableHead>Result</TableHead>
                              <TableHead>Reference Range</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(order.results.CBC).map(([test, value]) => {
                              const numValue = parseFloat(value as string);
                              const status = getValueStatus(numValue, test);
                              const range = normalRanges[test as keyof typeof normalRanges];
                              
                              return (
                                <TableRow key={test}>
                                  <TableCell className="font-medium">{test}</TableCell>
                                  <TableCell>{value as string} {range?.unit}</TableCell>
                                  <TableCell>
                                    {range ? `${range.min} - ${range.max} ${range.unit}` : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <div className={`flex items-center gap-2 ${getStatusColor(status)}`}>
                                      {getStatusIcon(status)}
                                      <span className="capitalize">{status}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Chemistry Results */}
                  {order.results.Chemistry && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Chemistry Panel</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Test</TableHead>
                              <TableHead>Result</TableHead>
                              <TableHead>Reference Range</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(order.results.Chemistry).map(([test, value]) => {
                              const numValue = parseFloat(value as string);
                              const status = getValueStatus(numValue, test);
                              const range = normalRanges[test as keyof typeof normalRanges];
                              
                              return (
                                <TableRow key={test}>
                                  <TableCell className="font-medium">{test}</TableCell>
                                  <TableCell>{value as string} {range?.unit}</TableCell>
                                  <TableCell>
                                    {range ? `${range.min} - ${range.max} ${range.unit}` : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <div className={`flex items-center gap-2 ${getStatusColor(status)}`}>
                                      {getStatusIcon(status)}
                                      <span className="capitalize">{status}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No results available yet</p>
                    <Button className="mt-4" variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Results
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="interpretation">
              <Card>
                <CardHeader>
                  <CardTitle>Veterinarian Interpretation</CardTitle>
                  <CardDescription>
                    Add your interpretation and notes for these results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="interpretation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clinical Interpretation</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your interpretation of the results..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="veterinarianNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any additional notes or follow-up recommendations..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button type="submit">Save Interpretation</Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments">
              <Card>
                <CardHeader>
                  <CardTitle>Result Attachments</CardTitle>
                  <CardDescription>
                    Upload PDF reports, images, or other files related to this lab order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.tiff"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload files or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, JPG, PNG, TIFF up to 10MB each
                        </p>
                      </label>
                    </div>

                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Uploaded Files:</h4>
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{file.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </Badge>
                            </div>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
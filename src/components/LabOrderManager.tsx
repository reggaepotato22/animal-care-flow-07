import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Microscope, Plus, Send, Copy, Check, X, FileText, Clock,
  ExternalLink, Trash2, Eye, AlertTriangle, Zap, FlaskConical,
  Activity, Bone, Stethoscope, Mail, CheckCircle, Home, Building2, Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  saveLabOrder, loadLabOrders, deleteLabOrder, generateLabUploadToken,
  generateLabUploadEmailTemplate, type LabOrder, subscribeToLabOrders,
  loadAttachments, type Attachment,
} from "@/lib/attachmentStore";
import {
  getDefaultEmailTemplate, getEmailTemplatesByType, processTemplate,
  type EmailTemplate,
} from "@/lib/communicationsStore";
import { FileViewer, FileList } from "@/components/FileViewer";
import { format } from "date-fns";

interface LabOrderManagerProps {
  patientId: string;
  patientName: string;
  createdBy: string;
  encounterId?: string;
}

const TEST_TYPES = [
  { value: "bloodwork", label: "Bloodwork", icon: FlaskConical },
  { value: "imaging", label: "Imaging", icon: Activity },
  { value: "pathology", label: "Pathology", icon: Microscope },
  { value: "cytology", label: "Cytology", icon: Bone },
  { value: "other", label: "Other", icon: FileText },
] as const;

const COMMON_TESTS = {
  bloodwork: [
    "CBC (Complete Blood Count)",
    "Chemistry Panel", 
    "Thyroid Panel",
    "Heartworm Test",
    "FeLV/FIV Test",
    "Liver Function Tests",
    "Kidney Function Tests",
    "Electrolyte Panel",
  ],
  imaging: [
    "X-Ray (Chest)",
    "X-Ray (Abdomen)", 
    "X-Ray (Extremities)",
    "Ultrasound (Abdomen)",
    "Ultrasound (Heart)",
    "CT Scan",
    "MRI",
  ],
  pathology: [
    "Histopathology",
    "Biopsy Analysis", 
    "Cytology",
    "Fine Needle Aspirate",
  ],
  cytology: [
    "Fine Needle Aspirate",
    "Impression Smear",
    "Fluid Analysis",
    "Urinalysis",
  ],
  other: [
    "Allergy Testing",
    "DNA Testing",
    "PCR Test",
    "Culture & Sensitivity",
  ],
};

const TEST_CODES: Record<string, string> = {
  "CBC (Complete Blood Count)": "CBC001",
  "Chemistry Panel": "CHEM001", 
  "Thyroid Panel": "THY001",
  "Heartworm Test": "HW001",
  "FeLV/FIV Test": "FIV001",
  "Liver Function Tests": "LIV001",
  "Kidney Function Tests": "KID001",
  "Electrolyte Panel": "ELE001",
  "X-Ray (Chest)": "XRC001",
  "X-Ray (Abdomen)": "XRA001", 
  "X-Ray (Extremities)": "XRE001",
  "Ultrasound (Abdomen)": "USA001",
  "Ultrasound (Heart)": "USH001",
  "CT Scan": "CT001",
  "MRI": "MRI001",
  "Histopathology": "HIS001",
  "Biopsy Analysis": "BIO001", 
  "Cytology": "CYT001",
  "Fine Needle Aspirate": "FNA001",
  "Impression Smear": "IMP001",
  "Fluid Analysis": "FLU001",
  "Urinalysis": "URI001",
  "Allergy Testing": "ALL001",
  "DNA Testing": "DNA001",
  "PCR Test": "PCR001",
  "Culture & Sensitivity": "CUL001",
};

export function LabOrderManager({ patientId, patientName, createdBy, encounterId }: LabOrderManagerProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState("");
  const [emailPreview, setEmailPreview] = useState<{ subject: string; html: string } | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [patientAttachments, setPatientAttachments] = useState<Attachment[]>([]);
  const [labFilter, setLabFilter] = useState<"all" | "internal" | "external">("all");

  // Form state
  const [testName, setTestName] = useState("");
  const [testType, setTestType] = useState<"bloodwork" | "imaging" | "pathology" | "cytology" | "other">("bloodwork");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [labName, setLabName] = useState("");
  const [notes, setNotes] = useState("");
  const [species, setSpecies] = useState("Dog");

  // Generate case ID
  const generateCaseId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `VET-${year}-${random}`;
  };

  // Load lab orders and email templates
  useEffect(() => {
    setLabOrders(loadLabOrders(patientId));
    
    // Load relevant email templates
    const templates = getEmailTemplatesByType("lab_request");
    const defaultTemplate = getDefaultEmailTemplate();
    if (defaultTemplate && !templates.find(t => t.id === defaultTemplate.id)) {
      templates.unshift(defaultTemplate);
    }
    setAvailableTemplates(templates);
    
    if (templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
    
    // Load patient attachments
    setPatientAttachments(loadAttachments(patientId));
  }, [patientId]);

  // Subscribe to updates
  useEffect(() => {
    const unsub = subscribeToLabOrders(() => {
      setLabOrders(loadLabOrders(patientId));
    });
    return unsub;
  }, [patientId]);

  const handleCreateOrder = () => {
    if (!testName.trim() || !labName.trim()) {
      toast({ title: "Missing Information", description: "Please fill in all required fields." });
      return;
    }

    const order: LabOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      patientId,
      patientName,
      encounterId,
      testName: testName.trim(),
      testCode: TEST_CODES[testName] || undefined,
      testType,
      orderedBy: createdBy,
      orderedAt: new Date().toISOString(),
      status: "pending",
      urgency,
      labName: labName.trim(),
      notes: notes.trim(),
      species,
      caseId: generateCaseId(),
    };

    saveLabOrder(order);
    
    // Generate upload token
    const { token } = generateLabUploadToken(order.id);
    const uploadUrl = `${window.location.origin}/external-upload?token=${token}`;
    setLastGeneratedUrl(uploadUrl);

    // Generate email preview using selected template
    const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId);
    let emailTemplate;
    
    if (selectedTemplate) {
      // Process template with variables
      const variables = {
        patient_name: order.patientName,
        patient_id: order.patientId,
        case_id: order.caseId,
        test_type: order.testType,
        test_name: order.testName,
        species: order.species,
        urgency: order.urgency,
        clinic_name: "Veti-Vision Animal Care",
        upload_url: uploadUrl,
        primary_color: "#0d9488",
        secondary_color: "#065f46",
      };
      
      const processed = processTemplate(selectedTemplate, variables);
      emailTemplate = {
        subject: processed.subject,
        html: processed.htmlBody,
      };
    } else {
      // Fallback to default template
      emailTemplate = generateLabUploadEmailTemplate(order, uploadUrl, "Veti-Vision Animal Care", createdBy);
    }
    
    setEmailPreview(emailTemplate);

    toast({
      title: "Lab Order Created",
      description: `Secure upload link generated for ${testName}`,
    });

    setIsCreateOpen(false);
    setIsEmailPreviewOpen(true);
    
    // Reset form
    setTestName("");
    setTestType("bloodwork");
    setUrgency("routine");
    setLabName("");
    setNotes("");
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  const copyEmailHtml = () => {
    if (emailPreview?.html) {
      navigator.clipboard.writeText(emailPreview.html);
      toast({ title: "Email HTML copied to clipboard" });
    }
  };

  const openEmailClient = () => {
    if (lastGeneratedUrl && emailPreview) {
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailPreview.subject)}&body=${encodeURIComponent(`Secure upload link: ${lastGeneratedUrl}`)}`;
      window.open(mailtoUrl, "_blank");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "stat": return <Zap className="h-3 w-3" />;
      case "urgent": return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getTestTypeIcon = (type: string) => {
    const testType = TEST_TYPES.find(t => t.value === type);
    return testType ? <testType.icon className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  return (
    <div 
      className="space-y-6 pointer-events-auto bg-white dark:bg-gray-950 rounded-lg border p-4"
      onClick={(e) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between isolate">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Microscope className="h-5 w-5 text-teal-600" />
            Lab Orders
          </h3>
          <p className="text-sm text-muted-foreground">Manage diagnostic test orders and secure result uploads</p>
        </div>
        <div className="relative z-50">
          <Button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/generate-link?patientId=${encodeURIComponent(patientId)}&patientName=${encodeURIComponent(patientName)}&category=lab&recipientType=lab`);
          }}
          className="relative"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Lab Order
        </Button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {(["all", "internal", "external"] as const).map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={labFilter === filter ? "default" : "outline"}
              onClick={() => setLabFilter(filter)}
              className="text-xs h-7 px-3"
            >
              {filter === "internal" && <Home className="h-3 w-3 mr-1" />}
              {filter === "external" && <Building2 className="h-3 w-3 mr-1" />}
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">
                {filter === "all" 
                  ? labOrders.length 
                  : labOrders.filter(o => (o.labDestination || "external") === filter).length}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Lab Orders List */}
      <div className="space-y-3">
        {labOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
            <Microscope className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No lab orders yet</p>
            <p className="text-xs mt-1">Create a lab order to generate secure upload links for external labs</p>
          </div>
        ) : (
          labOrders
            .filter(order => labFilter === "all" || (order.labDestination || "external") === labFilter)
            .map((order) => {
              const isInternal = (order.labDestination || "external") === "internal";
              return (
                <div key={order.id} className={`border rounded-lg p-4 space-y-3 ${isInternal ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-teal-500"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Internal/External Icon */}
                        {isInternal ? (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300" title="Internal Lab">
                            <Home className="h-3 w-3" />
                            <span className="text-[10px] font-semibold uppercase">INT</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 rounded text-teal-700 dark:text-teal-300" title="External Lab">
                            <Building2 className="h-3 w-3" />
                            <span className="text-[10px] font-semibold uppercase">EXT</span>
                          </div>
                        )}
                        {getTestTypeIcon(order.testType)}
                        <span className="font-medium">{order.testName}</span>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getUrgencyIcon(order.urgency)}
                          <span>{order.urgency}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>Lab: {order.labName || (isInternal ? "In-House" : "N/A")}</span>
                        <span>Case ID: #{order.caseId}</span>
                        <span>Ordered: {format(new Date(order.orderedAt), "MMM d, yyyy")}</span>
                        <span>Species: {order.species}</span>
                      </div>
                      {order.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">"{order.notes}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {order.uploadToken && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = `${window.location.origin}/external-upload?token=${order.uploadToken}`;
                            copyLink(url);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteLabOrder(order.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Recent Lab Results */}
      {patientAttachments.filter(a => a.category === "lab" || a.labOrderId).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Recent Lab Results
          </h4>
          <FileList
            attachments={patientAttachments.filter(a => a.category === "lab" || a.labOrderId)}
            patientName={patientName}
            onFileClick={(attachment) => {
              setSelectedAttachment(attachment);
              setIsFileViewerOpen(true);
            }}
          />
        </div>
      )}

      {/* Create Lab Order Dialog */}
      {isCreateOpen && (
        <Dialog 
          open={true} 
          onOpenChange={() => setIsCreateOpen(false)}
        >
          <DialogContent 
            className="sm:max-w-[600px] max-h-[90vh] !z-[9999] !bg-white dark:!bg-gray-950 border-4 border-teal-600 shadow-2xl"
            onPointerDownOutside={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onInteractOutside={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Microscope className="h-6 w-6 text-teal-600" />
              Create Lab Order
            </DialogTitle>
            <DialogDescription>
              Generate a secure upload link for diagnostic results for <strong>{patientName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Patient Info */}
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-medium">{patientName}</span>
                <span className="text-muted-foreground">Patient ID:</span>
                <span className="font-medium">{patientId}</span>
              </div>
            </div>

            {/* Test Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Test Type</Label>
              <Select value={testType} onValueChange={(value: any) => setTestType(value)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Test Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Specific Test</Label>
              <Select value={testName} onValueChange={setTestName}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select or type a test..." />
                </SelectTrigger>
                <SelectContent>
                  {(COMMON_TESTS[testType] || []).map((test) => (
                    <SelectItem key={test} value={test}>
                      {test}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Or type a custom test name..."
                className="h-9 text-sm"
              />
            </div>

            {/* Lab Name and Urgency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Lab Name *</Label>
                <Input
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="e.g., IDEXX Reference Lab"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Urgency</Label>
                <Select value={urgency} onValueChange={(value: any) => setUrgency(value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">🕐 Routine</SelectItem>
                    <SelectItem value="urgent">⚠️ Urgent</SelectItem>
                    <SelectItem value="stat">⚡ STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Species */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Species</Label>
              <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">🐕 Dog</SelectItem>
                  <SelectItem value="Cat">🐈 Cat</SelectItem>
                  <SelectItem value="Bird">🦜 Bird</SelectItem>
                  <SelectItem value="Rabbit">🐰 Rabbit</SelectItem>
                  <SelectItem value="Reptile">🦎 Reptile</SelectItem>
                  <SelectItem value="Other">🐾 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Template */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select email template..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {template.name}
                        {template.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateId && (
                <p className="text-xs text-muted-foreground">
                  Template: {availableTemplates.find(t => t.id === selectedTemplateId)?.subject}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Additional Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for the lab..."
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} disabled={!testName.trim() || !labName.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Create Order & Generate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Email Preview Dialog */}
      <Dialog open={isEmailPreviewOpen} onOpenChange={setIsEmailPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Professional email template ready to send to the lab
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Email Actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => copyLink(lastGeneratedUrl)}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link
              </Button>
              <Button size="sm" onClick={copyEmailHtml}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Email HTML
              </Button>
              <Button size="sm" onClick={openEmailClient}>
                <Send className="h-3.5 w-3.5 mr-1.5" /> Open in Email Client
              </Button>
              <Button size="sm" onClick={() => {
                // Simulate sending email
                setIsSendingEmail(true);
                setTimeout(() => {
                  setIsSendingEmail(false);
                  toast({ 
                    title: "Email Sent", 
                    description: "Lab request has been sent to the lab." 
                  });
                }, 2000);
              }} disabled={isSendingEmail}>
                {isSendingEmail ? (
                  <>
                    <div className="h-3.5 w-3.5 mr-1.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Send Email
                  </>
                )}
              </Button>
            </div>

            {/* Email Preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                Email Preview
              </div>
              <ScrollArea className="h-[400px]">
                <div 
                  className="p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: emailPreview?.html || "" }}
                />
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEmailPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              copyLink(lastGeneratedUrl);
              toast({ title: "Lab order created", description: "Secure link is ready to share with the lab." });
              setIsEmailPreviewOpen(false);
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Viewer */}
      <FileViewer
        attachment={selectedAttachment}
        isOpen={isFileViewerOpen}
        onClose={() => setIsFileViewerOpen(false)}
        patientName={patientName}
      />
    </div>
  );
}

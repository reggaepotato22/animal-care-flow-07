import { useState, useEffect } from "react";
// Card imports available if needed for future layout wrapping
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
  Paperclip, Upload, Link, Mail, Copy, Check, FileText, Clock,
  ExternalLink, Trash2, Eye, FlaskConical, Microscope,
  Send, Building2, User, Stethoscope, CheckCircle2, Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  generateUploadLink,
  loadAttachments,
  loadUploadLinks,
  deleteAttachment,
  generateUploadEmailTemplate,
  formatFileSize,
  getCategoryLabel,
  getRecipientLabel,
  subscribeToAttachments,
  loadPendingLabTests,
  savePendingLabTest,
  subscribeToPendingLabs,
  COMMON_LAB_TESTS,
  type Attachment,
  type UploadLink,
  type AttachmentCategory,
  type RecipientType,
  type PendingLabTest,
} from "@/lib/attachmentStore";
import { format, isAfter } from "date-fns";

interface AttachmentManagerProps {
  patientId: string;
  patientName: string;
  createdBy: string;
  encounterId?: string;
}

export function AttachmentManager({ patientId, patientName, createdBy, encounterId }: AttachmentManagerProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadLinks, setUploadLinks] = useState<UploadLink[]>([]);
  const [pendingLabs, setPendingLabs] = useState<PendingLabTest[]>([]);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState("");
  const [emailPreviewSubject, setEmailPreviewSubject] = useState("");
  const [emailPreviewTo, setEmailPreviewTo] = useState("");
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Generate-link form state
  const [category, setCategory] = useState<AttachmentCategory>("lab");
  const [recipientType, setRecipientType] = useState<RecipientType>("lab");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [expiryHours, setExpiryHours] = useState(24);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);

  // Pending lab test quick-add
  const [isAddLabOpen, setIsAddLabOpen] = useState(false);
  const [newLabTestCode, setNewLabTestCode] = useState("");
  const [newLabNotes, setNewLabNotes] = useState("");

  // ── Refresh data ──────────────────────────────────────────────────────────
  const refreshData = () => {
    setAttachments(loadAttachments(patientId));
    setUploadLinks(loadUploadLinks(patientId));
    setPendingLabs(loadPendingLabTests(patientId));
  };

  useEffect(() => {
    refreshData();
    const unsub1 = subscribeToAttachments(refreshData);
    const unsub2 = subscribeToPendingLabs(refreshData);
    return () => { unsub1(); unsub2(); };
  }, [patientId]);

  // ── Generate upload link ──────────────────────────────────────────────────
  const handleGenerateLink = () => {
    // Auto-create pending lab tests for selected tests
    const labTestIds: string[] = [];
    if (recipientType === "lab" && selectedLabTests.length > 0) {
      for (const code of selectedLabTests) {
        const test = COMMON_LAB_TESTS.find(t => t.code === code);
        if (test) {
          const id = `lab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          savePendingLabTest({
            id,
            patientId,
            patientName,
            encounterId,
            testName: test.name,
            testCode: test.code,
            orderedBy: createdBy,
            orderedAt: new Date().toISOString(),
            status: "pending",
            labName: recipientName.trim() || undefined,
            urgency,
          });
          labTestIds.push(id);
        }
      }
    }

    const link = generateUploadLink(patientId, patientName, createdBy, category, {
      description: description.trim() || undefined,
      expiryHours,
      recipientType,
      recipientName: recipientName.trim() || undefined,
      recipientEmail: recipientEmail.trim() || undefined,
      encounterId,
      labTestIds: labTestIds.length > 0 ? labTestIds : undefined,
      urgency,
    });

    const uploadUrl = `${window.location.origin}/external-upload?token=${link.token}`;
    setLastGeneratedUrl(uploadUrl);

    const labTestNames = selectedLabTests
      .map(c => COMMON_LAB_TESTS.find(t => t.code === c)?.name)
      .filter(Boolean) as string[];

    // Generate email template
    const template = generateUploadEmailTemplate(patientName, uploadUrl, undefined, description.trim() || undefined, {
      recipientType,
      recipientName: recipientName.trim() || undefined,
      labTestNames,
      urgency,
      expiryHours,
    });

    // Store email draft
    localStorage.setItem(`acf_email_draft_${link.token}`, JSON.stringify({
      to: recipientEmail,
      ...template,
      uploadUrl,
    }));

    // Fire notification
    const recipientLabel = recipientName.trim() || getRecipientLabel(recipientType);
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: urgency === "stat" ? "critical" : urgency === "urgent" ? "warning" : "info",
        message: `${urgency === "stat" ? "[STAT] " : urgency === "urgent" ? "[URGENT] " : ""}Upload link sent to ${recipientLabel} for ${patientName} (${getCategoryLabel(category)})`,
        patientId,
        patientName,
        targetRoles: ["SuperAdmin", "Vet", "Nurse", "Receptionist"],
      },
    }));

    // Show email preview if email was provided
    if (recipientEmail.trim()) {
      setEmailPreviewHtml(template.html);
      setEmailPreviewSubject(template.subject);
      setEmailPreviewTo(recipientEmail.trim());
      setIsGenerateOpen(false);
      setIsEmailPreviewOpen(true);
    } else {
      // Copy link to clipboard
      navigator.clipboard.writeText(uploadUrl).catch(() => {});
      toast({
        title: "Upload Link Generated",
        description: `Link copied to clipboard. Share with ${recipientLabel}.`,
      });
      setIsGenerateOpen(false);
    }

    // Reset form
    resetForm();
    refreshData();
  };

  const resetForm = () => {
    setCategory("lab");
    setRecipientType("lab");
    setRecipientName("");
    setRecipientEmail("");
    setDescription("");
    setUrgency("routine");
    setExpiryHours(24);
    setSelectedLabTests([]);
  };

  // ── Quick-add pending lab test ────────────────────────────────────────────
  const handleAddPendingLab = () => {
    const test = COMMON_LAB_TESTS.find(t => t.code === newLabTestCode);
    if (!test) return;
    savePendingLabTest({
      id: `lab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      patientId,
      patientName,
      encounterId,
      testName: test.name,
      testCode: test.code,
      orderedBy: createdBy,
      orderedAt: new Date().toISOString(),
      status: "pending",
      notes: newLabNotes.trim() || undefined,
      urgency: "routine",
    });
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: "info",
        message: `Lab test ordered: ${test.name} for ${patientName}`,
        patientId,
        patientName,
        targetRoles: ["SuperAdmin", "Vet", "Nurse"],
      },
    }));
    toast({ title: "Lab Test Ordered", description: test.name });
    setNewLabTestCode("");
    setNewLabNotes("");
    setIsAddLabOpen(false);
    refreshData();
  };

  // ── Copy link to clipboard ────────────────────────────────────────────────
  const copyLink = (token: string) => {
    const url = `${window.location.origin}/external-upload?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({ title: "Link copied to clipboard" });
  };

  // ── Delete attachment ─────────────────────────────────────────────────────
  const handleDeleteAttachment = (id: string) => {
    if (confirm("Are you sure you want to delete this attachment?")) {
      deleteAttachment(id);
      window.dispatchEvent(new CustomEvent("acf:notification", {
        detail: {
          type: "warning",
          message: `Attachment deleted for ${patientName}`,
          patientId,
          patientName,
          targetRoles: ["SuperAdmin", "Vet", "Nurse"],
        },
      }));
      toast({ title: "Attachment deleted" });
      refreshData();
    }
  };

  const openLink = (token: string) => {
    window.open(`/external-upload?token=${token}`, "_blank");
  };

  // Toggle lab test selection
  const toggleLabTest = (code: string) => {
    setSelectedLabTests(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const activeLinks = uploadLinks.filter(l => !l.isUsed && isAfter(new Date(l.expiresAt), new Date()));
  const usedLinks = uploadLinks.filter(l => l.isUsed);
  const pendingLabCount = pendingLabs.filter(t => t.status === "pending" || t.status === "in_progress").length;

  // ── Urgency badge helper ──────────────────────────────────────────────────
  const urgencyBadge = (u: string) => {
    if (u === "stat") return <Badge variant="destructive" className="text-[10px] font-bold animate-pulse">STAT</Badge>;
    if (u === "urgent") return <Badge className="text-[10px] bg-amber-500 hover:bg-amber-600">URGENT</Badge>;
    return <Badge variant="outline" className="text-[10px]">Routine</Badge>;
  };

  return (
    <>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Attachments & Lab Results
          </h3>
          <p className="text-sm text-muted-foreground">
            {attachments.length} file(s) • {activeLinks.length} active link(s)
            {pendingLabCount > 0 && (
              <span className="text-amber-600 font-medium"> • {pendingLabCount} pending lab(s)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsAddLabOpen(true)}>
            <FlaskConical className="h-3.5 w-3.5 mr-1" />
            Order Lab
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsViewOpen(true)}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            View All
          </Button>
          <Button size="sm" onClick={() => setIsGenerateOpen(true)}>
            <Send className="h-3.5 w-3.5 mr-1" />
            Generate Upload Link
          </Button>
        </div>
      </div>

      {/* Pending Lab Tests Banner */}
      {pendingLabCount > 0 && (
        <div className="mb-4 border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Microscope className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Pending Lab Results ({pendingLabCount})
            </span>
          </div>
          <div className="space-y-1.5">
            {pendingLabs
              .filter(t => t.status === "pending" || t.status === "in_progress")
              .slice(0, 4)
              .map(t => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${t.status === "in_progress" ? "bg-blue-500 animate-pulse" : "bg-amber-500"}`} />
                    <span className="font-medium">{t.testName}</span>
                    {t.labName && <span className="text-muted-foreground">({t.labName})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {urgencyBadge(t.urgency)}
                    {t.status === "in_progress" && (
                      <Badge variant="secondary" className="text-[10px]">Link Sent</Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Attachments Preview */}
      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.slice(0, 3).map((att) => (
            <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded ${att.uploadedBy === "external" ? "bg-emerald-100 dark:bg-emerald-950" : "bg-muted"}`}>
                  <FileText className={`h-4 w-4 ${att.uploadedBy === "external" ? "text-emerald-600" : ""}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{att.fileName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">
                      {getCategoryLabel(att.category)}
                    </Badge>
                    <span>{formatFileSize(att.fileSize)}</span>
                    {att.uploadedBy === "external" && (
                      <span className="text-emerald-600 font-medium">via {att.uploadedByName}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {format(new Date(att.uploadedAt), "MMM d, yyyy")}
                </span>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteAttachment(att.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {attachments.length > 3 && (
            <Button variant="ghost" className="w-full text-sm" onClick={() => setIsViewOpen(true)}>
              View {attachments.length - 3} more...
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
          <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No attachments yet</p>
          <p className="text-xs mt-1">Generate an upload link to collect documents from labs, owners, or specialists</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* GENERATE UPLOAD LINK DIALOG                                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Generate Secure Upload Link
            </DialogTitle>
            <DialogDescription>
              Create a one-time secure link and email it to a lab, owner, or specialist to upload documents for <strong>{patientName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-3">
            <div className="space-y-5 py-2">

              {/* ── Recipient Type ── */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Send To</Label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { value: "lab", label: "Laboratory", icon: FlaskConical },
                    { value: "owner", label: "Pet Owner", icon: User },
                    { value: "specialist", label: "Specialist", icon: Stethoscope },
                    { value: "other", label: "Other", icon: Building2 },
                  ] as const).map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRecipientType(r.value);
                        if (r.value === "lab") setCategory("lab");
                        else if (r.value === "specialist") setCategory("document");
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs font-medium
                        ${recipientType === r.value
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"}`}
                    >
                      <r.icon className="h-5 w-5" />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* ── Recipient Details ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {recipientType === "lab" ? "Lab Name" : recipientType === "specialist" ? "Specialist Name" : "Recipient Name"}
                  </Label>
                  <Input
                    placeholder={recipientType === "lab" ? "e.g., IDEXX Reference Lab" : "Full name"}
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address</Label>
                  <Input
                    type="email"
                    placeholder={recipientType === "lab" ? "lab@idexx.com" : "email@example.com"}
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* ── Document Category + Urgency ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Document Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as AttachmentCategory)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lab">Lab Results</SelectItem>
                      <SelectItem value="imaging">Imaging (X-rays, Ultrasound)</SelectItem>
                      <SelectItem value="photo">Photos</SelectItem>
                      <SelectItem value="document">Documents / Reports</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Urgency</Label>
                  <Select value={urgency} onValueChange={v => setUrgency(v as typeof urgency)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="stat">STAT (Immediate)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ── Link Expiry ── */}
              <div className="space-y-1.5">
                <Label className="text-xs">Link Expiry</Label>
                <Select value={String(expiryHours)} onValueChange={v => setExpiryHours(Number(v))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                    <SelectItem value="72">72 hours (3 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ── Lab Test Selector (only for lab recipient) ── */}
              {recipientType === "lab" && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Requested Tests (auto-tracks as pending)
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-2 border rounded-lg bg-muted/30">
                    {COMMON_LAB_TESTS.map(test => (
                      <button
                        key={test.code}
                        type="button"
                        onClick={() => toggleLabTest(test.code)}
                        className={`text-left text-xs p-2 rounded-md transition-all flex items-center gap-2
                          ${selectedLabTests.includes(test.code)
                            ? "bg-primary/10 text-primary border border-primary/30 font-medium"
                            : "hover:bg-muted border border-transparent"}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0
                          ${selectedLabTests.includes(test.code) ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                          {selectedLabTests.includes(test.code) && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        {test.name}
                      </button>
                    ))}
                  </div>
                  {selectedLabTests.length > 0 && (
                    <p className="text-xs text-primary font-medium">
                      {selectedLabTests.length} test(s) selected — will be tracked in Pending Labs
                    </p>
                  )}
                </div>
              )}

              {/* ── Description / Instructions ── */}
              <div className="space-y-1.5">
                <Label className="text-xs">Instructions / Notes</Label>
                <Textarea
                  placeholder={recipientType === "lab"
                    ? "e.g., Please prioritize the CBC results. Patient is fasting."
                    : "e.g., Please upload the vaccination records."}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* ── Summary Card ── */}
              <div className={`rounded-lg p-3 text-sm space-y-2 border ${
                urgency === "stat" ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                : urgency === "urgent" ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                : "bg-muted border-border"
              }`}>
                {urgency === "stat" && (
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-xs">
                    <Zap className="h-3.5 w-3.5" /> STAT — Immediate attention required
                  </div>
                )}
                <p className="font-medium text-xs">Link Summary:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>To: <strong>{recipientName.trim() || getRecipientLabel(recipientType)}</strong>{recipientEmail.trim() && ` (${recipientEmail})`}</li>
                  <li>Category: <strong>{getCategoryLabel(category)}</strong></li>
                  <li>Expires in <strong>{expiryHours}h</strong> • One-time use</li>
                  <li>Patient: <strong>{patientName}</strong></li>
                  {selectedLabTests.length > 0 && <li>{selectedLabTests.length} lab test(s) will be tracked</li>}
                  <li>Uploaded files attach to this clinical record automatically</li>
                </ul>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsGenerateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleGenerateLink} className={urgency === "stat" ? "bg-red-600 hover:bg-red-700" : ""}>
              {recipientEmail.trim() ? (
                <><Mail className="h-4 w-4 mr-1.5" /> Generate & Preview Email</>
              ) : (
                <><Link className="h-4 w-4 mr-1.5" /> Generate & Copy Link</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* EMAIL PREVIEW DIALOG                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isEmailPreviewOpen} onOpenChange={setIsEmailPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Preview
            </DialogTitle>
            <DialogDescription>
              Review the email before sending. You can copy the link or open your email client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm border rounded-lg p-3 bg-muted/30">
              <span className="font-medium text-muted-foreground">To:</span>
              <span>{emailPreviewTo}</span>
              <span className="font-medium text-muted-foreground">Subject:</span>
              <span className="font-medium">{emailPreviewSubject}</span>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white">
              <div
                className="max-h-[45vh] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: emailPreviewHtml }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(lastGeneratedUrl);
              toast({ title: "Upload link copied to clipboard" });
            }}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(emailPreviewHtml);
              toast({ title: "Email HTML copied" });
            }}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Email HTML
            </Button>
            <Button size="sm" onClick={() => {
              const mailtoUrl = `mailto:${emailPreviewTo}?subject=${encodeURIComponent(emailPreviewSubject)}&body=${encodeURIComponent(`Upload link: ${lastGeneratedUrl}`)}`;
              window.open(mailtoUrl, "_blank");
            }}>
              <Send className="h-3.5 w-3.5 mr-1.5" /> Open in Email Client
            </Button>
            <Button variant="secondary" size="sm" onClick={() => {
              setIsEmailPreviewOpen(false);
              toast({ title: "Upload link generated", description: "Email template is ready. The link is active." });
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ORDER LAB TEST DIALOG                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isAddLabOpen} onOpenChange={setIsAddLabOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Order Lab Test
            </DialogTitle>
            <DialogDescription>
              Add a pending lab test for {patientName}. You can link it to an upload link later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Test Type</Label>
              <Select value={newLabTestCode} onValueChange={setNewLabTestCode}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a test..." /></SelectTrigger>
                <SelectContent>
                  {COMMON_LAB_TESTS.map(t => (
                    <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                placeholder="Any special instructions..."
                value={newLabNotes}
                onChange={e => setNewLabNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLabOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPendingLab} disabled={!newLabTestCode}>
              <FlaskConical className="h-4 w-4 mr-1.5" /> Order Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW ALL DIALOG                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Attachments, Labs & Upload Links</DialogTitle>
            <DialogDescription>
              Full overview for {patientName}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="attachments">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="attachments" className="text-xs">
                Files ({attachments.length})
              </TabsTrigger>
              <TabsTrigger value="labs" className="text-xs">
                Lab Tests ({pendingLabs.length})
              </TabsTrigger>
              <TabsTrigger value="links" className="text-xs">
                Links ({uploadLinks.length})
              </TabsTrigger>
            </TabsList>

            {/* ── Attachments Tab ── */}
            <TabsContent value="attachments">
              <ScrollArea className="max-h-[50vh]">
                {attachments.length > 0 ? (
                  <div className="space-y-2 pr-3">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded ${att.uploadedBy === "external" ? "bg-emerald-100 dark:bg-emerald-950" : "bg-muted"}`}>
                            <FileText className={`h-4 w-4 ${att.uploadedBy === "external" ? "text-emerald-600" : ""}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{att.fileName}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-[10px]">{getCategoryLabel(att.category)}</Badge>
                              <span>{formatFileSize(att.fileSize)}</span>
                              {att.uploadedBy === "external" && (
                                <span className="text-emerald-600 font-medium">via {att.uploadedByName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{format(new Date(att.uploadedAt), "MMM d, yyyy")}</span>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteAttachment(att.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No files uploaded yet</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ── Lab Tests Tab ── */}
            <TabsContent value="labs">
              <ScrollArea className="max-h-[50vh]">
                {pendingLabs.length > 0 ? (
                  <div className="space-y-2 pr-3">
                    {pendingLabs.map(t => (
                      <div key={t.id} className={`p-3 border rounded-lg transition-colors ${
                        t.status === "completed" ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                        : t.status === "in_progress" ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                        : "hover:bg-muted/50"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {t.status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : t.status === "in_progress" ? (
                              <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                            ) : (
                              <FlaskConical className="h-4 w-4 text-amber-600" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{t.testName}</p>
                              <p className="text-xs text-muted-foreground">
                                Ordered by {t.orderedBy} • {format(new Date(t.orderedAt), "MMM d, h:mm a")}
                                {t.labName && ` • ${t.labName}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {urgencyBadge(t.urgency)}
                            <Badge variant={t.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                              {t.status === "completed" ? "Received" : t.status === "in_progress" ? "Awaiting" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                        {t.completedAt && (
                          <p className="text-xs text-emerald-600 mt-1 ml-6">
                            Received {format(new Date(t.completedAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No lab tests ordered</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ── Links Tab ── */}
            <TabsContent value="links">
              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-4 pr-3">
                  {/* Active Links */}
                  {activeLinks.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Link className="h-3.5 w-3.5" /> Active ({activeLinks.length})
                      </h4>
                      <div className="space-y-2">
                        {activeLinks.map(link => (
                          <div key={link.token} className="p-3 border rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{getCategoryLabel(link.category)}</p>
                                  {link.urgency && link.urgency !== "routine" && urgencyBadge(link.urgency)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  To: {link.recipientName || getRecipientLabel(link.recipientType || "owner")}
                                  {link.recipientEmail && ` (${link.recipientEmail})`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Expires {format(new Date(link.expiresAt), "MMM d, h:mm a")}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => copyLink(link.token)} className="h-7 text-xs">
                                  {copiedToken === link.token ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                  {copiedToken === link.token ? "Copied!" : "Copy"}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openLink(link.token)} className="h-7">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Used Links */}
                  {usedLinks.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" /> Used ({usedLinks.length})
                      </h4>
                      <div className="space-y-2">
                        {usedLinks.map(link => (
                          <div key={link.token} className="p-3 border rounded-lg bg-muted/50 opacity-70">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{getCategoryLabel(link.category)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Used {link.usedAt ? format(new Date(link.usedAt), "MMM d, h:mm a") : "N/A"}
                                  {link.recipientName && ` by ${link.recipientName}`}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-[10px]">Completed</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadLinks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upload links generated yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Upload, Link, Mail, Copy, Check, X, FileText, Clock, ExternalLink, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  generateUploadLink,
  loadAttachments,
  loadUploadLinks,
  deleteAttachment,
  generateUploadEmailTemplate,
  formatFileSize,
  getCategoryLabel,
  subscribeToAttachments,
  type Attachment,
  type UploadLink,
} from "@/lib/attachmentStore";
import { format, isAfter } from "date-fns";

interface AttachmentManagerProps {
  patientId: string;
  patientName: string;
  createdBy: string;
}

export function AttachmentManager({ patientId, patientName, createdBy }: AttachmentManagerProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadLinks, setUploadLinks] = useState<UploadLink[]>([]);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Form state for generating link
  const [category, setCategory] = useState<Attachment["category"]>("lab");
  const [description, setDescription] = useState("");
  const [emailTo, setEmailTo] = useState("");

  // Refresh data
  const refreshData = () => {
    setAttachments(loadAttachments(patientId));
    setUploadLinks(loadUploadLinks(patientId));
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToAttachments(refreshData);
    return unsubscribe;
  }, [patientId]);

  // Generate new upload link
  const handleGenerateLink = () => {
    const link = generateUploadLink(
      patientId,
      patientName,
      createdBy,
      category,
      description.trim() || undefined
    );

    const uploadUrl = `${window.location.origin}/external-upload?token=${link.token}`;

    // If email provided, generate template
    if (emailTo.trim()) {
      const template = generateUploadEmailTemplate(patientName, uploadUrl, undefined, description.trim() || undefined);

      // In a real app, this would send via backend
      toast({
        title: "Upload Link Generated & Email Ready",
        description: `Link created for ${patientName}. Email template prepared for ${emailTo}.`,
      });

      // Store in localStorage for demo purposes (would be sent via email in production)
      localStorage.setItem(`acf_email_draft_${link.token}`, JSON.stringify({
        to: emailTo,
        ...template,
        uploadUrl,
      }));
    } else {
      toast({
        title: "Upload Link Generated",
        description: `Link created for ${patientName}. Copy and share it with the owner.`,
      });
    }

    setIsGenerateOpen(false);
    setDescription("");
    setEmailTo("");
    refreshData();
  };

  // Copy link to clipboard
  const copyLink = (token: string) => {
    const url = `${window.location.origin}/external-upload?token=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  // Delete attachment
  const handleDeleteAttachment = (id: string) => {
    if (confirm("Are you sure you want to delete this attachment?")) {
      deleteAttachment(id);
      toast({ title: "Attachment deleted" });
      refreshData();
    }
  };

  // Open upload link
  const openLink = (token: string) => {
    window.open(`/external-upload?token=${token}`, "_blank");
  };

  const activeLinks = uploadLinks.filter(l => !l.isUsed && isAfter(new Date(l.expiresAt), new Date()));
  const usedLinks = uploadLinks.filter(l => l.isUsed);
  const expiredLinks = uploadLinks.filter(l => !l.isUsed && !isAfter(new Date(l.expiresAt), new Date()));

  return (
    <>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Attachments</h3>
          <p className="text-sm text-muted-foreground">
            {attachments.length} file(s) • {activeLinks.length} active link(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsViewOpen(true)}>
            <Eye className="h-4 w-4 mr-1" />
            View All
          </Button>
          <Button onClick={() => setIsGenerateOpen(true)}>
            <Link className="h-4 w-4 mr-1" />
            Generate Upload Link
          </Button>
        </div>
      </div>

      {/* Recent Attachments Preview */}
      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.slice(0, 3).map((att) => (
            <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded bg-muted">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{att.fileName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">
                      {getCategoryLabel(att.category)}
                    </Badge>
                    <span>{formatFileSize(att.fileSize)}</span>
                    {att.uploadedBy === "external" && (
                      <span className="text-emerald-600">by {att.uploadedByName}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {format(new Date(att.uploadedAt), "MMM d, yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteAttachment(att.id)}
                >
                  <Trash2 className="h-4 w-4" />
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
          <p className="text-xs">Generate an upload link to collect documents from owners</p>
        </div>
      )}

      {/* Generate Link Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Upload Link</DialogTitle>
            <DialogDescription>
              Create a secure, one-time use link for {patientName}'s owner to upload documents.
              The link expires in 24 hours.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Attachment["category"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab">Lab Results</SelectItem>
                  <SelectItem value="imaging">Imaging (X-rays, Ultrasound, etc.)</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="e.g., Please upload the blood work results from the external lab"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Owner Email (Optional)</Label>
              <Input
                type="email"
                placeholder="owner@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If provided, an email template will be generated with instructions.
              </p>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
              <p className="font-medium">Link Details:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Valid for 24 hours only</li>
                <li>One-time use (cannot be reused)</li>
                <li>Patient-specific for {patientName}</li>
                <li>Records in patient's clinical file automatically</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateLink}>
              <Link className="h-4 w-4 mr-1" />
              Generate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Attachments & Upload Links</DialogTitle>
            <DialogDescription>
              Manage all attachments and upload links for {patientName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
            {/* Attachments Section */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Uploaded Files ({attachments.length})
              </h4>
              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded bg-muted">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{att.fileName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-[10px]">
                              {getCategoryLabel(att.category)}
                            </Badge>
                            <span>{formatFileSize(att.fileSize)}</span>
                            {att.uploadedBy === "external" && (
                              <span className="text-emerald-600">by {att.uploadedByName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(att.uploadedAt), "MMM d, yyyy")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAttachment(att.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No attachments yet</p>
              )}
            </div>

            {/* Active Links Section */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Link className="h-4 w-4" />
                Active Upload Links ({activeLinks.length})
              </h4>
              {activeLinks.length > 0 ? (
                <div className="space-y-2">
                  {activeLinks.map((link) => (
                    <div key={link.token} className="p-3 border rounded-lg bg-emerald-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{getCategoryLabel(link.category)}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires {format(new Date(link.expiresAt), "MMM d, h:mm a")}
                          </p>
                          {link.description && (
                            <p className="text-xs text-muted-foreground">{link.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => copyLink(link.token)}>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openLink(link.token)}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No active links</p>
              )}
            </div>

            {/* Used Links Section */}
            {usedLinks.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4" />
                  Used Links ({usedLinks.length})
                </h4>
                <div className="space-y-2">
                  {usedLinks.slice(0, 3).map((link) => (
                    <div key={link.token} className="p-3 border rounded-lg bg-muted/50 opacity-60">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{getCategoryLabel(link.category)}</p>
                          <p className="text-xs text-muted-foreground">
                            Used {link.usedAt ? format(new Date(link.usedAt), "MMM d, h:mm a") : "N/A"}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">Used</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

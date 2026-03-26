import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Upload, FileText, X, CheckCircle, AlertTriangle, Clock, Send,
  ShieldCheck, File, Microscope, FileImage, Zap, Camera,
  Activity, Bone, Stethoscope,
} from "lucide-react";
import {
  validateLabUploadToken, validateUploadLink, markLinkAsUsed, saveAttachment, clearPendingLabsByToken,
  broadcastAttachmentUpdate, completeLabOrder, type UploadLink, type LabOrder, getCategoryLabel,
  type PendingLabTest,
} from "@/lib/attachmentStore";
import { format } from "date-fns";

export default function UploadPortal() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [labOrder, setLabOrder] = useState<LabOrder | null>(null);
  const [link, setLink] = useState<UploadLink | null>(null);
  const [valid, setValid] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isChecking, setIsChecking] = useState(true);

  const [files, setFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState("");
  const [description, setDescription] = useState("");
  const [labNotes, setLabNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [clearedLabs, setClearedLabs] = useState<PendingLabTest[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError("No upload token provided");
      setIsChecking(false);
      return;
    }

    // First try to validate as a lab upload token (new system)
    const labResult = validateLabUploadToken(token);
    if (labResult.valid && labResult.order) {
      setValid(true);
      setLabOrder(labResult.order);
      setIsChecking(false);
      return;
    }

    // Fallback to regular upload link validation (legacy system)
    const linkResult = validateUploadLink(token);
    if (!linkResult.valid) {
      setError(linkResult.reason || "Invalid link");
    } else {
      setValid(true);
      setLink(linkResult.link || null);
    }
    setIsChecking(false);
  }, [token]);

  const ACCEPTED_TYPES = [
    "application/pdf", "image/jpeg", "image/png", "image/tiff",
    "application/dicom", "image/bmp", "image/webp",
  ];
  const ACCEPTED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".dcm", ".bmp", ".webp"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): boolean => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    return (ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXT.includes(ext)) && file.size <= MAX_FILE_SIZE;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid: File[] = [];
    const rejected: string[] = [];
    for (const f of selected) {
      if (validateFile(f)) valid.push(f);
      else rejected.push(`${f.name} (${f.size > MAX_FILE_SIZE ? "too large" : "unsupported format"})`);
    }
    setFiles(prev => [...prev, ...valid]);
    if (rejected.length) setRejectedFiles(rejected);
    if (e.target) e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    const valid: File[] = [];
    const rejected: string[] = [];
    for (const f of dropped) {
      if (validateFile(f)) valid.push(f);
      else rejected.push(`${f.name} (${f.size > MAX_FILE_SIZE ? "too large" : "unsupported format"})`);
    }
    setFiles(prev => [...prev, ...valid]);
    if (rejected.length) setRejectedFiles(rejected);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="h-4 w-4 text-blue-500" />;
    if (type === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const handleUpload = async () => {
    if (!token || (!link && !labOrder) || files.length === 0 || !uploaderName.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Determine if this is a lab order or regular upload link
    const isLabOrder = !!labOrder;
    const targetLink = link;
    const targetOrder = labOrder;

    // Mark as used first (one-time use)
    let marked = false;
    if (isLabOrder && targetOrder) {
      // For lab orders, we'll complete the order after upload
      marked = true;
    } else if (targetLink) {
      marked = markLinkAsUsed(token);
    }
    
    if (!marked) {
      setError("This link has already been used or has expired");
      setIsUploading(false);
      return;
    }

    // Simulate upload progress
    const totalFiles = files.length;
    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      // Simulate per-file progress
      for (let p = 0; p < 5; p++) {
        await new Promise(r => setTimeout(r, 80 + Math.random() * 120));
        setUploadProgress(Math.round(((i + (p + 1) / 5) / totalFiles) * 100));
      }

      const attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        patientId: isLabOrder ? targetOrder!.patientId : targetLink!.patientId,
        encounterId: isLabOrder ? targetOrder!.encounterId : targetLink!.encounterId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        category: isLabOrder ? "lab" : targetLink!.category,
        uploadedBy: "external" as const,
        uploadedByName: uploaderName.trim(),
        uploadedAt: new Date().toISOString(),
        description: description.trim() || (isLabOrder ? targetOrder!.notes : targetLink!.description),
        uploadToken: token,
        labOrderId: isLabOrder ? targetOrder!.id : undefined,
      };
      saveAttachment(attachment);
    }

    // Collect attachment IDs for lab order completion
    const attachmentIds = Array.from({ length: totalFiles }, (_, i) => 
      `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`
    );

    let cleared: PendingLabTest[] = [];
    
    if (isLabOrder && targetOrder) {
      // Complete the lab order with lab notes
      completeLabOrder(targetOrder.id, attachmentIds, labNotes.trim());
    } else {
      // Auto-clear linked pending lab tests (legacy system)
      cleared = clearPendingLabsByToken(token);
      setClearedLabs(cleared);
    }

    // Broadcast notification to clinic
    const urgencyPrefix = (isLabOrder ? targetOrder!.urgency : targetLink!.urgency) === "stat" ? "[STAT] " : 
                         (isLabOrder ? targetOrder!.urgency : targetLink!.urgency) === "urgent" ? "[URGENT] " : "";
    const patientName = isLabOrder ? targetOrder!.patientName : targetLink!.patientName;
    const patientId = isLabOrder ? targetOrder!.patientId : targetLink!.patientId;
    
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: "success",
        message: `${urgencyPrefix}${totalFiles} document(s) uploaded for ${patientName} by ${uploaderName.trim()}${isLabOrder ? ` — ${targetOrder!.testName} completed` : cleared.length ? ` — ${cleared.length} lab test(s) completed` : ""}`,
        patientId,
        patientName,
        targetRoles: ["SuperAdmin", "Vet", "Nurse", "Receptionist"],
      },
    }));

    // Cross-tab sync
    broadcastAttachmentUpdate();

    setUploadProgress(100);
    await new Promise(r => setTimeout(r, 400));
    setUploadSuccess(true);
    setIsUploading(false);
  };

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50/50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-8 w-8 text-teal-600 dark:text-teal-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Validating Upload Link</h2>
            <p className="text-muted-foreground">Please wait while we verify your secure access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (!valid || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-0">
          <div className="h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-t-lg" />
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-800 dark:text-red-200">Invalid Upload Link</h2>
            <p className="text-muted-foreground mb-4">{error || "This upload link is not valid"}</p>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 text-left">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Possible reasons:</h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• The link has expired</li>
                <li>• The link has already been used</li>
                <li>• The link URL was corrupted</li>
                <li>• The lab order was cancelled</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Please contact the veterinary clinic for a new upload link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-xl border-0">
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-lg" />
          <CardContent className="py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Successful!</h2>
            <p className="text-muted-foreground">
              Your documents for <strong>{labOrder?.patientName || link?.patientName}</strong> have been securely uploaded.
            </p>

            <Separator className="my-6" />

            {/* Upload Receipt */}
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upload Receipt</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-medium">{labOrder?.patientName || link?.patientName}</span>
                <span className="text-muted-foreground">{labOrder ? "Test Type:" : "Category:"}</span>
                <span className="font-medium">{labOrder ? `${labOrder.testName} (${labOrder.testType})` : (link ? getCategoryLabel(link.category) : "N/A")}</span>
                <span className="text-muted-foreground">Files uploaded:</span>
                <span className="font-medium">{files.length}</span>
                <span className="text-muted-foreground">Uploaded by:</span>
                <span className="font-medium">{uploaderName}</span>
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{format(new Date(), "MMM d, yyyy 'at' h:mm a")}</span>
                {labOrder && (
                  <>
                    <span className="text-muted-foreground">Case ID:</span>
                    <span className="font-medium">#{labOrder.caseId}</span>
                  </>
                )}
              </div>

              {clearedLabs.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Microscope className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {clearedLabs.length} Lab Test(s) Marked Complete
                    </span>
                  </div>
                  <div className="space-y-1">
                    {clearedLabs.map((lab) => (
                      <div key={lab.id} className="text-xs text-muted-foreground">
                        • {lab.testName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-medium">
                  The clinic has been notified and will review your documents shortly.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              You can safely close this page now.
            </p>
          </CardContent>
          <div className="px-6 pb-4 text-center">
            <p className="text-[10px] text-muted-foreground">Powered by Veti-Vision Animal Care</p>
          </div>
        </Card>
      </div>
    );
  }

  // Main upload form
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 to-white dark:from-gray-950 dark:to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Urgency Banner */}
        {(labOrder?.urgency === "stat" || link?.urgency === "stat") && (
          <div className="mb-4 bg-red-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg animate-pulse">
            <Zap className="h-5 w-5 shrink-0" />
            <span className="font-bold text-sm tracking-wide">STAT &mdash; IMMEDIATE ATTENTION REQUIRED</span>
          </div>
        )}
        {(labOrder?.urgency === "urgent" || link?.urgency === "urgent") && (
          <div className="mb-4 bg-amber-500 text-white px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="font-bold text-sm tracking-wide">URGENT &mdash; PRIORITY UPLOAD</span>
          </div>
        )}

        {/* Header Card */}
        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white">
            <div className="flex items-center gap-2 text-teal-100 text-xs mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Secure One-Time Document Upload</span>
            </div>
            <h1 className="text-xl font-bold">
              {labOrder ? `Upload Results for ${labOrder.patientName}` : `Upload Documents for ${link?.patientName}`}
            </h1>
            <p className="text-teal-100 text-sm mt-1">
              {labOrder 
                ? `Please upload the ${labOrder.testName.toLowerCase()} results for Case #${labOrder.caseId}.`
                : (link?.description || `Please upload your ${link ? getCategoryLabel(link.category).toLowerCase() : "documents"} below.`)
              }
            </p>
          </div>
          <CardContent className="py-3 px-6 bg-amber-50 dark:bg-amber-950/30 flex items-center gap-3 border-t border-amber-200 dark:border-amber-800">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                This link expires {
                  (labOrder?.uploadExpiresAt || link?.expiresAt) 
                    ? format(new Date(labOrder?.uploadExpiresAt || link?.expiresAt!), "MMM d, yyyy 'at' h:mm a")
                    : "soon"
                }
                &nbsp;&bull;&nbsp;One-time use only
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-teal-600" />
              {labOrder ? "Lab Results Upload" : "Document Upload"}
            </CardTitle>
            <CardDescription>
              {labOrder ? (
                <>
                  Test: <Badge variant="secondary" className="text-[10px] ml-1">{labOrder.testName} ({labOrder.testType})</Badge>
                  <span className="ml-2">Case ID: <strong>#{labOrder.caseId}</strong></span>
                </>
              ) : (
                <>
                  Category: <Badge variant="secondary" className="text-[10px] ml-1">{link ? getCategoryLabel(link.category) : "Documents"}</Badge>
                  {link?.recipientType === "lab" && link?.recipientName && (
                    <span className="ml-2">From: <strong>{link.recipientName}</strong></span>
                  )}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Your Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">
                Your Name / Organization <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder={labOrder ? "e.g., IDEXX Reference Lab" : "Enter your full name"}
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                className="h-10"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium">
                {labOrder ? "General Notes (Optional)" : "Additional Notes (Optional)"}
              </Label>
              <Textarea
                id="description"
                placeholder={labOrder ? "Add any general notes about the upload..." : "Add any notes about the documents you're uploading..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Lab Notes (only for lab orders) */}
            {labOrder && (
              <div className="space-y-1.5">
                <Label htmlFor="labNotes" className="text-xs font-medium">
                  📝 Notes for Veterinarian <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="labNotes"
                  placeholder="e.g., Slight fracture noted in distal radius. Contrast agent used. Patient was cooperative during procedure."
                  value={labNotes}
                  onChange={(e) => setLabNotes(e.target.value)}
                  rows={3}
                  className="text-sm border-amber-200 focus:border-amber-400 dark:border-amber-800"
                />
                <p className="text-[10px] text-muted-foreground">
                  These notes will be automatically added to the patient's clinical record.
                </p>
              </div>
            )}

            {/* File Upload Area */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Upload Files <span className="text-destructive">*</span>
              </Label>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragOver 
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/20" 
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES.join(",")}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium mb-2">
                  {isDragOver ? "Drop files here" : "Drag and drop files here, or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, JPG, PNG, TIFF, DICOM, BMP, WebP • Max 10MB per file
                </p>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Selected Files ({files.length})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFileIcon(file.type)}
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Files */}
            {rejectedFiles.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">Some files were rejected:</p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  {rejectedFiles.map((file, index) => (
                    <li key={index}>• {file}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handleUpload} 
              disabled={files.length === 0 || !uploaderName.trim() || isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading... {uploadProgress}%
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Upload Documents
                </>
              )}
            </Button>

            {/* Progress Bar */}
            {isUploading && (
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Secure Upload Portal</p>
                  <p>This is a secure, one-time upload link. Your files will be encrypted and transmitted directly to the veterinary clinic's system.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>Powered by Veti-Vision Animal Care • Secure Veterinary Communications</p>
        </div>
      </div>
    </div>
  );
}

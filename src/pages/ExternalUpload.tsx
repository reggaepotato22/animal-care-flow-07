import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, X, CheckCircle, AlertTriangle, Clock, ArrowLeft, Send } from "lucide-react";
import { validateUploadLink, markLinkAsUsed, saveAttachment, generateUploadEmailTemplate, type UploadLink, getCategoryLabel } from "@/lib/attachmentStore";
import { format } from "date-fns";

export default function ExternalUpload() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [link, setLink] = useState<UploadLink | null>(null);
  const [valid, setValid] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isChecking, setIsChecking] = useState(true);

  const [files, setFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError("No upload token provided");
      setIsChecking(false);
      return;
    }

    const result = validateUploadLink(token);
    if (!result.valid) {
      setError(result.reason || "Invalid link");
    } else {
      setValid(true);
      setLink(result.link || null);
    }
    setIsChecking(false);
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const validFiles = selected.filter(f => f.size <= 10 * 1024 * 1024); // 10MB limit
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!token || !link || files.length === 0 || !uploaderName.trim()) return;

    setIsUploading(true);

    // Mark link as used first (one-time use)
    const marked = markLinkAsUsed(token);
    if (!marked) {
      setError("This link has already been used or has expired");
      setIsUploading(false);
      return;
    }

    // Save each attachment
    for (const file of files) {
      const attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        patientId: link.patientId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        category: link.category,
        uploadedBy: "external" as const,
        uploadedByName: uploaderName.trim(),
        uploadedAt: new Date().toISOString(),
        description: description.trim() || link.description,
        uploadToken: token,
      };
      saveAttachment(attachment);
    }

    // Broadcast notification
    window.dispatchEvent(new CustomEvent("acf:notification", {
      detail: {
        type: "success",
        message: `Documents uploaded for ${link.patientName} by ${uploaderName}`,
        patientId: link.patientId,
        patientName: link.patientName,
        targetRoles: ["SuperAdmin", "Vet", "Nurse", "Receptionist"],
      },
    }));

    // Also broadcast via storage event for cross-tab sync
    window.dispatchEvent(new CustomEvent("acf_attachments_updated"));

    setUploadSuccess(true);
    setIsUploading(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="animate-pulse">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Validating upload link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!valid || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Upload Link Invalid</h2>
            <p className="text-muted-foreground">{error || "This upload link is not valid."}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Please contact the clinic for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Upload Successful!</h2>
            <p className="text-muted-foreground">
              Your documents for <strong>{link?.patientName}</strong> have been uploaded successfully.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              The clinic has been notified and will review your documents shortly.
            </p>
            <p className="text-xs text-muted-foreground mt-6">
              You can now close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Secure Document Upload</span>
          </div>
          <h1 className="text-2xl font-bold">Upload Documents for {link?.patientName}</h1>
          <p className="text-muted-foreground">
            Please upload your lab results, imaging, or other documents below.
          </p>
        </div>

        {/* Expiry Warning */}
        <Card className="mb-6 border-warning/50 bg-warning/10">
          <CardContent className="py-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-medium">
                This link expires on {link?.expiresAt ? format(new Date(link.expiresAt), "MMM d, yyyy 'at' h:mm a") : "soon"}
              </p>
              <p className="text-xs text-muted-foreground">
                This is a one-time use link. Once you upload, this page will no longer be accessible.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Upload
            </CardTitle>
            <CardDescription>
              {link?.description ? `Purpose: ${link.description}` : `Category: ${link ? getCategoryLabel(link.category) : "Documents"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Your Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Additional Notes (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any notes about the documents you're uploading..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>
                Upload Files <span className="text-destructive">*</span>
              </Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center relative hover:border-primary/50 transition-colors">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-sm font-medium mb-1">Click to select files or drag and drop</h3>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, PNG, TIFF (Max 10MB per file)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.tiff"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded bg-background">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Upload Documents
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By uploading, you confirm that these documents relate to {link?.patientName} and that you have permission to share them.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Powered by Veti-Vision Animal Care</p>
          <p className="mt-1">For assistance, please contact the clinic directly.</p>
        </div>
      </div>
    </div>
  );
}

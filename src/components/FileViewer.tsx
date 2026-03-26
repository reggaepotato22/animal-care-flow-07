import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Download, Eye, X, FileText, FileImage, Calendar, User,
  Clock, ExternalLink, ZoomIn, ZoomOut, RotateCw, Maximize2,
  Mail, Send
} from "lucide-react";
import { format } from "date-fns";
import { type Attachment } from "@/lib/attachmentStore";

interface FileViewerProps {
  attachment: Attachment | null;
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
}

export function FileViewer({ attachment, isOpen, onClose, patientName }: FileViewerProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (attachment && isOpen) {
      // Reset state when attachment changes
      setZoom(1);
      setRotation(0);
      
      // For image files, create a preview URL
      if (attachment.fileType.startsWith("image/")) {
        setIsLoading(true);
        // In a real implementation, you'd fetch the actual file from storage
        // For now, we'll simulate it
        setTimeout(() => {
          setImageUrl(`/api/files/${attachment.id}`);
          setIsLoading(false);
        }, 500);
      } else {
        setImageUrl("");
        setIsLoading(false);
      }
    }
  }, [attachment, isOpen]);

  const handleDownload = () => {
    if (!attachment) return;
    
    // In a real implementation, you'd download the actual file
    // For now, we'll simulate it
    const link = document.createElement("a");
    link.href = `/api/files/${attachment.id}/download`;
    link.download = attachment.fileName;
    link.click();
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => prev + 90);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="h-5 w-5" />;
    if (type === "application/pdf") return <FileText className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImage = attachment?.fileType.startsWith("image/");
  const isPDF = attachment?.fileType === "application/pdf";

  if (!attachment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(attachment.fileType)}
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {attachment.fileName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {patientName && `Patient: ${patientName} • `}
                  {formatFileSize(attachment.fileSize)} • {attachment.fileType}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[calc(90vh-8rem)]">
          {/* File Info Bar */}
          <div className="px-6 py-3 bg-muted/30 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Uploaded by: {attachment.uploadedByName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(attachment.uploadedAt), "MMM d, yyyy h:mm a")}</span>
                </div>
                {attachment.category && (
                  <Badge variant="outline" className="text-xs">
                    {attachment.category}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {isImage && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleZoomOut}>
                      <ZoomOut className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-12 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button variant="outline" size="sm" onClick={handleZoomIn}>
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRotate}>
                      <RotateCw className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* File Content */}
          <ScrollArea className="flex-1 bg-background">
            <div className="p-6 flex items-center justify-center min-h-full">
              {isImage ? (
                <div className="relative">
                  {isLoading ? (
                    <div className="w-96 h-96 bg-muted rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt={attachment.fileName}
                      className="max-w-full max-h-[calc(90vh-12rem)] object-contain rounded-lg shadow-lg"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transition: "transform 0.2s ease",
                      }}
                    />
                  )}
                </div>
              ) : isPDF ? (
                <div className="w-full max-w-4xl">
                  <div className="bg-muted rounded-lg p-8 text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">PDF Document</h3>
                    <p className="text-muted-foreground mb-4">
                      This PDF document is ready for download and viewing in your preferred PDF reader.
                    </p>
                    <Button onClick={handleDownload} size="lg">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-4xl">
                  <div className="bg-muted rounded-lg p-8 text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Document File</h3>
                    <p className="text-muted-foreground mb-4">
                      This document file is ready for download. You can open it with the appropriate application.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>File Type: {attachment.fileType}</p>
                      <p>Size: {formatFileSize(attachment.fileSize)}</p>
                    </div>
                    <Button onClick={handleDownload} size="lg" className="mt-4">
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Description */}
          {attachment.description && (
            <div className="px-6 py-4 border-t bg-muted/30">
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{attachment.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// File List Component for displaying multiple files
interface FileListProps {
  attachments: Attachment[];
  patientName?: string;
  onFileClick?: (attachment: Attachment) => void;
}

export function FileList({ attachments, patientName, onFileClick }: FileListProps) {
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedAttachmentForEmail, setSelectedAttachmentForEmail] = useState<Attachment | null>(null);

  const handleFileClick = (attachment: Attachment) => {
    setSelectedFile(attachment);
    setIsViewerOpen(true);
    onFileClick?.(attachment);
  };

  const handleEmailClick = (attachment: Attachment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAttachmentForEmail(attachment);
    setEmailDialogOpen(true);
  };

  const openGmail = (attachment: Attachment) => {
    const subject = encodeURIComponent(`Medical Attachment: ${attachment.fileName}`);
    const body = encodeURIComponent(`Please find the attached file: ${attachment.fileName}\n\nPatient: ${patientName || 'N/A'}\nUploaded: ${format(new Date(attachment.uploadedAt), 'MMM d, yyyy')}\n\n`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
    setEmailDialogOpen(false);
  };

  const openOutlook = (attachment: Attachment) => {
    const subject = encodeURIComponent(`Medical Attachment: ${attachment.fileName}`);
    const body = encodeURIComponent(`Please find the attached file: ${attachment.fileName}\n\nPatient: ${patientName || 'N/A'}\nUploaded: ${format(new Date(attachment.uploadedAt), 'MMM d, yyyy')}\n\n`);
    window.open(`https://outlook.live.com/mail/0/deeplink/compose?subject=${subject}&body=${body}`, '_blank');
    setEmailDialogOpen(false);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (type === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
    return <FileText className="h-5 w-5 text-emerald-500" />;
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "lab": return "bg-blue-100 text-blue-800 border-blue-200";
      case "imaging": return "bg-purple-100 text-purple-800 border-purple-200";
      case "photo": return "bg-green-100 text-green-800 border-green-200";
      case "document": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/30">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No files available</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-4 border-2 rounded-xl hover:bg-teal-50/50 cursor-pointer transition-all shadow-sm hover:shadow-md bg-white"
            onClick={() => handleFileClick(attachment)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gray-100">
                {getFileIcon(attachment.fileType)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base truncate">{attachment.fileName}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="font-medium">{formatFileSize(attachment.fileSize)}</span>
                  <span>•</span>
                  <span>{format(new Date(attachment.uploadedAt), "MMM d, yyyy h:mm a")}</span>
                  <span>•</span>
                  <span className="text-teal-600 font-medium">by {attachment.uploadedByName}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {attachment.category && (
                <Badge variant="outline" className={`text-xs font-semibold ${getCategoryColor(attachment.category)}`}>
                  {attachment.category}
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={(e) => handleEmailClick(attachment, e)}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              <Button variant="ghost" size="sm" className="text-teal-600">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <FileViewer
        attachment={selectedFile}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        patientName={patientName}
      />

      {/* Email Provider Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Send via Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Choose your email provider to send <strong>{selectedAttachmentForEmail?.fileName}</strong>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2 border-red-200 hover:bg-red-50"
                onClick={() => selectedAttachmentForEmail && openGmail(selectedAttachmentForEmail)}
              >
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg">G</div>
                <span className="text-sm font-medium">Gmail</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2 border-blue-200 hover:bg-blue-50"
                onClick={() => selectedAttachmentForEmail && openOutlook(selectedAttachmentForEmail)}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">O</div>
                <span className="text-sm font-medium">Outlook</span>
              </Button>
            </div>
            <div className="pt-2 border-t">
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => {
                  if (selectedAttachmentForEmail) {
                    const subject = encodeURIComponent(`Medical Attachment: ${selectedAttachmentForEmail.fileName}`);
                    const body = encodeURIComponent(`Please find the attached file: ${selectedAttachmentForEmail.fileName}\n\nPatient: ${patientName || 'N/A'}\nUploaded: ${format(new Date(selectedAttachmentForEmail.uploadedAt), 'MMM d, yyyy')}\n\n`);
                    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                  }
                  setEmailDialogOpen(false);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Use Default Email Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

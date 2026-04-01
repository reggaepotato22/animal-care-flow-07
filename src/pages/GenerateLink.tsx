import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  Link, Copy, Check, Send, ArrowLeft, Upload, 
  FileText, Image, Microscope, User, Building2, 
  Search, ChevronDown, CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateUploadLink, type AttachmentCategory, type RecipientType } from "@/lib/attachmentStore";
import { getPatients } from "@/lib/patientStore";

const CATEGORIES: { value: AttachmentCategory; label: string; icon: React.ElementType }[] = [
  { value: "lab", label: "Lab Results", icon: Microscope },
  { value: "imaging", label: "Imaging (X-Ray, Ultrasound)", icon: Image },
  { value: "photo", label: "Photos", icon: Image },
  { value: "document", label: "Documents", icon: FileText },
];

const RECIPIENTS: { value: RecipientType; label: string }[] = [
  { value: "owner", label: "Pet Owner" },
  { value: "lab", label: "External Lab" },
  { value: "specialist", label: "Specialist/Vet" },
  { value: "other", label: "Other" },
];

export default function GenerateLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openPatientSearch, setOpenPatientSearch] = useState(false);
  const [category, setCategory] = useState<AttachmentCategory>("lab");
  const [recipientType, setRecipientType] = useState<RecipientType>("lab");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [expiresIn, setExpiresIn] = useState("72");
  
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Read URL parameters on mount
  useEffect(() => {
    const urlPatientId = searchParams.get("patientId");
    const urlPatientName = searchParams.get("patientName");
    const urlCategory = searchParams.get("category") as AttachmentCategory;
    const urlRecipientType = searchParams.get("recipientType") as RecipientType;
    
    if (urlPatientId) setPatientId(urlPatientId);
    if (urlPatientName) setPatientName(urlPatientName);
    if (urlCategory && ["lab", "imaging", "photo", "document"].includes(urlCategory)) {
      setCategory(urlCategory);
    }
    if (urlRecipientType && ["owner", "lab", "specialist", "other"].includes(urlRecipientType)) {
      setRecipientType(urlRecipientType);
    }
  }, [searchParams]);

  const handleGenerate = () => {
    if (!patientId.trim() || !patientName.trim()) {
      toast({ title: "Missing Information", description: "Please enter patient ID and name." });
      return;
    }

    const expiresHours = parseInt(expiresIn) || 72;
    
    const link = generateUploadLink(
      patientId.trim(),
      patientName.trim(),
      "Staff",
      category,
      {
        recipientType,
        recipientName: recipientName.trim() || undefined,
        recipientEmail: recipientEmail.trim() || undefined,
        description: description.trim() || undefined,
        urgency,
        expiryHours: expiresHours,
      }
    );

    const fullUrl = `${window.location.origin}/external-upload?token=${link.token}`;
    setGeneratedLink(fullUrl);
    
    toast({
      title: "Upload Link Generated",
      description: `Secure link created for ${patientName}. Expires in ${expiresHours} hours.`,
    });
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast({ title: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendEmail = () => {
    if (generatedLink && recipientEmail) {
      const subject = encodeURIComponent(`Upload Request for ${patientName}`);
      const body = encodeURIComponent(
        `Hello ${recipientName || 'there'},\n\n` +
        `Please upload the requested documents for ${patientName} using this secure link:\n\n` +
        `${generatedLink}\n\n` +
        `This link will expire in ${expiresIn} hours.\n\n` +
        `Description: ${description || 'N/A'}\n\n` +
        `Thank you!`
      );
      window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`, "_blank");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Link className="h-8 w-8 text-teal-600" />
          Generate Upload Link
        </h1>
        <p className="text-muted-foreground mt-2">
          Create a secure upload link to collect files from owners, labs, or specialists
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-teal-600" />
            Link Details
          </CardTitle>
          <CardDescription>
            Fill in the details to generate a secure upload link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </h3>
            
            {/* Patient Search Dropdown */}
            <Popover open={openPatientSearch} onOpenChange={setOpenPatientSearch}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPatientSearch}
                  className="w-full justify-between"
                >
                  {patientId ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {patientName} ({patientId})
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search for a patient...
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search by name, ID, or owner..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No patients found.</CommandEmpty>
                    <CommandGroup heading="Patients">
                      {getPatients()
                        .filter((p) => {
                          const query = searchQuery.toLowerCase();
                          return (
                            p.name.toLowerCase().includes(query) ||
                            p.patientId.toLowerCase().includes(query) ||
                            p.owner.toLowerCase().includes(query)
                          );
                        })
                        .slice(0, 10)
                        .map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.patientId}`}
                            onSelect={() => {
                              setPatientId(p.patientId);
                              setPatientName(p.name);
                              setOpenPatientSearch(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{p.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {p.patientId} • Owner: {p.owner}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected Patient Display */}
            {patientId && (
              <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold">
                    {patientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-teal-900 dark:text-teal-100">{patientName}</p>
                    <p className="text-xs text-teal-600 dark:text-teal-400">{patientId}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-muted-foreground"
                    onClick={() => {
                      setPatientId("");
                      setPatientName("");
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Upload Type */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Upload Type
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as AttachmentCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as any)}>
                  <SelectTrigger>
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
          </div>

          <Separator />

          {/* Recipient */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Recipient
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient Type</Label>
                <Select value={recipientType} onValueChange={(v) => setRecipientType(v as RecipientType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPIENTS.map((rec) => (
                      <SelectItem key={rec.value} value={rec.value}>
                        {rec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g., IDEXX Lab"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="lab@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Settings</h3>
            <div className="space-y-2">
              <Label>Description / Instructions</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any special instructions for the recipient..."
              />
            </div>
            <div className="space-y-2">
              <Label>Link Expires In</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours (3 days)</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            className="w-full"
            disabled={!patientId.trim() || !patientName.trim()}
          >
            <Link className="h-4 w-4 mr-2" />
            Generate Secure Upload Link
          </Button>

          {/* Generated Link Display */}
          {generatedLink && (
            <div className="bg-muted rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">Generated</Badge>
                <span className="text-sm text-muted-foreground">Ready to share</span>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Upload URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={generatedLink} 
                    readOnly 
                    className="font-mono text-sm bg-white"
                  />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {recipientEmail && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={sendEmail}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Open Email Client
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                Files uploaded via this link will be automatically attached to patient <strong>{patientName}</strong> ({patientId}).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

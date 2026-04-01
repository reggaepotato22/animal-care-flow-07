import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Mail, Settings, Plus, Edit, Trash2, Copy, Eye, Send, TestTube,
  Palette, ShieldCheck, Globe, Lock, Check, X, AlertTriangle, Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  loadCommunicationSettings,
  saveCommunicationSettings,
  updateSMTPConfig,
  saveEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplate,
  getDefaultEmailTemplate,
  getEmailTemplatesByType,
  processTemplate,
  type CommunicationSettings,
  type EmailTemplate,
  type SMTPConfig,
} from "@/lib/communicationsStore";

export default function SettingsCommunications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<CommunicationSettings | null>(null);
  const [activeTab, setActiveTab] = useState("templates");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "custom" as EmailTemplate['type'],
    subject: "",
    htmlBody: "",
    textBody: "",
    variables: [] as string[],
    isDefault: false,
  });

  // SMTP form state
  const [smtpForm, setSmtpForm] = useState<SMTPConfig>({
    host: "",
    port: 587,
    username: "",
    password: "",
    encryption: "tls",
    fromEmail: "",
    fromName: "",
    replyTo: "",
  });

  // Branding form state
  const [brandingForm, setBrandingForm] = useState({
    clinicName: "",
    primaryColor: "#0d9488",
    secondaryColor: "#065f46",
    logoUrl: "",
  });

  useEffect(() => {
    const loadedSettings = loadCommunicationSettings();
    setSettings(loadedSettings);
    setSmtpForm(loadedSettings.smtp);
    setBrandingForm(loadedSettings.branding);
  }, []);

  const handleSaveSMTP = () => {
    if (!settings) return;

    const success = updateSMTPConfig(smtpForm);
    if (success) {
      toast({ title: "SMTP configuration saved" });
      setSettings(loadCommunicationSettings());
    } else {
      toast({ title: "Failed to save SMTP configuration", variant: "destructive" });
    }
  };

  const handleSaveBranding = () => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      branding: brandingForm,
    };
    saveCommunicationSettings(updatedSettings);
    setSettings(updatedSettings);
    toast({ title: "Branding settings saved" });
  };

  const handleSaveTemplate = () => {
    if (!settings) return;

    let success = false;
    if (editingTemplate) {
      success = updateEmailTemplate(editingTemplate.id, templateForm);
    } else {
      saveEmailTemplate(templateForm);
      success = true;
    }

    if (success) {
      toast({ title: `Template ${editingTemplate ? "updated" : "created"}` });
      setSettings(loadCommunicationSettings());
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    } else {
      toast({ title: "Failed to save template", variant: "destructive" });
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      type: template.type,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      variables: template.variables,
      isDefault: template.isDefault,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    const success = deleteEmailTemplate(id);
    if (success) {
      toast({ title: "Template deleted" });
      setSettings(loadCommunicationSettings());
    } else {
      toast({ title: "Failed to delete template", variant: "destructive" });
    }
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      type: "custom",
      subject: "",
      htmlBody: "",
      textBody: "",
      variables: [],
      isDefault: false,
    });
    setEditingTemplate(null);
  };

  const processPreview = () => {
    if (!previewTemplate) return "";

    const variables = {
      patient_name: "Buddy",
      patient_id: "PAT-001",
      case_id: "VET-2024-12345",
      test_type: "CBC Bloodwork",
      test_name: "Complete Blood Count",
      species: "Dog",
      urgency: "Routine",
      clinic_name: settings?.branding.clinicName || "Veti-Vision Animal Care",
      upload_url: "https://your-clinic.com/upload-portal/sample-token",
      primary_color: settings?.branding.primaryColor || "#0d9488",
      secondary_color: settings?.branding.secondaryColor || "#065f46",
    };

    const processed = processTemplate(previewTemplate, variables);
    return processed.htmlBody;
  };

  const getTemplateTypeLabel = (type: EmailTemplate['type']) => {
    const labels = {
      lab_request: "Lab Request",
      bloodwork_request: "Bloodwork",
      imaging_request: "Imaging",
      general_upload: "General Upload",
      custom: "Custom",
    };
    return labels[type];
  };

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-teal-600" />
            Communications Settings
          </h1>
          <p className="text-muted-foreground">Manage email templates, SMTP configuration, and branding</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/settings")}>
          <Settings className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="smtp">SMTP Configuration</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
        </TabsList>

        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Templates
                  </CardTitle>
                  <CardDescription>
                    Create and manage email templates for lab requests and communications
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  resetTemplateForm();
                  setIsTemplateDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="outline">{getTemplateTypeLabel(template.type)}</Badge>
                          {template.isDefault && (
                            <Badge className="bg-teal-100 text-teal-800">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{template.subject}</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable) => (
                            <Badge key={variable} variant="secondary" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.variables.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handlePreviewTemplate(template)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteTemplate(template.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Configuration Tab */}
        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                SMTP Configuration
              </CardTitle>
              <CardDescription>
                Configure your email server settings to send automated communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) })}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input
                    id="smtp-username"
                    value={smtpForm.username}
                    onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                    placeholder="your-email@clinic.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={smtpForm.password}
                    onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                    placeholder="App password or SMTP password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-encryption">Encryption</Label>
                  <Select value={smtpForm.encryption} onValueChange={(value: any) => setSmtpForm({ ...smtpForm, encryption: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-from">From Email</Label>
                  <Input
                    id="smtp-from"
                    value={smtpForm.fromEmail}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                    placeholder="noreply@clinic.com"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="smtp-from-name">From Name</Label>
                  <Input
                    id="smtp-from-name"
                    value={smtpForm.fromName}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                    placeholder={settings.branding.clinicName}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="smtp-reply-to">Reply To (Optional)</Label>
                  <Input
                    id="smtp-reply-to"
                    value={smtpForm.replyTo || ""}
                    onChange={(e) => setSmtpForm({ ...smtpForm, replyTo: e.target.value })}
                    placeholder="support@clinic.com"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleSaveSMTP}>
                  <Save className="h-4 w-4 mr-2" />
                  Save SMTP Configuration
                </Button>
                <Button variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>
                Customize the appearance of your email templates and communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic-name">Clinic Name</Label>
                  <Input
                    id="clinic-name"
                    value={brandingForm.clinicName}
                    onChange={(e) => setBrandingForm({ ...brandingForm, clinicName: e.target.value })}
                    placeholder="Veti-Vision Animal Care"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo URL (Optional)</Label>
                  <Input
                    id="logo-url"
                    value={brandingForm.logoUrl || ""}
                    onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                    placeholder="https://your-clinic.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                      placeholder="#0d9488"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={brandingForm.secondaryColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={brandingForm.secondaryColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                      placeholder="#065f46"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Preview</h4>
                <div className="border rounded-lg p-4">
                  <div 
                    className="p-4 rounded text-white text-center font-bold"
                    style={{ background: `linear-gradient(135deg, ${brandingForm.primaryColor}, ${brandingForm.secondaryColor})` }}
                  >
                    {brandingForm.clinicName}
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveBranding}>
                <Save className="h-4 w-4 mr-2" />
                Save Branding Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure general communication preferences and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-notifications">Auto-send Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send email notifications when lab results are received
                  </p>
                </div>
                <Switch
                  id="auto-notifications"
                  checked={settings.autoSendNotifications}
                  onCheckedChange={(checked) => {
                    const updatedSettings = { ...settings, autoSendNotifications: checked };
                    saveCommunicationSettings(updatedSettings);
                    setSettings(updatedSettings);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Email Template" : "Create Email Template"}
            </DialogTitle>
            <DialogDescription>
              Design your email template with dynamic variables
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Lab Results Request"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-type">Template Type</Label>
                <Select value={templateForm.type} onValueChange={(value: any) => setTemplateForm({ ...templateForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lab_request">Lab Request</SelectItem>
                    <SelectItem value="bloodwork_request">Bloodwork Request</SelectItem>
                    <SelectItem value="imaging_request">Imaging Request</SelectItem>
                    <SelectItem value="general_upload">General Upload</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject Line</Label>
              <Input
                id="template-subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Action Required - {{patient_name}} (Case #{{case_id}})"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-html">HTML Body</Label>
              <Textarea
                id="template-html"
                value={templateForm.htmlBody}
                onChange={(e) => setTemplateForm({ ...templateForm, htmlBody: e.target.value })}
                placeholder="HTML email content with {{variables}}"
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-text">Text Body (Plain Text)</Label>
              <Textarea
                id="template-text"
                value={templateForm.textBody}
                onChange={(e) => setTemplateForm({ ...templateForm, textBody: e.target.value })}
                placeholder="Plain text version for email clients that don't support HTML"
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="template-default"
                checked={templateForm.isDefault}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isDefault: checked })}
              />
              <Label htmlFor="template-default">Set as default template</Label>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">Available Variables:</h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {["patient_name", "patient_id", "case_id", "test_type", "test_name", "species", "urgency", "clinic_name", "upload_url", "primary_color", "secondary_color"].map((variable) => (
                  <Badge key={variable} variant="secondary" className="font-mono">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateForm.name || !templateForm.subject}>
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will look to recipients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                Email Preview
              </div>
              <div 
                className="p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: processPreview() }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Communications Settings Store
// Manages email templates, SMTP configuration, and communication preferences

export interface EmailTemplate {
  id: string;
  name: string;
  type: "lab_request" | "bloodwork_request" | "imaging_request" | "general_upload" | "custom";
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: "none" | "ssl" | "tls";
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export interface CommunicationSettings {
  smtp: SMTPConfig;
  templates: EmailTemplate[];
  defaultTemplateId?: string;
  autoSendNotifications: boolean;
  branding: {
    clinicName: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

const COMMUNICATIONS_KEY = "acf_communications";

// Default templates
const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: "Lab Results Request",
    type: "lab_request",
    subject: "Action Required - Diagnostic Results for {{patient_name}} (Case #{{case_id}})",
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnostic Results Request - {{clinic_name}}</title>
  <style>
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, {{primary_color}}, {{secondary_color}}); color: white; padding: 32px 28px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px 28px; }
    .patient-card { background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .patient-card .avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #0d9488, #059669); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; }
    .upload-button { display: block; width: 100%; background: linear-gradient(135deg, {{primary_color}}, {{secondary_color}}); color: white; padding: 18px 24px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; text-align: center; margin: 24px 0; box-shadow: 0 10px 25px -5px rgba(13,148,136,0.4); }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 32px; padding: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔬 Diagnostic Results Request</h1>
      <p>{{clinic_name}} • Case #{{case_id}}</p>
    </div>
    
    <div class="content">
      <div class="patient-card">
        <h3>{{patient_name}}</h3>
        <p>Species: {{species}} • Patient ID: {{patient_id}}</p>
        <p>Test: {{test_type}} • Urgency: {{urgency}}</p>
      </div>

      <p>Please use the secure link below to upload diagnostic results for <strong>{{patient_name}}</strong>.</p>

      <a href="{{upload_url}}" class="upload-button">
        📤 UPLOAD SECURE DOCUMENTS
      </a>

      <div class="info-box">
        <h4>Important Information</h4>
        <ul>
          <li>This link is valid for 24 hours and can only be used once</li>
          <li>Supported formats: PDF, JPG, PNG, TIFF, DICOM</li>
          <li>Maximum file size: 10MB per file</li>
        </ul>
      </div>

      <p>If you have questions, please reply to this email.</p>
    </div>

    <div class="footer">
      <p><strong>{{clinic_name}}</strong></p>
      <p>Professional Veterinary Care • Digital Health Records</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `{{clinic_name}} - Diagnostic Results Request

Dear Lab Team,

Please upload diagnostic results for:

Patient: {{patient_name}}
Species: {{species}}
Test: {{test_type}}
Urgency: {{urgency}}
Case ID: #{{case_id}}

Upload Link: {{upload_url}}

This link is valid for 24 hours and can only be used once.

Best regards,
{{clinic_name}}`,
    variables: ["patient_name", "patient_id", "case_id", "test_type", "urgency", "species", "clinic_name", "upload_url", "primary_color", "secondary_color"],
    isDefault: true,
  },
  {
    name: "Bloodwork Request",
    type: "bloodwork_request",
    subject: "Bloodwork Results Request - {{patient_name}} ({{test_name}})",
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bloodwork Request - {{clinic_name}}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .blood-icon { font-size: 48px; margin-bottom: 16px; }
    .upload-btn { display: inline-block; background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="blood-icon">🩸</div>
    <h1>Bloodwork Results Request</h1>
    <p>{{clinic_name}} • Case #{{case_id}}</p>
  </div>
  
  <div class="content">
    <h3>Patient: {{patient_name}}</h3>
    <p><strong>Test:</strong> {{test_name}}</p>
    <p><strong>Species:</strong> {{species}}</p>
    <p><strong>Urgency:</strong> {{urgency}}</p>
    
    <p>Please upload the bloodwork results using the secure link below:</p>
    
    <a href="{{upload_url}}" class="upload-btn">📤 Upload Results</a>
    
    <p><small>This link expires in 24 hours and is for one-time use only.</small></p>
  </div>
</body>
</html>`,
    textBody: `Bloodwork Request - {{clinic_name}}

Patient: {{patient_name}}
Test: {{test_name}}
Species: {{species}}
Urgency: {{urgency}}

Upload Link: {{upload_url}}

This link expires in 24 hours.`,
    variables: ["patient_name", "test_name", "species", "urgency", "case_id", "clinic_name", "upload_url"],
    isDefault: false,
  },
  {
    name: "Imaging Request",
    type: "imaging_request",
    subject: "Imaging Results Request - {{patient_name}} ({{test_type}})",
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Imaging Request - {{clinic_name}}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .imaging-icon { font-size: 48px; margin-bottom: 16px; }
    .upload-btn { display: inline-block; background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="imaging-icon">📷</div>
    <h1>Imaging Results Request</h1>
    <p>{{clinic_name}} • Case #{{case_id}}</p>
  </div>
  
  <div class="content">
    <h3>Patient: {{patient_name}}</h3>
    <p><strong>Test Type:</strong> {{test_type}}</p>
    <p><strong>Species:</strong> {{species}}</p>
    <p><strong>Urgency:</strong> {{urgency}}</p>
    
    <p>Please upload the imaging results using the secure link below:</p>
    
    <a href="{{upload_url}}" class="upload-btn">📤 Upload Images</a>
    
    <p><small>This link expires in 24 hours and is for one-time use only.</small></p>
  </div>
</body>
</html>`,
    textBody: `Imaging Request - {{clinic_name}}

Patient: {{patient_name}}
Test Type: {{test_type}}
Species: {{species}}
Urgency: {{urgency}}

Upload Link: {{upload_url}}

This link expires in 24 hours.`,
    variables: ["patient_name", "test_type", "species", "urgency", "case_id", "clinic_name", "upload_url"],
    isDefault: false,
  },
];

// Load communications settings
export function loadCommunicationSettings(): CommunicationSettings {
  try {
    const raw = localStorage.getItem(COMMUNICATIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  // Return default settings
  const now = new Date().toISOString();
  const defaultTemplates: EmailTemplate[] = DEFAULT_TEMPLATES.map((template, index) => ({
    ...template,
    id: `template-${Date.now()}-${index}`,
    createdAt: now,
    updatedAt: now,
  }));

  return {
    smtp: {
      host: "",
      port: 587,
      username: "",
      password: "",
      encryption: "tls",
      fromEmail: "",
      fromName: "",
      replyTo: "",
    },
    templates: defaultTemplates,
    defaultTemplateId: defaultTemplates[0]?.id,
    autoSendNotifications: true,
    branding: {
      clinicName: "Veti-Vision Animal Care",
      primaryColor: "#0d9488",
      secondaryColor: "#065f46",
    },
  };
}

// Save communications settings
export function saveCommunicationSettings(settings: CommunicationSettings): void {
  try {
    localStorage.setItem(COMMUNICATIONS_KEY, JSON.stringify(settings));
  } catch {}
}

// Update SMTP configuration
export function updateSMTPConfig(config: Partial<SMTPConfig>): boolean {
  try {
    const settings = loadCommunicationSettings();
    settings.smtp = { ...settings.smtp, ...config };
    saveCommunicationSettings(settings);
    return true;
  } catch {
    return false;
  }
}

// Save email template
export function saveEmailTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate {
  const settings = loadCommunicationSettings();
  const now = new Date().toISOString();
  
  const newTemplate: EmailTemplate = {
    ...template,
    id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };

  settings.templates.push(newTemplate);
  
  // If this is the first template or marked as default, update default
  if (!settings.defaultTemplateId || template.isDefault) {
    // Unmark other templates as default
    settings.templates.forEach(t => t.isDefault = false);
    newTemplate.isDefault = true;
    settings.defaultTemplateId = newTemplate.id;
  }

  saveCommunicationSettings(settings);
  return newTemplate;
}

// Update email template
export function updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): boolean {
  try {
    const settings = loadCommunicationSettings();
    const index = settings.templates.findIndex(t => t.id === id);
    if (index < 0) return false;

    settings.templates[index] = {
      ...settings.templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If marked as default, unmark others
    if (updates.isDefault) {
      settings.templates.forEach((t, i) => {
        if (i !== index) t.isDefault = false;
      });
      settings.defaultTemplateId = id;
    }

    saveCommunicationSettings(settings);
    return true;
  } catch {
    return false;
  }
}

// Delete email template
export function deleteEmailTemplate(id: string): boolean {
  try {
    const settings = loadCommunicationSettings();
    const index = settings.templates.findIndex(t => t.id === id);
    if (index < 0) return false;

    settings.templates.splice(index, 1);

    // If deleted template was default, set new default
    if (settings.defaultTemplateId === id && settings.templates.length > 0) {
      settings.templates[0].isDefault = true;
      settings.defaultTemplateId = settings.templates[0].id;
    }

    saveCommunicationSettings(settings);
    return true;
  } catch {
    return false;
  }
}

// Get template by ID
export function getEmailTemplate(id: string): EmailTemplate | null {
  const settings = loadCommunicationSettings();
  return settings.templates.find(t => t.id === id) || null;
}

// Get default template
export function getDefaultEmailTemplate(): EmailTemplate | null {
  const settings = loadCommunicationSettings();
  if (!settings.defaultTemplateId) return null;
  return getEmailTemplate(settings.defaultTemplateId);
}

// Get templates by type
export function getEmailTemplatesByType(type: EmailTemplate['type']): EmailTemplate[] {
  const settings = loadCommunicationSettings();
  return settings.templates.filter(t => t.type === type);
}

// Process template variables
export function processTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; htmlBody: string; textBody: string } {
  const processText = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
  };

  return {
    subject: processText(template.subject),
    htmlBody: processText(template.htmlBody),
    textBody: processText(template.textBody),
  };
}

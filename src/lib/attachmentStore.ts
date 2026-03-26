// Attachment management with generative upload links
// Supports 24-hour expiry, one-time use links for external uploads

export interface Attachment {
  id: string;
  patientId: string;
  encounterId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: "lab" | "imaging" | "photo" | "document" | "other";
  uploadedBy: "clinic" | "external";
  uploadedByName?: string;
  uploadedAt: string;
  description?: string;
  // For external uploads via generative link
  uploadToken?: string;
  expiresAt?: string;
  isUsed?: boolean;
}

export interface UploadLink {
  token: string;
  patientId: string;
  patientName: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  description?: string;
  category: Attachment["category"];
}

const ATTACHMENTS_KEY = "acf_attachments";
const UPLOAD_LINKS_KEY = "acf_upload_links";
const ATTACHMENTS_CHANNEL = "acf_attachments_channel";
const ATTACHMENTS_EVENT = "acf_attachments_updated";

// ── Attachments CRUD ─────────────────────────────────────────────────────────

export function loadAttachments(patientId?: string): Attachment[] {
  try {
    const raw = localStorage.getItem(ATTACHMENTS_KEY);
    const all = raw ? (JSON.parse(raw) as Attachment[]) : [];
    return patientId ? all.filter(a => a.patientId === patientId) : all;
  } catch {
    return [];
  }
}

export function saveAttachment(attachment: Attachment): void {
  try {
    const existing = loadAttachments();
    existing.unshift(attachment);
    localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(existing));
    broadcastAttachmentUpdate();
  } catch {}
}

export function deleteAttachment(id: string): boolean {
  try {
    const existing = loadAttachments();
    const filtered = existing.filter(a => a.id !== id);
    if (filtered.length === existing.length) return false;
    localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(filtered));
    broadcastAttachmentUpdate();
    return true;
  } catch {
    return false;
  }
}

// ── Upload Links (Generative) ────────────────────────────────────────────────

export function generateUploadLink(
  patientId: string,
  patientName: string,
  createdBy: string,
  category: Attachment["category"],
  description?: string,
  expiryHours: number = 24
): UploadLink {
  const token = `link-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

  const link: UploadLink = {
    token,
    patientId,
    patientName,
    createdBy,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isUsed: false,
    description,
    category,
  };

  try {
    const existing = loadUploadLinks();
    existing.unshift(link);
    localStorage.setItem(UPLOAD_LINKS_KEY, JSON.stringify(existing));
    broadcastAttachmentUpdate();
  } catch {}

  return link;
}

export function loadUploadLinks(patientId?: string): UploadLink[] {
  try {
    const raw = localStorage.getItem(UPLOAD_LINKS_KEY);
    const all = raw ? (JSON.parse(raw) as UploadLink[]) : [];
    return patientId ? all.filter(l => l.patientId === patientId) : all;
  } catch {
    return [];
  }
}

export function getUploadLink(token: string): UploadLink | null {
  return loadUploadLinks().find(l => l.token === token) || null;
}

export function validateUploadLink(token: string): { valid: boolean; reason?: string; link?: UploadLink } {
  const link = getUploadLink(token);
  if (!link) return { valid: false, reason: "Invalid or expired link" };
  if (link.isUsed) return { valid: false, reason: "This link has already been used" };
  if (new Date(link.expiresAt) < new Date()) return { valid: false, reason: "This link has expired" };
  return { valid: true, link };
}

export function markLinkAsUsed(token: string): boolean {
  try {
    const links = loadUploadLinks();
    const idx = links.findIndex(l => l.token === token);
    if (idx < 0 || links[idx].isUsed) return false;
    links[idx].isUsed = true;
    links[idx].usedAt = new Date().toISOString();
    localStorage.setItem(UPLOAD_LINKS_KEY, JSON.stringify(links));
    broadcastAttachmentUpdate();
    return true;
  } catch {
    return false;
  }
}

export function cleanupExpiredLinks(): void {
  try {
    const links = loadUploadLinks();
    const now = new Date();
    const active = links.filter(l => !l.isUsed && new Date(l.expiresAt) > now);
    localStorage.setItem(UPLOAD_LINKS_KEY, JSON.stringify(active));
  } catch {}
}

// ── Broadcast (same-tab + cross-tab) ───────────────────────────────────────────

let _channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel {
  if (!_channel) _channel = new BroadcastChannel(ATTACHMENTS_CHANNEL);
  return _channel;
}

export function broadcastAttachmentUpdate(): void {
  window.dispatchEvent(new CustomEvent(ATTACHMENTS_EVENT));
  try {
    getChannel().postMessage({ type: ATTACHMENTS_EVENT });
  } catch {}
}

export function subscribeToAttachments(cb: () => void): () => void {
  const onEvent = () => cb();
  window.addEventListener(ATTACHMENTS_EVENT, onEvent);

  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(ATTACHMENTS_CHANNEL);
    ch.onmessage = () => cb();
  } catch {}

  return () => {
    window.removeEventListener(ATTACHMENTS_EVENT, onEvent);
    ch?.close();
  };
}

// ── Email Template ────────────────────────────────────────────────────────────

export function generateUploadEmailTemplate(
  patientName: string,
  uploadUrl: string,
  clinicName: string = "Veti-Vision Animal Care",
  description?: string
): { subject: string; body: string; html: string } {
  const subject = `Upload Documents for ${patientName} - ${clinicName}`;

  const body = `Dear Pet Owner,

We need you to upload documents/lab results for ${patientName}.

${description ? `Details: ${description}\n\n` : ""}Please use the secure link below to upload your files:

${uploadUrl}

Important:
- This link is valid for 24 hours only
- You can only use this link once
- Supported formats: PDF, JPG, PNG, TIFF
- Maximum file size: 10MB per file

If you have any questions, please contact us.

Best regards,
${clinicName}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0d9488; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #0f766e; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📎 Document Upload Required</h1>
  </div>
  <div class="content">
    <p>Dear Pet Owner,</p>
    <p>We need you to upload documents/lab results for <strong>${patientName}</strong>.</p>
    ${description ? `<p><strong>Details:</strong> ${description}</p>` : ""}
    <p style="text-align: center;">
      <a href="${uploadUrl}" class="button">Upload Documents Now</a>
    </p>
    <div class="warning">
      <strong>⚠️ Important:</strong>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>This link is valid for <strong>24 hours only</strong></li>
        <li>You can only use this link <strong>once</strong></li>
        <li>Supported formats: PDF, JPG, PNG, TIFF (Max 10MB)</li>
      </ul>
    </div>
    <p>If the button doesn't work, copy and paste this link:</p>
    <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-size: 12px;">${uploadUrl}</p>
  </div>
  <div class="footer">
    <p>Best regards,<br><strong>${clinicName}</strong></p>
    <p style="font-size: 11px;">This is an automated message. Please do not reply directly to this email.</p>
  </div>
</body>
</html>`;

  return { subject, body, html };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getCategoryLabel(category: Attachment["category"]): string {
  const labels: Record<Attachment["category"], string> = {
    lab: "Lab Results",
    imaging: "Imaging (X-rays, etc.)",
    photo: "Photos",
    document: "Documents",
    other: "Other",
  };
  return labels[category];
}

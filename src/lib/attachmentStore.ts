// Attachment management with generative upload links
// Supports 24-hour expiry, one-time use links for external uploads
// Includes pending-lab-test tracking with auto-clear on external upload

// ── Types ────────────────────────────────────────────────────────────────────

export type AttachmentCategory = "lab" | "imaging" | "photo" | "document" | "other";
export type RecipientType = "lab" | "owner" | "specialist" | "other";
export type LabTestStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Attachment {
  id: string;
  patientId: string;
  encounterId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: AttachmentCategory;
  uploadedBy: "clinic" | "external";
  uploadedByName?: string;
  uploadedAt: string;
  description?: string;
  uploadToken?: string;
  expiresAt?: string;
  isUsed?: boolean;
  // New fields for lab-test binding
  labTestId?: string;
  labOrderId?: string;
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
  category: AttachmentCategory;
  // New fields
  recipientType: RecipientType;
  recipientName?: string;
  recipientEmail?: string;
  encounterId?: string;
  labTestIds?: string[];        // linked pending lab tests to auto-clear
  urgency?: "routine" | "urgent" | "stat";
}

export type LabDestination = "internal" | "external";

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  encounterId?: string;
  appointmentId?: string;
  testName: string;
  testCode?: string;
  testType: "bloodwork" | "imaging" | "pathology" | "cytology" | "other";
  orderedBy: string;
  orderedAt: string;
  status: LabTestStatus;
  completedAt?: string;
  labName?: string;
  labDestination?: LabDestination;
  labEmail?: string;
  uploadLinkToken?: string;
  uploadToken?: string; // Session-tokenized URL
  uploadExpiresAt?: string;
  notes?: string;
  urgency: "routine" | "urgent" | "stat";
  species: string;
  caseId: string;
}

export interface PendingLabTest {
  id: string;
  patientId: string;
  patientName: string;
  encounterId?: string;
  testName: string;
  testCode?: string;
  orderedBy: string;
  orderedAt: string;
  status: LabTestStatus;
  completedAt?: string;
  labName?: string;
  uploadLinkToken?: string;
  notes?: string;
  urgency: "routine" | "urgent" | "stat";
}

const ATTACHMENTS_KEY = "acf_attachments";
const UPLOAD_LINKS_KEY = "acf_upload_links";
const PENDING_LABS_KEY = "acf_pending_labs";
const LAB_ORDERS_KEY = "acf_lab_orders";
const ATTACHMENTS_CHANNEL = "acf_attachments_channel";
const ATTACHMENTS_EVENT = "acf_attachments_updated";
const PENDING_LABS_EVENT = "acf_pending_labs_updated";
const LAB_ORDERS_EVENT = "acf_lab_orders_updated";

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
  category: AttachmentCategory,
  opts?: {
    description?: string;
    expiryHours?: number;
    recipientType?: RecipientType;
    recipientName?: string;
    recipientEmail?: string;
    encounterId?: string;
    labTestIds?: string[];
    urgency?: "routine" | "urgent" | "stat";
  }
): UploadLink {
  const token = `link-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const now = new Date();
  const expiryHours = opts?.expiryHours ?? 24;
  const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

  const link: UploadLink = {
    token,
    patientId,
    patientName,
    createdBy,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isUsed: false,
    description: opts?.description,
    category,
    recipientType: opts?.recipientType ?? "owner",
    recipientName: opts?.recipientName,
    recipientEmail: opts?.recipientEmail,
    encounterId: opts?.encounterId,
    labTestIds: opts?.labTestIds,
    urgency: opts?.urgency ?? "routine",
  };

  // Link pending lab tests to this upload link
  if (opts?.labTestIds?.length) {
    for (const ltId of opts.labTestIds) {
      updatePendingLabTest(ltId, { status: "in_progress", uploadLinkToken: token });
    }
  }

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

// ── Pending Lab Tests CRUD ──────────────────────────────────────────────────

export function loadPendingLabTests(patientId?: string): PendingLabTest[] {
  try {
    const raw = localStorage.getItem(PENDING_LABS_KEY);
    const all = raw ? (JSON.parse(raw) as PendingLabTest[]) : [];
    return patientId ? all.filter(t => t.patientId === patientId) : all;
  } catch {
    return [];
  }
}

export function savePendingLabTest(test: PendingLabTest): void {
  try {
    const existing = loadPendingLabTests();
    existing.unshift(test);
    localStorage.setItem(PENDING_LABS_KEY, JSON.stringify(existing));
    broadcastPendingLabsUpdate();
  } catch {}
}

export function updatePendingLabTest(id: string, updates: Partial<PendingLabTest>): boolean {
  try {
    const all = loadPendingLabTests();
    const idx = all.findIndex(t => t.id === id);
    if (idx < 0) return false;
    all[idx] = { ...all[idx], ...updates };
    localStorage.setItem(PENDING_LABS_KEY, JSON.stringify(all));
    broadcastPendingLabsUpdate();
    return true;
  } catch {
    return false;
  }
}

export function deletePendingLabTest(id: string): boolean {
  try {
    const all = loadPendingLabTests();
    const filtered = all.filter(t => t.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(PENDING_LABS_KEY, JSON.stringify(filtered));
    broadcastPendingLabsUpdate();
    return true;
  } catch {
    return false;
  }
}

export function clearPendingLabsByToken(token: string): PendingLabTest[] {
  const all = loadPendingLabTests();
  const cleared: PendingLabTest[] = [];
  const updated = all.map(t => {
    if (t.uploadLinkToken === token && t.status !== "completed") {
      cleared.push(t);
      return { ...t, status: "completed" as LabTestStatus, completedAt: new Date().toISOString() };
    }
    return t;
  });
  localStorage.setItem(PENDING_LABS_KEY, JSON.stringify(updated));
  broadcastPendingLabsUpdate();
  return cleared;
}

export function clearPendingLabsByIds(ids: string[]): PendingLabTest[] {
  const all = loadPendingLabTests();
  const cleared: PendingLabTest[] = [];
  const updated = all.map(t => {
    if (ids.includes(t.id) && t.status !== "completed") {
      cleared.push(t);
      return { ...t, status: "completed" as LabTestStatus, completedAt: new Date().toISOString() };
    }
    return t;
  });
  localStorage.setItem(PENDING_LABS_KEY, JSON.stringify(updated));
  broadcastPendingLabsUpdate();
  return cleared;
}

function broadcastPendingLabsUpdate(): void {
  window.dispatchEvent(new CustomEvent(PENDING_LABS_EVENT));
  try {
    getChannel().postMessage({ type: PENDING_LABS_EVENT });
  } catch {}
}

export function subscribeToPendingLabs(cb: () => void): () => void {
  const onEvent = () => cb();
  window.addEventListener(PENDING_LABS_EVENT, onEvent);
  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(ATTACHMENTS_CHANNEL);
    ch.onmessage = (e) => { if (e.data?.type === PENDING_LABS_EVENT) cb(); };
  } catch {}
  return () => {
    window.removeEventListener(PENDING_LABS_EVENT, onEvent);
    ch?.close();
  };
}

// ── Lab Orders CRUD ─────────────────────────────────────────────────────────────

export function loadLabOrders(patientId?: string): LabOrder[] {
  try {
    const raw = localStorage.getItem(LAB_ORDERS_KEY);
    const all = raw ? (JSON.parse(raw) as LabOrder[]) : [];
    return patientId ? all.filter(o => o.patientId === patientId) : all;
  } catch {
    return [];
  }
}

export function saveLabOrder(order: LabOrder): void {
  try {
    const existing = loadLabOrders();
    const idx = existing.findIndex(o => o.id === order.id);
    if (idx >= 0) {
      existing[idx] = order;
    } else {
      existing.unshift(order);
    }
    localStorage.setItem(LAB_ORDERS_KEY, JSON.stringify(existing));
    broadcastLabOrderUpdate();
  } catch {}
}

export function updateLabOrder(id: string, updates: Partial<LabOrder>): boolean {
  try {
    const orders = loadLabOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx < 0) return false;
    orders[idx] = { ...orders[idx], ...updates };
    localStorage.setItem(LAB_ORDERS_KEY, JSON.stringify(orders));
    broadcastLabOrderUpdate();
    return true;
  } catch {
    return false;
  }
}

export function deleteLabOrder(id: string): boolean {
  try {
    const orders = loadLabOrders();
    const filtered = orders.filter(o => o.id !== id);
    if (filtered.length === orders.length) return false;
    localStorage.setItem(LAB_ORDERS_KEY, JSON.stringify(filtered));
    broadcastLabOrderUpdate();
    return true;
  } catch {
    return false;
  }
}

export function getLabOrder(id: string): LabOrder | null {
  return loadLabOrders().find(o => o.id === id) || null;
}

export function generateSessionToken(): string {
  const timestamp = Date.now();
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `lab-${timestamp}-${randomBytes}`;
}

export function generateLabUploadToken(orderId: string, expiresInHours: number = 24): { token: string; expiresAt: string } {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
  
  // Update the lab order with the token
  updateLabOrder(orderId, { uploadToken: token, uploadExpiresAt: expiresAt });
  
  return { token, expiresAt };
}

export function validateLabUploadToken(token: string): { valid: boolean; reason?: string; order?: LabOrder } {
  const order = loadLabOrders().find(o => o.uploadToken === token);
  if (!order) return { valid: false, reason: "Invalid or expired upload token" };
  if (!order.uploadExpiresAt) return { valid: false, reason: "Token has no expiry" };
  if (new Date(order.uploadExpiresAt) < new Date()) return { valid: false, reason: "Upload token has expired" };
  if (order.status === "completed") return { valid: false, reason: "Lab order already completed" };
  return { valid: true, order };
}

export function completeLabOrder(orderId: string, attachmentIds: string[], labNotes?: string): boolean {
  try {
    const order = getLabOrder(orderId);
    if (!order) return false;
    
    const success = updateLabOrder(orderId, {
      status: "completed",
      completedAt: new Date().toISOString(),
      notes: labNotes ? (order.notes ? `${order.notes}\n\nLab Notes: ${labNotes}` : labNotes) : order.notes,
      uploadToken: undefined, // Clear the token
      uploadExpiresAt: undefined,
    });
    
    if (success) {
      // Dispatch real-time notification with rich metadata
      const urgencyPrefix = order.urgency === "stat" ? "[STAT] " : order.urgency === "urgent" ? "[URGENT] " : "";
      
      window.dispatchEvent(new CustomEvent("acf:notification", {
        detail: {
          type: order.urgency === "stat" ? "critical" : order.urgency === "urgent" ? "warning" : "success",
          message: `${urgencyPrefix}New Results: ${order.patientName} - ${order.testName}`,
          patientId: order.patientId,
          patientName: order.patientName,
          targetRoles: ["SuperAdmin", "Vet", "Nurse"],
          metadata: {
            orderId: order.id,
            testName: order.testName,
            testType: order.testType,
            urgency: order.urgency,
            caseId: order.caseId,
            labName: order.labName,
            attachmentIds: attachmentIds,
            completedAt: new Date().toISOString(),
            actionUrl: `/records/new?patient=${order.patientId}`,
          }
        }
      }));
      
      // Update linked attachments to reference this lab order
      attachmentIds.forEach(attachmentId => {
        // Update the attachment to reference the completed lab order
        const attachments = loadAttachments();
        const attachment = attachments.find(a => a.id === attachmentId);
        if (attachment) {
          attachment.labOrderId = orderId;
          // In a real implementation, you'd save this back to storage
          localStorage.setItem('acf_attachments', JSON.stringify(attachments));
        }
      });
    }
    
    return success;
  } catch {
    return false;
  }
}

export function broadcastLabOrderUpdate(): void {
  window.dispatchEvent(new CustomEvent(LAB_ORDERS_EVENT));
  try {
    const channel = new BroadcastChannel(ATTACHMENTS_CHANNEL);
    channel.postMessage({ type: LAB_ORDERS_EVENT });
  } catch {}
}

export function subscribeToLabOrders(cb: () => void): () => void {
  const onEvent = () => cb();
  window.addEventListener(LAB_ORDERS_EVENT, onEvent);

  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(ATTACHMENTS_CHANNEL);
    ch.onmessage = () => cb();
  } catch {}

  return () => {
    window.removeEventListener(LAB_ORDERS_EVENT, onEvent);
    ch?.close();
  };
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
  description?: string,
  opts?: {
    recipientType?: RecipientType;
    recipientName?: string;
    labTestNames?: string[];
    urgency?: "routine" | "urgent" | "stat";
    expiryHours?: number;
  }
): { subject: string; body: string; html: string } {
  const recipientType = opts?.recipientType ?? "owner";
  const recipientName = opts?.recipientName;
  const urgency = opts?.urgency ?? "routine";
  const expiryLabel = `${opts?.expiryHours ?? 24} hours`;

  const isLab = recipientType === "lab";
  const isSpecialist = recipientType === "specialist";
  const greeting = recipientName
    ? `Dear ${recipientName},`
    : isLab ? "Dear Laboratory Team," : isSpecialist ? "Dear Specialist," : "Dear Pet Owner,";

  const testList = opts?.labTestNames?.length
    ? `\nRequested tests/results:\n${opts.labTestNames.map(t => `  - ${t}`).join("\n")}\n` : "";

  const urgencyNote = urgency === "stat" ? "\n** STAT — Results needed as soon as possible **\n"
    : urgency === "urgent" ? "\n** URGENT — Please prioritize this upload **\n" : "";

  const subject = isLab
    ? `${urgency === "stat" ? "[STAT] " : urgency === "urgent" ? "[URGENT] " : ""}Lab Results Upload — ${patientName} — ${clinicName}`
    : `Upload Documents for ${patientName} — ${clinicName}`;

  const body = `${greeting}
${urgencyNote}
${isLab ? `Please upload the lab results for patient ${patientName}.` : `We need you to upload documents for ${patientName}.`}
${testList}
${description ? `Details: ${description}\n` : ""}Please use the secure link below to upload your files:

${uploadUrl}

Important:
- This link is valid for ${expiryLabel} only
- You can only use this link once
- Supported formats: PDF, JPG, PNG, TIFF, DICOM
- Maximum file size: 10MB per file

If you have any questions, please contact us.

Best regards,
${clinicName}`;

  const urgencyBanner = urgency === "stat"
    ? `<div style="background:#dc2626;color:#fff;padding:10px 20px;text-align:center;font-weight:bold;font-size:14px;letter-spacing:1px;">⚡ STAT — IMMEDIATE ATTENTION REQUIRED</div>`
    : urgency === "urgent"
    ? `<div style="background:#f59e0b;color:#fff;padding:10px 20px;text-align:center;font-weight:bold;font-size:14px;letter-spacing:1px;">⚠️ URGENT — PRIORITY UPLOAD</div>`
    : "";

  const testListHtml = opts?.labTestNames?.length
    ? `<div style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px;margin:15px 0;">
        <strong>Requested Results:</strong>
        <ul style="margin:8px 0;padding-left:20px;">${opts.labTestNames.map(t => `<li>${t}</li>`).join("")}</ul>
      </div>` : "";

  const headerTitle = isLab ? "🔬 Lab Results Upload Required" : isSpecialist ? "📋 Specialist Report Upload" : "📎 Document Upload Required";

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d9488, #065f46); color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 6px 0 0; opacity: 0.9; font-size: 13px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
    .patient-card { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 14px; margin: 16px 0; display: flex; align-items: center; gap: 12px; }
    .patient-card .avatar { width: 44px; height: 44px; border-radius: 50%; background: #0d9488; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; }
    .button { display: inline-block; background: linear-gradient(135deg, #0d9488, #0f766e); color: white; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; font-size: 15px; box-shadow: 0 4px 14px rgba(13,148,136,0.3); }
    .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 15px 0; border-radius: 0 6px 6px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  ${urgencyBanner}
  <div class="header">
    <h1>${headerTitle}</h1>
    <p>Secure one-time upload portal</p>
  </div>
  <div class="content">
    <p>${greeting}</p>
    <p>${isLab ? `Please upload the laboratory results for the following patient:` : isSpecialist ? `Please upload your specialist report for:` : `We need you to upload documents for:`}</p>
    <div class="patient-card">
      <div class="avatar">${patientName.charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-weight:600;font-size:15px;">${patientName}</div>
        <div style="font-size:12px;color:#6b7280;">Patient at ${clinicName}</div>
      </div>
    </div>
    ${testListHtml}
    ${description ? `<p style="background:#f3f4f6;padding:12px;border-radius:6px;"><strong>Instructions:</strong> ${description}</p>` : ""}
    <p style="text-align: center;">
      <a href="${uploadUrl}" class="button">Upload Documents Now</a>
    </p>
    <div class="warning">
      <strong>⚠️ Important:</strong>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>This link is valid for <strong>${expiryLabel}</strong></li>
        <li>You can only use this link <strong>once</strong></li>
        <li>Supported formats: PDF, JPG, PNG, TIFF, DICOM (Max 10MB)</li>
      </ul>
    </div>
    <p style="font-size:13px;">If the button doesn't work, copy and paste this link:</p>
    <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 6px; font-size: 12px; font-family: monospace;">${uploadUrl}</p>
  </div>
  <div class="footer">
    <p>Best regards,<br><strong>${clinicName}</strong></p>
    <p style="font-size: 11px;">This is an automated secure message. Please do not reply directly.</p>
  </div>
</body>
</html>`;

  return { subject, body, html };
}

export function generateLabUploadEmailTemplate(
  labOrder: LabOrder,
  uploadUrl: string,
  clinicName: string = "Veti-Vision Animal Care",
  vetName?: string
): { subject: string; body: string; html: string } {
  const urgencyBanner = labOrder.urgency === "stat"
    ? `<div style="background:#dc2626;color:#fff;padding:12px 20px;text-align:center;font-weight:bold;font-size:14px;letter-spacing:1px;">⚡ STAT — IMMEDIATE ATTENTION REQUIRED</div>`
    : labOrder.urgency === "urgent"
    ? `<div style="background:#f59e0b;color:#fff;padding:12px 20px;text-align:center;font-weight:bold;font-size:14px;letter-spacing:1px;">⚠️ URGENT — PRIORITY UPLOAD</div>`
    : "";

  const testTypeIcon = {
    bloodwork: "🩸",
    imaging: "📷",
    pathology: "🔬",
    cytology: "🦠",
    other: "📋"
  }[labOrder.testType] || "📋";

  const subject = `${labOrder.urgency === "stat" ? "[STAT] " : labOrder.urgency === "urgent" ? "[URGENT] " : ""}Action Required - Diagnostic Results Request for ${labOrder.patientName} (Case #${labOrder.caseId})`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnostic Results Request - ${clinicName}</title>
  <style>
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #0d9488, #065f46); color: white; padding: 32px 28px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px 28px; }
    .patient-card { background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .patient-card .header-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .patient-card .avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #0d9488, #059669); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; }
    .patient-card .patient-info h3 { margin: 0; font-size: 18px; color: #064e3b; }
    .patient-card .patient-info p { margin: 4px 0 0; color: #047857; font-size: 14px; }
    .test-details { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .test-detail { background: white; border: 1px solid #d1fae5; border-radius: 8px; padding: 12px; }
    .test-detail .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px; }
    .test-detail .value { font-size: 14px; font-weight: 600; color: #064e3b; }
    .upload-button { display: block; width: 100%; background: linear-gradient(135deg, #0d9488, #0f766e); color: white; padding: 18px 24px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; text-align: center; margin: 24px 0; box-shadow: 0 10px 25px -5px rgba(13,148,136,0.4); transition: all 0.2s; }
    .upload-button:hover { transform: translateY(-1px); box-shadow: 0 20px 25px -5px rgba(13,148,136,0.5); }
    .urgency-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; }
    .urgency-stat { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .urgency-urgent { background: #fffbeb; color: #d97706; border: 1px solid #fed7aa; }
    .urgency-routine { background: #f0fdf4; color: #059669; border: 1px solid #bbf7d0; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .info-box h4 { margin: 0 0 8px; color: #1e40af; font-size: 14px; }
    .info-box ul { margin: 0; padding-left: 20px; color: #3730a3; }
    .info-box li { margin: 4px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 32px; padding: 20px; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 4px 0; }
    .veterinarian-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .veterinarian-section h4 { margin: 0 0 8px; color: #334155; font-size: 14px; }
    .veterinarian-section p { margin: 0; color: #475569; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    ${urgencyBanner}
    <div class="header">
      <h1>${testTypeIcon} Diagnostic Results Request</h1>
      <p>${clinicName} • Case #${labOrder.caseId}</p>
    </div>
    
    <div class="content">
      <div class="patient-card">
        <div class="header-row">
          <div class="avatar">${labOrder.patientName.charAt(0).toUpperCase()}</div>
          <div class="patient-info">
            <h3>${labOrder.patientName}</h3>
            <p>${labOrder.species} • Patient ID: ${labOrder.patientId}</p>
          </div>
        </div>
        
        <div class="test-details">
          <div class="test-detail">
            <div class="label">Test Requested</div>
            <div class="value">${labOrder.testName}</div>
          </div>
          <div class="test-detail">
            <div class="label">Test Type</div>
            <div class="value">${labOrder.testType.charAt(0).toUpperCase() + labOrder.testType.slice(1)}</div>
          </div>
          <div class="test-detail">
            <div class="label">Test Code</div>
            <div class="value">${labOrder.testCode || "N/A"}</div>
          </div>
          <div class="test-detail">
            <div class="label">Ordered</div>
            <div class="value">${new Date(labOrder.orderedAt).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div class="urgency-badge urgency-${labOrder.urgency}">
          ${labOrder.urgency === "stat" ? "STAT Priority" : labOrder.urgency === "urgent" ? "Urgent" : "Routine"}
        </div>
      </div>

      ${vetName ? `
      <div class="veterinarian-section">
        <h4>👨‍⚕️ Requesting Veterinarian</h4>
        <p>Dr. ${vetName} • ${clinicName}</p>
      </div>
      ` : ''}

      <p style="font-size: 16px; color: #374151; margin: 20px 0;">
        Please use the secure, one-time link below to upload the diagnostic results for <strong>${labOrder.patientName}</strong>. 
        This link will automatically sync the results to the patient's medical record.
      </p>

      <a href="${uploadUrl}" class="upload-button">
        📤 UPLOAD SECURE DOCUMENTS
      </a>

      <div class="info-box">
        <h4>📋 Important Information</h4>
        <ul>
          <li>This link is valid for <strong>24 hours</strong> and can only be used once</li>
          <li>Supported formats: PDF, JPG, PNG, TIFF, DICOM, BMP, WebP</li>
          <li>Maximum file size: 10MB per file</li>
          <li>Multiple files can be uploaded in a single session</li>
          <li>Files are automatically attached to the patient's medical record</li>
        </ul>
      </div>

      ${labOrder.notes ? `
      <div class="info-box" style="background: #fefce8; border-left-color: #eab308;">
        <h4 style="color: #a16207;">📝 Additional Notes</h4>
        <p style="color: #854d0e; margin: 0;">${labOrder.notes}</p>
      </div>
      ` : ''}

      <p style="font-size: 14px; color: #6b7280; margin: 24px 0;">
        If you encounter any issues with the upload link or have questions about this request, please reply to this email or contact our clinic directly.
      </p>
    </div>

    <div class="footer">
      <p><strong>${clinicName}</strong></p>
      <p>Professional Veterinary Care • Digital Health Records</p>
      <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">
        This is an automated message. Case ID: #${labOrder.caseId} | Order ID: ${labOrder.id}
      </p>
    </div>
  </div>
</body>
</html>`;

  const body = `${clinicName} - Diagnostic Results Request

Dear Lab Team,

Dr. ${vetName || "Veterinarian"} has requested diagnostic results for the following patient:

PATIENT INFORMATION:
• Name: ${labOrder.patientName}
• Species: ${labOrder.species}
• Patient ID: ${labOrder.patientId}
• Case ID: #${labOrder.caseId}

TEST DETAILS:
• Test Requested: ${labOrder.testName}
• Test Type: ${labOrder.testType}
• Test Code: ${labOrder.testCode || "N/A"}
• Ordered Date: ${new Date(labOrder.orderedAt).toLocaleDateString()}
• Priority: ${labOrder.urgency.toUpperCase()}

${labOrder.notes ? `ADDITIONAL NOTES:
${labOrder.notes}

` : ''}Please use the secure, one-time link below to upload the diagnostic results. This link will automatically sync the results to the patient's medical record.

UPLOAD LINK:
${uploadUrl}

IMPORTANT INFORMATION:
• This link is valid for 24 hours and can only be used once
• Supported formats: PDF, JPG, PNG, TIFF, DICOM, BMP, WebP
• Maximum file size: 10MB per file
• Multiple files can be uploaded in a single session

If you encounter any issues with the upload link or have questions about this request, please reply to this email.

Best regards,
${clinicName}
Professional Veterinary Care

---
Case ID: #${labOrder.caseId} | Order ID: ${labOrder.id}
This is an automated message.`;

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

export function getCategoryLabel(category: AttachmentCategory): string {
  const labels: Record<AttachmentCategory, string> = {
    lab: "Lab Results",
    imaging: "Imaging (X-rays, etc.)",
    photo: "Photos",
    document: "Documents",
    other: "Other",
  };
  return labels[category];
}

export function getRecipientLabel(type: RecipientType): string {
  const labels: Record<RecipientType, string> = {
    lab: "External Laboratory",
    owner: "Pet Owner",
    specialist: "Specialist / Referral",
    other: "Other",
  };
  return labels[type];
}

export const COMMON_LAB_TESTS = [
  { code: "CBC",  name: "Complete Blood Count (CBC)" },
  { code: "CHEM", name: "Chemistry Panel" },
  { code: "UA",   name: "Urinalysis" },
  { code: "XRAY", name: "Radiograph (X-Ray)" },
  { code: "US",   name: "Ultrasound" },
  { code: "CYTO", name: "Cytology" },
  { code: "HIST", name: "Histopathology" },
  { code: "FECAL",name: "Fecal Exam" },
  { code: "FIV",  name: "FIV/FeLV Test" },
  { code: "PARVO",name: "Parvo Test" },
  { code: "DERM", name: "Dermatology Scraping" },
  { code: "CULT", name: "Culture & Sensitivity" },
  { code: "ENDO", name: "Endocrine Panel (Thyroid/Cortisol)" },
  { code: "COAG", name: "Coagulation Panel" },
  { code: "OTHER",name: "Other (specify in notes)" },
] as const;

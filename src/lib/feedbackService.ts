// ── InnoVetPro Feedback Service ──────────────────────────────────────────────
// Mirrors the Formspree + EmailJS pattern used in Landing.tsx

const FORMSPREE =
  (import.meta.env.VITE_FORMSPREE_ENDPOINT as string | undefined) ||
  "https://formspree.io/f/xjgpwzzq";

const EJS_SERVICE =
  (import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined) ||
  "service_ghes6jc";
const EJS_KEY =
  (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined) ||
  "SGqjlLe6QR5y6JYHm";
const EJS_CONFIRM =
  (import.meta.env.VITE_EMAILJS_CONFIRM_TPL as string | undefined) ||
  "template_lowkwr4";

export type FeedbackCategory = "bug" | "ux" | "feature" | "general";

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug:     "🐛 Bug Report",
  ux:      "🎨 UI/UX Issue",
  feature: "✨ Feature Request",
  general: "💬 General Feedback",
};

export type SurveyEvent =
  | "patient_saved"
  | "record_saved"
  | "appointment_booked"
  | "invoice_finalized";

export interface FeedbackPayload {
  type: "snag_report" | "micro_survey";
  category?: FeedbackCategory;
  message: string;
  rating?: number;
  surveyEvent?: SurveyEvent;
  role: string;
  route: string;
  pageContext?: string;
  userEmail?: string;
  timestamp: string;
}

export async function sendFeedback(payload: FeedbackPayload): Promise<void> {
  const catLabel = payload.category ? CATEGORY_LABELS[payload.category] : "";
  const stars = payload.rating
    ? "★".repeat(payload.rating) + "☆".repeat(5 - payload.rating)
    : "";

  const subject =
    payload.type === "micro_survey"
      ? `⭐ Micro-Survey [${payload.surveyEvent ?? "general"}] — ${payload.role} — ${stars}`
      : `🔧 Snag Report [${catLabel}] — ${payload.role}`;

  const bodyLines = [
    `Type: ${payload.type === "micro_survey" ? "Micro-Survey" : "Snag Report"}`,
    catLabel ? `Category: ${catLabel}` : "",
    stars ? `Rating: ${stars} (${payload.rating}/5)` : "",
    payload.surveyEvent ? `Triggered after: ${payload.surveyEvent.replace(/_/g, " ")}` : "",
    "",
    `Feedback:`,
    payload.message,
    "",
    `User Role: ${payload.role}`,
    `Route: ${payload.route}`,
    payload.pageContext ? `Page Context: ${payload.pageContext}` : "",
    payload.userEmail ? `User Email: ${payload.userEmail}` : "",
    `Submitted: ${payload.timestamp}`,
  ].filter(v => v !== undefined && v !== null);

  // ── 1. Formspree → notify system owners ─────────────────────────────────
  try {
    await fetch(FORMSPREE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        subject,
        message: bodyLines.join("\n"),
        email: payload.userEmail || "noreply@innovetpro.demo",
        _replyto: payload.userEmail || "noreply@innovetpro.demo",
        _cc: "andrewmandieka@gmail.com",
        feedback_type: payload.type,
        category: payload.category ?? "—",
        rating: payload.rating ?? "—",
        role: payload.role,
        route: payload.route,
        timestamp: payload.timestamp,
      }),
    });
  } catch {
    // Non-fatal — feedback still attempted via EmailJS
  }

  // ── 2. EmailJS → branded acknowledgment to submitter (if email given) ───
  if (payload.userEmail && EJS_SERVICE && EJS_KEY && EJS_CONFIRM) {
    try {
      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EJS_SERVICE,
          template_id: EJS_CONFIRM,
          user_id: EJS_KEY,
          template_params: {
            to_email: payload.userEmail,
            phone: "—",
            timestamp: payload.timestamp,
          },
        }),
      });
    } catch {
      // Non-fatal
    }
  }
}

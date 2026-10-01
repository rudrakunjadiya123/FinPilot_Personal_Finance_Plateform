// ═══════════════════════════════════════════════════════════
// FINPILOT — Email Service (Brevo API & SMTP Relay)
// Primary transport: Brevo REST API v3
// Fallback transport: Brevo SMTP Relay (Nodemailer)
// ═══════════════════════════════════════════════════════════

const nodemailer = require("nodemailer");

let cachedTransporter = null;

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER || process.env.BREVO_SENDER_EMAIL,
        pass: process.env.SMTP_PASS || process.env.BREVO_API_KEY,
      },
    });
  }
  return cachedTransporter;
}

/**
 * Normalizes recipients into Brevo format: [{ email: string, name?: string }]
 */
function normalizeRecipients(to) {
  if (Array.isArray(to)) {
    return to
      .map((item) => {
        if (typeof item === "string") return { email: item.trim() };
        if (item && item.email) return item;
        return null;
      })
      .filter(Boolean);
  }
  if (typeof to === "string") {
    return to
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)
      .map((email) => ({ email }));
  }
  if (to && typeof to === "object" && to.email) {
    return [to];
  }
  return [];
}

/**
 * Send email via Brevo REST API v3
 */
async function sendViaBrevoApi({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not defined in environment");
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "rudrak.mail20@gmail.com";
  const senderName = process.env.BREVO_SENDER_NAME || "FinPilot";
  const recipients = normalizeRecipients(to);

  if (recipients.length === 0) {
    throw new Error("No valid recipient email address provided");
  }

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: recipients,
    subject,
    htmlContent: html,
  };

  if (text) {
    payload.textContent = text;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || response.statusText || "Unknown Brevo API error";
    const error = new Error(`Brevo API Error (${response.status}): ${errorMsg}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  console.log(`[Brevo API] Successfully sent email to ${recipients.map((r) => r.email).join(", ")} (messageId: ${data?.messageId || "N/A"})`);
  return { success: true, messageId: data?.messageId, provider: "brevo-api" };
}

/**
 * Send email via SMTP (Brevo Relay / Nodemailer) as secondary transport
 */
async function sendViaSmtp({ to, subject, html, text }) {
  const transporter = getTransporter();
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "rudrak.mail20@gmail.com";
  const senderName = process.env.BREVO_SENDER_NAME || "FinPilot";

  const info = await transporter.sendMail({
    from: `"${senderName}" <${senderEmail}>`,
    to,
    subject,
    html,
    text,
  });

  console.log(`[Brevo SMTP] Successfully sent email to ${to} (messageId: ${info?.messageId || "N/A"})`);
  return { success: true, messageId: info?.messageId, provider: "brevo-smtp" };
}

/**
 * Send an email using Brevo (API first, SMTP fallback, or Dev stub).
 * @param {Object} options
 * @param {string|string[]|Object[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email body (HTML)
 * @param {string} [options.text] - Optional plain text body
 */
async function sendEmail({ to, subject, html, text }) {
  const hasBrevoKey = !!process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.startsWith("xkeysib-");
  const hasSmtpConfig = !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

  // Stub in dev if neither API key nor SMTP credentials are configured
  if (!hasBrevoKey && !hasSmtpConfig) {
    console.log(`\n[EMAIL STUB] Would have sent email to: ${JSON.stringify(to)}`);
    console.log(`[EMAIL STUB] Subject: ${subject}`);
    console.log(`[EMAIL STUB] Content length: ${html ? html.length : 0} chars\n`);
    return { success: true, stub: true };
  }

  // 1. Try Brevo REST API first
  if (hasBrevoKey) {
    try {
      return await sendViaBrevoApi({ to, subject, html, text });
    } catch (brevoErr) {
      console.error("[Brevo API] Request failed:", brevoErr.message);
      if (hasSmtpConfig) {
        console.log("[Brevo API] Falling back to Brevo SMTP relay...");
        return await sendViaSmtp({ to, subject, html, text });
      }
      throw brevoErr;
    }
  }

  // 2. SMTP fallback if no Brevo API key
  return await sendViaSmtp({ to, subject, html, text });
}

module.exports = { sendEmail, sendViaBrevoApi, sendViaSmtp };

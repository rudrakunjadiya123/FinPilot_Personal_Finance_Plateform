// ═══════════════════════════════════════════════════════════
// FINPILOT — Email Service
// Simple Nodemailer wrapper for sending emails.
// Includes a stub for dev environments missing SMTP config.
// ═══════════════════════════════════════════════════════════

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email using the configured SMTP server.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email body (HTML)
 */
async function sendEmail({ to, subject, html }) {
  const isMissingConfig = !process.env.SMTP_USER || process.env.SMTP_USER === "your_email@gmail.com";
  
  if (process.env.NODE_ENV === "development" && isMissingConfig) {
    console.log(`\n[EMAIL STUB] Would have sent email to: ${to}`);
    console.log(`[EMAIL STUB] Subject: ${subject}`);
    console.log(`[EMAIL STUB] Content length: ${html.length} chars\n`);
    return;
  }

  await transporter.sendMail({
    from: `"Finpilot" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };

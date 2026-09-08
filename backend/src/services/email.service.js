import { Resend } from "resend";
import { env } from "../config/env.js";
import { renderEmailTemplate, htmlToText } from "./template.service.js";

let resendClient = null;
let loggedTransport = false;

function getResend() {
  if (!env.resendApiKey) return null;
  if (!resendClient) resendClient = new Resend(env.resendApiKey);
  return resendClient;
}

function formatFrom() {
  if (env.emailFrom.includes("<")) return env.emailFrom;
  return `${env.emailFromName} <${env.emailFrom}>`;
}

function logTransportOnce(configured) {
  if (loggedTransport) return;
  loggedTransport = true;

  if (configured) {
    console.log(`📧 Email transport: resend (HTTPS) from ${formatFrom()}`);
    return;
  }

  console.warn("\n⚠️  RESEND_API_KEY is not set — emails will be logged, not sent.");
  console.warn("   Add RESEND_API_KEY=re_xxxxxxxx to backend/.env (or Render env).");
  console.warn("   Test sender: EMAIL_FROM=beth.t@example.com\n");
}

function logDevEmail({ to, subject, text, replyTo }) {
  console.log("\n" + "=".repeat(70));
  console.log("📧 EMAIL (Development Mode - Not Actually Sent)");
  console.log("=".repeat(70));
  console.log("To:", to);
  if (replyTo) console.log("Reply-To:", replyTo);
  console.log("Subject:", subject);
  console.log("\n--- Plain Text Version (redacted) ---");
  console.log((text || "N/A").replace(/\b\d{4,8}\b/g, "******").substring(0, 500));
  console.log("=".repeat(70));
  console.log("💡 Set RESEND_API_KEY to send real emails via Resend.");
  console.log("=".repeat(70) + "\n");
}

/**
 * Send email using template via Resend HTTPS API.
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.template
 * @param {object} options.variables
 * @param {string} options.html
 * @param {string} options.text
 * @param {string} [options.replyTo]
 */
export async function sendEmail({ to, subject, template, variables = {}, html, text, replyTo }) {
  const resend = getResend();
  logTransportOnce(Boolean(resend));

  if (!html && template) {
    html = renderEmailTemplate(template, variables);
  }
  if (!text && html) {
    text = htmlToText(html);
  }

  if (!resend) {
    logDevEmail({ to, subject, text, replyTo });
    return { success: true, messageId: "dev-mode", sent: false };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: formatFrom(),
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {})
    });

    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }

    const messageId = data?.id;
    console.log(`✅ Email sent via resend to ${to} (Message ID: ${messageId})`);
    return { success: true, messageId, sent: true };
  } catch (error) {
    console.error("❌ Email send error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send verification email with OTP (legacy wrapper — prefer notification service)
 */
export async function sendVerificationEmail(email, otpCode) {
  const { notify } = await import("../notifications/notification.service.js");
  const { NOTIFICATION_TYPES } = await import("../config/notification.constants.js");
  const { buildOtpVariables } = await import("../notifications/notification.context.js");

  return notify(NOTIFICATION_TYPES.EMAIL_VERIFICATION, [{
    email,
    variables: buildOtpVariables({ otpCode, purpose: "EMAIL_VERIFICATION" })
  }]);
}

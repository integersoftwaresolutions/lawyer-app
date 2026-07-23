import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { renderEmailTemplate, htmlToText } from "./template.service.js";

let transporter = null;

/**
 * Initialize and get email transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  // Check if email is configured
  const isConfigured = env.emailUser && env.emailPassword && env.emailHost;
  
  if (!isConfigured) {
    if (env.nodeEnv === "development") {
      console.warn("\n⚠️  EMAIL NOT CONFIGURED");
      console.warn("   OTPs will be logged to console instead of being sent.");
      console.warn("   To enable email sending, add to .env:");
      console.warn("   EMAIL_USER=your-email@gmail.com");
      console.warn("   EMAIL_PASSWORD=your-app-password");
      console.warn("   EMAIL_HOST=smtp.gmail.com\n");
    }
    return null;
  }

  try {
    const isGmail = env.emailHost.includes("gmail");

    transporter = nodemailer.createTransport(
      isGmail && env.emailPort === 465
        ? {
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: env.emailUser,
              pass: env.emailPassword
            }
          }
        : isGmail
          ? {
              service: "gmail",
              auth: {
                user: env.emailUser,
                pass: env.emailPassword
              }
            }
          : {
              host: env.emailHost,
              port: env.emailPort,
              secure: env.emailSecure,
              auth: {
                user: env.emailUser,
                pass: env.emailPassword
              }
            }
    );

    // Verify connection
    transporter.verify((error) => {
      if (error) {
        console.error("❌ Email transporter verification failed:", error.message);
      } else {
        console.log("✅ Email transporter configured successfully");
      }
    });

    return transporter;
  } catch (error) {
    console.error("❌ Failed to create email transporter:", error);
    return null;
  }
}

/**
 * Send email using template
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name (without .html)
 * @param {object} options.variables - Template variables
 * @param {string} options.html - Optional custom HTML (overrides template)
 * @param {string} options.text - Optional plain text version
 */
export async function sendEmail({ to, subject, template, variables = {}, html, text }) {
  const mailTransporter = getTransporter();

  // Generate HTML from template if not provided
  if (!html && template) {
    html = renderEmailTemplate(template, variables);
  }

  // Generate text version if not provided
  if (!text && html) {
    text = htmlToText(html);
  }

  // In development without email config, log to console
  if (!mailTransporter) {
    console.log("\n" + "=".repeat(70));
    console.log("📧 EMAIL (Development Mode - Not Actually Sent)");
    console.log("=".repeat(70));
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("\n--- Plain Text Version ---");
    console.log(text?.substring(0, 500) || "N/A");
    if (text && text.length > 500) console.log("... (truncated)");
    console.log("\n--- 🔑 OTP CODE (Look for this!) ---");
    const otpMatch = text?.match(/\d{6}/) || html?.match(/\d{6}/);
    if (otpMatch) {
      console.log(`   VERIFICATION CODE: ${otpMatch[0]}`);
    } else {
      console.log("   (OTP code not found in email content)");
    }
    console.log("\n--- Full HTML (first 300 chars) ---");
    console.log(html?.substring(0, 300) || "N/A");
    if (html && html.length > 300) console.log("... (truncated)");
    console.log("=".repeat(70));
    console.log("💡 To actually send emails, configure EMAIL_USER, EMAIL_PASSWORD, EMAIL_HOST in .env");
    console.log("=".repeat(70) + "\n");
    return { success: true, messageId: "dev-mode", sent: false };
  }

  try {
    const mailOptions = {
      from: `"${env.emailFromName}" <${env.emailFrom}>`,
      to,
      subject,
      text,
      html
    };

    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to} (Message ID: ${info.messageId})`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      sent: true 
    };
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

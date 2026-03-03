import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // In development, use console logging if email is not configured
  if (env.nodeEnv === "development" && !env.emailUser) {
    console.warn("Email not configured. OTPs will be logged to console.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.emailHost,
    port: env.emailPort,
    secure: env.emailSecure,
    auth: env.emailUser && env.emailPassword ? {
      user: env.emailUser,
      pass: env.emailPassword
    } : undefined
  });

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const mailTransporter = getTransporter();

  // In development without email config, log to console
  if (!mailTransporter) {
    console.log("=".repeat(50));
    console.log("EMAIL (Development Mode - Not Sent):");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text);
    console.log("HTML:", html);
    console.log("=".repeat(50));
    return { success: true, messageId: "dev-mode" };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: `"${env.emailFromName}" <${env.emailFrom}>`,
      to,
      subject,
      text,
      html
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendVerificationEmail(email, otpCode) {
  const subject = "Verify Your Email Address";
  const text = `Your verification code is: ${otpCode}\n\nThis code will expire in ${env.otpExpiryMinutes} minutes.`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Verify Your Email</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">Thank you for registering with Lawyer App. Please use the verification code below to verify your email address:</p>
        <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
            ${otpCode}
          </div>
        </div>
        <p style="font-size: 14px; color: #666;">This code will expire in <strong>${env.otpExpiryMinutes} minutes</strong>.</p>
        <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">© ${new Date().getFullYear()} Lawyer App. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, text, html });
}


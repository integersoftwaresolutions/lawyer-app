import Otp from "../models/Otp.js";
import { env } from "../config/env.js";
import { ApiError } from "../helpers/apiError.js";
import { NOTIFICATION_TYPES } from "../config/notification.constants.js";
import { notify } from "../notifications/notification.service.js";
import { buildOtpVariables, greetingName } from "../notifications/notification.context.js";

/**
 * Generate a random OTP code
 */
function generateOtpCode() {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < env.otpLength; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

const OTP_NOTIFICATION_MAP = {
  EMAIL_VERIFICATION: NOTIFICATION_TYPES.EMAIL_VERIFICATION,
  PASSWORD_RESET: NOTIFICATION_TYPES.PASSWORD_RESET
};

async function sendOtpEmail(email, code, purpose) {
  const notificationType = OTP_NOTIFICATION_MAP[purpose];
  if (!notificationType) return;

  const variables = buildOtpVariables({ otpCode: code, purpose });
  variables.recipientName = greetingName("");

  await notify(notificationType, [{
    email,
    variables
  }], { metadata: { purpose } });
}

/**
 * Send OTP to email
 */
export async function sendOtp(email, purpose = "EMAIL_VERIFICATION") {
  console.log(`\n📧 Sending OTP to ${email} (purpose: ${purpose})`);

  await Otp.deleteMany({ email: email.toLowerCase(), purpose });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
  console.log(`   Generated OTP: ${code} (expires in ${env.otpExpiryMinutes} minutes)`);

  await Otp.create({
    email: email.toLowerCase(),
    code,
    purpose,
    expiresAt
  });

  try {
    await sendOtpEmail(email, code, purpose);
    console.log(`   ✅ OTP email dispatched to ${email}`);
  } catch (error) {
    console.error(`   ❌ Failed to send OTP email to ${email}:`, error.message);
  }

  return { success: true };
}

/**
 * Verify OTP code
 */
export async function verifyOtp(email, code, purpose = "EMAIL_VERIFICATION") {
  const otp = await Otp.findOne({
    email: email.toLowerCase(),
    code,
    purpose
  });

  if (!otp) {
    throw new ApiError(400, "Invalid or expired verification code");
  }

  if (new Date() > otp.expiresAt) {
    await Otp.deleteOne({ _id: otp._id });
    throw new ApiError(400, "Verification code has expired");
  }

  await Otp.deleteOne({ _id: otp._id });

  return { success: true };
}

/**
 * Resend OTP
 */
export async function resendOtp(email, purpose = "EMAIL_VERIFICATION") {
  return sendOtp(email, purpose);
}

import Otp from "../models/Otp.js";
import { sendVerificationEmail } from "./email.service.js";
import { env } from "../config/env.js";
import { ApiError } from "../helpers/apiError.js";

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

/**
 * Send OTP to email
 */
export async function sendOtp(email, purpose = "EMAIL_VERIFICATION") {
  // Delete any existing OTPs for this email and purpose
  await Otp.deleteMany({ email: email.toLowerCase(), purpose });

  // Generate new OTP
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

  // Store OTP in database
  await Otp.create({
    email: email.toLowerCase(),
    code,
    purpose,
    expiresAt
  });

  // Send email
  if (purpose === "EMAIL_VERIFICATION") {
    await sendVerificationEmail(email, code);
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

  // Check if expired (MongoDB TTL should handle this, but double-check)
  if (new Date() > otp.expiresAt) {
    await Otp.deleteOne({ _id: otp._id });
    throw new ApiError(400, "Verification code has expired");
  }

  // Delete the OTP after successful verification
  await Otp.deleteOne({ _id: otp._id });

  return { success: true };
}

/**
 * Resend OTP
 */
export async function resendOtp(email, purpose = "EMAIL_VERIFICATION") {
  return sendOtp(email, purpose);
}

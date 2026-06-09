import { ApiError } from "../helpers/apiError.js";
import User from "../models/User.js";
import LawyerProfile from "../models/LawyerProfile.js";
import ClientProfile from "../models/ClientProfile.js";
import Wallet from "../models/Wallet.js";
import AdminSetting from "../models/AdminSetting.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, compareToken } from "./token.service.js";
import * as otpService from "./otp.service.js";

async function ensureAdminSetting() {
  const existing = await AdminSetting.findOne();
  if (existing) return existing;
  return AdminSetting.create({});
}

export async function register({ role, email, password, fullName }) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Check if email already exists
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, "Email already registered");

  // Validate password strength
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  // Hash password
  const passwordHash = await User.hashPassword(password);
  
  // Create user
  const user = await User.create({ 
    role, 
    email: email.toLowerCase(), 
    passwordHash, 
    isEmailVerified: false 
  });

  // Create wallet
  const settings = await ensureAdminSetting();
  await Wallet.create({
    userId: user._id,
    balanceCredits: settings.monthlyCreditGrant,
    monthlyCredits: settings.monthlyCreditGrant,
    monthlyResetAt: new Date()
  });

  // Create basic profile (empty, to be completed later)
  if (role === "LAWYER") {
    await LawyerProfile.create({
      userId: user._id,
      fullName: fullName || "",
      verificationStatus: "PENDING"
    });
  } else if (role === "CLIENT") {
    await ClientProfile.create({
      userId: user._id,
      fullName: fullName || ""
    });
  }

  // Send OTP for email verification
  try {
    await otpService.sendOtp(email, "EMAIL_VERIFICATION");
    console.log(`✅ Registration OTP sent to ${email}`);
  } catch (error) {
    // Log error but don't fail registration - OTP is stored, user can request resend
    console.error(`❌ Failed to send registration OTP to ${email}:`, error.message);
  }

  return { userId: user._id.toString(), email };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  // If email is not verified, automatically send OTP
  if (!user.isEmailVerified) {
    try {
      await otpService.sendOtp(email, "EMAIL_VERIFICATION");
      console.log(`✅ Login: OTP sent to unverified email ${email}`);
    } catch (error) {
      console.error(`❌ Login: Failed to send OTP to ${email}:`, error.message);
      // Don't fail login - user can request resend on verify page
    }
  }

  const accessToken = signAccessToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString());
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  return {
    user: { id: user._id.toString(), email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
    accessToken,
    refreshToken
  };
}

export async function refresh({ refreshToken }) {
  if (!refreshToken) throw new ApiError(401, "Missing refresh token");

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.refreshTokenHash) throw new ApiError(401, "Refresh token not recognized");

  const ok = await compareToken(refreshToken, user.refreshTokenHash);
  if (!ok) throw new ApiError(401, "Refresh token not recognized");

  const newAccess = signAccessToken(user._id.toString(), user.role);
  const newRefresh = signRefreshToken(user._id.toString());
  user.refreshTokenHash = await hashToken(newRefresh);
  await user.save();

  return { accessToken: newAccess, refreshToken: newRefresh };
}

export async function logout(userId) {
  const user = await User.findById(userId);
  if (!user) return;
  user.refreshTokenHash = null;
  await user.save();
}

export async function sendOtp(email) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.isEmailVerified) {
    throw new ApiError(400, "Email already verified");
  }
  return otpService.sendOtp(email, "EMAIL_VERIFICATION");
}

export async function verifyOtp(email, code) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.isEmailVerified) {
    throw new ApiError(400, "Email already verified");
  }

  // Verify the OTP
  await otpService.verifyOtp(email, code, "EMAIL_VERIFICATION");

  // Mark email as verified
  user.isEmailVerified = true;
  await user.save();

  return { success: true };
}

export async function resendOtp(email) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.isEmailVerified) {
    throw new ApiError(400, "Email already verified");
  }
  return otpService.resendOtp(email, "EMAIL_VERIFICATION");
}

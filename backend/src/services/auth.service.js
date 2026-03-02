import { ApiError } from "../helpers/apiError.js";
import User from "../models/User.js";
import LawyerProfile from "../models/LawyerProfile.js";
import Wallet from "../models/Wallet.js";
import AdminSetting from "../models/AdminSetting.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, compareToken } from "./token.service.js";

async function ensureAdminSetting() {
  const existing = await AdminSetting.findOne();
  if (existing) return existing;
  return AdminSetting.create({});
}

export async function register({ role, email, password, fullName }) {
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, "Email already registered");

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ role, email, passwordHash, isEmailVerified: false });

  // Create wallet
  const settings = await ensureAdminSetting();
  await Wallet.create({
    userId: user._id,
    balanceCredits: settings.monthlyCreditGrant,
    monthlyCredits: settings.monthlyCreditGrant,
    monthlyResetAt: new Date()
  });

  // If lawyer, create profile
  if (role === "LAWYER") {
    await LawyerProfile.create({
      userId: user._id,
      fullName: fullName || "Lawyer",
      city: "",
      specialization: [],
      experienceYears: 0,
      hourlyRate: 0,
      ratingAvg: 0,
      verificationStatus: "PENDING"
    });
  }

  return { userId: user._id.toString() };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, "Invalid credentials");

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

import { sendSuccess } from "../helpers/response.helper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../helpers/apiError.js";
import * as authService from "../services/auth.service.js";
import { env } from "../config/env.js";
import { uploadSingle } from "../middlewares/upload.middleware.js";
import User from "../models/User.js";

function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/api/auth/refresh"
  });
}

export const register = asyncHandler(async (req, res) => {
  const { role, email, password, fullName } = req.body;
  const out = await authService.register({ role, email, password, fullName });
  return sendSuccess(res, { statusCode: 201, message: "Registered", data: out });
});

export const login = asyncHandler(async (req, res) => {
  const out = await authService.login(req.body);
  setRefreshCookie(res, out.refreshToken);
  return sendSuccess(res, { message: "Logged in", data: { user: out.user, accessToken: out.accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const out = await authService.refresh({ refreshToken: token });
  setRefreshCookie(res, out.refreshToken);
  return sendSuccess(res, { message: "Refreshed", data: { accessToken: out.accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  return sendSuccess(res, { message: "Logged out", data: null });
});

export const me = asyncHandler(async (req, res) => {
  // Get full user with populated profile image
  const user = await User.findById(req.user.id).populate("profileImageMediaId").lean();
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  // Get profile image URL - prefer populated Media URL, fallback to user.profileImage
  let profileImageUrl = "";
  if (user.profileImageMediaId?.url) {
    profileImageUrl = user.profileImageMediaId.url;
  } else if (user.profileImage && user.profileImage.trim() !== "") {
    profileImageUrl = user.profileImage;
  }
  
  const userData = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    profileImage: profileImageUrl, // Will be empty string if no image
    profileImageMediaId: user.profileImageMediaId?._id?.toString() || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  
  return sendSuccess(res, { message: "Me", data: userData });
});

export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.sendOtp(email);
  return sendSuccess(res, { message: "Verification code sent to your email" });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const out = await authService.verifyOtp(email, code);
  return sendSuccess(res, { message: "Email verified successfully", data: out });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.resendOtp(email);
  return sendSuccess(res, { message: "Verification code resent to your email" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  return sendSuccess(res, {
    message: "If an account exists for this email, a reset code has been sent"
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  await authService.resetPassword({ email, code, newPassword });
  return sendSuccess(res, { message: "Password reset successfully. You can now log in." });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword({
    userId: req.user.id,
    currentPassword,
    newPassword
  });
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  return sendSuccess(res, {
    message: "Password changed successfully. Please sign in again."
  });
});

// Profile picture management
export const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendSuccess(res, { statusCode: 400, message: "No file uploaded", data: null });
  }

  const { mediaService } = await import("../services/media.service.js");
  const user = await User.findById(req.user.id);
  if (!user) {
    return sendSuccess(res, { statusCode: 404, message: "User not found", data: null });
  }

  // Delete old profile picture if exists
  if (user.profileImageMediaId) {
    try {
      await mediaService.delete(user.profileImageMediaId.toString(), { hardDelete: true });
    } catch (error) {
      console.error("Failed to delete old profile picture:", error);
    }
  }

  // Upload new profile picture
  const media = await mediaService.upload(req.file, {
    mediaType: "PROFILE_IMAGE",
    uploadedBy: req.user.id,
    relatedEntityType: "User",
    relatedEntityId: user._id,
    validation: {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
      allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"]
    },
    folder: "profile-images"
  });

  // Update user
  user.profileImageMediaId = media._id;
  await user.save();

  // Reload user with populated media
  await user.populate("profileImageMediaId");
  
  // Get the URL from media
  const profileImageUrl = media.url || user.profileImageMediaId?.url || "";
  
  const userData = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    profileImage: profileImageUrl,
    profileImageMediaId: media._id.toString()
  };

  return sendSuccess(res, { 
    statusCode: 201, 
    message: "Profile picture uploaded successfully", 
    data: userData 
  });
});

export const deleteProfilePicture = asyncHandler(async (req, res) => {
  const { mediaService } = await import("../services/media.service.js");
  const user = await User.findById(req.user.id);
  if (!user) {
    return sendSuccess(res, { statusCode: 404, message: "User not found", data: null });
  }

  if (!user.profileImageMediaId) {
    return sendSuccess(res, { statusCode: 400, message: "No profile picture to delete", data: null });
  }

  // Delete media
  await mediaService.delete(user.profileImageMediaId.toString(), { hardDelete: true });

  // Update user
  user.profileImageMediaId = null;
  user.profileImage = "";
  await user.save();

  const userData = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    profileImage: "",
    profileImageMediaId: null
  };

  return sendSuccess(res, { 
    message: "Profile picture deleted successfully", 
    data: userData 
  });
});
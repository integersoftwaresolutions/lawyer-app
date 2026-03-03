import { sendSuccess } from "../helpers/response.helper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";
import { env } from "../config/env.js";

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
  return sendSuccess(res, { message: "Me", data: req.user });
});

export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.sendOtp(email);
  return sendSuccess(res, { message: "Verification code sent to your email" });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  await authService.verifyOtp(email, code);
  return sendSuccess(res, { message: "Email verified successfully" });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.resendOtp(email);
  return sendSuccess(res, { message: "Verification code resent to your email" });
});
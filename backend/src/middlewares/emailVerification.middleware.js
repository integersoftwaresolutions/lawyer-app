import { ApiError } from "../helpers/apiError.js";

/**
 * Middleware to enforce email verification
 * Use this on routes that require verified email
 */
export function requireEmailVerification(req, _res, next) {
  if (!req.user) {
    return next(new ApiError(401, "Not authenticated"));
  }
  if (!req.user.isEmailVerified) {
    return next(new ApiError(403, "Email verification required"));
  }
  next();
}


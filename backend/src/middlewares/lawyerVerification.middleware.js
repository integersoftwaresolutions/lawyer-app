import { ApiError } from "../helpers/apiError.js";
import LawyerProfile from "../models/LawyerProfile.js";
import { VERIFICATION_STATUS } from "../config/constants.js";

/**
 * Middleware to ensure lawyer is verified
 * Use this on routes that only verified lawyers can access
 */
export async function requireVerifiedLawyer(req, res, next) {
  try {
    // Check if user is authenticated (should be done by authMiddleware first)
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Check if user is a lawyer
    if (req.user.role !== "LAWYER") {
      throw new ApiError(403, "This endpoint is only available for lawyers");
    }

    // Check verification status
    const profile = await LawyerProfile.findOne({ userId: req.user.id }).lean();
    
    if (!profile) {
      throw new ApiError(404, "Lawyer profile not found. Please complete your profile first.");
    }

    if (profile.verificationStatus !== VERIFICATION_STATUS.APPROVED) {
      throw new ApiError(403, "Your account must be verified to access this feature. Please complete the verification process.");
    }

    // Add profile to request for use in controllers
    req.lawyerProfile = profile;
    
    next();
  } catch (error) {
    next(error);
  }
}


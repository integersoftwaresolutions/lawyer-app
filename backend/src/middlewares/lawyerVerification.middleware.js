import { ApiError } from "../helpers/apiError.js";
import LawyerProfile from "../models/LawyerProfile.js";
import { ERROR_CODES, VERIFICATION_STATUS } from "../config/constants.js";

/**
 * Marketplace-only gate: KYC approved. No verification fee.
 * Do not use on workspace docs/AI — those use email verified + permissions.
 */
export async function requireVerifiedLawyer(req, res, next) {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    if (req.user.role !== "LAWYER") {
      throw new ApiError(403, "This endpoint is only available for lawyers");
    }

    const profile = await LawyerProfile.findOne({ userId: req.user.id }).lean();

    if (!profile) {
      throw new ApiError(404, "Lawyer profile not found. Please complete your profile first.");
    }

    if (profile.verificationStatus !== VERIFICATION_STATUS.APPROVED) {
      throw new ApiError(
        403,
        "Your lawyer profile must be verified before you can use this page.",
        undefined,
        ERROR_CODES.LAWYER_NOT_VERIFIED
      );
    }

    req.lawyerProfile = profile;
    next();
  } catch (error) {
    next(error);
  }
}

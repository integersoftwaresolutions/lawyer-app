import { ApiError } from "../helpers/apiError.js";
import AdminSetting from "../models/AdminSetting.js";
import LawyerProfile from "../models/LawyerProfile.js";
import * as walletService from "./wallet.service.js";

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

function getPackageFee({ settings, durationDays }) {
  if (durationDays === 7) return settings.profileBoostFee7Days || 0;
  if (durationDays === 30) return settings.profileBoostFee30Days || 0;
  return 0;
}

export async function getMyProfileBoostInfo(lawyerUserId) {
  const settings = await AdminSetting.findOne();
  const profile = await LawyerProfile.findOne({ userId: lawyerUserId }).lean();
  if (!profile) throw new ApiError(404, "Lawyer profile not found");

  const now = new Date();
  const boostActive =
    profile.isFeatured === true && profile.featuredUntil && new Date(profile.featuredUntil) > now;

  return {
    pricing: {
      fee7Days: settings?.profileBoostFee7Days || 0,
      fee30Days: settings?.profileBoostFee30Days || 0
    },
    boost: {
      isFeatured: boostActive,
      featuredUntil: profile.featuredUntil
    }
  };
}

export async function purchaseProfileBoost({ lawyerUserId, durationDays }) {
  const settings = await AdminSetting.findOne();
  const profile = await LawyerProfile.findOne({ userId: lawyerUserId });
  if (!profile) throw new ApiError(404, "Lawyer profile not found");

  const fee = getPackageFee({ settings, durationDays });
  if (!fee || fee <= 0) {
    throw new ApiError(400, "This boost package is not available");
  }

  const now = new Date();
  const baseUntil = profile.featuredUntil && new Date(profile.featuredUntil) > now ? profile.featuredUntil : now;
  const newUntil = new Date(baseUntil.getTime() + durationDays * MILLISECONDS_IN_DAY);

  // Spend credits first; only update featured state if wallet spend succeeds.
  await walletService.spendCredits(lawyerUserId, {
    amount: fee,
    note: `Profile boost (${durationDays} days)`
  });

  profile.isFeatured = true;
  profile.featuredUntil = newUntil;
  await profile.save();

  return {
    profile: profile.toObject()
  };
}


import { ApiError } from "../helpers/apiError.js";
import LawyerProfile from "../models/LawyerProfile.js";
import Booking from "../models/Booking.js";
import Wallet from "../models/Wallet.js";
import LedgerEntry from "../models/LedgerEntry.js";
import { getPagination } from "../utils/pagination.js";
import { BOOKING_STATUS, LEDGER_TYPES } from "../config/constants.js";

export async function searchLawyers(query) {
  const { page, limit, skip } = getPagination(query);

  const filter = {};

  if (query.verified === "true") {
    filter.verificationStatus = "APPROVED";
  }

  if (query.city) filter.city = query.city;
  if (query.specialization) filter.specialization = query.specialization;
  if (query.minExp) filter.experienceYears = { ...(filter.experienceYears || {}), $gte: Number(query.minExp) };
  if (query.maxExp) filter.experienceYears = { ...(filter.experienceYears || {}), $lte: Number(query.maxExp) };
  if (query.minRate) filter.hourlyRate = { ...(filter.hourlyRate || {}), $gte: Number(query.minRate) };
  if (query.maxRate) filter.hourlyRate = { ...(filter.hourlyRate || {}), $lte: Number(query.maxRate) };
  if (query.minRating) filter.ratingAvg = { $gte: Number(query.minRating) };

  if (query.q) {
    filter.$or = [
      { fullName: { $regex: query.q, $options: "i" } },
      { bio: { $regex: query.q, $options: "i" } },
      { specialization: { $regex: query.q, $options: "i" } }
    ];
  }

  let sort = { isFeatured: -1, ratingAvg: -1 };
  if (query.sort === "rate_low") sort = { isFeatured: -1, hourlyRate: 1 };
  if (query.sort === "rate_high") sort = { isFeatured: -1, hourlyRate: -1 };
  if (query.sort === "experience") sort = { isFeatured: -1, experienceYears: -1 };
  if (query.sort === "rating") sort = { isFeatured: -1, ratingAvg: -1 };

  const [items, total] = await Promise.all([
    LawyerProfile.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    LawyerProfile.countDocuments(filter)
  ]);

  return {
    items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

export async function getLawyerProfile(lawyerUserId) {
  const profile = await LawyerProfile.findOne({ userId: lawyerUserId }).lean();
  return profile;
}

export async function getMyLawyerProfile(userId) {
  const profile = await LawyerProfile.findOne({ userId }).lean();
  if (!profile) throw new ApiError(404, "Lawyer profile not found");
  return profile;
}

export async function updateLawyerProfile(userId, data) {
  const profile = await LawyerProfile.findOne({ userId });
  if (!profile) throw new ApiError(404, "Lawyer profile not found");

  const allowedFields = [
    "fullName", "phone", "email", "whatsapp", "city", "officeAddress",
    "specialization", "languages", "experienceYears", "hourlyRate",
    "consultationFee", "bio", "profileImage"
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  }

  await profile.save();
  return profile.toObject();
}

export async function getLawyerBookings(lawyerUserId, { status, page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const filter = { lawyerUserId, deletedByLawyer: { $ne: true }, deletedByClient: { $ne: true } };

  if (status) {
    filter.status = status;
  }

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate({ path: "clientId", select: "email" })
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter)
  ]);

  return {
    items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

export async function getLawyerStats(lawyerUserId) {
  const baseFilter = { lawyerUserId, deletedByClient: { $ne: true }, deletedByLawyer: { $ne: true } };
  const [totalBookings, completedBookings, upcomingBookings, totalEarnings] = await Promise.all([
    Booking.countDocuments(baseFilter),
    Booking.countDocuments({ ...baseFilter, status: BOOKING_STATUS.COMPLETED }),
    Booking.countDocuments({
      ...baseFilter,
      status: { $in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ACTIVE] },
      startAt: { $gte: new Date() }
    }),
    Booking.aggregate([
      { $match: { lawyerUserId, deletedByClient: { $ne: true }, deletedByLawyer: { $ne: true }, status: BOOKING_STATUS.COMPLETED } },
      { $group: { _id: null, total: { $sum: "$lawyerEarning" } } }
    ])
  ]);

  const profile = await LawyerProfile.findOne({ userId: lawyerUserId }).lean();

  return {
    totalBookings,
    completedBookings,
    upcomingBookings,
    totalEarnings: totalEarnings[0]?.total || 0,
    ratingAvg: profile?.ratingAvg || 0,
    ratingCount: profile?.ratingCount || 0,
    totalConsultations: profile?.totalConsultations || 0
  };
}

export async function getLawyerEarnings(lawyerUserId, { page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;

  const [items, total, summary] = await Promise.all([
    LedgerEntry.find({ userId: lawyerUserId, isHidden: { $ne: true }, type: { $in: [LEDGER_TYPES.EARNING, LEDGER_TYPES.PAYOUT] } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LedgerEntry.countDocuments({ userId: lawyerUserId, isHidden: { $ne: true }, type: { $in: [LEDGER_TYPES.EARNING, LEDGER_TYPES.PAYOUT] } }),
    LedgerEntry.aggregate([
      { $match: { userId: lawyerUserId } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ])
  ]);

  const wallet = await Wallet.findOne({ userId: lawyerUserId }).lean();

  return {
    items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
    summary: {
      balance: wallet?.balanceCredits || 0,
      totalEarnings: summary.find(s => s._id === LEDGER_TYPES.EARNING)?.total || 0,
      totalPayouts: Math.abs(summary.find(s => s._id === LEDGER_TYPES.PAYOUT)?.total || 0)
    }
  };
}

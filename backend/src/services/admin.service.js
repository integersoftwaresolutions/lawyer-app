import { ApiError } from "../helpers/apiError.js";
import LawyerProfile from "../models/LawyerProfile.js";
import AdminSetting from "../models/AdminSetting.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import VerificationDocument from "../models/VerificationDocument.js";
import { BOOKING_STATUS, VERIFICATION_STATUS } from "../config/constants.js";
import { listResult } from "../utils/pagination.js";

export async function listPendingLawyers() {
  return LawyerProfile.find({ verificationStatus: "PENDING" })
    .populate("userId", "email createdAt")
    .lean();
}

export async function listAllLawyers({ status, page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const filter = {};
  
  if (status) {
    filter.verificationStatus = status;
  }
  
  const [items, total] = await Promise.all([
    LawyerProfile.find(filter)
      .populate("userId", "email createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LawyerProfile.countDocuments(filter)
  ]);
  
  return listResult({ items, total, pagination: { page, limit } });
}

export async function setLawyerVerification({ lawyerUserId, status, notes, adminId }) {
  const profile = await LawyerProfile.findOne({ userId: lawyerUserId });
  if (!profile) throw new ApiError(404, "Lawyer profile not found");
  
  profile.verificationStatus = status;
  profile.verificationNotes = notes || "";
  
  if (status === VERIFICATION_STATUS.APPROVED) {
    profile.verifiedAt = new Date();
  }
  
  await profile.save();
  return profile.toObject();
}

export async function getSettings() {
  const s = await AdminSetting.findOne();
  return (s || (await AdminSetting.create({}))).toObject();
}

export async function updateSettings(patch) {
  const s = await AdminSetting.findOne();
  const doc = s || (await AdminSetting.create({}));
  
  const allowedFields = [
    "commissionPercent",
    "monthlyCreditGrant",
    "profileBoostFee7Days",
    "profileBoostFee30Days"
  ];
  for (const field of allowedFields) {
    if (patch[field] !== undefined) {
      doc[field] = patch[field];
    }
  }
  // Verification fee removed as product paywall — subscriptions gate practice tools
  doc.verificationFee = 0;
  
  await doc.save();
  return doc.toObject();
}

export async function getAnalytics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const [totalUsers, totalLawyers, totalClients, verifiedLawyers, pendingLawyers,
    totalBookings, completedBookings, activeBookings, monthlyBookings,
    totalRevenue, monthlyRevenue, totalReviews] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "LAWYER" }),
    User.countDocuments({ role: "CLIENT" }),
    LawyerProfile.countDocuments({ verificationStatus: VERIFICATION_STATUS.APPROVED }),
    LawyerProfile.countDocuments({ verificationStatus: VERIFICATION_STATUS.PENDING }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: BOOKING_STATUS.COMPLETED }),
    Booking.countDocuments({ status: BOOKING_STATUS.ACTIVE }),
    Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Booking.aggregate([
      { $match: { status: BOOKING_STATUS.COMPLETED } },
      { $group: { _id: null, total: { $sum: "$platformFee" } } }
    ]),
    Booking.aggregate([
      { $match: { status: BOOKING_STATUS.COMPLETED, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$platformFee" } } }
    ]),
    Review.countDocuments()
  ]);
  
  return {
    users: {
      total: totalUsers,
      lawyers: totalLawyers,
      clients: totalClients
    },
    lawyers: {
      verified: verifiedLawyers,
      pending: pendingLawyers
    },
    bookings: {
      total: totalBookings,
      completed: completedBookings,
      active: activeBookings,
      thisMonth: monthlyBookings
    },
    revenue: {
      total: totalRevenue[0]?.total || 0,
      thisMonth: monthlyRevenue[0]?.total || 0
    },
    reviews: totalReviews
  };
}

export async function getAllUsers({ role, page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const filter = {};
  
  if (role) {
    filter.role = role;
  }
  
  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash -refreshTokenHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ]);
  
  return listResult({ items, total, pagination: { page, limit } });
}

export async function getAllBookings({ status, page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const filter = {};
  
  if (status) {
    filter.status = status;
  }
  
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate("clientId", "email")
      .populate("lawyerUserId", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter)
  ]);
  
  return listResult({ items, total, pagination: { page, limit } });
}

export async function getVerificationDocuments(lawyerUserId) {
  return VerificationDocument.find({ lawyerUserId }).lean();
}

export async function reviewVerificationDocument({ documentId, status, notes, adminId }) {
  const doc = await VerificationDocument.findById(documentId);
  if (!doc) throw new ApiError(404, "Document not found");
  
  doc.status = status;
  doc.adminNotes = notes || "";
  doc.reviewedAt = new Date();
  doc.reviewedBy = adminId;
  
  await doc.save();
  return doc.toObject();
}

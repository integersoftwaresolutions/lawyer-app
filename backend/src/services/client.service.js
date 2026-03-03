import { ApiError } from "../helpers/apiError.js";
import ClientProfile from "../models/ClientProfile.js";
import Booking from "../models/Booking.js";
import { BOOKING_STATUS } from "../config/constants.js";

export async function getClientProfile(userId) {
  let profile = await ClientProfile.findOne({ userId });
  
  if (!profile) {
    profile = await ClientProfile.create({ userId });
  }
  
  return profile.toObject();
}

export async function updateClientProfile(userId, data) {
  let profile = await ClientProfile.findOne({ userId });
  
  if (!profile) {
    profile = new ClientProfile({ userId });
  }
  
  const allowedFields = ["fullName", "phone", "whatsapp", "city", "address", "cnic", "dateOfBirth", "gender", "profileImage"];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  }
  
  await profile.save();
  return profile.toObject();
}

export async function getClientBookings(clientId, { status, page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const filter = { clientId, deletedByClient: { $ne: true }, deletedByLawyer: { $ne: true } };
  
  if (status) {
    filter.status = status;
  }
  
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate({
        path: "lawyerUserId",
        select: "email"
      })
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

export async function getClientStats(clientId) {
  const [totalBookings, completedBookings, upcomingBookings] = await Promise.all([
    Booking.countDocuments({ clientId, deletedByClient: { $ne: true }, deletedByLawyer: { $ne: true } }),
    Booking.countDocuments({ clientId, deletedByClient: { $ne: true }, deletedByLawyer: { $ne: true }, status: BOOKING_STATUS.COMPLETED }),
    Booking.countDocuments({ 
      clientId, 
      deletedByClient: { $ne: true },
      deletedByLawyer: { $ne: true },
      status: { $in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ACTIVE] },
      startAt: { $gte: new Date() }
    })
  ]);
  
  return {
    totalBookings,
    completedBookings,
    upcomingBookings
  };
}

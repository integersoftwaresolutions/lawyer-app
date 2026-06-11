import { ApiError } from "../helpers/apiError.js";
import ClientProfile from "../models/ClientProfile.js";
import Booking from "../models/Booking.js";
import Dispute from "../models/Dispute.js";
import { BOOKING_STATUS } from "../config/constants.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

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

export async function getClientBookings(clientId, query = {}) {
  const { status } = query;
  const { page, limit, skip } = getPagination(query);
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

  const bookingIds = items.map((b) => b._id);
  const disputes = await Dispute.find({ bookingId: { $in: bookingIds } })
    .select("bookingId status reason description raisedBy resolution refundAmount resolutionNote")
    .lean();
  const disputeByBooking = Object.fromEntries(
    disputes.map((d) => [
      d.bookingId.toString(),
      {
        status: d.status,
        reason: d.reason,
        description: d.description,
        raisedBy: d.raisedBy?.toString(),
        resolution: d.resolution,
        refundAmount: d.refundAmount,
        resolutionNote: d.resolutionNote
      }
    ])
  );

  const itemsWithDispute = items.map((b) => ({
    ...b,
    dispute: disputeByBooking[b._id.toString()] || null
  }));

  return {
    items: itemsWithDispute,
    meta: buildPaginationMeta(total, { page, limit })
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

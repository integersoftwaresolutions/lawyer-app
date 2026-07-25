import { ApiError } from "../helpers/apiError.js";
import ClientProfile from "../models/ClientProfile.js";
import Booking from "../models/Booking.js";
import Dispute from "../models/Dispute.js";
import { BOOKING_STATUS } from "../config/constants.js";
import { listResult } from "../utils/pagination.js";
import { parseListQuery } from "../utils/listQuery.js";
import { CLIENT_PROFILE_FIELDS } from "../utils/userProfileFields.js";

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
  
  const allowedFields = CLIENT_PROFILE_FIELDS;
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  }
  
  await profile.save();
  return profile.toObject();
}

export async function getClientBookings(clientId, query = {}) {
  const { filter, sort, pagination } = parseListQuery(query, {
    baseFilter: { clientId, deletedByClient: { $ne: true }, deletedByLawyer: { $ne: true } },
    filters: [{ key: "status", path: "status", type: "eq" }],
    sort: { default: { startAt: -1 } }
  });

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate({
        path: "lawyerUserId",
        select: "email"
      })
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
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

  return listResult({ items: itemsWithDispute, total, pagination });
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

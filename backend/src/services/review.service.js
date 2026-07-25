import { ApiError } from "../helpers/apiError.js";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import LawyerProfile from "../models/LawyerProfile.js";
import { BOOKING_STATUS } from "../config/constants.js";
import { listResult } from "../utils/pagination.js";

export async function createReview({ bookingId, clientId, rating, comment }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  
  if (booking.clientId.toString() !== clientId) {
    throw new ApiError(403, "Only the client can review this booking");
  }
  
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw new ApiError(400, "Can only review completed sessions");
  }
  
  const existingReview = await Review.findOne({ bookingId });
  if (existingReview) throw new ApiError(409, "Review already exists for this booking");
  
  const review = await Review.create({
    bookingId,
    clientId,
    lawyerUserId: booking.lawyerUserId,
    rating,
    comment
  });
  
  booking.hasReview = true;
  await booking.save();
  
  await updateLawyerRating(booking.lawyerUserId);
  
  return review.toObject();
}

export async function updateLawyerRating(lawyerUserId) {
  const reviews = await Review.find({ lawyerUserId });
  if (reviews.length === 0) return;
  
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / reviews.length;
  
  await LawyerProfile.findOneAndUpdate(
    { userId: lawyerUserId },
    { ratingAvg: Math.round(avgRating * 10) / 10, ratingCount: reviews.length }
  );
}

export async function getReviewsByLawyer(lawyerUserId, { page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    Review.find({ lawyerUserId })
      .populate("clientId", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ lawyerUserId })
  ]);
  
  return listResult({ items, total, pagination: { page, limit } });
}

export async function getReviewsByClient(clientId, { page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    Review.find({ clientId })
      .populate("lawyerUserId", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ clientId })
  ]);
  
  return listResult({ items, total, pagination: { page, limit } });
}

export async function disputeReview({ reviewId, clientId, reason }) {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, "Review not found");
  
  if (review.clientId.toString() !== clientId) {
    throw new ApiError(403, "Not authorized");
  }
  
  review.isDisputed = true;
  review.disputeReason = reason;
  await review.save();
  
  return review.toObject();
}

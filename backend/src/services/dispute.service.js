import mongoose from "mongoose";
import { ApiError } from "../helpers/apiError.js";
import Dispute from "../models/Dispute.js";
import Booking from "../models/Booking.js";
import Wallet from "../models/Wallet.js";
import LedgerEntry from "../models/LedgerEntry.js";
import * as walletService from "./wallet.service.js";
import {
  BOOKING_STATUS,
  DISPUTE_STATUS,
  DISPUTE_REASON,
  DISPUTE_RESOLUTION,
  LEDGER_TYPES
} from "../config/constants.js";

export async function raiseDispute({ bookingId, raisedById, reason, description }) {
  const booking = await Booking.findById(bookingId)
    .populate("clientId", "email")
    .populate("lawyerUserId", "email")
    .lean();
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw new ApiError(400, "Disputes can only be raised for completed consultations");
  }

  const isClient = booking.clientId._id.toString() === raisedById;
  const isLawyer = booking.lawyerUserId._id.toString() === raisedById;
  if (!isClient && !isLawyer) throw new ApiError(403, "Only participants can raise a dispute");

  const raisedBy = isClient ? booking.clientId._id : booking.lawyerUserId._id;
  const raisedAgainst = isClient ? booking.lawyerUserId._id : booking.clientId._id;

  const existing = await Dispute.findOne({
    bookingId,
    status: { $in: [DISPUTE_STATUS.OPEN, DISPUTE_STATUS.UNDER_REVIEW] }
  });
  if (existing) throw new ApiError(400, "An active dispute already exists for this booking");

  const validReason = Object.values(DISPUTE_REASON).includes(reason);
  if (!validReason) throw new ApiError(400, "Invalid dispute reason");

  const dispute = await Dispute.create({
    bookingId,
    raisedBy,
    raisedAgainst,
    reason,
    description: description || "",
    status: DISPUTE_STATUS.OPEN
  });

  return dispute.toObject();
}

export async function getMyDisputes(userId, { page = 1, limit = 20, status } = {}) {
  const skip = (page - 1) * limit;
  const filter = { $or: [{ raisedBy: userId }, { raisedAgainst: userId }] };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Dispute.find(filter)
      .populate("bookingId")
      .populate("raisedBy", "email")
      .populate("raisedAgainst", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Dispute.countDocuments(filter)
  ]);

  return {
    items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

export async function getDisputesAdmin({ page = 1, limit = 20, status } = {}) {
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Dispute.find(filter)
      .populate("bookingId")
      .populate("raisedBy", "email fullName")
      .populate("raisedAgainst", "email fullName")
      .populate("resolvedBy", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Dispute.countDocuments(filter)
  ]);

  return {
    items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

export async function getDisputeById(disputeId) {
  const dispute = await Dispute.findById(disputeId)
    .populate("bookingId")
    .populate("raisedBy", "email fullName")
    .populate("raisedAgainst", "email fullName")
    .populate("resolvedBy", "email")
    .lean();
  if (!dispute) throw new ApiError(404, "Dispute not found");
  return dispute;
}

export async function updateDisputeStatus({ disputeId, status }) {
  const validStatuses = [DISPUTE_STATUS.OPEN, DISPUTE_STATUS.UNDER_REVIEW];
  if (!validStatuses.includes(status)) throw new ApiError(400, "Invalid status");

  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw new ApiError(404, "Dispute not found");
  if (dispute.status === DISPUTE_STATUS.RESOLVED) {
    throw new ApiError(400, "Cannot change status of resolved dispute");
  }

  dispute.status = status;
  await dispute.save();

  return dispute.toObject();
}

export async function resolveDispute({ disputeId, adminId, resolution, resolutionNote, refundAmount }) {
  const dispute = await Dispute.findById(disputeId).populate("bookingId").lean();
  if (!dispute) throw new ApiError(404, "Dispute not found");
  if (dispute.status === DISPUTE_STATUS.RESOLVED) {
    throw new ApiError(400, "Dispute is already resolved");
  }

  const validResolution = Object.values(DISPUTE_RESOLUTION).includes(resolution);
  if (!validResolution) throw new ApiError(400, "Invalid resolution type");

  const amount = Number(refundAmount) || 0;
  const booking = dispute.bookingId;
  if (!booking) throw new ApiError(404, "Booking not found");

  const refundResolutions = [DISPUTE_RESOLUTION.REFUND_CLIENT_FULL, DISPUTE_RESOLUTION.REFUND_CLIENT_PARTIAL];
  if (refundResolutions.includes(resolution)) {
    const maxRefund = booking.amount || 0;
    if (amount <= 0 || amount > maxRefund) {
      throw new ApiError(400, `Refund amount must be between 1 and ${maxRefund}`);
    }
  }

  const now = new Date();

  if (refundResolutions.includes(resolution) && amount > 0) {
    await walletService.refundCredits(booking.clientId, {
      amount,
      note: `Dispute refund - Booking ${booking._id}`,
      refId: disputeId
    });

    if (booking.lawyerEarning > 0) {
      const debitAmount = Math.min(amount, booking.lawyerEarning);
      const lawyerWallet = await Wallet.findOne({ userId: booking.lawyerUserId });
      if (lawyerWallet) {
        lawyerWallet.balanceCredits = Math.max(0, lawyerWallet.balanceCredits - debitAmount);
        await lawyerWallet.save();
      }
      await LedgerEntry.create({
        userId: booking.lawyerUserId,
        type: LEDGER_TYPES.EARNING_REVERSAL,
        amount: -debitAmount,
        note: `Dispute resolution - refund to client`,
        refId: disputeId
      });
    }
  }

  const updated = await Dispute.findByIdAndUpdate(
    disputeId,
    {
      status: DISPUTE_STATUS.RESOLVED,
      resolution,
      resolutionNote: resolutionNote || "",
      refundAmount: amount,
      resolvedBy: adminId,
      resolvedAt: now
    },
    { new: true }
  )
    .populate("bookingId")
    .populate("raisedBy", "email")
    .populate("raisedAgainst", "email")
    .populate("resolvedBy", "email")
    .lean();

  return updated;
}

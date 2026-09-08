import mongoose from "mongoose";
import { PLAN_KEYS } from "../billing/planCatalog.js";

export const BILLING_STATUS = Object.freeze({
  FREE: "FREE",
  TRIALING: "TRIALING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
  INCOMPLETE: "INCOMPLETE"
});

export const BILLING_PROVIDER = Object.freeze({
  STRIPE: "stripe",
  MANUAL: "manual",
  NONE: "none"
});

const WorkspaceSubscriptionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true,
      index: true
    },
    planKey: {
      type: String,
      enum: Object.values(PLAN_KEYS),
      default: PLAN_KEYS.BASE,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(BILLING_STATUS),
      default: BILLING_STATUS.FREE,
      index: true
    },
    provider: {
      type: String,
      enum: Object.values(BILLING_PROVIDER),
      default: BILLING_PROVIDER.NONE
    },
    stripeCustomerId: { type: String, default: null, index: true },
    stripeSubscriptionId: { type: String, default: null },
    stripePriceId: { type: String, default: null },
    seatLimit: { type: Number, default: null },
    trialEndsAt: { type: Date, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date, default: null },
    graceEndsAt: { type: Date, default: null },
    /** When true, practice writes/AI are locked (past due grace or post-trial unpaid). */
    practiceLocked: { type: Boolean, default: false },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

WorkspaceSubscriptionSchema.index({ status: 1, planKey: 1 });
WorkspaceSubscriptionSchema.index({ stripeSubscriptionId: 1 });

export default mongoose.model("WorkspaceSubscription", WorkspaceSubscriptionSchema);

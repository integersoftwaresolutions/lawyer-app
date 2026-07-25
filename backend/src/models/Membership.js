import mongoose from "mongoose";
import { MEMBERSHIP_STATUS } from "../config/constants.js";

const MembershipSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    isOwner: { type: Boolean, default: false, index: true },
    /** Null when isOwner — owner has implicit all permissions. */
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.ACTIVE,
      index: true
    },
    lastActiveAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true }
  },
  { timestamps: true }
);

MembershipSchema.index(
  { workspaceId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null, status: MEMBERSHIP_STATUS.ACTIVE }
  }
);
MembershipSchema.index({ userId: 1, status: 1, deletedAt: 1 });

export default mongoose.model("Membership", MembershipSchema);

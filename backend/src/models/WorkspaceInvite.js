import mongoose from "mongoose";
import { WORKSPACE_INVITE_STATUS } from "../config/constants.js";

const WorkspaceInviteSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    /** Email invite targets a specific address; link invites may omit email. */
    email: { type: String, default: null, lowercase: true, trim: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: Object.values(WORKSPACE_INVITE_STATUS),
      default: WORKSPACE_INVITE_STATUS.PENDING,
      index: true
    },
    expiresAt: { type: Date, required: true, index: true },
    /** Email invites: maxUses=1. Link invites: multi-use with cap. */
    maxUses: { type: Number, default: 1, min: 1 },
    useCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

WorkspaceInviteSchema.index({ workspaceId: 1, status: 1, createdAt: -1 });

export default mongoose.model("WorkspaceInvite", WorkspaceInviteSchema);

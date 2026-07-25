import mongoose from "mongoose";

const WorkspaceAuditLogSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    action: { type: String, required: true, index: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

WorkspaceAuditLogSchema.index({ workspaceId: 1, createdAt: -1 });

export default mongoose.model("WorkspaceAuditLog", WorkspaceAuditLogSchema);

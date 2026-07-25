import mongoose from "mongoose";
import { ALL_PERMISSION_KEYS } from "../workspaces/permissions.catalog.js";

const RoleSchema = new mongoose.Schema(
  {
    /**
     * null = global system template (immutable).
     * set = workspace-scoped role (builtin copy or custom).
     */
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true
    },
    key: { type: String, required: true, trim: true, uppercase: true, maxlength: 64 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator(keys) {
          return keys.every((k) => ALL_PERMISSION_KEYS.includes(k));
        },
        message: "Invalid permission key"
      }
    },
    /** Global template row (workspaceId null). */
    isSystem: { type: Boolean, default: false },
    /** Builtin preset copy inside a firm (immutable permissions unless cloned). */
    isBuiltin: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null, index: true }
  },
  { timestamps: true }
);

RoleSchema.index(
  { workspaceId: 1, key: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

export default mongoose.model("Role", RoleSchema);

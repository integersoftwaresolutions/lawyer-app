import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES } from "../config/constants.js";

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: Object.values(ROLES), required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    refreshTokenHash: { type: String, default: null },
    // Profile picture - reference to Media model
    profileImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    // Legacy field for backward compatibility (will be populated from Media)
    profileImage: { type: String, default: "" }
  },
  { timestamps: true }
);

// Pre-save hook to sync legacy profileImage field from Media (for backward compatibility)
UserSchema.pre("save", async function() {
  if (this.isNew || this.isModified("profileImageMediaId")) {
    if (this.profileImageMediaId) {
      try {
        const Media = mongoose.model("Media");
        const media = await Media.findById(this.profileImageMediaId);
        if (media) {
          this.profileImage = media.url;
        }
      } catch (error) {
        // If Media model not available or error, skip sync
        console.warn("Failed to sync Media fields:", error.message);
      }
    } else if (!this.profileImageMediaId && !this.profileImage) {
      this.profileImage = "";
    }
  }
});

UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

export default mongoose.model("User", UserSchema);

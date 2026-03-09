import mongoose from "mongoose";

const ClientProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    city: { type: String, default: "", index: true },
    address: { type: String, default: "" },
    cnic: { type: String, default: "" }, // CNIC for Pakistani clients
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    // Reference to Media model instead of storing raw URL
    profileImageMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    // Legacy field for backward compatibility (will be populated from Media)
    profileImage: { type: String, default: "" }
  },
  { timestamps: true }
);

// Pre-save hook to sync legacy profileImage field from Media (for backward compatibility)
ClientProfileSchema.pre("save", async function() {
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

export default mongoose.model("ClientProfile", ClientProfileSchema);

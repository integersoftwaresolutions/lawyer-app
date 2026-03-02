import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true, index: true },
    balanceCredits: { type: Number, default: 0 },
    monthlyCredits: { type: Number, default: 0 },
    monthlyResetAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", WalletSchema);

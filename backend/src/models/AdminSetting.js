import mongoose from "mongoose";

const AdminSettingSchema = new mongoose.Schema(
  {
    commissionPercent: { type: Number, default: 10 },
    verificationFee: { type: Number, default: 0 },
    monthlyCreditGrant: { type: Number, default: 30 },
    // Profile boost packages (fees are deducted from lawyer wallet credits)
    profileBoostFee7Days: { type: Number, default: 0 },
    profileBoostFee30Days: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("AdminSetting", AdminSettingSchema);

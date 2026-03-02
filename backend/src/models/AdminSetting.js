import mongoose from "mongoose";

const AdminSettingSchema = new mongoose.Schema(
  {
    commissionPercent: { type: Number, default: 10 },
    verificationFee: { type: Number, default: 0 },
    monthlyCreditGrant: { type: Number, default: 30 }
  },
  { timestamps: true }
);

export default mongoose.model("AdminSetting", AdminSettingSchema);

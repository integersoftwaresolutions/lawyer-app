import mongoose from "mongoose";

const AdminSettingSchema = new mongoose.Schema(
  {
    commissionPercent: { type: Number, default: 10 },
    verificationFee: { type: Number, default: 0 },
    monthlyCreditGrant: { type: Number, default: 30 },
    // Profile boost packages (fees are deducted from lawyer wallet credits)
    profileBoostFee7Days: { type: Number, default: 0 },
    profileBoostFee30Days: { type: Number, default: 0 },
    // Phase 2 — AI (billing disabled until explicitly enabled)
    aiBillingEnabled: { type: Boolean, default: false },
    aiDailyRequestLimit: { type: Number, default: 50 },
    aiCreditsPerThousandTokens: { type: Number, default: 1 },
    phase2Enabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("AdminSetting", AdminSettingSchema);

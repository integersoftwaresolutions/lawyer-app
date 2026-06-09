import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import AdminSetting from "../models/AdminSetting.js";
import { ROLES } from "../config/constants.js";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "Password@123";

/**
 * Ensure the default admin account exists.
 * Idempotent — safe to run on every server start.
 */
export async function seedAdmin() {
  let adminSettings = await AdminSetting.findOne();
  if (!adminSettings) {
    adminSettings = await AdminSetting.create({});
  }

  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (existingAdmin) {
    return;
  }

  const passwordHash = await User.hashPassword(ADMIN_PASSWORD);
  const adminUser = await User.create({
    role: ROLES.ADMIN,
    email: ADMIN_EMAIL,
    passwordHash,
    isEmailVerified: true,
  });

  await Wallet.create({
    userId: adminUser._id,
    balanceCredits: adminSettings.monthlyCreditGrant,
    monthlyCredits: adminSettings.monthlyCreditGrant,
    monthlyResetAt: new Date(),
  });

  console.log(`✅ Default admin created: ${ADMIN_EMAIL}`);
}

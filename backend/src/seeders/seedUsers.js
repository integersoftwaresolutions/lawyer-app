import User from "../models/User.js";
import ClientProfile from "../models/ClientProfile.js";
import LawyerProfile from "../models/LawyerProfile.js";
import Wallet from "../models/Wallet.js";
import AdminSetting from "../models/AdminSetting.js";
import { ROLES } from "../config/constants.js";

/**
 * Seed test users (Admin, Client, Lawyer)
 * This function is idempotent - it checks if users exist before creating them
 * Safe to run multiple times
 */
export async function seedUsers() {
  try {
    console.log("🌱 Seeding test users...");

    // Ensure admin settings exist
    let adminSettings = await AdminSetting.findOne();
    if (!adminSettings) {
      adminSettings = await AdminSetting.create({});
    }

    // Create Admin User
    let adminUser = await User.findOne({ email: "admin@lawyer.com" });
    if (!adminUser) {
      const adminPasswordHash = await User.hashPassword("admin123");
      adminUser = await User.create({
        role: ROLES.ADMIN,
        email: "admin@lawyer.com",
        passwordHash: adminPasswordHash,
        isEmailVerified: true
      });
      await Wallet.create({
        userId: adminUser._id,
        balanceCredits: adminSettings.monthlyCreditGrant,
        monthlyCredits: adminSettings.monthlyCreditGrant,
        monthlyResetAt: new Date()
      });
      console.log("✅ Admin user created: admin@lawyer.com / admin123");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Create Client User
    let clientUser = await User.findOne({ email: "client@lawyer.com" });
    if (!clientUser) {
      const clientPasswordHash = await User.hashPassword("client123");
      clientUser = await User.create({
        role: ROLES.CLIENT,
        email: "client@lawyer.com",
        passwordHash: clientPasswordHash,
        isEmailVerified: true
      });
      await Wallet.create({
        userId: clientUser._id,
        balanceCredits: adminSettings.monthlyCreditGrant,
        monthlyCredits: adminSettings.monthlyCreditGrant,
        monthlyResetAt: new Date()
      });
      await ClientProfile.create({
        userId: clientUser._id,
        fullName: "Test Client",
        phone: "+923001234567",
        whatsapp: "+923001234567",
        city: "Karachi",
        address: "123 Test Street, Karachi",
        cnic: "12345-1234567-1",
        gender: "Male"
      });
      console.log("✅ Client user created: client@lawyer.com / client123");
    } else {
      console.log("ℹ️  Client user already exists");
    }

    // Create Lawyer User
    let lawyerUser = await User.findOne({ email: "lawyer@lawyer.com" });
    if (!lawyerUser) {
      const lawyerPasswordHash = await User.hashPassword("lawyer123");
      lawyerUser = await User.create({
        role: ROLES.LAWYER,
        email: "lawyer@lawyer.com",
        passwordHash: lawyerPasswordHash,
        isEmailVerified: true
      });
      await Wallet.create({
        userId: lawyerUser._id,
        balanceCredits: adminSettings.monthlyCreditGrant,
        monthlyCredits: adminSettings.monthlyCreditGrant,
        monthlyResetAt: new Date()
      });
      await LawyerProfile.create({
        userId: lawyerUser._id,
        fullName: "Test Lawyer",
        phone: "+923001234568",
        email: "lawyer@lawyer.com",
        whatsapp: "+923001234568",
        city: "Lahore",
        officeAddress: "456 Law Office, Lahore",
        cnic: "12345-1234567-2",
        barCouncilNumber: "BC-12345",
        barCouncil: "Punjab Bar Council",
        specialization: ["Criminal Law", "Family Law"],
        languages: ["English", "Urdu"],
        experienceYears: 5,
        hourlyRate: 5000,
        consultationFee: 2000,
        bio: "Experienced lawyer with expertise in criminal and family law.",
        verificationStatus: "APPROVED",
        verifiedAt: new Date()
      });
      console.log("✅ Lawyer user created: lawyer@lawyer.com / lawyer123");
    } else {
      console.log("ℹ️  Lawyer user already exists");
    }

    console.log("✅ User seeding completed!");
    console.log("\n📋 Test Users:");
    console.log("   Admin:  admin@lawyer.com / admin123");
    console.log("   Client: client@lawyer.com / client123");
    console.log("   Lawyer: lawyer@lawyer.com / lawyer123");
    console.log("");
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
}


import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/user";
import dotenv from "dotenv";

dotenv.config();

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "superadmin@glangetaway.com";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!";
const SUPER_ADMIN_FIRST_NAME = "Admin";
const SUPER_ADMIN_LAST_NAME = "System";

async function initializeSuperAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (existingSuperAdmin) {
      console.log("Super Admin already exists:", existingSuperAdmin.email);
      await mongoose.disconnect();
      return;
    }

    // Create Super Admin account
    const superAdmin = new User({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      firstName: SUPER_ADMIN_FIRST_NAME,
      lastName: SUPER_ADMIN_LAST_NAME,
      role: "superAdmin",
      birthdate: new Date("1990-01-01"),
      emailVerified: true,
      isActive: true,
    });

    await superAdmin.save();
    console.log("✅ Super Admin account created successfully!");
    console.log("📧 Email:", SUPER_ADMIN_EMAIL);
    console.log("🔑 Password:", SUPER_ADMIN_PASSWORD);
    console.log("👤 Role: admin");
    console.log("\n⚠️  Please save these credentials securely!");
    console.log("🔒 You can change the password after first login.");

  } catch (error) {
    console.error("❌ Error creating Super Admin:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
if (require.main === module) {
  initializeSuperAdmin();
}

export default initializeSuperAdmin;

import mongoose from "mongoose";
import User from "../src/models/user";
import dotenv from "dotenv";

dotenv.config();

async function promoteUserToAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("📡 Connected to MongoDB");

    // Find the user to promote
    const email = process.argv[2]; // Get email from command line argument
    if (!email) {
      console.log("❌ Please provide an email address:");
      console.log("   Usage: npm run promote-admin <email>");
      console.log("   Example: npm run promote-admin admin@test.com");
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User with email '${email}' not found`);
      process.exit(1);
    }

    console.log(`👤 Found user: ${user.email} (Current role: ${user.role || "user"})`);

    // Update user role to admin
    const oldRole = user.role || "user";
    user.set("role", "admin");
    await user.save();

    console.log(`✅ User promoted successfully!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Old Role: ${oldRole}`);
    console.log(`   New Role: admin`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);

  } catch (error) {
    console.error("❌ Error promoting user:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
if (require.main === module) {
  promoteUserToAdmin();
}

export default promoteUserToAdmin;

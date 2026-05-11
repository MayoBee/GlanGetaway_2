import mongoose from "mongoose";
import User from "../src/models/user";
import dotenv from "dotenv";

dotenv.config();

/**
 * Migration Script: Update Role Hierarchy
 * 
 * Old Hierarchy:         New Hierarchy:
 * - super_admin    ->    - admin
 * - admin          ->    - resort_owner
 * - user           ->    - user
 * - front_desk     ->    - front_desk
 * - housekeeping   ->    - housekeeping
 */

async function migrateRoleHierarchy() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Count before migration
    const beforeCounts = {
      super_admin: await User.countDocuments({ role: "super_admin" }),
      admin: await User.countDocuments({ role: "admin" }),
      user: await User.countDocuments({ role: "user" }),
      front_desk: await User.countDocuments({ role: "front_desk" }),
      housekeeping: await User.countDocuments({ role: "housekeeping" }),
    };

    console.log("\n📊 Before Migration:");
    console.log(`   super_admin: ${beforeCounts.super_admin}`);
    console.log(`   admin: ${beforeCounts.admin}`);
    console.log(`   user: ${beforeCounts.user}`);
    console.log(`   front_desk: ${beforeCounts.front_desk}`);
    console.log(`   housekeeping: ${beforeCounts.housekeeping}`);

    // Migrate super_admin -> admin
    const superAdminResult = await User.updateMany(
      { role: "super_admin" },
      { $set: { role: "admin" } }
    );
    console.log(`\n✅ Migrated ${superAdminResult.modifiedCount} users from super_admin to admin`);

    // Migrate admin -> resort_owner
    const adminResult = await User.updateMany(
      { role: "admin" },
      { $set: { role: "resort_owner" } }
    );
    console.log(`✅ Migrated ${adminResult.modifiedCount} users from admin to resort_owner`);

    // Count after migration
    const afterCounts = {
      admin: await User.countDocuments({ role: "admin" }),
      resort_owner: await User.countDocuments({ role: "resort_owner" }),
      user: await User.countDocuments({ role: "user" }),
      front_desk: await User.countDocuments({ role: "front_desk" }),
      housekeeping: await User.countDocuments({ role: "housekeeping" }),
    };

    console.log("\n📊 After Migration:");
    console.log(`   admin: ${afterCounts.admin}`);
    console.log(`   resort_owner: ${afterCounts.resort_owner}`);
    console.log(`   user: ${afterCounts.user}`);
    console.log(`   front_desk: ${afterCounts.front_desk}`);
    console.log(`   housekeeping: ${afterCounts.housekeeping}`);

    console.log("\n✅ Role hierarchy migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
if (require.main === module) {
  migrateRoleHierarchy();
}

export default migrateRoleHierarchy;

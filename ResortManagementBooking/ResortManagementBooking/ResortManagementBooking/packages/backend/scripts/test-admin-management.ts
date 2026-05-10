import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/user";

dotenv.config();

async function testAdminManagement() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("📡 Connected to MongoDB");

    console.log("\n🧪 Testing Admin Management System...");
    
    // Test 1: Check Super Admin exists
    console.log("\n📊 Test 1: Verify Super Admin Account");
    const superAdmin = await User.findOne({ email: "superadmin@glangetaway.com" });
    if (superAdmin) {
      console.log(`✅ Super Admin found: ${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin.email})`);
      console.log(`   Role: ${superAdmin.role}`);
    } else {
      console.log("❌ Super Admin account not found!");
    }

    // Test 2: Check regular users count
    console.log("\n📈 Test 2: User Statistics");
    const users = await User.find({});
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const regularUsers = users.filter(u => u.role === 'user' || !u.role).length;
    const superAdmins = users.filter(u => u.role === 'superAdmin').length;

    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Super Admins: ${superAdmins}`);
    console.log(`   Admins: ${adminUsers}`);
    console.log(`   Regular Users: ${regularUsers}`);

    // Test 3: Display users that can be promoted
    console.log("\n👥 Test 3: Users Available for Promotion");
    const promotableUsers = users.filter(u => u.role !== 'superAdmin');
    console.log(`   Users that can be promoted/demoted: ${promotableUsers.length}`);
    
    if (promotableUsers.length > 0) {
      console.log("\n   Available Users:");
      promotableUsers.slice(0, 5).forEach(user => {
        const currentRole = user.role || 'user';
        const action = currentRole === 'user' ? 'Promote to Admin' : 'Demote to User';
        console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - ${currentRole} -> ${action}`);
      });
      
      if (promotableUsers.length > 5) {
        console.log(`   ... and ${promotableUsers.length - 5} more users`);
      }
    }

    console.log("\n✅ Admin Management System Test Complete!");
    console.log("\n🎯 How to Use:");
    console.log("   1. Login as Super Admin: superadmin@glangetaway.com");
    console.log("   2. Go to Admin -> User Management in the navigation");
    console.log("   3. Search for users or browse all users");
    console.log("   4. Click 'Promote' to make users admin");
    console.log("   5. Click 'Demote' to remove admin access");

  } catch (error) {
    console.error("❌ Test Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run test
if (require.main === module) {
  console.log("🔧 Starting Admin Management System Test");
  console.log("==========================================");
  testAdminManagement();
}

export default testAdminManagement;

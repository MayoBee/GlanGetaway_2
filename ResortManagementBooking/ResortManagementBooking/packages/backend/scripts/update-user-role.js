const mongoose = require('mongoose');
require('dotenv').config();

// Use ts-node to load TypeScript files
require('ts-node/register');

const User = require('./src/models/user');

const updateUserRole = async (email, newRole) => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
    }
    
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User with email ${email} not found!`);
      process.exit(1);
    }

    console.log(`📧 Found user: ${user.email}`);
    console.log(`👤 Current role: ${user.role}`);
    console.log(`🔄 Updating role to: ${newRole}`);

    // Update the user's role
    user.role = newRole;
    await user.save();

    console.log(`✅ User role updated successfully!`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.firstName} ${user.lastName}`);
    console.log(`🔑 New Role: ${user.role}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    process.exit(1);
  }
};

// Get command line arguments
const email = process.argv[2];
const newRole = process.argv[3] || "resort_owner";

if (!email) {
  console.log("Usage: node update-user-role.js <email> [role]");
  console.log("Example: node update-user-role.js biennickwadingan@gmail.com resort_owner");
  console.log("Default role: resort_owner");
  process.exit(1);
}

updateUserRole(email, newRole);

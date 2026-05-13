const mongoose = require('mongoose');
require('dotenv').config();

const updateUserRole = async (email, newRole) => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
    }
    
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Direct MongoDB update without using the model
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: email },
      { $set: { role: newRole } }
    );

    if (result.matchedCount === 0) {
      console.log(`❌ User with email ${email} not found!`);
      process.exit(1);
    }

    console.log(`✅ User role updated successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`👤 New Role: ${newRole}`);
    console.log(`📊 Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    
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
  console.log("Usage: node update-user-role-simple.js <email> [role]");
  console.log("Example: node update-user-role-simple.js biennickwadingan@gmail.com resort_owner");
  console.log("Default role: resort_owner");
  process.exit(1);
}

updateUserRole(email, newRole);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
    }
    
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "superadmin@glangetaway.com" });
    if (existingAdmin) {
      console.log("Admin already exists!");
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("SuperAdmin123!", 10);
    const admin = new User({
      email: "superadmin@glangetaway.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "System",
      role: "superadmin",
      isActive: true
    });

    await admin.save();
    console.log("✅ Admin account created successfully!");
    console.log("📧 Email: superadmin@glangetaway.com");
    console.log("🔑 Password: SuperAdmin123!");
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();

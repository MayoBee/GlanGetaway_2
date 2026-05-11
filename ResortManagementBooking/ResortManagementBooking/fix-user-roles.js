// Script to fix user roles in the database
// Run this with: node fix-user-roles.js

const mongoose = require('mongoose');

// MongoDB connection string - using the same database as the backend
const MONGO_URI = 'mongodb://localhost:27017/hotel-booking';

// User Schema (minimal)
const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String,
  password: String
});

const User = mongoose.model('User', userSchema);

async function fixRoles() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find and display all users with their roles
    const users = await User.find({}).select('email firstName lastName role');
    console.log('\n📋 Current users in database:');
    users.forEach(u => {
      console.log(`  - ${u.email} | ${u.firstName} ${u.lastName} | Role: ${u.role || 'none'}`);
    });

    // Fix admin@glangetaway.com - should be "admin"
    const adminUser = await User.findOne({ email: 'admin@glangetaway.com' });
    if (adminUser) {
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('\n✅ Updated admin@glangetaway.com to role: admin');
    } else {
      console.log('\n⚠️  admin@glangetaway.com not found in database');
    }

    // Fix biennickwadingan@gmail.com - should be "resort_owner"
    const resortOwner = await User.findOne({ email: 'biennickwadingan@gmail.com' });
    if (resortOwner) {
      resortOwner.role = 'resort_owner';
      await resortOwner.save();
      console.log('✅ Updated biennickwadingan@gmail.com to role: resort_owner');
    } else {
      console.log('⚠️  biennickwadingan@gmail.com not found in database');
    }

    // Fix biennickw@gmail.com - should be "user" (regular user)
    const regularUser = await User.findOne({ email: 'biennickw@gmail.com' });
    if (regularUser) {
      regularUser.role = 'user';
      await regularUser.save();
      console.log('✅ Updated biennickw@gmail.com to role: user');
    } else {
      console.log('⚠️  biennickw@gmail.com not found in database');
    }

    // Display updated roles
    console.log('\n📋 Updated user roles:');
    const updatedUsers = await User.find({}).select('email firstName lastName role');
    updatedUsers.forEach(u => {
      console.log(`  - ${u.email} | ${u.firstName} ${u.lastName} | Role: ${u.role || 'none'}`);
    });

    console.log('\n✅ Role fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixRoles();

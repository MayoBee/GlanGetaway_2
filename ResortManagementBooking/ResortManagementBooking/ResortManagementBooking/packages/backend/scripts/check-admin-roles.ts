import mongoose from 'mongoose';
import User from '../src/models/user';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING;

if (!MONGODB_CONNECTION_STRING) {
  console.error('MONGODB_CONNECTION_STRING not found in environment variables');
  process.exit(1);
}

async function checkAndUpdateAdminRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB');

    // Check all users and their roles
    const allUsers = await User.find({}, 'email firstName lastName role');
    console.log('\n=== All Users ===');
    allUsers.forEach(user => {
      console.log(`Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
    });

    // Check if any admin users exist
    const adminUsers = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    console.log(`\n=== Admin Users Found: ${adminUsers.length} ===`);
    adminUsers.forEach(user => {
      console.log(`Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
    });

    // If no admin users, let's create one or update an existing user
    if (adminUsers.length === 0) {
      console.log('\n=== No admin users found. Creating/updating admin user... ===');
      
      // Look for a specific email to make admin (you can change this)
      const targetEmail = 'admin@example.com'; // Change this to your admin email
      
      // Try to find user with target email
      let adminUser = await User.findOne({ email: targetEmail });
      
      if (!adminUser) {
        // If no user found, create a new admin user
        console.log(`Creating new admin user with email: ${targetEmail}`);
        adminUser = new User({
          email: targetEmail,
          firstName: 'Admin',
          lastName: 'User',
          password: 'admin123456', // You should change this
          role: 'superAdmin',
          emailVerified: true,
          isActive: true
        });
      } else {
        // Update existing user to admin
        console.log(`Updating existing user to admin: ${targetEmail}`);
        adminUser.role = 'superAdmin';
      }
      
      await adminUser.save();
      console.log('Admin user created/updated successfully!');
      console.log(`Email: ${adminUser.email}, Role: ${adminUser.role}`);
    }

    // List admin users after update
    const updatedAdminUsers = await User.find({ role: { $in: ['admin', 'superAdmin'] } });
    console.log(`\n=== Admin Users After Update: ${updatedAdminUsers.length} ===`);
    updatedAdminUsers.forEach(user => {
      console.log(`Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAndUpdateAdminRoles();

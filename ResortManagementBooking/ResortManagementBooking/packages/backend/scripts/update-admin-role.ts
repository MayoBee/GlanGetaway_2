import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function updateAdminRole() {
  try {
    console.log('🔄 Updating admin role...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    console.log(`📦 Using database: ${db.databaseName}`);
    
    // Update admin user role from superAdmin to admin
    const result = await db.collection('users').updateOne(
      { email: "admin@glangetaway.com" },
      { $set: { role: "admin" } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Admin role updated successfully');
      console.log(`   Modified ${result.modifiedCount} document(s)`);
    } else {
      console.log('⚠️ No admin user found with email admin@glangetaway.com');
    }
    
    // Verify the update
    const adminUser = await db.collection('users').findOne({ email: "admin@glangetaway.com" });
    if (adminUser) {
      console.log(`📋 Current admin role: ${adminUser.role}`);
    }
    
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error updating admin role:', error);
    process.exit(1);
  }
}

updateAdminRole();

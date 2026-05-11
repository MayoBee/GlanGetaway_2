import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function debugUser() {
  try {
    console.log('🔍 Debugging user authentication...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    
    // Check user data
    const user = await db.collection('users').findOne({ email: "biennickw@gmail.com" });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.email}`);
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Name: ${user.firstName} ${user.lastName}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Approved: ${user.isApproved}`);
    console.log(`   - Password hash exists: ${user.password ? 'Yes' : 'No'}`);
    
    // Test password verification
    const testPassword = "password123";
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log(`   - Password "password123" valid: ${isValid}`);
    
    if (!isValid) {
      console.log('🔧 Trying to fix password...');
      const newPassword = await bcrypt.hash(testPassword, 8);
      
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { password: newPassword } }
      );
      
      console.log('✅ Password updated to "password123"');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the debug
if (require.main === module) {
  debugUser();
}

export default debugUser;

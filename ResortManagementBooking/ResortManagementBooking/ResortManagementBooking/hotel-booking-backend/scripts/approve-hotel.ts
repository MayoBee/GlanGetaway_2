import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function approveHotel() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Database connection successful');
    
    const db = mongoose.connection.db;
    const hotelsCollection = db.collection('hotels');
    
    // Get current hotel
    const hotel = await hotelsCollection.findOne({});
    console.log('📋 Hotel before approval:', JSON.stringify(hotel, null, 2));
    
    if (!hotel) {
      console.log('❌ No hotel found in database');
      return;
    }
    
    // Approve the hotel
    await hotelsCollection.updateOne(
      { _id: hotel._id },
      { $set: { isApproved: true } }
    );
    
    // Get updated hotel
    const updatedHotel = await hotelsCollection.findOne({ _id: hotel._id });
    console.log('✅ Hotel approved successfully');
    console.log('📋 Hotel after approval:', JSON.stringify(updatedHotel, null, 2));
    
  } catch (error) {
    console.error('❌ Error approving hotel:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

approveHotel()
  .then(() => {
    console.log('🎉 Hotel approval completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Hotel approval failed!');
    process.exit(1);
  });

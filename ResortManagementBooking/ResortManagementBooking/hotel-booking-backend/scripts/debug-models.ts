import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

// Import the models to test them
import Booking from '../src/domains/booking/models/booking';
import Hotel from '../src/domains/hotel/models/hotel';

async function debugModels() {
  try {
    console.log('🔍 Debugging Mongoose models vs raw data...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    console.log(`📦 Database: ${db.databaseName}`);
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Collections in database:`);
    collections.forEach((collection) => {
      console.log(`  - ${collection.name}`);
    });
    
    // Check raw data counts
    console.log(`\n📊 Raw data counts:`);
    const rawUsersCount = await db.collection('users').countDocuments();
    const rawBookingsCount = await db.collection('bookings').countDocuments();
    const rawHotelsCount = await db.collection('hotels').countDocuments();
    
    console.log(`  - users collection: ${rawUsersCount} documents`);
    console.log(`  - bookings collection: ${rawBookingsCount} documents`);
    console.log(`  - hotels collection: ${rawHotelsCount} documents`);
    
    // Check model data counts
    console.log(`\n📊 Mongoose model counts:`);
    const modelUsersCount = await db.collection('users').countDocuments(); // Users might not have a model
    const modelBookingsCount = await Booking.countDocuments();
    const modelHotelsCount = await Hotel.countDocuments();
    
    console.log(`  - Booking model: ${modelBookingsCount} documents`);
    console.log(`  - Hotel model: ${modelHotelsCount} documents`);
    
    // Find user ID
    const user = await db.collection('users').findOne({ email: "biennickw@gmail.com" });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`\n👤 User ID: ${user._id}`);
    
    // Test raw bookings query
    console.log(`\n🔍 Raw bookings query:`);
    const rawBookings = await db.collection('bookings').find({ userId: user._id }).toArray();
    console.log(`  - Found ${rawBookings.length} bookings with userId ${user._id}`);
    
    // Test Mongoose bookings query
    console.log(`\n🔍 Mongoose bookings query:`);
    const modelBookings = await Booking.find({ userId: user._id }).lean();
    console.log(`  - Found ${modelBookings.length} bookings with userId ${user._id}`);
    
    // Check if the ObjectId conversion is the issue
    console.log(`\n🔍 Testing ObjectId conversion:`);
    const userIdString = user._id.toString();
    const userIdObject = new mongoose.Types.ObjectId(userIdString);
    
    console.log(`  - User ID as string: ${userIdString}`);
    console.log(`  - User ID as ObjectId: ${userIdObject}`);
    
    const bookingsWithString = await db.collection('bookings').find({ userId: userIdString }).toArray();
    const bookingsWithObjectId = await db.collection('bookings').find({ userId: userIdObject }).toArray();
    
    console.log(`  - Bookings with string ID: ${bookingsWithString.length}`);
    console.log(`  - Bookings with ObjectId: ${bookingsWithObjectId.length}`);
    
    // Check the actual data types in the bookings
    if (rawBookings.length > 0) {
      console.log(`\n🔍 Checking data types in first booking:`);
      const firstBooking = rawBookings[0];
      console.log(`  - userId type: ${typeof firstBooking.userId}`);
      console.log(`  - userId value: ${firstBooking.userId}`);
      console.log(`  - userId constructor: ${firstBooking.userId.constructor.name}`);
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
  debugModels();
}

export default debugModels;

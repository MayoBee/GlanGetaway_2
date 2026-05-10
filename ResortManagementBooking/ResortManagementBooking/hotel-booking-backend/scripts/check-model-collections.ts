import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function checkModelCollections() {
  try {
    console.log('🔍 Checking Mongoose model collections...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Collections in database:`);
    collections.forEach((collection) => {
      console.log(`  - ${collection.name}`);
    });
    
    // Check raw data counts
    console.log(`\n📊 Raw data counts:`);
    const rawBookingsCount = await db.collection('bookings').countDocuments();
    const rawUsersCount = await db.collection('users').countDocuments();
    const rawHotelsCount = await db.collection('hotels').countDocuments();
    
    console.log(`  - bookings collection: ${rawBookingsCount} documents`);
    console.log(`  - users collection: ${rawUsersCount} documents`);
    console.log(`  - hotels collection: ${rawHotelsCount} documents`);
    
    // Test direct Mongoose model usage
    console.log(`\n🔍 Testing Mongoose models...`);
    
    try {
      // Import the models
      const Booking = require('../src/domains/booking/models/booking').default;
      const Hotel = require('../src/domains/hotel/models/hotel').default;
      
      console.log(`✅ Models imported successfully`);
      
      // Check model collection names
      console.log(`  - Booking model collection: ${Booking.collection.name}`);
      console.log(`  - Hotel model collection: ${Hotel.collection.name}`);
      
      // Test model counts
      const bookingCount = await Booking.countDocuments();
      const hotelCount = await Hotel.countDocuments();
      
      console.log(`  - Booking model documents: ${bookingCount}`);
      console.log(`  - Hotel model documents: ${hotelCount}`);
      
      // Test finding bookings with the model
      const user = await db.collection('users').findOne({ email: "biennickw@gmail.com" });
      if (user) {
        console.log(`\n👤 Testing booking queries for user ${user.email}...`);
        
        const modelBookings = await Booking.find({ userId: user._id });
        console.log(`  - Model query with ObjectId: ${modelBookings.length} results`);
        
        const modelBookingsString = await Booking.find({ userId: user._id.toString() });
        console.log(`  - Model query with string: ${modelBookingsString.length} results`);
        
        // Test with new ObjectId
        const newObjectId = new mongoose.Types.ObjectId(user._id.toString());
        const modelBookingsNew = await Booking.find({ userId: newObjectId });
        console.log(`  - Model query with new ObjectId: ${modelBookingsNew.length} results`);
      }
      
    } catch (modelError) {
      console.error(`❌ Model import error:`, modelError.message);
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
  checkModelCollections();
}

export default checkModelCollections;

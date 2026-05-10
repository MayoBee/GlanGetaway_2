import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function debugHotelLookup() {
  try {
    console.log('🔍 Debugging hotel lookup issue...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    
    // Find user
    const user = await db.collection('users').findOne({ email: "biennickw@gmail.com" });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    // Get bookings for this user
    const bookings = await db.collection('bookings').find({ 
      userId: new mongoose.Types.ObjectId(user._id.toString()) 
    }).toArray();
    
    console.log(`📋 Found ${bookings.length} bookings`);
    
    // Test hotel lookup for each booking
    console.log(`\n🏨 Testing hotel lookups...`);
    
    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      const hotelId = booking.hotelId;
      
      console.log(`\nBooking ${i + 1}:`);
      console.log(`  - hotelId: ${hotelId} (type: ${typeof hotelId})`);
      
      // Test different hotel lookup approaches
      const hotel1 = await db.collection('hotels').findOne({ _id: hotelId });
      const hotel2 = await db.collection('hotels').findOne({ _id: hotelId.toString() });
      const hotel3 = await db.collection('hotels').findOne({ _id: new mongoose.Types.ObjectId(hotelId.toString()) });
      
      console.log(`  - Hotel lookup with ObjectId: ${hotel1 ? 'Found' : 'Not found'} ${hotel1 ? `(${hotel1.name})` : ''}`);
      console.log(`  - Hotel lookup with string: ${hotel2 ? 'Found' : 'Not found'} ${hotel2 ? `(${hotel2.name})` : ''}`);
      console.log(`  - Hotel lookup with new ObjectId: ${hotel3 ? 'Found' : 'Not found'} ${hotel3 ? `(${hotel3.name})` : ''}`);
      
      if (!hotel1 && !hotel2 && !hotel3) {
        console.log(`  ❌ Hotel not found with any method!`);
      }
    }
    
    // Check what hotels actually exist
    console.log(`\n🏨 All hotels in database:`);
    const allHotels = await db.collection('hotels').find({}).limit(5).toArray();
    allHotels.forEach((hotel, index) => {
      console.log(`  ${index + 1}. ${hotel.name} - ID: ${hotel._id} (type: ${typeof hotel._id})`);
    });
    
    // Simulate the exact API logic
    console.log(`\n🔍 Simulating exact API logic...`);
    
    const hotelBookingsMap = new Map();
    
    for (const booking of bookings) {
      const hotelId = booking.hotelId?.toString();
      console.log(`Processing booking with hotelId: ${hotelId}`);
      
      if (!hotelId) continue;
      
      if (!hotelBookingsMap.has(hotelId)) {
        // Fetch hotel info - this is where the API might be failing
        const hotel = await db.collection('hotels').findOne({ _id: hotelId });
        console.log(`Hotel lookup for ${hotelId}: ${hotel ? 'Found' : 'Not found'}`);
        
        if (hotel) {
          hotelBookingsMap.set(hotelId, {
            ...hotel,
            bookings: []
          });
          console.log(`Added hotel ${hotel.name} to map`);
        } else {
          console.log(`❌ Failed to find hotel ${hotelId}`);
        }
      }
      
      const hotelData = hotelBookingsMap.get(hotelId);
      if (hotelData) {
        hotelData.bookings.push(booking);
        console.log(`Added booking to ${hotelData.name}`);
      }
    }
    
    const results = Array.from(hotelBookingsMap.values());
    console.log(`\n📊 Final result: ${results.length} hotels with bookings`);
    
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} - ${result.bookings.length} bookings`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the debug
if (require.main === module) {
  debugHotelLookup();
}

export default debugHotelLookup;

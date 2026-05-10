import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function debugSimple() {
  try {
    console.log('🔍 Simple debug of data types...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    
    // Find user
    const user = await db.collection('users').findOne({ email: "biennickw@gmail.com" });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`👤 User ID: ${user._id} (type: ${typeof user._id})`);
    
    // Check bookings data types
    console.log(`\n🔍 Checking bookings data types...`);
    const bookings = await db.collection('bookings').find({}).limit(3).toArray();
    
    bookings.forEach((booking, index) => {
      console.log(`\nBooking ${index + 1}:`);
      console.log(`  - userId: ${booking.userId} (type: ${typeof booking.userId})`);
      console.log(`  - userId equals user._id: ${booking.userId.toString() === user._id.toString()}`);
      console.log(`  - hotelId: ${booking.hotelId} (type: ${typeof booking.hotelId})`);
    });
    
    // Test different query approaches
    console.log(`\n🔍 Testing different query approaches...`);
    
    const query1 = await db.collection('bookings').find({ userId: user._id }).toArray();
    console.log(`1. Query with ObjectId: ${query1.length} results`);
    
    const query2 = await db.collection('bookings').find({ userId: user._id.toString() }).toArray();
    console.log(`2. Query with string: ${query2.length} results`);
    
    const query3 = await db.collection('bookings').find({ 
      userId: new mongoose.Types.ObjectId(user._id.toString()) 
    }).toArray();
    console.log(`3. Query with new ObjectId: ${query3.length} results`);
    
    // Test the exact API logic
    console.log(`\n🔍 Testing exact API logic...`);
    
    const apiBookings = await db.collection('bookings').find({ 
      userId: new mongoose.Types.ObjectId(user._id.toString()) 
    }).sort({ createdAt: -1 });
    
    const apiBookingsArray = await apiBookings.toArray();
    console.log(`API query found: ${apiBookingsArray.length} bookings`);
    
    if (apiBookingsArray.length > 0) {
      console.log(`First booking userId type: ${typeof apiBookingsArray[0].userId}`);
      console.log(`First booking hotelId type: ${typeof apiBookingsArray[0].hotelId}`);
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
  debugSimple();
}

export default debugSimple;

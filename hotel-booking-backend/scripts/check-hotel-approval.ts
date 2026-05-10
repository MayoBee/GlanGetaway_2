import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function checkHotelApproval() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Database connection successful');
    
    const db = mongoose.connection.db;
    const hotelsCollection = db.collection('hotels');
    
    // Get all hotels
    const hotels = await hotelsCollection.find({}).toArray();
    console.log(`📋 Total hotels in database: ${hotels.length}`);
    
    hotels.forEach((hotel: any, index: number) => {
      console.log(`\nHotel ${index + 1}:`);
      console.log(`  Name: ${hotel.name}`);
      console.log(`  ID: ${hotel._id}`);
      console.log(`  isApproved: ${hotel.isApproved}`);
      console.log(`  status: ${hotel.status || 'N/A'}`);
    });
    
    // Count approved vs not approved
    const approved = await hotelsCollection.countDocuments({ isApproved: true });
    const notApproved = await hotelsCollection.countDocuments({ isApproved: false });
    const undefinedApproval = await hotelsCollection.countDocuments({ isApproved: { $exists: false } });
    
    console.log(`\n📊 Approval Status Summary:`);
    console.log(`  Approved (isApproved: true): ${approved}`);
    console.log(`  Not Approved (isApproved: false): ${notApproved}`);
    console.log(`  Undefined isApproved field: ${undefinedApproval}`);
    
  } catch (error) {
    console.error('❌ Error checking hotel approval:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

checkHotelApproval()
  .then(() => {
    console.log('\n🎉 Hotel approval check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Hotel approval check failed!');
    process.exit(1);
  });

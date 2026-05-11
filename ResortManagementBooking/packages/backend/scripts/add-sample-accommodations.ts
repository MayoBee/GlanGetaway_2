import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function addSampleAccommodations() {
  try {
    console.log('🔄 Connecting to database...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    const hotelsCollection = db.collection('hotels');
    
    // Find a resort to update (let's use the first one we find)
    const resort = await hotelsCollection.findOne({});
    
    if (!resort) {
      console.log('❌ No resorts found in database');
      return;
    }
    
    console.log(`🏨 Found resort: ${resort.name}`);
    
    // Sample rooms data
    const rooms = [
      {
        id: "room-1",
        name: "Deluxe Beachfront Room",
        type: "Deluxe",
        pricePerNight: 3500,
        maxOccupancy: 2,
        description: "Beautiful room with ocean view and private balcony"
      },
      {
        id: "room-2", 
        name: "Standard Garden Room",
        type: "Standard",
        pricePerNight: 2500,
        maxOccupancy: 2,
        description: "Comfortable room overlooking the tropical gardens"
      },
      {
        id: "room-3",
        name: "Family Suite",
        type: "Suite", 
        pricePerNight: 5500,
        maxOccupancy: 4,
        description: "Spacious suite perfect for families with children"
      }
    ];
    
    // Sample cottages data
    const cottages = [
      {
        id: "cottage-1",
        name: "Beach Cottage",
        type: "Beach Cottage",
        pricePerNight: 4500,
        maxOccupancy: 3,
        description: "Private cottage just steps from the beach"
      },
      {
        id: "cottage-2",
        name: "Garden Villa",
        type: "Garden Cottage", 
        pricePerNight: 6000,
        maxOccupancy: 4,
        description: "Luxury villa surrounded by tropical gardens"
      }
    ];
    
    // Update the resort with rooms and cottages
    const result = await hotelsCollection.updateOne(
      { _id: resort._id },
      { 
        $set: { 
          rooms: rooms,
          cottages: cottages
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully added rooms and cottages to resort');
      console.log(`📊 Added ${rooms.length} rooms and ${cottages.length} cottages`);
      console.log(`🏨 Resort "${resort.name}" now has accommodation options`);
    } else {
      console.log('⚠️ No changes made to resort');
    }
    
    // Verify the update
    const updatedResort = await hotelsCollection.findOne({ _id: resort._id });
    console.log('✅ Verification - Updated resort has:');
    console.log(`  - Rooms: ${updatedResort.rooms?.length || 0}`);
    console.log(`  - Cottages: ${updatedResort.cottages?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Failed to add accommodations:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  addSampleAccommodations();
}

export default addSampleAccommodations;

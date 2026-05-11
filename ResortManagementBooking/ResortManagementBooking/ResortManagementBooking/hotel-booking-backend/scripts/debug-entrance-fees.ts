import mongoose from 'mongoose';
import Hotel from '../src/models/hotel';
import dotenv from 'dotenv';

dotenv.config();

async function debugEntranceFees() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27071/hotel-booking');
    console.log('Connected to MongoDB');

    const resort = await Hotel.findOne({ name: 'McJorn Shoreline Beach Resort' });
    
    if (!resort) {
      console.log('❌ McJorn Beach Resort not found');
      return;
    }

    console.log('=== 🔍 Debugging Entrance Fees ===');
    console.log('Resort ID:', resort._id);
    console.log('Cottages count:', resort.cottages?.length);
    console.log('Rooms count:', resort.rooms?.length);

    // Check current cottage data
    console.log('\n=== Current Cottage Data ===');
    resort.cottages?.forEach((cottage: any, i) => {
      console.log(`${i+1}. ${cottage.name}`);
      console.log(`   Raw data:`, JSON.stringify(cottage, null, 2));
    });

    // Force update with proper structure
    console.log('\n=== 🔄 Force Updating Entrance Fees ===');
    
    const updatedCottages = resort.cottages?.map((cottage: any) => {
      const updated = {
        id: cottage.id,
        name: cottage.name,
        type: cottage.type,
        pricePerNight: cottage.pricePerNight,
        dayRate: cottage.dayRate,
        nightRate: cottage.nightRate,
        hasDayRate: cottage.hasDayRate,
        hasNightRate: cottage.hasNightRate,
        minOccupancy: cottage.minOccupancy,
        maxOccupancy: cottage.maxOccupancy,
        description: cottage.description,
        amenities: cottage.amenities,
        imageUrl: cottage.imageUrl,
        includedEntranceFee: {
          enabled: true,
          adultCount: 6,
          childCount: 0,
        }
      };
      console.log(`Updated ${cottage.name}:`, JSON.stringify(updated.includedEntranceFee, null, 2));
      return updated;
    });

    const updatedRooms = resort.rooms?.map((room: any) => {
      const updated = {
        id: room.id,
        name: room.name,
        type: room.type,
        pricePerNight: room.pricePerNight,
        minOccupancy: room.minOccupancy,
        maxOccupancy: room.maxOccupancy,
        description: room.description,
        amenities: room.amenities,
        imageUrl: room.imageUrl,
        includedEntranceFee: {
          enabled: true,
          adultCount: 6,
          childCount: 0,
        }
      };
      console.log(`Updated ${room.name}:`, JSON.stringify(updated.includedEntranceFee, null, 2));
      return updated;
    });

    // Update the resort
    const result = await Hotel.findByIdAndUpdate(resort._id, {
      cottages: updatedCottages,
      rooms: updatedRooms
    }, { new: true });

    console.log('\n=== ✅ Update Result ===');
    console.log('Updated successfully:', !!result);

    // Verify the update
    const updatedResort = await Hotel.findOne({ name: 'McJorn Shoreline Beach Resort' });
    console.log('\n=== 🧪 Verification ===');
    updatedResort?.cottages?.forEach((cottage: any, i) => {
      console.log(`${i+1}. ${cottage.name} - Entrance Fee: ${cottage.includedEntranceFee?.enabled ? 'ENABLED' : 'DISABLED'}`);
    });

  } catch (error) {
    console.error('❌ Error debugging entrance fees:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugEntranceFees();

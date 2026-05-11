import mongoose from 'mongoose';
import Hotel from '../src/models/hotel';
import dotenv from 'dotenv';

dotenv.config();

async function updateMcJornEntranceFees() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27071/hotel-booking');
    console.log('Connected to MongoDB');

    const resort = await Hotel.findOne({ name: 'McJorn Shoreline Beach Resort' });
    
    if (!resort) {
      console.log('McJorn Beach Resort not found');
      return;
    }

    console.log('Found McJorn Beach Resort, updating entrance fees...');

    // Update cottages with included entrance fees (6 adults free)
    const updatedCottages = resort.cottages?.map(cottage => ({
      ...cottage,
      includedEntranceFee: {
        enabled: true,
        adultCount: 6,
        childCount: 0,
      }
    }));

    // Update rooms with included entrance fees (6 adults free)
    const updatedRooms = resort.rooms?.map(room => ({
      ...room,
      includedEntranceFee: {
        enabled: true,
        adultCount: 6,
        childCount: 0,
      }
    }));

    // Update the resort with the new data
    await Hotel.findByIdAndUpdate(resort._id, {
      cottages: updatedCottages,
      rooms: updatedRooms
    });

    console.log('✅ Updated McJorn Beach Resort with included entrance fees');
    console.log('Cottages updated:', updatedCottages?.length || 0);
    console.log('Rooms updated:', updatedRooms?.length || 0);
    
    console.log('\n=== Updated Cottage Details ===');
    updatedCottages?.forEach((cottage, i) => {
      const index = i + 1;
      console.log(`${index}. ${cottage.name} - ${cottage.includedEntranceFee?.enabled ? `${cottage.includedEntranceFee.adultCount} adults free` : 'No free entrance'}`);
    });
    
    console.log('\n=== Updated Room Details ===');
    updatedRooms?.forEach((room, i) => {
      const index = i + 1;
      console.log(`${index}. ${room.name} - ${room.includedEntranceFee?.enabled ? `${room.includedEntranceFee.adultCount} adults free` : 'No free entrance'}`);
    });

  } catch (error) {
    console.error('Error updating McJorn entrance fees:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateMcJornEntranceFees();

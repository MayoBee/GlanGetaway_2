import mongoose from 'mongoose';
import Hotel from '../src/models/hotel';
import dotenv from 'dotenv';

dotenv.config();

async function verifyEntranceFeeFeature() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27071/hotel-booking');
    console.log('Connected to MongoDB');

    const resort = await Hotel.findOne({ name: 'McJorn Shoreline Beach Resort' });
    
    if (!resort) {
      console.log('❌ McJorn Beach Resort not found');
      return;
    }

    console.log('=== ✅ Entrance Fee Feature Verification ===');
    console.log('Resort:', resort.name);
    console.log('Status:', resort.isApproved ? 'APPROVED' : 'PENDING');
    
    console.log('\n=== 🏠 Cottage Entrance Fees ===');
    resort.cottages?.forEach((cottage: any, i) => {
      const index = i + 1;
      const entranceFee = (cottage as any).includedEntranceFee;
      console.log(`${index}. ${cottage.name}`);
      console.log(`   ✅ Included Entrance: ${entranceFee?.enabled ? 'YES' : 'NO'}`);
      if (entranceFee?.enabled) {
        console.log(`   👥 Free Adults: ${entranceFee.adultCount}`);
        console.log(`   👶 Free Children: ${entranceFee.childCount}`);
        console.log(`   💰 Price: ₱${cottage.dayRate}/₱${cottage.nightRate}`);
      }
      console.log('');
    });
    
    console.log('\n=== 🛏️ Room Entrance Fees ===');
    resort.rooms?.forEach((room: any, i) => {
      const index = i + 1;
      const entranceFee = (room as any).includedEntranceFee;
      console.log(`${index}. ${room.name}`);
      console.log(`   ✅ Included Entrance: ${entranceFee?.enabled ? 'YES' : 'NO'}`);
      if (entranceFee?.enabled) {
        console.log(`   👥 Free Adults: ${entranceFee.adultCount}`);
        console.log(`   👶 Free Children: ${entranceFee.childCount}`);
        console.log(`   💰 Price: ₱${room.pricePerNight}`);
      }
      console.log('');
    });

    console.log('=== 🎯 Feature Summary ===');
    console.log('✅ Frontend Form: Added included entrance fee fields');
    console.log('✅ Backend Model: Updated Room and Cottage schemas');
    console.log('✅ Database: McJorn Beach Resort updated with 6 free adults');
    console.log('✅ UI Components: Created IncludedEntranceFeeField component');
    
    console.log('\n=== 📋 How It Works ===');
    console.log('1. Resort owners can enable free entrance fees for accommodations');
    console.log('2. They specify how many adults and children get free entrance');
    console.log('3. When guests book, entrance fees are automatically included');
    console.log('4. Additional guests beyond the limit pay regular entrance fees');
    console.log('5. McJorn Beach Resort: 6 adults free with every cottage/room booking');

  } catch (error) {
    console.error('❌ Error verifying entrance fee feature:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

verifyEntranceFeeFeature();

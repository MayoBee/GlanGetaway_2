import mongoose from 'mongoose';

async function updatePricing() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel-booking');
    const db = mongoose.connection.db;
    
    // Update MCJorn Shoreline with proper pricing
    const result = await db.collection('hotels').updateOne(
      { name: 'MCJorn Shoreline ' },
      { 
        $set: {
          dayRate: 2000,
          nightRate: 3500,
          hasDayRate: true,
          hasNightRate: true
        }
      }
    );
    
    console.log('Updated hotel:', result.modifiedCount, 'documents');
    
    // Verify the update
    const hotel = await db.collection('hotels').findOne({ name: 'MCJorn Shoreline ' });
    console.log('Updated hotel data:', {
      name: hotel.name,
      dayRate: hotel.dayRate,
      nightRate: hotel.nightRate,
      hasDayRate: hotel.hasDayRate,
      hasNightRate: hotel.hasNightRate
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePricing();

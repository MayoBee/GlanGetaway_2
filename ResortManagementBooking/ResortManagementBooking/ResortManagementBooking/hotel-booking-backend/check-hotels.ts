import mongoose from 'mongoose';

async function checkHotels() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel-booking');
    const db = mongoose.connection.db;
    const hotels = await db.collection('hotels').find({}).toArray();
    console.log('Found hotels:', hotels.length);
    hotels.forEach((hotel, index) => {
      console.log(`Hotel ${index + 1}:`, {
        name: hotel.name,
        dayRate: hotel.dayRate,
        nightRate: hotel.nightRate,
        hasDayRate: hotel.hasDayRate,
        hasNightRate: hotel.hasNightRate,
        pricePerNight: hotel.pricePerNight // Check if old field still exists
      });
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkHotels();

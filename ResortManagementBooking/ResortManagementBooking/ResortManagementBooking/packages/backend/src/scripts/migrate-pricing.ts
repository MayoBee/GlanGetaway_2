import mongoose from 'mongoose';

async function migratePricing() {
  try {
    console.log('Starting pricing migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const hotelsCollection = db.collection('hotels');

    // Find all hotels that still have pricePerNight
    const hotels = await hotelsCollection.find({ pricePerNight: { $exists: true } }).toArray();
    console.log(`Found ${hotels.length} hotels to migrate`);

    for (const hotel of hotels) {
      // Set dayRate and nightRate to the old pricePerNight value
      // Enable both rates by default
      await hotelsCollection.updateOne(
        { _id: hotel._id },
        { 
          $set: {
            dayRate: hotel.pricePerNight,
            nightRate: hotel.pricePerNight,
            hasDayRate: true,
            hasNightRate: true
          },
          $unset: {
            pricePerNight: 1 // Remove the old field
          }
        }
      );
      console.log(`Migrated hotel: ${hotel.name}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migratePricing();

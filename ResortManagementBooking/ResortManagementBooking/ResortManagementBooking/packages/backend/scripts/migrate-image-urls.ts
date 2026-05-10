import mongoose from 'mongoose';
import Hotel from '../models/hotel';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error('MONGODB_CONNECTION_STRING environment variable is required');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Update image URLs from localhost to production
const updateImageUrls = async () => {
  try {
    console.log('🔄 Starting image URL migration...');

    const localhostRegex = /^http:\/\/localhost:\d+\//;
    const productionUrl = process.env.BACKEND_URL || 'https://glangetaway-2-1.onrender.com';

    // Find all hotels with imageUrls
    const hotels = await Hotel.find({
      $or: [
        { imageUrls: { $exists: true, $ne: [] } },
        { images: { $exists: true, $ne: [] } }
      ]
    });

    console.log(`📊 Found ${hotels.length} hotels with images`);

    let updatedCount = 0;

    for (const hotel of hotels) {
      let hasUpdates = false;

      // Update imageUrls array
      if (hotel.imageUrls && Array.isArray(hotel.imageUrls)) {
        hotel.imageUrls = hotel.imageUrls.map((url: string) => {
          if (typeof url === 'string' && localhostRegex.test(url)) {
            hasUpdates = true;
            return url.replace(localhostRegex, `${productionUrl}/`);
          }
          return url;
        });
      }

      // Update images array if it exists
      if (hotel.images && Array.isArray(hotel.images)) {
        hotel.images = hotel.images.map((url: string) => {
          if (typeof url === 'string' && localhostRegex.test(url)) {
            hasUpdates = true;
            return url.replace(localhostRegex, `${productionUrl}/`);
          }
          return url;
        });
      }

      // Update cottage images if they exist
      if (hotel.cottages && Array.isArray(hotel.cottages)) {
        hotel.cottages.forEach((cottage: any) => {
          if (cottage.images && Array.isArray(cottage.images)) {
            cottage.images = cottage.images.map((url: string) => {
              if (typeof url === 'string' && localhostRegex.test(url)) {
                hasUpdates = true;
                return url.replace(localhostRegex, `${productionUrl}/`);
              }
              return url;
            });
          }
        });
      }

      // Update room images if they exist
      if (hotel.rooms && Array.isArray(hotel.rooms)) {
        hotel.rooms.forEach((room: any) => {
          if (room.images && Array.isArray(room.images)) {
            room.images = room.images.map((url: string) => {
              if (typeof url === 'string' && localhostRegex.test(url)) {
                hasUpdates = true;
                return url.replace(localhostRegex, `${productionUrl}/`);
              }
              return url;
            });
          }
        });
      }

      if (hasUpdates) {
        await hotel.save();
        updatedCount++;
        console.log(`✅ Updated hotel: ${hotel.name} (${hotel._id})`);
      }
    }

    console.log(`🎉 Migration completed! Updated ${updatedCount} hotels`);

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the migration
const runMigration = async () => {
  console.log('🚀 Starting image URL migration script...');

  // Load environment variables
  require('dotenv').config({ path: '../.env' });

  await connectDB();
  await updateImageUrls();

  console.log('✨ Migration script completed successfully!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

runMigration();</content>
<parameter name="filePath">D:\Coding practice\Websites\Booking-website\ResortManagementBooking\ResortManagementBooking\packages\backend\scripts\migrate-image-urls.ts
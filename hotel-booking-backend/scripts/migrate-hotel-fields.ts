import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function migrateHotels() {
  try {
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to database');
    
    const db = mongoose.connection.db;
    const hotelsCollection = db.collection('hotels');
    
    // Update all hotels with missing fields
    const result = await hotelsCollection.updateMany(
      {},
      [
        {
          $set: {
            imageUrls: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ['$imageUrls', []] } }, 0] },
                then: '$imageUrls',
                else: { $cond: { if: '$image', then: ['$image'], else: [] } }
              }
            },
            starRating: { $ifNull: ['$starRating', { $ifNull: ['$rating', 3] }] },
            type: {
              $cond: {
                if: { $isArray: '$type' },
                then: '$type',
                else: { $cond: { if: '$type', then: ['$type'], else: ['Resort'] } }
              }
            }
          }
        }
      ]
    );
    
    console.log(`✅ Migration completed. Updated ${result.modifiedCount} hotels`);
    
    // Verify the changes
    const hotels = await hotelsCollection.find({}).toArray();
    hotels.forEach((h, i) => {
      console.log(`\nHotel ${i+1}: ${h.name}`);
      console.log('  imageUrls:', h.imageUrls?.length || 0);
      console.log('  starRating:', h.starRating);
      console.log('  type:', h.type);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateHotels();

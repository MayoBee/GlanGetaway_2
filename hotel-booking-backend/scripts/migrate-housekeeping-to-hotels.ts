import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function migrateHousekeepingToHotels() {
  try {
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to database');
    
    const db = mongoose.connection.db;
    const housekeepingsCollection = db.collection('housekeepings');
    const hotelsCollection = db.collection('hotels');
    
    // Check if there are documents in housekeepings
    const housekeepingsCount = await housekeepingsCollection.countDocuments();
    console.log(`📊 Found ${housekeepingsCount} documents in housekeepings collection`);
    
    if (housekeepingsCount === 0) {
      console.log('⚠️ No documents to migrate');
      await mongoose.disconnect();
      return;
    }
    
    // Get all documents from housekeepings
    const housekeepings = await housekeepingsCollection.find({}).toArray();
    console.log(`📋 Found ${housekeepings.length} resorts to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const hk of housekeepings) {
      // Check if this resort already exists in hotels collection (by name or _id)
      const existingByName = await hotelsCollection.findOne({ name: hk.name });
      const existingById = await hotelsCollection.findOne({ _id: hk._id });
      
      if (existingByName || existingById) {
        console.log(`⏭️ Skipping "${hk.name}" - already exists in hotels collection`);
        skippedCount++;
        continue;
      }
      
      // Ensure required fields exist
      const hotelDoc = {
        ...hk,
        // Ensure isApproved is set to true so it shows on the website
        isApproved: hk.isApproved !== false,
        // Ensure type is an array
        type: Array.isArray(hk.type) ? hk.type : (hk.type ? [hk.type] : ['Resort']),
        // Ensure imageUrls is an array
        imageUrls: Array.isArray(hk.imageUrls) ? hk.imageUrls : (hk.image ? [hk.image] : []),
        // Ensure starRating exists
        starRating: hk.starRating || hk.rating || 3,
        // Set timestamps if missing
        createdAt: hk.createdAt || new Date(),
        updatedAt: hk.updatedAt || new Date(),
      };
      
      // Insert into hotels collection
      await hotelsCollection.insertOne(hotelDoc);
      console.log(`✅ Migrated "${hk.name}" to hotels collection`);
      migratedCount++;
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   - Migrated: ${migratedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Total processed: ${housekeepings.length}`);
    
    // Verify the migration
    const hotelsCount = await hotelsCollection.countDocuments();
    console.log(`\n📊 Total resorts in hotels collection: ${hotelsCount}`);
    
    await mongoose.disconnect();
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateHousekeepingToHotels();

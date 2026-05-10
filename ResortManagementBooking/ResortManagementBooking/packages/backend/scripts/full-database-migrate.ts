import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.migration' });

const LOCAL_URI = 'mongodb://localhost:27017';
const ATLAS_URI = process.env.MONGODB_ATLAS_CONNECTION_STRING!;
const DB_NAME = 'hotel-booking';

async function migrateEntireDatabase() {
  console.log('🚀 Starting full database migration...');
  
  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);
  
  try {
    await localClient.connect();
    await atlasClient.connect();
    
    const localDb = localClient.db(DB_NAME);
    const atlasDb = atlasClient.db(DB_NAME);
    
    console.log('✅ Connected to both databases');
    
    // Get all collections
    const collections = await localDb.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections: ${collections.map(c => c.name).join(', ')}`);
    
    let totalMigrated = 0;
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📦 Migrating ${collectionName}...`);
      
      try {
        const localCollection = localDb.collection(collectionName);
        const documents = await localCollection.find({}).toArray();
        
        if (documents.length === 0) {
          console.log(`   ⚠️  Empty collection`);
          continue;
        }
        
        // Clear and recreate in Atlas
        const atlasCollection = atlasDb.collection(collectionName);
        await atlasCollection.deleteMany({});
        
        if (documents.length > 0) {
          const result = await atlasCollection.insertMany(documents);
          console.log(`   ✅ ${result.insertedCount} documents migrated`);
          totalMigrated += result.insertedCount;
        }
        
      } catch (error) {
        console.error(`   ❌ Error: ${error}`);
      }
    }
    
    console.log(`\n🎉 Migration completed! Total documents: ${totalMigrated}`);
    
    // Final verification
    console.log('\n🔍 Final verification:');
    let totalLocal = 0;
    let totalAtlas = 0;
    
    for (const collection of collections) {
      const localCount = await localDb.collection(collection.name).countDocuments();
      const atlasCount = await atlasDb.collection(collection.name).countDocuments();
      
      totalLocal += localCount;
      totalAtlas += atlasCount;
      
      const status = localCount === atlasCount ? '✅' : '❌';
      console.log(`   ${status} ${collection.name}: ${localCount} → ${atlasCount}`);
    }
    
    console.log(`\n📊 Summary: ${totalLocal} local → ${totalAtlas} Atlas`);
    
    if (totalLocal === totalAtlas) {
      console.log('🎊 Perfect migration! All data transferred successfully.');
    } else {
      console.log('⚠️  Some data may not have migrated correctly. Check individual collections.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrateEntireDatabase();

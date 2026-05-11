import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.migration' });

const LOCAL_DB_STRING = 'mongodb://localhost:27017/hotel-booking';
const ATLAS_DB_STRING = process.env.MONGODB_ATLAS_CONNECTION_STRING!;

async function migrateData() {
  console.log('🔄 Starting migration...');
  
  const localClient = new MongoClient(LOCAL_DB_STRING);
  const atlasClient = new MongoClient(ATLAS_DB_STRING);
  
  try {
    // Connect to both databases
    await localClient.connect();
    await atlasClient.connect();
    
    const localDb = localClient.db('hotel-booking');
    const atlasDb = atlasClient.db('hotel-booking');
    
    console.log('✅ Connected to both databases');
    
    // Get all collections
    const collections = await localDb.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections to migrate`);
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📦 Migrating: ${collectionName}`);
      
      try {
        // Get all documents from local
        const localCollection = localDb.collection(collectionName);
        const documents = await localCollection.find({}).toArray();
        
        if (documents.length === 0) {
          console.log(`   ⚠️  Empty collection, skipping...`);
          continue;
        }
        
        // Clear Atlas collection
        const atlasCollection = atlasDb.collection(collectionName);
        await atlasCollection.deleteMany({});
        
        // Insert into Atlas
        const result = await atlasCollection.insertMany(documents);
        console.log(`   ✅ Migrated ${result.insertedCount} documents`);
        
      } catch (error) {
        console.error(`   ❌ Error with ${collectionName}:`, error);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    
    // Verify
    console.log('\n🔍 Verifying migration...');
    for (const collection of collections) {
      const localCount = await localDb.collection(collection.name).countDocuments();
      const atlasCount = await atlasDb.collection(collection.name).countDocuments();
      
      const status = localCount === atlasCount ? '✅' : '❌';
      console.log(`   ${status} ${collection.name}: Local=${localCount}, Atlas=${atlasCount}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrateData();

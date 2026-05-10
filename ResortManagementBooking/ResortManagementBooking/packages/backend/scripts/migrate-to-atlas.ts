import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.migration' });

const LOCAL_DB_STRING = 'mongodb://localhost:27017/hotel-booking';
const ATLAS_DB_STRING = process.env.MONGODB_ATLAS_CONNECTION_STRING || 'mongodb+srv://username:password@cluster.mongodb.net/hotel-booking';

interface CollectionInfo {
  name: string;
  count: number;
}

class DatabaseMigrator {
  private localClient: MongoClient;
  private atlasClient: MongoClient;
  private localDb: Db;
  private atlasDb: Db;

  constructor() {
    this.localClient = new MongoClient(LOCAL_DB_STRING);
    this.atlasClient = new MongoClient(ATLAS_DB_STRING);
  }

  async connect() {
    console.log('🔄 Connecting to databases...');
    
    await this.localClient.connect();
    this.localDb = this.localClient.db('hotel-booking');
    console.log('✅ Connected to local MongoDB');

    await this.atlasClient.connect();
    this.atlasDb = this.atlasClient.db('hotel-booking');
    console.log('✅ Connected to MongoDB Atlas');
  }

  async getLocalCollections(): Promise<string[]> {
    const collections = await this.localDb.listCollections().toArray();
    return collections.map(c => c.name);
  }

  async migrateCollection(collectionName: string) {
    console.log(`\n📦 Migrating collection: ${collectionName}`);
    
    try {
      // Get all documents from local collection
      const localCollection = this.localDb.collection(collectionName);
      const documents = await localCollection.find({}).toArray();
      
      if (documents.length === 0) {
        console.log(`   ⚠️  Collection ${collectionName} is empty, skipping...`);
        return;
      }

      // Clear existing data in Atlas collection
      const atlasCollection = this.atlasDb.collection(collectionName);
      await atlasCollection.deleteMany({});
      
      // Insert documents into Atlas
      if (documents.length > 0) {
        const result = await atlasCollection.insertMany(documents);
        console.log(`   ✅ Migrated ${result.insertedCount} documents to ${collectionName}`);
      }

    } catch (error) {
      console.error(`   ❌ Error migrating ${collectionName}:`, error);
    }
  }

  async migrateAll() {
    console.log('🚀 Starting database migration from Local to Atlas...\n');
    
    await this.connect();
    
    const collections = await this.getLocalCollections();
    console.log(`📋 Found ${collections.length} collections: ${collections.join(', ')}`);

    // Migrate each collection
    for (const collection of collections) {
      await this.migrateCollection(collection);
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    for (const collection of collections) {
      const localCount = await this.localDb.collection(collection).countDocuments();
      const atlasCount = await this.atlasDb.collection(collection).countDocuments();
      
      const status = localCount === atlasCount ? '✅' : '❌';
      console.log(`   ${status} ${collection}: Local=${localCount}, Atlas=${atlasCount}`);
    }

    await this.close();
    console.log('\n🎉 Migration completed!');
  }

  async close() {
    await this.localClient.close();
    await this.atlasClient.close();
  }

  // Backup local data before migration
  async backupLocalData() {
    console.log('💾 Creating backup of local data...');
    
    const collections = await this.getLocalCollections();
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `local-backup-${timestamp}.json`);

    const backupData: any = {};

    for (const collectionName of collections) {
      const collection = this.localDb.collection(collectionName);
      const documents = await collection.find({}).toArray();
      backupData[collectionName] = documents;
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saved to: ${backupFile}`);
  }
}

// Main execution
async function main() {
  const migrator = new DatabaseMigrator();

  try {
    // Create backup first
    await migrator.connect();
    await migrator.backupLocalData();
    await migrator.close();

    // Perform migration
    await migrator.migrateAll();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DatabaseMigrator };

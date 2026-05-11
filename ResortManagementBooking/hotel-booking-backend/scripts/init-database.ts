import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function initDatabase() {
  try {
    console.log('🔄 Initializing database connection...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    console.log(`📦 Using database: ${db.databaseName}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Existing collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // Create indexes for better performance
    console.log('🔍 Creating database indexes...');
    
    // Hotels collection indexes
    const hotelsCollection = db.collection('hotels');
    await hotelsCollection.createIndex({ name: 1 });
    await hotelsCollection.createIndex({ city: 1 });
    await hotelsCollection.createIndex({ country: 1 });
    await hotelsCollection.createIndex({ 'contact.email': 1 });
    console.log('✅ Hotels indexes created');
    
    // Users collection indexes
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ firstName: 1 });
    await usersCollection.createIndex({ lastName: 1 });
    console.log('✅ Users indexes created');
    
    // Bookings collection indexes
    const bookingsCollection = db.collection('bookings');
    await bookingsCollection.createIndex({ userId: 1 });
    await bookingsCollection.createIndex({ hotelId: 1 });
    await bookingsCollection.createIndex({ createdAt: -1 });
    console.log('✅ Bookings indexes created');
    
    // Reports collection indexes
    const reportsCollection = db.collection('reports');
    await reportsCollection.createIndex({ reporterId: 1 });
    await reportsCollection.createIndex({ reportedItemId: 1 });
    await reportsCollection.createIndex({ status: 1 });
    await reportsCollection.createIndex({ createdAt: -1 });
    console.log('✅ Reports indexes created');
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('\n📊 Database Statistics:');
    
    // Count documents in each collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the initialization
if (require.main === module) {
  initDatabase();
}

export default initDatabase;

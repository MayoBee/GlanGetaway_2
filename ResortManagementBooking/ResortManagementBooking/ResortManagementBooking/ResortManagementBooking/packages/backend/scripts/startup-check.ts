import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Database connection successful');
    
    const db = mongoose.connection.db;
    
    // Check if collections exist and have data
    const collections = ['users', 'hotels', 'bookings', 'reports'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`📋 ${collectionName}: ${count} documents`);
    }
    
    console.log('✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run check if called directly
if (require.main === module) {
  checkDatabase()
    .then(() => {
      console.log('🎉 Database is ready for use!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database is not ready!');
      process.exit(1);
    });
}

export default checkDatabase;

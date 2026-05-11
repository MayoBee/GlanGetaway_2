import mongoose from 'mongoose';
import User from '../src/models/user';

// Script to optimize database indexes for faster authentication
async function optimizeAuthIndexes() {
  try {
    console.log('🔍 Checking authentication indexes...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
    await mongoose.connect(mongoUri);
    
    // Get current indexes
    const userIndexes = await User.collection.getIndexes();
    console.log('📋 Current user collection indexes:', Object.keys(userIndexes));
    
    // Ensure email index exists and is optimal
    await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
    console.log('✅ Email index optimized');
    
    // Create compound index for role-based queries (if needed)
    await User.collection.createIndex({ role: 1, isActive: 1 }, { background: true });
    console.log('✅ Role + Status compound index created');
    
    // Create index for lastLogin sorting (if needed)
    await User.collection.createIndex({ lastLogin: -1 }, { background: true });
    console.log('✅ LastLogin index created');
    
    // Show index statistics
    const stats = await User.collection.aggregate([{ $collStats: { count: {}, storageStats: {} } }]).toArray();
    if (stats.length > 0) {
      console.log(`📊 Collection size: ${(stats[0].storageStats.size / 1024).toFixed(2)} KB`);
      console.log(`📊 Document count: ${stats[0].count}`);
      console.log(`📊 Average document size: ${(stats[0].storageStats.avgObjSize / 1024).toFixed(2)} KB`);
    }
    
    console.log('🚀 Authentication indexes optimized successfully!');
    
  } catch (error) {
    console.error('❌ Error optimizing indexes:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  optimizeAuthIndexes();
}

export default optimizeAuthIndexes;

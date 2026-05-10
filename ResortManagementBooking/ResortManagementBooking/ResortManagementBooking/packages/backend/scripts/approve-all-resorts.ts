import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function approveAllResorts() {
  try {
    console.log('🔄 Connecting to database...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    const hotelsCollection = db.collection('hotels');
    
    // Find all resorts that are not approved
    const unapprovedResorts = await hotelsCollection.find({ 
      $or: [
        { isApproved: { $ne: true } },
        { isApproved: { $exists: false } }
      ]
    }).toArray();
    
    if (unapprovedResorts.length === 0) {
      console.log('✅ All resorts are already approved');
      return;
    }
    
    console.log(`🏨 Found ${unapprovedResorts.length} unapproved resorts:`);
    unapprovedResorts.forEach(resort => {
      console.log(`  - ${resort.name} (approved: ${resort.isApproved})`);
    });
    
    // Approve all resorts
    const result = await hotelsCollection.updateMany(
      { 
        $or: [
          { isApproved: { $ne: true } },
          { isApproved: { $exists: false } }
        ]
      },
      { 
        $set: { 
          isApproved: true,
          approvedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Successfully approved ${result.modifiedCount} resorts`);
      
      // Verify the update
      const approvedCount = await hotelsCollection.countDocuments({ isApproved: true });
      const totalCount = await hotelsCollection.countDocuments();
      
      console.log(`📊 Database Statistics:`);
      console.log(`  - Total resorts: ${totalCount}`);
      console.log(`  - Approved resorts: ${approvedCount}`);
      console.log(`  - Unapproved resorts: ${totalCount - approvedCount}`);
    } else {
      console.log('⚠️ No resorts were updated');
    }
    
  } catch (error) {
    console.error('❌ Failed to approve resorts:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  approveAllResorts();
}

export default approveAllResorts;

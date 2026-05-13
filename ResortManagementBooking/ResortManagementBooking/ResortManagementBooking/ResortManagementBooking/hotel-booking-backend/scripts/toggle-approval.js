const mongoose = require('mongoose');
require('dotenv').config();

// Direct MongoDB connection without model imports
async function toggleApproval() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB');

    // Get the hotels collection directly
    const db = mongoose.connection.db;
    const hotelsCollection = db.collection('hotels');

    // Find current status first
    const currentHotel = await hotelsCollection.findOne({ name: { $regex: /MCJorn/i } });
    const currentStatus = currentHotel ? currentHotel.isApproved : 'not found';
    console.log(`📊 Current approval status: ${currentStatus}`);

    // Toggle the approval status
    const newStatus = !currentHotel?.isApproved;
    const result = await hotelsCollection.updateOne(
      { name: { $regex: /MCJorn/i } },
      { 
        $set: { 
          isApproved: newStatus,
          approvedAt: newStatus ? new Date() : null,
          approvedBy: newStatus ? 'system' : null
        }
      }
    );

    console.log(`✅ Toggled approval status to: ${newStatus ? 'APPROVED' : 'PENDING'}`);
    console.log(`📊 Updated ${result.modifiedCount} resort(s)`);

    // Verify the update
    const totalHotels = await hotelsCollection.countDocuments();
    const approvedHotels = await hotelsCollection.countDocuments({ isApproved: true });
    const unapprovedHotels = await hotelsCollection.countDocuments({ isApproved: false });

    console.log(`📊 Total hotels: ${totalHotels}`);
    console.log(`✅ Approved hotels: ${approvedHotels}`);
    console.log(`❌ Unapproved hotels: ${unapprovedHotels}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

toggleApproval();

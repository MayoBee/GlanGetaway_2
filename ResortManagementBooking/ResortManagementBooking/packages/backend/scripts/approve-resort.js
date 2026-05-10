const mongoose = require('mongoose');
require('dotenv').config();

// Direct MongoDB connection without model imports
async function approveResort() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB');

    // Get the hotels collection directly
    const db = mongoose.connection.db;
    const hotelsCollection = db.collection('hotels');

    // Update the specific resort to approved status
    const result = await hotelsCollection.updateOne(
      { name: { $regex: /MCJorn/i } }, // Find the MCJorn resort
      { 
        $set: { 
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: 'system' // Simulating admin approval
        }
      }
    );

    console.log(`✅ Approved ${result.modifiedCount} resort(s)`);

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

approveResort();

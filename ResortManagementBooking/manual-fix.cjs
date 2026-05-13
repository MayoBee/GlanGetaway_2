// Manual fix for front desk user - direct database update
const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://mayojavierbaylonia:mcjorn123@cluster0.8xh5.mongodb.net/glangetaway?retryWrites=true&w=majority';

async function fixFrontDeskUser() {
  let client;
  
  try {
    console.log('🔧 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('glangetaway');
    const users = db.collection('users');
    
    // Find the front desk user
    console.log('🔍 Finding front desk user...');
    const user = await users.findOne({ email: 'frontdesk@gmail.com' });
    
    if (!user) {
      console.error('❌ Front desk user not found');
      return;
    }
    
    console.log('✅ Front desk user found:', user.email);
    console.log('📝 Current role:', user.role);
    console.log('📝 Current permissions:', user.permissions);
    
    // Update role from housekeeping to front_desk
    console.log('📝 Updating role...');
    const roleResult = await users.updateOne(
      { email: 'frontdesk@gmail.com' },
      { $set: { role: 'front_desk' } }
    );
    console.log('✅ Role updated to front_desk');
    
    // Update permissions to enable management features
    console.log('📝 Updating permissions...');
    const permissionsResult = await users.updateOne(
      { email: 'frontdesk@gmail.com' },
      { 
        $set: { 
          permissions: {
            canManageBookings: true,
            canManageRooms: true,
            canManagePricing: false,
            canManageAmenities: true,
            canManageActivities: true,
            canViewReports: true,
            canManageBilling: true,
            canManageHousekeeping: true,
            canManageMaintenance: true,
            canManageUsers: false
          }
        } 
      }
    );
    console.log('✅ Permissions updated');
    
    console.log('🎉 Front desk user fix completed!');
    console.log('🔄 Please refresh the browser page and check for "Manage Resort" option');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run the fix
fixFrontDeskUser();

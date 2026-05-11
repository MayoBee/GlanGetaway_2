import mongoose from 'mongoose';
import User from '../src/models/user';

async function checkSuperAdmin() {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
    await mongoose.connect(mongoUri);
    
    const superAdmins = await User.find({ role: 'super_admin' });
    console.log('✅ Super Admins found:', superAdmins.length);
    superAdmins.forEach(admin => {
      console.log(`- ${admin.firstName} ${admin.lastName} (${admin.email}) - Role: ${admin.role}`);
    });
    
    const allUsers = await User.find({});
    console.log('\n📋 All users:');
    allUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkSuperAdmin();

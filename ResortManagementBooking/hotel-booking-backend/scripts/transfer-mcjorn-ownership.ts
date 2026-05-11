import mongoose from 'mongoose';
import Hotel from '../src/models/hotel';
import User from '../src/models/user';
import dotenv from 'dotenv';

dotenv.config();

async function transferOwnership() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking');
    console.log('Connected to MongoDB');

    const targetUserId = '69eca6dc8ae4c97d9056eb52';
    
    // Find the user
    const user = await User.findById(targetUserId);
    if (!user) {
      console.error('User not found');
      return;
    }
    console.log('Found user:', user.email);

    // Update user permissions to full resort owner
    await User.findByIdAndUpdate(targetUserId, {
      'permissions.canManageBookings': true,
      'permissions.canManageRooms': true,
      'permissions.canManagePricing': true,
      'permissions.canManageAmenities': true,
      'permissions.canManageActivities': true,
      'permissions.canViewReports': true,
      'permissions.canManageBilling': true,
      'permissions.canManageHousekeeping': true,
      'permissions.canManageMaintenance': true,
      'permissions.canManageUsers': true
    });
    console.log('Updated user permissions to full resort owner access');

    // Find and update the resort
    const resort = await Hotel.findOne({ name: 'McJorn Shoreline Beach Resort' });
    if (!resort) {
      console.error('Resort not found');
      return;
    }
    console.log('Found resort:', resort.name);
    console.log('Current owner ID:', resort.userId);

    await Hotel.findByIdAndUpdate(resort._id, {
      userId: targetUserId
    });
    console.log('Updated resort ownership to:', targetUserId);

    // Update staff to include the new owner
    await Hotel.findByIdAndUpdate(resort._id, {
      staff: [{
        staffUserId: targetUserId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        position: 'Resort Owner',
        department: 'Management',
        role: 'resort_owner',
        hireDate: new Date(),
        isActive: true,
        permissions: {
          canManageBookings: true,
          canManageRooms: true,
          canManagePricing: true,
          canManageAmenities: true,
          canViewReports: true
        }
      }]
    });
    console.log('Updated resort staff with new owner');

    console.log('\n=== Ownership Transfer Complete ===');
    console.log('Resort:', resort.name);
    console.log('New Owner:', user.email);
    console.log('Owner Name:', user.firstName, user.lastName);
    console.log('User ID:', targetUserId);
    console.log('Resort ID:', resort._id);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

transferOwnership();

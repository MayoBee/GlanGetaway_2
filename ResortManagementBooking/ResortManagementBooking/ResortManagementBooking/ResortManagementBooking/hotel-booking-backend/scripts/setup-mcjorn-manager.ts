import mongoose from 'mongoose';
import Hotel from '../src/models/hotel';
import User from '../src/models/user';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupMcJornManager() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find the manager user
    const managerUser = await User.findOne({ email: 'biennickwadingan@gmail.com' });
    
    if (!managerUser) {
      console.error('Manager user not found. Please run the resort creation script first.');
      return;
    }

    console.log('Found manager user:', managerUser.email);

    // Set a proper password for the manager user
    const tempPassword = 'McJorn2025'; // This should be changed on first login
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    await User.findByIdAndUpdate(managerUser._id, {
      password: hashedPassword,
      mustChangePassword: true,
      isActive: true,
      role: 'resort_owner'
    });

    console.log('Manager user password set. Temporary password:', tempPassword);
    console.log('User will be required to change password on first login.');

    // Find and approve the McJorn Beach Resort
    const resort = await Hotel.findOne({ 
      name: 'McJorn Shoreline Beach Resort',
      userId: managerUser._id 
    });

    if (!resort) {
      console.error('McJorn Beach Resort not found. Please run the resort creation script first.');
      return;
    }

    // Approve the resort
    await Hotel.findByIdAndUpdate(resort._id, {
      isApproved: true,
      status: 'approved',
      approvedBy: managerUser._id,
      approvedAt: new Date()
    });

    console.log('McJorn Beach Resort has been approved and is now live!');

    // Add manager as staff to the resort
    await Hotel.findByIdAndUpdate(resort._id, {
      $push: {
        staff: {
          staffUserId: managerUser._id,
          firstName: 'Mayobi',
          lastName: 'Wadz',
          email: 'biennickwadingan@gmail.com',
          position: 'Resort Manager',
          department: 'Management',
          role: 'resort_owner',
          hireDate: new Date(),
          isActive: true,
          mustChangePassword: true,
          permissions: {
            canManageBookings: true,
            canManageRooms: true,
            canManagePricing: true,
            canManageAmenities: true,
            canViewReports: true
          }
        }
      }
    });

    console.log('Manager added as resort staff with full permissions');

    // Display setup summary
    console.log('\n=== Setup Complete ===');
    console.log('Resort Name:', resort.name);
    console.log('Resort ID:', resort._id);
    console.log('Manager Email:', managerUser.email);
    console.log('Manager Role:', 'resort_owner');
    console.log('Resort Status:', 'approved');
    console.log('Temporary Password:', tempPassword);
    console.log('\nNext Steps:');
    console.log('1. Manager should login at the admin panel');
    console.log('2. Change the temporary password on first login');
    console.log('3. Verify all resort details and pricing');
    console.log('4. Test the booking system');

  } catch (error) {
    console.error('Error setting up McJorn manager:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
setupMcJornManager();

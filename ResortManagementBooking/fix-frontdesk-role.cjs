const axios = require('axios');
const https = require('https');

// API configuration
const API_BASE_URL = 'https://glangetaway-api.onrender.com';

// Create axios instance with SSL verification bypass
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ignore SSL certificate verification for this API call
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// Function to update front desk user role and permissions
async function fixFrontDeskRole() {
  try {
    console.log('🔧 Starting front desk role fix...');
    
    // First, try to find the user by email to get their ID
    console.log('🔍 Finding user by email...');
    const findUserResponse = await axiosInstance.get('/api/users/email/frontdesk@gmail.com');
    console.log('✅ User found:', findUserResponse.data);
    
    if (!findUserResponse.data._id) {
      console.error('❌ User not found');
      return;
    }
    
    // 1. Update user role from housekeeping to front_desk
    console.log('📝 Updating user role...');
    const roleResponse = await axiosInstance.patch(`/api/users/${findUserResponse.data._id}`, {
      role: 'front_desk'
    });
    console.log('✅ Role updated:', roleResponse.data);
    
    // 2. Update permissions to enable management features
    console.log('📝 Updating user permissions...');
    const permissionsResponse = await axiosInstance.patch(`/api/users/${findUserResponse.data._id}`, {
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
    });
    console.log('✅ Permissions updated:', permissionsResponse.data);
    
    console.log('🎉 Front desk role and permissions fix completed!');
    console.log('🔄 Please refresh the page and check for "Manage Resort" option');
    
  } catch (error) {
    console.error('❌ Error fixing front desk role:', error.response?.data || error.message);
  }
}

// Run the fix
fixFrontDeskRole();

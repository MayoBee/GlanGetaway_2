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
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// Function to update front desk user using admin credentials
async function updateFrontDeskUser() {
  try {
    console.log('🔧 Starting front desk user update...');
    
    // 1. Login as admin to get auth token
    console.log('🔑 Logging in as admin...');
    const adminLoginResponse = await axiosInstance.post('/api/auth/login', {
      email: 'admin@glangetaway.com',
      password: 'admin123'
    });
    
    if (!adminLoginResponse.data?.token) {
      console.error('❌ Admin login failed');
      return;
    }
    
    console.log('✅ Admin login successful');
    const adminToken = adminLoginResponse.data.token;
    
    // Update axios instance to use admin token
    const adminAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
    
    // 2. Find the front desk user
    console.log('🔍 Finding front desk user...');
    const findUserResponse = await adminAxios.get('/api/users/email/frontdesk@gmail.com');
    console.log('✅ Front desk user found:', findUserResponse.data);
    
    if (!findUserResponse.data?._id) {
      console.error('❌ Front desk user not found');
      return;
    }
    
    // 3. Update user role from housekeeping to front_desk
    console.log('📝 Updating user role...');
    const roleResponse = await adminAxios.patch(`/api/users/${findUserResponse.data._id}`, {
      role: 'front_desk'
    });
    console.log('✅ Role updated:', roleResponse.data);
    
    // 4. Update permissions to enable management features
    console.log('📝 Updating user permissions...');
    const permissionsResponse = await adminAxios.patch(`/api/users/${findUserResponse.data._id}`, {
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
    
    // 5. Logout admin
    console.log('🔑 Logging out admin...');
    await adminAxios.post('/api/auth/logout');
    
    console.log('🎉 Front desk user update completed!');
    console.log('🔄 Please refresh the page and check for "Manage Resort" option');
    
  } catch (error) {
    console.error('❌ Error updating front desk user:', error.response?.data || error.message);
  }
}

// Run the update
updateFrontDeskUser();

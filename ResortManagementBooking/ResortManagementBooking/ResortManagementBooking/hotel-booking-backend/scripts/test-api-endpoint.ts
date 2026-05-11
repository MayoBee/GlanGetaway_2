import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function testMyBookingsAPI() {
  try {
    console.log('🔍 Testing /api/my-bookings API endpoint...');
    
    // First, login to get a token
    console.log('🔑 Logging in as biennickw@gmail.com...');
    
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: "biennickw@gmail.com",
      password: "password123"
    });
    
    console.log('✅ Login successful');
    console.log('🔍 Token received:', loginResponse.data.token ? 'Yes' : 'No');
    console.log('🔍 User ID:', loginResponse.data.userId);
    
    const token = loginResponse.data.token;
    
    // Now test the my-bookings endpoint
    console.log('\n📋 Testing /api/my-bookings endpoint...');
    
    const bookingsResponse = await axios.get(`${API_BASE_URL}/api/my-bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ API call successful');
    console.log(`📊 Response status: ${bookingsResponse.status}`);
    console.log(`📊 Response data length: ${bookingsResponse.data.length}`);
    
    if (bookingsResponse.data.length === 0) {
      console.log('❌ No bookings returned by API');
    } else {
      console.log('✅ Bookings found:');
      bookingsResponse.data.forEach((hotel: any, index: number) => {
        console.log(`  ${index + 1}. ${hotel.name} - ${hotel.bookings?.length || 0} bookings`);
        if (hotel.bookings) {
          hotel.bookings.forEach((booking: any, bookingIndex: number) => {
            console.log(`     - Booking ${bookingIndex + 1}: ${booking.status} - ${booking.checkIn} to ${booking.checkOut}`);
          });
        }
      });
    }
    
  } catch (error: any) {
    console.error('❌ API test failed:');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      console.error('   No response received - server might be down');
      console.error(`   URL: ${API_BASE_URL}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Run the test
if (require.main === module) {
  testMyBookingsAPI();
}

export default testMyBookingsAPI;

// Test the login API directly
import fetch from 'node-fetch';

const testData = {
  email: 'biennickwadingan@gmail.com',
  password: '123456'
};

async function testLogin() {
  try {
    console.log('Testing login API...');
    console.log('Request data:', testData);
    
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();

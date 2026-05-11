async function testAPI() {
  try {
    console.log('Testing /api/hotels endpoint...');
    const response = await fetch('http://localhost:5000/api/hotels');
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data length:', data?.length || 'No data');
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();

// Test the login API using built-in Node.js http module
const http = require('http');

const testData = JSON.stringify({
  email: 'biennickwadingan@gmail.com',
  password: '123456'
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

async function testLogin() {
  return new Promise((resolve, reject) => {
    console.log('Testing login API...');
    console.log('Request data:', testData);
    
    const req = http.request(options, (res) => {
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response data:', data);
        try {
          const jsonData = JSON.parse(data);
          console.log('Parsed JSON:', jsonData);
          resolve(jsonData);
        } catch (e) {
          console.log('Raw response:', data);
          resolve(data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });
    
    req.write(testData);
    req.end();
  });
}

testLogin().catch(console.error);

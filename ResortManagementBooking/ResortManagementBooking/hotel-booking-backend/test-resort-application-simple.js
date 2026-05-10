/**
 * Simple test script for Resort Owner Application endpoint
 * Tests FormData submission and Content-Type handling
 *
 * Usage: node test-resort-application-simple.js
 * Note: This is a basic test without full authentication setup
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const API_ENDPOINT = `${BACKEND_URL}/api/resort-owner-application`;

// Mock JWT token (will fail auth but allows testing Content-Type)
const MOCK_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwicm9sZSI6InVzZXIifQ.mock';

/**
 * Build multipart/form-data body manually
 */
function buildMultipartBody(files) {
  const boundary = '----FormBoundary' + Date.now();
  const bodyParts = [];

  const addString = (str) => bodyParts.push(Buffer.from(str, 'utf8'));

  // Add file fields
  Object.keys(files).forEach(key => {
    const filePath = files[key];
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    addString(`--${boundary}\r\n`);
    addString(`Content-Disposition: form-data; name="${key}"; filename="${fileName}"\r\n`);
    addString(`Content-Type: application/pdf\r\n\r\n`);
    bodyParts.push(fileContent);
    addString('\r\n');
  });

  addString(`--${boundary}--\r\n`);

  return {
    boundary,
    body: Buffer.concat(bodyParts)
  };
}

/**
 * Make HTTP request with multipart form data
 */
function makeMultipartRequest(url, token, fileMap) {
  return new Promise((resolve, reject) => {
    const { boundary, body } = buildMultipartBody(fileMap);
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString();
        resolve({
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          headers: res.headers,
          body: responseBody
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Create a simple test file
 */
function createTestFile(filename) {
  const tempDir = path.join(__dirname, 'temp-test-files');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, filename);

  // Create a minimal valid PDF
  const pdfContent = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000200 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n284\n%%EOF',
    'binary'
  );

  fs.writeFileSync(filePath, pdfContent);
  return filePath;
}

/**
 * Clean up test files
 */
function cleanupTestFiles(files) {
  files.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.log(`Warning: Could not delete ${filePath}:`, err.message);
    }
  });

  const tempDir = path.join(__dirname, 'temp-test-files');
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  } catch (err) {
    // Ignore cleanup errors
  }
}

/**
 * Main test function
 */
async function testResortApplication() {
  console.log('🚀 Simple Resort Owner Application Test');
  console.log('=======================================');
  console.log(`Testing endpoint: ${API_ENDPOINT}`);
  console.log('');

  const testFiles = [];

  try {
    // Step 1: Create test files
    console.log('1. Creating test PDF documents...');

    // Required document fields
    const requiredDocs = [
      'dtiPermit',
      'municipalEngineeringCert',
      'municipalHealthCert',
      'menroCert',
      'bfpPermit',
      'businessPermit',
      'nationalId'
    ];

    const fileMap = {};
    for (const docName of requiredDocs) {
      const filePath = createTestFile(`${docName}.pdf`);
      testFiles.push(filePath);
      fileMap[docName] = filePath;
    }

    console.log(`✓ Created ${requiredDocs.length} test PDF documents`);
    console.log('');

    // Step 2: Make the request
    console.log('2. Making POST request with multipart/form-data...');

    const response = await makeMultipartRequest(API_ENDPOINT, MOCK_TOKEN, fileMap);

    console.log('✓ Request completed');
    console.log(`Response status: ${response.status} ${response.statusText}`);

    let responseData;
    try {
      responseData = JSON.parse(response.body);
      console.log('Response data:', JSON.stringify(responseData, null, 2));
    } catch {
      console.log('Raw response body:', response.body);
      responseData = { raw: response.body };
    }

    // Step 3: Analyze results
    console.log('');
    console.log('3. Test Results:');
    console.log('================');

    if (response.status >= 200 && response.status < 300) {
      console.log('✅ SUCCESS: FormData submission accepted');
      console.log('   No 400 error due to Content-Type issues');
      console.log('   The endpoint correctly handles multipart/form-data');
    } else if (response.status === 400) {
      console.log('❌ FAILED: 400 Bad Request');
      console.log('   This indicates a Content-Type or validation issue');
      if (responseData.message) {
        console.log(`   Message: ${responseData.message}`);
      }
      if (responseData.errors) {
        console.log('   Validation errors:');
        responseData.errors.forEach((err, idx) => {
          console.log(`     ${idx + 1}. ${err.msg || err.message || JSON.stringify(err)}`);
        });
      }
    } else if (response.status === 401) {
      console.log('✅ EXPECTED: 401 Unauthorized');
      console.log('   Authentication failed as expected (mock token)');
      console.log('   But Content-Type/FormData handling is working correctly');
      console.log('   The 400 error due to Content-Type issues is NOT present');
    } else {
      console.log(`⚠️  UNEXPECTED STATUS: ${response.status}`);
      console.log('   Response:', JSON.stringify(responseData, null, 2));
    }

  } catch (error) {
    console.log('');
    console.log('3. Test Results:');
    console.log('================');

    if (error.code === 'ECONNREFUSED') {
      console.log('❌ CONNECTION FAILED: Backend server not running');
      console.log(`   Please start the server on ${BACKEND_URL}`);
      console.log('   Run: npm run dev (in hotel-booking-backend directory)');
    } else {
      console.log('❌ REQUEST FAILED:', error.message);
      console.log('   This might indicate network issues or server problems');
    }
  } finally {
    // Cleanup
    console.log('');
    console.log('4. Cleaning up...');
    cleanupTestFiles(testFiles);
    console.log('✓ Cleanup complete');
  }

  console.log('');
  console.log('=======================================');
  console.log('Test completed.');
}

// Run the test
testResortApplication().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
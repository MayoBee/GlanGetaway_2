/**
 * Test script for Resort Owner Application endpoint
 * This script:
 * 1. Connects to the database
 * 2. Finds or creates a test user
 * 3. Generates a valid JWT token for that user
 * 4. Makes a POST request to /api/resort-owner-application with test data
 * 5. Reports the response
 *
 * Usage: npx ts-node test-resort-application.ts
 * Note: Ensure the backend server is running before executing.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

// Import User model
import User from './src/domains/identity/models/user';
import ResortOwnerApplication from './src/models/resort-owner-application';

// Configuration
const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const API_ENDPOINT = `${BACKEND_URL}/api/resort-owner-application`;

// Test configuration
const TEST_USER_EMAIL = 'test-resort-applicant@example.com';
const TEST_USER_FIRST_NAME = 'Test';
const TEST_USER_LAST_NAME = 'User';

// Global variables
let user: any = null;
let token: string | null = null;
const tempFiles: Array<{ key: string; path: string }> = [];

/**
 * Generate JWT token using the same method as SessionManager.createAccessToken
 */
function generateAccessToken(userId: string, email: string, role: string = 'user'): string {
  const now = Math.floor(Date.now() / 1000);
  const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || '15m';

  // Parse duration
  const expiresIn = parseDuration(accessTokenExpiry);

  const payload = {
    userId,
    email,
    role,
    sessionId: `${Date.now()}-test-session`,
    issuedAt: now,
    expiresAt: now + expiresIn
  };

  return jwt.sign(
    payload,
    JWT_SECRET_KEY!,
    {
      expiresIn: accessTokenExpiry,
      issuer: 'hotel-booking-system',
      audience: 'hotel-booking-client'
    }
  );
}

/**
 * Parse duration string to seconds
 */
function parseDuration(duration: string): number {
  const units: Record<string, number> = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400,
    'w': 604800,
    'M': 2592000,
    'y': 31536000
  };
  const match = duration.match(/^(\d+)([smhdwMy])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

/**
 * Create a test file with allowed MIME type (PDF)
 */
function createTestFile(docName: string): string {
  const tempDir = path.join(__dirname, 'temp-uploads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Use PDF for all documents as it's universally accepted
  const fileName = `${docName}_test.pdf`;
  const filePath = path.join(tempDir, fileName);

  // Minimal valid PDF header (1-page empty PDF)
  const pdfHeader = '%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 72 72] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 0 >>\nstream\n\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\r\n0000000009 00000 n\r\n0000000058 00000 n\r\n0000000115 00000 n\r\n0000000206 00000 n\r\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n300\n%%EOF';

  fs.writeFileSync(filePath, pdfHeader);
  return filePath;
}

/**
 * Clean up temp files
 */
function cleanupTempFiles(filePaths: string[]): void {
  filePaths.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.log(`Warning: Could not delete ${filePath}: ${err instanceof Error ? err.message : err}`);
    }
  });
  const tempDir = path.join(__dirname, 'temp-uploads');
  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      if (files.length === 0) {
        fs.rmdirSync(tempDir);
      }
    }
  } catch (err) {
    // Ignore cleanup errors
  }
}

/**
 * Build multipart/form-data body manually
 */
function buildMultipartBody(fields: Record<string, string>, files: Record<string, string>) {
  const boundary = '----FormBoundary' + Date.now();
  const bodyParts: Buffer[] = [];

  const addString = (str: string) => bodyParts.push(Buffer.from(str, 'utf8'));

  // Add text fields (none expected for this endpoint, but kept for extensibility)
  Object.keys(fields).forEach(key => {
    addString(`--${boundary}\r\n`);
    addString(`Content-Disposition: form-data; name="${key}"\r\n\r\n`);
    addString(fields[key] + '\r\n');
  });

  // Add file fields
  Object.keys(files).forEach(key => {
    const filePath = files[key];
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    const mimeType = 'application/pdf';

    addString(`--${boundary}\r\n`);
    addString(`Content-Disposition: form-data; name="${key}"; filename="${fileName}"\r\n`);
    addString(`Content-Type: ${mimeType}\r\n\r\n`);
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
function makeMultipartRequest(url: string, token: string, fileMap: Record<string, string>): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const { boundary, body } = buildMultipartBody({}, fileMap);
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? require('https') : require('http');

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = lib.request(options, (res) => {
      const chunks: Buffer[] = [];
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
 * Main test function
 */
async function main(): Promise<void> {
  try {
    console.log('🚀 Starting Resort Owner Application Test\n');
    console.log('='.repeat(60));

    // Step 1: Connect to database
    console.log('\x1b[34m%s\x1b[0m', '1. Connecting to database...');
    try {
      await mongoose.connect(MONGODB_URI!);
      console.log('\x1b[32m✓\x1b[0m MongoDB connected successfully');
      console.log(`   Database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
    } catch (dbError: any) {
      console.error('\x1b[31m✗\x1b[0m MongoDB connection failed:', dbError.message);
      process.exit(1);
    }

    // Step 2: Find or create test user
    console.log('\n\x1b[34m%s\x1b[0m', '2. Finding or creating test user...');
    try {
      user = await User.findOne({ email: TEST_USER_EMAIL });
      if (user) {
        console.log(`\x1b[32m✓\x1b[0m Found existing user: ${user.email} (ID: ${user._id})`);
        console.log(`   Role: ${user.role}`);
      } else {
        user = new User({
          email: TEST_USER_EMAIL,
          firstName: TEST_USER_FIRST_NAME,
          lastName: TEST_USER_LAST_NAME,
          password: 'testpassword123',
          role: 'user',
          emailVerified: true,
          isActive: true,
        });
        await user.save();
        console.log(`\x1b[32m✓\x1b[0m Created new test user: ${user.email} (ID: ${user._id})`);
        console.log(`   Role: ${user.role}`);
      }
    } catch (userError: any) {
      console.error('\x1b[31m✗\x1b[0m User operation failed:', userError.message);
      process.exit(1);
    }

    // Step 3: Generate JWT token
    console.log('\n\x1b[34m%s\x1b[0m', '3. Generating JWT token...');
    try {
      token = generateAccessToken(user!._id.toString(), user!.email, user!.role);
      console.log('\x1b[32m✓\x1b[0m Token generated successfully');

      const decoded = jwt.decode(token) as any;
      if (decoded) {
        console.log(`   Token type: access`);
        console.log(`   Expires at: ${new Date(decoded.expiresAt * 1000).toISOString()}`);
        console.log(`   Role: ${decoded.role}`);
      }
    } catch (tokenError: any) {
      console.error('\x1b[31m✗\x1b[0m Token generation failed:', tokenError.message);
      process.exit(1);
    }

    // Step 4: Create test files (PDF format)
    console.log('\n\x1b[34m%s\x1b[0m', '4. Creating test document files...');
    const requiredDocuments = [
      'dtiPermit',
      'municipalEngineeringCert',
      'municipalHealthCert',
      'menroCert',
      'bfpPermit',
      'businessPermit',
      'nationalId'
    ];

    try {
      for (const docName of requiredDocuments) {
        const filePath = createTestFile(docName);
        tempFiles.push({ key: docName, path: filePath });
      }
      console.log(`\x1b[32m✓\x1b[0m Created ${requiredDocuments.length} test documents (PDF format)`);
    } catch (fileError: any) {
      console.error('\x1b[31m✗\x1b[0m File creation failed:', fileError.message);
      process.exit(1);
    }

    // Step 5: Check for existing pending applications (informational)
    console.log('\n\x1b[34m%s\x1b[0m', '5. Checking for existing pending applications...');
    try {
      const existing = await ResortOwnerApplication.findOne({
        userId: user!._id,
        status: 'pending'
      });
      if (existing) {
        console.log('\x1b[33m⚠\x1b[0m Existing pending application found:');
        console.log(`   Application ID: ${existing._id}`);
        console.log(`   Submitted: ${existing.submittedAt}`);
        console.log('   This may cause a 400 error if you submit again.');
        console.log('   Consider deleting it or waiting for review.');
      } else {
        console.log('\x1b[32m✓\x1b[0m No existing pending applications');
      }
    } catch (err: any) {
      console.log(`   Could not check existing applications: ${err.message}`);
    }

    // Step 6: Make POST request
    console.log('\n\x1b[34m%s\x1b[0m', '6. Making POST request to /api/resort-owner-application...');
    console.log(`   Endpoint: ${API_ENDPOINT}`);

    const fileMap: Record<string, string> = {};
    tempFiles.forEach(f => {
      fileMap[f.key] = f.path;
    });

    let response;
    try {
      response = await makeMultipartRequest(API_ENDPOINT, token!, fileMap);
    } catch (requestError: any) {
      console.error('\x1b[31m✗\x1b[0m Request failed:', requestError.message);
      console.log('\n\x1b[31m%s\x1b[0m', 'TROUBLESHOOTING TIPS:');
      console.log('   1. Ensure backend server is running on', BACKEND_URL);
      console.log('      Run: npm run dev (in hotel-booking-backend directory)');
      console.log('   2. Check database connection string in .env');
      console.log('   3. Verify JWT_SECRET_KEY is configured');
      console.log('   4. Ensure all 7 required documents are being sent as PDFs');
      console.log('   5. Check that uploads directory exists and is writable');
      process.exit(1);
    }

    let responseData: any;
    try {
      responseData = JSON.parse(response.body);
    } catch {
      responseData = { raw: response.body };
    }

    console.log('\n\x1b[33m%s\x1b[0m', 'Response:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log('   Body:', JSON.stringify(responseData, null, 2));

    // Summary
    console.log('\n' + '='.repeat(60));
    if (response.status >= 200 && response.status < 300) {
      console.log('\x1b[32m%s\x1b[0m', '✅ TEST PASSED - 2xx Success');
      if (responseData.applicationId) {
        console.log(`   Application ID: ${responseData.applicationId}`);
      }
      console.log('\nThe 400 error issue is NOT present. Application was accepted.');
    } else if (response.status === 400) {
      console.log('\x1b[33m%s\x1b[0m', '⚠️  TEST RESULT: 400 BAD REQUEST');
      if (responseData.message) {
        console.log(`   Message: ${responseData.message}`);
      }
      if (responseData.errors) {
        console.log('   Validation errors:');
        responseData.errors.forEach((err: any, idx: number) => {
          const msg = err.msg || err.message || JSON.stringify(err);
          console.log(`     ${idx + 1}. ${msg}`);
        });
      }
      if (responseData.error) {
        console.log(`   Error: ${responseData.error}`);
      }
      console.log('\n\x1b[33m%s\x1b[0m', '💡 Possible causes of 400 error:');
      console.log('   - Missing required document files (all 7 must be sent)');
      console.log('   - Invalid file type (must be image/jpg, png, gif, or pdf)');
      console.log('   - File size exceeds 10MB limit');
      console.log('   - User already has a pending application');
      console.log('   - JWT token invalid or expired');
      console.log('\n💡 Check server logs for more details.');
    } else if (response.status === 401) {
      console.log('\x1b[31m%s\x1b[0m', '❌ 401 Unauthorized - Token issue');
      console.log('   Check that JWT_SECRET_KEY matches between client and server.');
    } else {
      console.log(`\x1b[31m%s\x1b[0m`, '❌ TEST FAILED - Unexpected status');
    }

  } catch (error: any) {
    console.error('\x1b[31m✗\x1b[0m Unexpected error:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n\x1b[34m%s\x1b[0m', '7. Cleaning up...');
    cleanupTempFiles(tempFiles.map(f => f.path));
    console.log('\x1b[32m✓\x1b[0m Cleanup complete');

    // Close database connection
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
      console.log('\x1b[32m✓\x1b[0m Database connection closed');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Test completed.\n');
  }
}

// Run the test
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

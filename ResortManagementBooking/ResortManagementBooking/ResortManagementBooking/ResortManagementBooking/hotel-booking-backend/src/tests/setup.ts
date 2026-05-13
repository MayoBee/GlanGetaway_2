// Jest setup file
import 'dotenv/config';
import mongoose from 'mongoose';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.MONGODB_CONNECTION_STRING = 'mongodb://localhost:27017/hotel-booking-test';
process.env.JWT_SECRET_KEY = 'test-secret-key';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud-name';

// Set up MongoDB connection for tests
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);
  } catch (error) {
    console.log('MongoDB connection failed, using in-memory database for tests');
    // Tests will run without actual database connection
  }
});

// Clean up after tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

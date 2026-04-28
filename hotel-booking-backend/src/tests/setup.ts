// Jest setup file
import 'dotenv/config';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.MONGODB_CONNECTION_STRING = 'mongodb://localhost:27017/hotel-booking-test';
process.env.JWT_SECRET_KEY = 'test-secret-key';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud-name';

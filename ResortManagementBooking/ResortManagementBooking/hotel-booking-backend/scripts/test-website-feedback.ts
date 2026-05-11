import mongoose from 'mongoose';
import WebsiteFeedback from '../src/models/website-feedback';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING;

if (!MONGODB_CONNECTION_STRING) {
  console.error('MONGODB_CONNECTION_STRING not found in environment variables');
  process.exit(1);
}

async function testWebsiteFeedback() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB');

    // Check existing feedback
    const existingFeedback = await WebsiteFeedback.find().sort({ createdAt: -1 });
    console.log(`\n=== Existing Website Feedback: ${existingFeedback.length} ===`);
    
    if (existingFeedback.length === 0) {
      console.log('No feedback found in database');
    } else {
      existingFeedback.slice(0, 5).forEach((feedback, index) => {
        console.log(`\n${index + 1}. Feedback ID: ${feedback._id}`);
        console.log(`   Type: ${feedback.type}`);
        console.log(`   Status: ${feedback.status}`);
        console.log(`   Priority: ${feedback.priority}`);
        console.log(`   Message: ${feedback.message.substring(0, 100)}${feedback.message.length > 100 ? "..." : ""}`);
        console.log(`   Email: ${feedback.email || 'Not provided'}`);
        console.log(`   Page URL: ${feedback.pageUrl}`);
        console.log(`   Created: ${feedback.createdAt}`);
        console.log(`   IP Address: ${feedback.ipAddress || 'Not recorded'}`);
      });
    }

    // Create test feedback if none exists
    if (existingFeedback.length === 0) {
      console.log('\n=== Creating Test Feedback ===');
      
      const testFeedback = new WebsiteFeedback({
        type: 'feedback',
        message: 'This is a test feedback message to verify the system is working correctly. The website feedback system should allow users to submit feedback and administrators to view and manage it.',
        email: 'test@example.com',
        pageUrl: 'http://localhost:5174/test-page',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '127.0.0.1',
        status: 'new',
        priority: 'medium'
      });

      await testFeedback.save();
      console.log('✅ Test feedback created successfully!');
      console.log(`   Feedback ID: ${testFeedback._id}`);
      console.log(`   Type: ${testFeedback.type}`);
      console.log(`   Status: ${testFeedback.status}`);
    }

    // Check feedback by status
    const feedbackByStatus = await WebsiteFeedback.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    console.log('\n=== Feedback by Status ===');
    feedbackByStatus.forEach(stat => {
      console.log(`${stat._id}: ${stat.count}`);
    });

    // Check feedback by type
    const feedbackByType = await WebsiteFeedback.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    
    console.log('\n=== Feedback by Type ===');
    feedbackByType.forEach(stat => {
      console.log(`${stat._id}: ${stat.count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testWebsiteFeedback();

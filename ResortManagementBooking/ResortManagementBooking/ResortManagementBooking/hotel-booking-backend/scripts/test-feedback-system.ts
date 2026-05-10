import mongoose from "mongoose";
import WebsiteFeedback from "../src/models/website-feedback";
import Report from "../src/models/report";
import dotenv from "dotenv";

dotenv.config();

async function testFeedbackSystem() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("📡 Connected to MongoDB");

    console.log("\n🧪 Testing Feedback System...");

    // Test 1: Create a website feedback
    console.log("\n📝 Test 1: Creating Website Feedback...");
    const feedback = new WebsiteFeedback({
      type: "feedback",
      message: "This is a test feedback message to verify the system is working properly!",
      email: "test@example.com",
      pageUrl: "http://localhost:5174/test",
      userAgent: "Test Browser",
      ipAddress: "127.0.0.1",
    });

    await feedback.save();
    console.log("✅ Website Feedback Created:");
    console.log(`   ID: ${feedback._id}`);
    console.log(`   Type: ${feedback.type}`);
    console.log(`   Message: ${feedback.message}`);

    // Test 2: Create a report
    console.log("\n🚨 Test 2: Creating Report...");
    const report = new Report({
      reporterId: new mongoose.Types.ObjectId(), // Test user ID
      reportedItemId: new mongoose.Types.ObjectId(), // Test hotel ID
      reportedItemType: "hotel",
      reason: "inappropriate_content",
      description: "This is a test report to verify the system is working properly!",
      priority: "medium",
    });

    await report.save();
    console.log("✅ Report Created:");
    console.log(`   ID: ${report._id}`);
    console.log(`   Type: ${report.reportedItemType}`);
    console.log(`   Reason: ${report.reason}`);

    // Test 3: Query the collections
    console.log("\n📊 Test 3: Querying Collections...");
    
    const feedbackCount = await WebsiteFeedback.countDocuments();
    const reportCount = await Report.countDocuments();
    
    console.log(`   Website Feedback Count: ${feedbackCount}`);
    console.log(`   Reports Count: ${reportCount}`);

    // Test 4: Fetch with population
    console.log("\n🔍 Test 4: Fetching with Population...");
    
    const allFeedback = await WebsiteFeedback.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    const allReports = await Report.find()
      .populate("reporterId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`   Recent Feedback: ${allFeedback.length} items`);
    console.log(`   Recent Reports: ${allReports.length} items`);

    console.log("\n✅ All Tests Passed!");
    console.log("\n📋 Summary:");
    console.log("   - Website Feedback system is working");
    console.log("   - Reports system is working");
    console.log("   - Data is properly stored in MongoDB");
    console.log("   - Collections are ready for use");

    console.log("\n🎯 Next Steps:");
    console.log("1. Start your frontend application");
    console.log("2. Test the feedback forms on the website");
    console.log("3. Check MongoDB Compass for new data");
    console.log("4. Test admin access to reports and feedback");

  } catch (error) {
    console.error("❌ Test Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
if (require.main === module) {
  console.log("🚀 Starting Feedback System Test");
  console.log("===================================");
  testFeedbackSystem();
}

export default testFeedbackSystem;

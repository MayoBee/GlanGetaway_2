"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const website_feedback_1 = __importDefault(require("../src/models/website-feedback"));
const report_1 = __importDefault(require("../src/models/report"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function testFeedbackSystem() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            const mongoUri = process.env.MONGODB_CONNECTION_STRING;
            if (!mongoUri) {
                throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
            }
            yield mongoose_1.default.connect(mongoUri);
            console.log("📡 Connected to MongoDB");
            console.log("\n🧪 Testing Feedback System...");
            // Test 1: Create a website feedback
            console.log("\n📝 Test 1: Creating Website Feedback...");
            const feedback = new website_feedback_1.default({
                type: "feedback",
                message: "This is a test feedback message to verify the system is working properly!",
                email: "test@example.com",
                pageUrl: "http://localhost:5174/test",
                userAgent: "Test Browser",
                ipAddress: "127.0.0.1",
            });
            yield feedback.save();
            console.log("✅ Website Feedback Created:");
            console.log(`   ID: ${feedback._id}`);
            console.log(`   Type: ${feedback.type}`);
            console.log(`   Message: ${feedback.message}`);
            // Test 2: Create a report
            console.log("\n🚨 Test 2: Creating Report...");
            const report = new report_1.default({
                reporterId: new mongoose_1.default.Types.ObjectId(),
                reportedItemId: new mongoose_1.default.Types.ObjectId(),
                reportedItemType: "hotel",
                reason: "inappropriate_content",
                description: "This is a test report to verify the system is working properly!",
                priority: "medium",
            });
            yield report.save();
            console.log("✅ Report Created:");
            console.log(`   ID: ${report._id}`);
            console.log(`   Type: ${report.reportedItemType}`);
            console.log(`   Reason: ${report.reason}`);
            // Test 3: Query the collections
            console.log("\n📊 Test 3: Querying Collections...");
            const feedbackCount = yield website_feedback_1.default.countDocuments();
            const reportCount = yield report_1.default.countDocuments();
            console.log(`   Website Feedback Count: ${feedbackCount}`);
            console.log(`   Reports Count: ${reportCount}`);
            // Test 4: Fetch with population
            console.log("\n🔍 Test 4: Fetching with Population...");
            const allFeedback = yield website_feedback_1.default.find()
                .sort({ createdAt: -1 })
                .limit(5);
            const allReports = yield report_1.default.find()
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
        }
        catch (error) {
            console.error("❌ Test Error:", error);
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
// Run the test
if (require.main === module) {
    console.log("🚀 Starting Feedback System Test");
    console.log("===================================");
    testFeedbackSystem();
}
exports.default = testFeedbackSystem;

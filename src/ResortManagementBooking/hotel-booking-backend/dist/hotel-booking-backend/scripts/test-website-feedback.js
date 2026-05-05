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
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING;
if (!MONGODB_CONNECTION_STRING) {
    console.error('MONGODB_CONNECTION_STRING not found in environment variables');
    process.exit(1);
}
function testWebsiteFeedback() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('Connected to MongoDB');
            // Check existing feedback
            const existingFeedback = yield website_feedback_1.default.find().sort({ createdAt: -1 });
            console.log(`\n=== Existing Website Feedback: ${existingFeedback.length} ===`);
            if (existingFeedback.length === 0) {
                console.log('No feedback found in database');
            }
            else {
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
                const testFeedback = new website_feedback_1.default({
                    type: 'feedback',
                    message: 'This is a test feedback message to verify the system is working correctly. The website feedback system should allow users to submit feedback and administrators to view and manage it.',
                    email: 'test@example.com',
                    pageUrl: 'http://localhost:5174/test-page',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    ipAddress: '127.0.0.1',
                    status: 'new',
                    priority: 'medium'
                });
                yield testFeedback.save();
                console.log('✅ Test feedback created successfully!');
                console.log(`   Feedback ID: ${testFeedback._id}`);
                console.log(`   Type: ${testFeedback.type}`);
                console.log(`   Status: ${testFeedback.status}`);
            }
            // Check feedback by status
            const feedbackByStatus = yield website_feedback_1.default.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);
            console.log('\n=== Feedback by Status ===');
            feedbackByStatus.forEach(stat => {
                console.log(`${stat._id}: ${stat.count}`);
            });
            // Check feedback by type
            const feedbackByType = yield website_feedback_1.default.aggregate([
                { $group: { _id: "$type", count: { $sum: 1 } } }
            ]);
            console.log('\n=== Feedback by Type ===');
            feedbackByType.forEach(stat => {
                console.log(`${stat._id}: ${stat.count}`);
            });
        }
        catch (error) {
            console.error('Error:', error);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('\nDisconnected from MongoDB');
        }
    });
}
testWebsiteFeedback();

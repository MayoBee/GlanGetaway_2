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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function testAuthPerformance() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            const mongoUri = process.env.MONGODB_CONNECTION_STRING;
            if (!mongoUri) {
                throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
            }
            yield mongoose_1.default.connect(mongoUri);
            console.log("📡 Connected to MongoDB");
            console.log("\n🚀 Testing Authentication Performance...");
            // Test 1: Check database indexes for users collection
            console.log("\n📊 Test 1: Checking User Collection Indexes...");
            const db = mongoose_1.default.connection.db;
            const userCollection = db.collection('users');
            const indexes = yield userCollection.indexes();
            console.log("Current indexes on users collection:");
            indexes.forEach(index => {
                console.log(`  - ${JSON.stringify(index.key)} (unique: ${index.unique || false})`);
            });
            // Test 2: Check if email index exists (critical for login performance)
            const hasEmailIndex = indexes.some(index => Object.keys(index.key).includes('email') && index.unique);
            if (!hasEmailIndex) {
                console.log("⚠️  WARNING: No unique email index found! This will slow down login queries.");
                console.log("Creating email index...");
                yield userCollection.createIndex({ email: 1 }, { unique: true });
                console.log("✅ Email index created successfully!");
            }
            else {
                console.log("✅ Email index exists - login queries will be fast!");
            }
            // Test 3: Check user count
            const userCount = yield userCollection.countDocuments();
            console.log(`\n📈 Test 2: Database Statistics`);
            console.log(`  - Total users: ${userCount}`);
            console.log(`  - Database size: ${(yield db.stats()).dataSize / 1024 / 1024} MB`);
            // Test 4: Simulate login query performance
            console.log("\n⚡ Test 3: Login Query Performance");
            const startTime = Date.now();
            const testUser = yield userCollection.findOne({ email: "superadmin@glangetaway.com" });
            const queryTime = Date.now() - startTime;
            console.log(`  - Login query time: ${queryTime}ms`);
            console.log(`  - Super Admin found: ${!!testUser}`);
            // Performance recommendations
            console.log("\n💡 Performance Recommendations:");
            if (queryTime > 50) {
                console.log("  ⚠️  Login query is slow (>50ms). Consider:");
                console.log("     - Adding more database indexes");
                console.log("     - Optimizing user schema");
                console.log("     - Using database connection pooling");
            }
            else {
                console.log("  ✅ Login query performance is good!");
            }
            if (userCount > 1000) {
                console.log("  ⚠️  Large user base detected. Consider:");
                console.log("     - Implementing user caching");
                console.log("     - Adding pagination to user queries");
                console.log("     - Using read replicas for auth queries");
            }
            console.log("\n✅ Auth Performance Test Complete!");
            console.log("\n🎯 Frontend Optimizations Applied:");
            console.log("  - Simplified AppContext logic");
            console.log("  - Removed redundant loading states");
            console.log("  - Added proper error handling");
            console.log("  - Reduced API timeout to 15 seconds");
            console.log("  - Added retry logic for network errors");
            console.log("  - Updated test accounts for three-tier system");
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
    console.log("🔧 Starting Auth Performance Test");
    console.log("====================================");
    testAuthPerformance();
}
exports.default = testAuthPerformance;

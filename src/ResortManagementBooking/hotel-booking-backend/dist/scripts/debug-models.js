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
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
// Import the models to test them
const booking_1 = __importDefault(require("../src/domains/booking/models/booking"));
const hotel_1 = __importDefault(require("../src/domains/hotel/models/hotel"));
function debugModels() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Debugging Mongoose models vs raw data...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to MongoDB successfully');
            const db = mongoose_1.default.connection.db;
            console.log(`📦 Database: ${db.databaseName}`);
            // Check all collections
            const collections = yield db.listCollections().toArray();
            console.log(`\n📋 Collections in database:`);
            collections.forEach((collection) => {
                console.log(`  - ${collection.name}`);
            });
            // Check raw data counts
            console.log(`\n📊 Raw data counts:`);
            const rawUsersCount = yield db.collection('users').countDocuments();
            const rawBookingsCount = yield db.collection('bookings').countDocuments();
            const rawHotelsCount = yield db.collection('hotels').countDocuments();
            console.log(`  - users collection: ${rawUsersCount} documents`);
            console.log(`  - bookings collection: ${rawBookingsCount} documents`);
            console.log(`  - hotels collection: ${rawHotelsCount} documents`);
            // Check model data counts
            console.log(`\n📊 Mongoose model counts:`);
            const modelUsersCount = yield db.collection('users').countDocuments(); // Users might not have a model
            const modelBookingsCount = yield booking_1.default.countDocuments();
            const modelHotelsCount = yield hotel_1.default.countDocuments();
            console.log(`  - Booking model: ${modelBookingsCount} documents`);
            console.log(`  - Hotel model: ${modelHotelsCount} documents`);
            // Find user ID
            const user = yield db.collection('users').findOne({ email: "biennickw@gmail.com" });
            if (!user) {
                console.log('❌ User not found');
                return;
            }
            console.log(`\n👤 User ID: ${user._id}`);
            // Test raw bookings query
            console.log(`\n🔍 Raw bookings query:`);
            const rawBookings = yield db.collection('bookings').find({ userId: user._id }).toArray();
            console.log(`  - Found ${rawBookings.length} bookings with userId ${user._id}`);
            // Test Mongoose bookings query
            console.log(`\n🔍 Mongoose bookings query:`);
            const modelBookings = yield booking_1.default.find({ userId: user._id }).lean();
            console.log(`  - Found ${modelBookings.length} bookings with userId ${user._id}`);
            // Check if the ObjectId conversion is the issue
            console.log(`\n🔍 Testing ObjectId conversion:`);
            const userIdString = user._id.toString();
            const userIdObject = new mongoose_1.default.Types.ObjectId(userIdString);
            console.log(`  - User ID as string: ${userIdString}`);
            console.log(`  - User ID as ObjectId: ${userIdObject}`);
            const bookingsWithString = yield db.collection('bookings').find({ userId: userIdString }).toArray();
            const bookingsWithObjectId = yield db.collection('bookings').find({ userId: userIdObject }).toArray();
            console.log(`  - Bookings with string ID: ${bookingsWithString.length}`);
            console.log(`  - Bookings with ObjectId: ${bookingsWithObjectId.length}`);
            // Check the actual data types in the bookings
            if (rawBookings.length > 0) {
                console.log(`\n🔍 Checking data types in first booking:`);
                const firstBooking = rawBookings[0];
                console.log(`  - userId type: ${typeof firstBooking.userId}`);
                console.log(`  - userId value: ${firstBooking.userId}`);
                console.log(`  - userId constructor: ${firstBooking.userId.constructor.name}`);
            }
        }
        catch (error) {
            console.error('❌ Debug failed:', error);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('🔌 Disconnected from database');
        }
    });
}
// Run the debug
if (require.main === module) {
    debugModels();
}
exports.default = debugModels;

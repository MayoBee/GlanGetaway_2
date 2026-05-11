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
function checkModelCollections() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Checking Mongoose model collections...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to MongoDB successfully');
            const db = mongoose_1.default.connection.db;
            // Check all collections
            const collections = yield db.listCollections().toArray();
            console.log(`\n📋 Collections in database:`);
            collections.forEach((collection) => {
                console.log(`  - ${collection.name}`);
            });
            // Check raw data counts
            console.log(`\n📊 Raw data counts:`);
            const rawBookingsCount = yield db.collection('bookings').countDocuments();
            const rawUsersCount = yield db.collection('users').countDocuments();
            const rawHotelsCount = yield db.collection('hotels').countDocuments();
            console.log(`  - bookings collection: ${rawBookingsCount} documents`);
            console.log(`  - users collection: ${rawUsersCount} documents`);
            console.log(`  - hotels collection: ${rawHotelsCount} documents`);
            // Test direct Mongoose model usage
            console.log(`\n🔍 Testing Mongoose models...`);
            try {
                // Import the models
                const Booking = require('../src/domains/booking/models/booking').default;
                const Hotel = require('../src/domains/hotel/models/hotel').default;
                console.log(`✅ Models imported successfully`);
                // Check model collection names
                console.log(`  - Booking model collection: ${Booking.collection.name}`);
                console.log(`  - Hotel model collection: ${Hotel.collection.name}`);
                // Test model counts
                const bookingCount = yield Booking.countDocuments();
                const hotelCount = yield Hotel.countDocuments();
                console.log(`  - Booking model documents: ${bookingCount}`);
                console.log(`  - Hotel model documents: ${hotelCount}`);
                // Test finding bookings with the model
                const user = yield db.collection('users').findOne({ email: "biennickw@gmail.com" });
                if (user) {
                    console.log(`\n👤 Testing booking queries for user ${user.email}...`);
                    const modelBookings = yield Booking.find({ userId: user._id });
                    console.log(`  - Model query with ObjectId: ${modelBookings.length} results`);
                    const modelBookingsString = yield Booking.find({ userId: user._id.toString() });
                    console.log(`  - Model query with string: ${modelBookingsString.length} results`);
                    // Test with new ObjectId
                    const newObjectId = new mongoose_1.default.Types.ObjectId(user._id.toString());
                    const modelBookingsNew = yield Booking.find({ userId: newObjectId });
                    console.log(`  - Model query with new ObjectId: ${modelBookingsNew.length} results`);
                }
            }
            catch (modelError) {
                console.error(`❌ Model import error:`, modelError.message);
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
    checkModelCollections();
}
exports.default = checkModelCollections;

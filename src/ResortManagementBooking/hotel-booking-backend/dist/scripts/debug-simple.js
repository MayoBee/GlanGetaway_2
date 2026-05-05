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
function debugSimple() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Simple debug of data types...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to MongoDB successfully');
            const db = mongoose_1.default.connection.db;
            // Find user
            const user = yield db.collection('users').findOne({ email: "biennickw@gmail.com" });
            if (!user) {
                console.log('❌ User not found');
                return;
            }
            console.log(`👤 User ID: ${user._id} (type: ${typeof user._id})`);
            // Check bookings data types
            console.log(`\n🔍 Checking bookings data types...`);
            const bookings = yield db.collection('bookings').find({}).limit(3).toArray();
            bookings.forEach((booking, index) => {
                console.log(`\nBooking ${index + 1}:`);
                console.log(`  - userId: ${booking.userId} (type: ${typeof booking.userId})`);
                console.log(`  - userId equals user._id: ${booking.userId.toString() === user._id.toString()}`);
                console.log(`  - hotelId: ${booking.hotelId} (type: ${typeof booking.hotelId})`);
            });
            // Test different query approaches
            console.log(`\n🔍 Testing different query approaches...`);
            const query1 = yield db.collection('bookings').find({ userId: user._id }).toArray();
            console.log(`1. Query with ObjectId: ${query1.length} results`);
            const query2 = yield db.collection('bookings').find({ userId: user._id.toString() }).toArray();
            console.log(`2. Query with string: ${query2.length} results`);
            const query3 = yield db.collection('bookings').find({
                userId: new mongoose_1.default.Types.ObjectId(user._id.toString())
            }).toArray();
            console.log(`3. Query with new ObjectId: ${query3.length} results`);
            // Test the exact API logic
            console.log(`\n🔍 Testing exact API logic...`);
            const apiBookings = yield db.collection('bookings').find({
                userId: new mongoose_1.default.Types.ObjectId(user._id.toString())
            }).sort({ createdAt: -1 });
            const apiBookingsArray = yield apiBookings.toArray();
            console.log(`API query found: ${apiBookingsArray.length} bookings`);
            if (apiBookingsArray.length > 0) {
                console.log(`First booking userId type: ${typeof apiBookingsArray[0].userId}`);
                console.log(`First booking hotelId type: ${typeof apiBookingsArray[0].hotelId}`);
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
    debugSimple();
}
exports.default = debugSimple;

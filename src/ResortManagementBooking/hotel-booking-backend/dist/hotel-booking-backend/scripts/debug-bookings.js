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
function debugBookings() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Starting debug for bookings data...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to MongoDB successfully');
            const db = mongoose_1.default.connection.db;
            console.log(`📦 Using database: ${db.databaseName}`);
            // 1. Check if user exists
            const user = yield db.collection('users').findOne({ email: "biennickw@gmail.com" });
            if (!user) {
                console.log('❌ User biennickw@gmail.com not found in database');
                return;
            }
            console.log(`✅ Found user: ${user.email} (ID: ${user._id})`);
            console.log(`   - Name: ${user.firstName} ${user.lastName}`);
            console.log(`   - Role: ${user.role}`);
            console.log(`   - Approved: ${user.isApproved}`);
            // 2. Check all bookings for this user
            const bookings = yield db.collection('bookings').find({ userId: user._id }).toArray();
            console.log(`\n📋 Found ${bookings.length} bookings for this user:`);
            if (bookings.length === 0) {
                console.log('❌ No bookings found for this user');
                // Check if there are any bookings at all
                const allBookings = yield db.collection('bookings').find({}).limit(5).toArray();
                console.log(`📊 Total bookings in database: ${yield db.collection('bookings').countDocuments()}`);
                if (allBookings.length > 0) {
                    console.log('Sample bookings:');
                    allBookings.forEach((booking, index) => {
                        console.log(`  ${index + 1}. User ID: ${booking.userId}, Hotel ID: ${booking.hotelId}, Email: ${booking.email}`);
                    });
                }
            }
            else {
                bookings.forEach((booking, index) => {
                    console.log(`\n  Booking ${index + 1}:`);
                    console.log(`    - ID: ${booking._id}`);
                    console.log(`    - Hotel ID: ${booking.hotelId}`);
                    console.log(`    - Status: ${booking.status}`);
                    console.log(`    - Payment Status: ${booking.paymentStatus}`);
                    console.log(`    - Check-in: ${booking.checkIn}`);
                    console.log(`    - Check-out: ${booking.checkOut}`);
                    console.log(`    - Total Cost: ₱${booking.totalCost}`);
                    console.log(`    - Created: ${booking.createdAt}`);
                });
            }
            // 3. Check hotel information
            console.log(`\n🏨 Checking hotel information...`);
            const hotelIds = [...new Set(bookings.map(b => b.hotelId))];
            for (const hotelId of hotelIds) {
                const hotel = yield db.collection('hotels').findOne({ _id: hotelId });
                if (hotel) {
                    console.log(`✅ Hotel ${hotelId}: ${hotel.name} - ₱${hotel.pricePerNight || hotel.nightRate || 'N/A'}/night`);
                }
                else {
                    console.log(`❌ Hotel ${hotelId} not found`);
                }
            }
            // 4. Check what the API would return
            console.log(`\n🔍 Simulating API call to /api/my-bookings...`);
            // Group bookings by hotelId (same as backend API)
            const hotelBookingsMap = new Map();
            for (const booking of bookings) {
                const hotelId = (_a = booking.hotelId) === null || _a === void 0 ? void 0 : _a.toString();
                if (!hotelId)
                    continue;
                if (!hotelBookingsMap.has(hotelId)) {
                    // Fetch hotel info
                    const hotel = yield db.collection('hotels').findOne({ _id: hotelId });
                    if (hotel) {
                        hotelBookingsMap.set(hotelId, Object.assign(Object.assign({}, hotel), { bookings: [] }));
                    }
                }
                const hotelData = hotelBookingsMap.get(hotelId);
                if (hotelData) {
                    hotelData.bookings.push(booking);
                }
            }
            // Convert map to array
            const results = Array.from(hotelBookingsMap.values());
            console.log(`📊 API would return ${results.length} hotels with bookings:`);
            results.forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.name} - ${result.bookings.length} bookings`);
            });
            if (results.length === 0) {
                console.log('❌ API would return empty array - this explains "No Bookings Found"');
            }
        }
        catch (error) {
            console.error('❌ Debug failed:', error);
            process.exit(1);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('🔌 Disconnected from database');
        }
    });
}
// Run the debug
if (require.main === module) {
    debugBookings();
}
exports.default = debugBookings;

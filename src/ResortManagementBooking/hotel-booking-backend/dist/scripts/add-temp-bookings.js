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
function addTempBookings() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔄 Starting to add temporary booking data...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to MongoDB successfully');
            const db = mongoose_1.default.connection.db;
            console.log(`📦 Using database: ${db.databaseName}`);
            // Find the user with email biennickw@gmail.com
            const user = yield db.collection('users').findOne({ email: "biennickw@gmail.com" });
            if (!user) {
                console.log('❌ User biennickw@gmail.com not found. Please run seed-database.ts first.');
                return;
            }
            console.log(`✅ Found user: ${user.email} (ID: ${user._id})`);
            // Get sample hotels
            const hotels = yield db.collection('hotels').find({}).limit(3).toArray();
            if (hotels.length === 0) {
                console.log('❌ No hotels found. Please run seed-database.ts first.');
                return;
            }
            console.log(`✅ Found ${hotels.length} hotels to create bookings for`);
            console.log('📊 Available hotels:');
            hotels.forEach((hotel, index) => {
                console.log(`${index + 1}. ${hotel.name || 'Unnamed Hotel'} - ID: ${hotel._id} - Price: ₱${hotel.pricePerNight || hotel.nightRate || 'N/A'}/night`);
            });
            // Clear existing bookings for this user
            yield db.collection('bookings').deleteMany({ userId: user._id });
            console.log('🧹 Cleared existing bookings for biennickw@gmail.com');
            // Create sample bookings
            const bookings = [];
            const currentDate = new Date();
            // Booking 1: Confirmed booking for next week
            const checkIn1 = new Date(currentDate);
            checkIn1.setDate(currentDate.getDate() + 7);
            const checkOut1 = new Date(checkIn1);
            checkOut1.setDate(checkIn1.getDate() + 2);
            bookings.push({
                userId: user._id,
                hotelId: hotels[0]._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: "+639123456789",
                adultCount: 2,
                childCount: 1,
                checkIn: checkIn1,
                checkOut: checkOut1,
                checkInTime: "12:00",
                checkOutTime: "11:00",
                totalCost: (hotels[0].pricePerNight || hotels[0].nightRate || 2000) * 2,
                basePrice: hotels[0].pricePerNight || hotels[0].nightRate || 2000,
                selectedRooms: [{
                        id: "room1",
                        name: "Deluxe Room",
                        type: "deluxe",
                        pricePerNight: hotels[0].pricePerNight || hotels[0].nightRate || 2000,
                        maxOccupancy: 3,
                        description: "Spacious deluxe room with ocean view"
                    }],
                selectedAmenities: [{
                        id: "amenity1",
                        name: "Breakfast",
                        price: 500,
                        description: "Daily breakfast for 3 guests"
                    }],
                roomIds: ["room1"],
                cottageIds: [],
                status: "confirmed",
                paymentStatus: "paid",
                paymentMethod: "credit_card",
                specialRequests: "Please arrange airport pickup",
                cancellationReason: "",
                refundAmount: 0,
                isPwdBooking: false,
                isSeniorCitizenBooking: false,
                discountApplied: null,
                verifiedByOwner: true,
                ownerVerificationNote: "Guest confirmed via phone",
                ownerVerifiedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            // Booking 2: Pending booking for next month
            const checkIn2 = new Date(currentDate);
            checkIn2.setMonth(currentDate.getMonth() + 1);
            checkIn2.setDate(1);
            const checkOut2 = new Date(checkIn2);
            checkOut2.setDate(checkIn2.getDate() + 3);
            bookings.push({
                userId: user._id,
                hotelId: hotels[0]._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: "+639123456789",
                adultCount: 4,
                childCount: 2,
                checkIn: checkIn2,
                checkOut: checkOut2,
                checkInTime: "14:00",
                checkOutTime: "12:00",
                totalCost: (hotels[0].pricePerNight || hotels[0].nightRate || 2500) * 3,
                basePrice: hotels[0].pricePerNight || hotels[0].nightRate || 2500,
                selectedRooms: [{
                        id: "room2",
                        name: "Family Suite",
                        type: "suite",
                        pricePerNight: hotels[0].pricePerNight || hotels[0].nightRate || 2500,
                        maxOccupancy: 6,
                        description: "Large family suite with kitchenette"
                    }],
                selectedAmenities: [
                    {
                        id: "amenity2",
                        name: "All Meals Package",
                        price: 2000,
                        description: "Breakfast, lunch, and dinner for all guests"
                    },
                    {
                        id: "amenity3",
                        name: "Airport Transfer",
                        price: 1500,
                        description: "Round-trip airport transfer"
                    }
                ],
                roomIds: ["room2"],
                status: "pending",
                paymentStatus: "pending",
                paymentMethod: "gcash",
                specialRequests: "Need extra beds for children, prefer ground floor",
                cancellationReason: "",
                refundAmount: 0,
                isPwdBooking: false,
                isSeniorCitizenBooking: false,
                discountApplied: null,
                verifiedByOwner: false,
                gcashPayment: {
                    gcashNumber: "09123456789",
                    referenceNumber: "GCASH123456789",
                    amountPaid: (hotels[0].pricePerNight || hotels[0].nightRate || 2500) * 3,
                    paymentTime: new Date(),
                    status: "pending"
                },
                createdAt: new Date(),
                updatedAt: new Date()
            });
            // Booking 3: Completed booking from last month
            const checkIn3 = new Date(currentDate);
            checkIn3.setMonth(currentDate.getMonth() - 1);
            checkIn3.setDate(15);
            const checkOut3 = new Date(checkIn3);
            checkOut3.setDate(checkIn3.getDate() + 1);
            bookings.push({
                userId: user._id,
                hotelId: hotels[0]._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: "+639123456789",
                adultCount: 2,
                childCount: 0,
                checkIn: checkIn3,
                checkOut: checkOut3,
                checkInTime: "12:00",
                checkOutTime: "11:00",
                totalCost: hotels[0].pricePerNight || hotels[0].nightRate || 1800,
                basePrice: hotels[0].pricePerNight || hotels[0].nightRate || 1800,
                selectedRooms: [{
                        id: "room3",
                        name: "Standard Room",
                        type: "standard",
                        pricePerNight: hotels[0].pricePerNight || hotels[0].nightRate || 1800,
                        maxOccupancy: 2,
                        description: "Comfortable standard room"
                    }],
                selectedAmenities: [],
                roomIds: ["room3"],
                status: "completed",
                paymentStatus: "paid",
                paymentMethod: "credit_card",
                specialRequests: "Late check-out requested and approved",
                cancellationReason: "",
                refundAmount: 0,
                isPwdBooking: false,
                isSeniorCitizenBooking: false,
                discountApplied: null,
                verifiedByOwner: true,
                ownerVerificationNote: "Guest checked out smoothly",
                ownerVerifiedAt: new Date(),
                createdAt: checkIn3,
                updatedAt: checkOut3
            });
            // Insert bookings
            const result = yield db.collection('bookings').insertMany(bookings);
            console.log(`✅ Added ${result.insertedCount} temporary bookings for biennickw@gmail.com`);
            console.log('\n📋 Bookings Summary:');
            bookings.forEach((booking, index) => {
                const hotel = hotels.find(h => h._id.toString() === booking.hotelId.toString());
                console.log(`${index + 1}. ${(hotel === null || hotel === void 0 ? void 0 : hotel.name) || 'Unknown Hotel'} - ${booking.status} - ${booking.checkIn.toDateString()} to ${booking.checkOut.toDateString()} - ₱${booking.totalCost}`);
            });
            console.log('\n🎉 Temporary booking data added successfully!');
            console.log('👤 You can now view these bookings on the /my-bookings page when logged in as biennickw@gmail.com');
        }
        catch (error) {
            console.error('❌ Failed to add temporary bookings:', error);
            process.exit(1);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('🔌 Disconnected from database');
        }
    });
}
// Run the script
if (require.main === module) {
    addTempBookings();
}
exports.default = addTempBookings;

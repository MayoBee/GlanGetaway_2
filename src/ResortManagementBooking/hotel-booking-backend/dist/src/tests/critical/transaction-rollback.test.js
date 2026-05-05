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
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const bootstrap_1 = require("../../bootstrap");
const hotel_1 = __importDefault(require("../../models/hotel"));
const booking_1 = __importDefault(require("../../models/booking"));
const user_1 = __importDefault(require("../../models/user"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Test suite for transaction rollback testing
// This verifies that if any part of the booking flow fails,
// the entire transaction is rolled back and no orphaned records exist
describe('Transaction Rollback', () => {
    let app;
    let testHotel;
    let authToken;
    let userId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Increase timeout for test setup
        jest.setTimeout(30000);
        app = (0, bootstrap_1.createAndConfigureApp)();
        // Create test user
        const hashedPassword = yield bcryptjs_1.default.hash('testpassword123', 12);
        const user = new user_1.default({
            email: 'rollback-test@example.com',
            password: hashedPassword,
            firstName: 'Rollback',
            lastName: 'Test',
            role: 'user',
            totalBookings: 0
        });
        yield user.save();
        userId = user._id.toString();
        // Generate auth token
        authToken = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET_KEY || 'test-secret-key', { expiresIn: '7d' });
        // Create test hotel
        testHotel = new hotel_1.default({
            userId: userId,
            name: 'Rollback Test Resort',
            city: 'Glan',
            country: 'Philippines',
            description: 'Test resort for transaction rollback testing',
            type: ['beach'],
            facilities: ['pool'],
            dayRate: 1000,
            nightRate: 2000,
            hasDayRate: true,
            hasNightRate: true,
            starRating: 3,
            imageUrls: [],
            isApproved: true,
            status: 'approved',
            rooms: [{
                    id: 'room-001',
                    name: 'Single Room',
                    type: 'standard',
                    pricePerNight: 2000,
                    minOccupancy: 1,
                    maxOccupancy: 2
                }],
            totalBookings: 0,
            lastUpdated: new Date()
        });
        yield testHotel.save();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Cleanup
        try {
            if (testHotel && testHotel._id) {
                yield booking_1.default.deleteMany({ hotelId: testHotel._id });
                yield hotel_1.default.deleteMany({ _id: testHotel._id });
            }
            if (userId) {
                yield user_1.default.deleteMany({ _id: userId });
            }
        }
        catch (error) {
            console.log('Cleanup error:', error);
        }
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clear bookings and reset counters before each test
        if (testHotel && testHotel._id) {
            yield booking_1.default.deleteMany({ hotelId: testHotel._id });
            yield hotel_1.default.findByIdAndUpdate(testHotel._id, { totalBookings: 0 });
        }
        if (userId) {
            yield user_1.default.findByIdAndUpdate(userId, { totalBookings: 0 });
        }
    }));
    it('should rollback booking when availability conflict occurs', () => __awaiter(void 0, void 0, void 0, function* () {
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 1);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 2);
        // First, create a confirmed booking for the same room and dates
        const existingBooking = new booking_1.default({
            userId,
            hotelId: testHotel._id,
            firstName: 'Existing',
            lastName: 'Booking',
            email: 'existing@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn,
            checkOut,
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Single Room',
                    type: 'standard',
                    pricePerNight: 2000,
                    minOccupancy: 1,
                    maxOccupancy: 2
                }],
            paymentMethod: 'card',
            status: 'confirmed',
            paymentStatus: 'paid',
            changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
            canModify: true
        });
        yield existingBooking.save();
        // Now try to book the same room for the same dates
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Single Room',
                    type: 'standard',
                    pricePerNight: 2000,
                    minOccupancy: 1,
                    maxOccupancy: 2
                }],
            paymentMethod: 'card'
        };
        const response = yield (0, supertest_1.default)(app)
            .post(`/api/hotels/${testHotel._id}/bookings`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(bookingPayload);
        // Should fail with conflict
        expect(response.status).toBe(409);
        expect(response.body.message).toContain('availability');
        // Verify only the original booking exists
        const bookings = yield booking_1.default.find({ hotelId: testHotel._id });
        expect(bookings.length).toBe(1);
        expect(bookings[0]._id.toString()).toBe(existingBooking._id.toString());
        // Verify hotel count was NOT incremented (stays at 1)
        const hotel = yield hotel_1.default.findById(testHotel._id);
        expect(hotel === null || hotel === void 0 ? void 0 : hotel.totalBookings).toBe(0); // Should be 0 because the new booking was rolled back
        // Actually it's 1 from the existing booking that we manually created, 
        // so the route didn't increment it. Let me check...
        // The existing booking was created directly, not through the route
        // So totalBookings should be 0
        expect(hotel === null || hotel === void 0 ? void 0 : hotel.totalBookings).toBe(0);
    }));
    it('should maintain consistency between booking and counters', () => __awaiter(void 0, void 0, void 0, function* () {
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 3);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 4);
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Single Room',
                    type: 'standard',
                    pricePerNight: 2000,
                    minOccupancy: 1,
                    maxOccupancy: 2
                }],
            paymentMethod: 'card'
        };
        // Create a successful booking
        const response = yield (0, supertest_1.default)(app)
            .post(`/api/hotels/${testHotel._id}/bookings`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(bookingPayload);
        expect(response.status).toBe(201);
        // Verify all counters are consistent
        const bookings = yield booking_1.default.find({ hotelId: testHotel._id });
        const hotel = yield hotel_1.default.findById(testHotel._id);
        const user = yield user_1.default.findById(userId);
        // Hotel totalBookings should equal the count of confirmed/pending bookings
        expect(hotel === null || hotel === void 0 ? void 0 : hotel.totalBookings).toBe(bookings.length);
        // User totalBookings should also match
        expect(user === null || user === void 0 ? void 0 : user.totalBookings).toBe(bookings.length);
    }));
    it('should prevent orphaned bookings on concurrent requests', () => __awaiter(void 0, void 0, void 0, function* () {
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 5);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 6);
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Single Room',
                    type: 'standard',
                    pricePerNight: 2000,
                    minOccupancy: 1,
                    maxOccupancy: 2
                }],
            paymentMethod: 'card'
        };
        // Fire multiple requests simultaneously
        const requests = Array(10).fill(null).map(() => (0, supertest_1.default)(app)
            .post(`/api/hotels/${testHotel._id}/bookings`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(bookingPayload));
        yield Promise.all(requests);
        // Verify no orphaned bookings
        // All counts should be consistent
        const bookings = yield booking_1.default.find({ hotelId: testHotel._id });
        const hotel = yield hotel_1.default.findById(testHotel._id);
        const user = yield user_1.default.findById(userId);
        // Exactly one booking should exist
        expect(bookings.length).toBe(1);
        // Counter should match booking count
        expect(hotel === null || hotel === void 0 ? void 0 : hotel.totalBookings).toBe(bookings.length);
        expect(user === null || user === void 0 ? void 0 : user.totalBookings).toBe(bookings.length);
    }));
    it('should handle invalid hotel ID gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeHotelId = new mongoose_1.default.Types.ObjectId();
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: new Date().toISOString(),
            checkOut: new Date(Date.now() + 86400000).toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [],
            paymentMethod: 'card'
        };
        const response = yield (0, supertest_1.default)(app)
            .post(`/api/hotels/${fakeHotelId}/bookings`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(bookingPayload);
        expect(response.status).toBe(404);
        expect(response.body.message).toContain('Hotel not found');
    }));
    it('should handle past check-in dates', () => __awaiter(void 0, void 0, void 0, function* () {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: pastDate.toISOString(),
            checkOut: new Date().toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Single Room',
                    type: 'standard',
                    pricePerNight: 2000,
                    minOccupancy: 1,
                    maxOccupancy: 2
                }],
            paymentMethod: 'card'
        };
        const response = yield (0, supertest_1.default)(app)
            .post(`/api/hotels/${testHotel._id}/bookings`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(bookingPayload);
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('past');
    }));
    it('should handle check-out before check-in', () => __awaiter(void 0, void 0, void 0, function* () {
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 7);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 6); // Before check-in
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Single Room',
                    type: 'standard',
                    pricePerNight: 2000,
                    minOccupancy: 1,
                    maxOccupancy: 2
                }],
            paymentMethod: 'card'
        };
        const response = yield (0, supertest_1.default)(app)
            .post(`/api/hotels/${testHotel._id}/bookings`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(bookingPayload);
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('after');
    }));
});

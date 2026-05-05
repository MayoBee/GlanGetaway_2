"use strict";
/**
 * Timezone Safety Tests
 * Tests timezone-aware date handling and validation
 */
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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bootstrap_1 = require("../../bootstrap");
const user_1 = __importDefault(require("../../domains/identity/models/user"));
const hotel_1 = __importDefault(require("../../domains/hotel/models/hotel"));
const timezoneUtils_1 = require("../../utils/timezoneUtils");
describe('Timezone Safety', () => {
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
            email: `timezone-test-${Date.now()}@example.com`,
            password: hashedPassword,
            firstName: 'Test',
            lastName: 'User',
            role: 'user'
        });
        yield user.save();
        userId = user._id.toString();
        // Generate auth token
        authToken = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET_KEY || 'test-secret-key', { expiresIn: '7d' });
        // Create test hotel
        testHotel = new hotel_1.default({
            userId: userId,
            name: 'Timezone Test Resort',
            city: 'Test City',
            country: 'Philippines',
            description: 'A resort for timezone testing',
            type: ['Beach Resort'],
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
                    name: 'Timezone Room',
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
        // Clear any existing bookings
        if (testHotel && testHotel._id) {
            const Booking = mongoose_1.default.model('Booking');
            yield Booking.deleteMany({ hotelId: testHotel._id });
        }
    }));
    it('should handle booking requests with different timezones correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        // Test with Manila timezone
        const manilaCheckIn = new Date();
        manilaCheckIn.setDate(manilaCheckIn.getDate() + 1);
        const manilaCheckOut = new Date();
        manilaCheckOut.setDate(manilaCheckOut.getDate() + 2);
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: manilaCheckIn.toISOString(),
            checkOut: manilaCheckOut.toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Timezone Room',
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
            .set('X-Timezone', 'Asia/Manila')
            .send(bookingPayload);
        expect(response.status).toBe(201);
        expect(response.body.message).toContain('created successfully');
    }));
    it('should reject bookings with past dates in different timezones', () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a date that's in the past in Manila timezone
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
                    name: 'Timezone Room',
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
            .set('X-Timezone', 'Asia/Manila')
            .send(bookingPayload);
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('past');
        expect(response.body.timezone).toBeDefined();
        expect(response.body.clientTimezone).toBe('Asia/Manila');
    }));
    it('should handle invalid timezone gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: futureDate.toISOString(),
            checkOut: new Date(futureDate.getTime() + 86400000).toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Timezone Room',
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
            .set('X-Timezone', 'Invalid/Timezone')
            .send(bookingPayload);
        // Should fall back to default timezone and succeed
        expect(response.status).toBe(201);
    }));
    it('should prevent bookings too far in the future', () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a date more than 1 year in the future
        const farFutureDate = new Date();
        farFutureDate.setFullYear(farFutureDate.getFullYear() + 2);
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: farFutureDate.toISOString(),
            checkOut: new Date(farFutureDate.getTime() + 86400000).toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Timezone Room',
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
        expect(response.body.message).toContain('year');
    }));
    it('should validate date formats correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: 'invalid-date-format',
            checkOut: new Date().toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Timezone Room',
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
        expect(response.body.message).toContain('validation failed');
    }));
    it('should handle timezone edge cases correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        // Test booking across midnight boundary
        const tonight = new Date();
        tonight.setHours(23, 30, 0, 0); // 11:30 PM
        const tomorrowMorning = new Date(tonight);
        tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
        tomorrowMorning.setHours(1, 30, 0, 0); // 1:30 AM next day
        const bookingPayload = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            adultCount: 1,
            childCount: 0,
            checkIn: tonight.toISOString(),
            checkOut: tomorrowMorning.toISOString(),
            totalCost: 2000,
            basePrice: 2000,
            selectedRooms: [{
                    id: testHotel.rooms[0].id,
                    name: 'Timezone Room',
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
            .set('X-Timezone', 'Asia/Manila')
            .send(bookingPayload);
        // Should handle the midnight crossing correctly
        expect([201, 400]).toContain(response.status);
    }));
});
// Unit tests for TimezoneManager
describe('TimezoneManager Unit Tests', () => {
    it('should validate supported timezones', () => {
        expect(timezoneUtils_1.TimezoneManager.isValidTimezone('Asia/Manila')).toBe(true);
        expect(timezoneUtils_1.TimezoneManager.isValidTimezone('UTC')).toBe(true);
        expect(timezoneUtils_1.TimezoneManager.isValidTimezone('Invalid/Timezone')).toBe(false);
    });
    it('should parse dates correctly', () => {
        const dateString = '2024-12-25T10:00:00.000Z';
        const parsed = timezoneUtils_1.TimezoneManager.parseDate(dateString, 'Asia/Manila');
        expect(parsed.isValid).toBe(true);
        expect(parsed.year).toBe(2024);
        expect(parsed.month).toBe(12);
        expect(parsed.day).toBe(25);
    });
    it('should validate booking dates correctly', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const validation = timezoneUtils_1.TimezoneManager.validateBookingDates(tomorrow.toISOString(), dayAfter.toISOString(), 'Asia/Manila');
        expect(validation.isValid).toBe(true);
        expect(validation.normalizedDates).toBeDefined();
    });
    it('should reject invalid booking dates', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const today = new Date();
        const validation = timezoneUtils_1.TimezoneManager.validateBookingDates(yesterday.toISOString(), today.toISOString(), 'Asia/Manila');
        expect(validation.isValid).toBe(false);
        expect(validation.error).toContain('past');
    });
    it('should get timezone information', () => {
        const info = timezoneUtils_1.TimezoneManager.getTimezoneInfo('Asia/Manila');
        expect(info.timezone).toBe('Asia/Manila');
        expect(typeof info.offset).toBe('number');
        expect(typeof info.isDST).toBe('boolean');
    });
    it('should format dates correctly', () => {
        const dateString = '2024-12-25T10:00:00.000Z';
        const formatted = timezoneUtils_1.TimezoneManager.formatDate(dateString, 'Asia/Manila', 'yyyy-MM-dd');
        expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

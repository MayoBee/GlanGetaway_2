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
// Test suite for GCash security testing
// This verifies duplicate reference numbers are rejected and payment security works
describe('GCash Security', () => {
    let app;
    let testHotel;
    let authToken;
    let ownerToken;
    let userId;
    let ownerId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Increase timeout for test setup
        jest.setTimeout(30000);
        app = (0, bootstrap_1.createAndConfigureApp)();
        // Create test user (booker)
        const hashedPassword = yield bcryptjs_1.default.hash('testpassword123', 12);
        const user = new user_1.default({
            email: `test-user-${Date.now()}@example.com`,
            password: hashedPassword,
            firstName: 'Test',
            lastName: 'User',
            role: 'user'
        });
        yield user.save();
        userId = user._id.toString();
        // Create test user (resort owner)
        const owner = new user_1.default({
            email: `test-owner-${Date.now()}@example.com`,
            password: hashedPassword,
            firstName: 'Owner',
            lastName: 'User',
            role: 'resort_owner'
        });
        yield owner.save();
        ownerId = owner._id.toString();
        // Generate auth tokens
        authToken = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET_KEY || 'test-secret-key', { expiresIn: '7d' });
        ownerToken = jsonwebtoken_1.default.sign({ userId: owner._id, email: owner.email, role: owner.role }, process.env.JWT_SECRET_KEY || 'test-secret-key', { expiresIn: '7d' });
        // Create test hotel owned by owner
        testHotel = new hotel_1.default({
            userId: ownerId,
            name: 'Test GCash Resort',
            city: 'Glan',
            country: 'Philippines',
            description: 'Test resort for GCash security testing',
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
            gcashNumber: '09171234567',
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
            if (userId || ownerId) {
                yield user_1.default.deleteMany({ $or: [{ _id: userId }, { _id: ownerId }] });
            }
        }
        catch (error) {
            console.log('Cleanup error:', error);
        }
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clear bookings before each test
        if (testHotel && testHotel._id) {
            yield booking_1.default.deleteMany({ hotelId: testHotel._id });
        }
    }));
    it('should reject duplicate GCash reference numbers', () => __awaiter(void 0, void 0, void 0, function* () {
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 1);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 2);
        // Create first booking with GCash payment
        const booking1 = new booking_1.default({
            userId,
            hotelId: testHotel._id,
            firstName: 'Test',
            lastName: 'User',
            email: `test-user-${Date.now()}@example.com`,
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
            paymentMethod: 'gcash',
            status: 'pending',
            paymentStatus: 'pending',
            gcashPayment: {
                gcashNumber: '09171234567',
                referenceNumber: 'REF-123456789',
                amountPaid: 1000,
                paymentTime: new Date(),
                status: 'pending'
            },
            changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
            canModify: true
        });
        yield booking1.save();
        // Verify first booking (should succeed)
        const verifyResponse1 = yield (0, supertest_1.default)(app)
            .patch(`/api/bookings/${booking1._id}/gcash/verify`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'verified' });
        expect(verifyResponse1.status).toBe(200);
        expect(verifyResponse1.body.message).toContain('verified');
        // Create second booking with SAME reference number
        const booking2 = new booking_1.default({
            userId,
            hotelId: testHotel._id,
            firstName: 'Test',
            lastName: 'User',
            email: `test-user-${Date.now()}@example.com`,
            adultCount: 1,
            childCount: 0,
            checkIn: new Date(checkOut.getTime() + 86400000),
            checkOut: new Date(checkOut.getTime() + 2 * 86400000),
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
            paymentMethod: 'gcash',
            status: 'pending',
            paymentStatus: 'pending',
            gcashPayment: {
                gcashNumber: '09171234567',
                referenceNumber: 'REF-123456789',
                amountPaid: 1000,
                paymentTime: new Date(),
                status: 'pending'
            },
            changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
            canModify: true
        });
        yield booking2.save();
        // Try to verify second booking with duplicate reference (should fail)
        const verifyResponse2 = yield (0, supertest_1.default)(app)
            .patch(`/api/bookings/${booking2._id}/gcash/verify`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'verified' });
        expect(verifyResponse2.status).toBe(400);
        expect(verifyResponse2.body.message).toContain('already been used');
    }));
    it('should allow same reference number for rejected payments', () => __awaiter(void 0, void 0, void 0, function* () {
        // A rejected payment's reference number should be allowed to be reused
        // because the payment was never actually completed
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 3);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 4);
        // Create first booking and reject it
        const booking1 = new booking_1.default({
            userId,
            hotelId: testHotel._id,
            firstName: 'Test',
            lastName: 'User',
            email: `test-user-${Date.now()}@example.com`,
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
            paymentMethod: 'gcash',
            status: 'cancelled',
            paymentStatus: 'failed',
            gcashPayment: {
                gcashNumber: '09171234567',
                referenceNumber: 'REF-REJECTED-001',
                amountPaid: 1000,
                paymentTime: new Date(),
                status: 'rejected'
            },
            changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
            canModify: true,
            cancellationReason: 'GCash payment rejected'
        });
        yield booking1.save();
        // Create second booking with same reference number (rejected one)
        const booking2 = new booking_1.default({
            userId,
            hotelId: testHotel._id,
            firstName: 'Test',
            lastName: 'User',
            email: `test-user-${Date.now()}@example.com`,
            adultCount: 1,
            childCount: 0,
            checkIn: new Date(checkOut.getTime() + 86400000),
            checkOut: new Date(checkOut.getTime() + 2 * 86400000),
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
            paymentMethod: 'gcash',
            status: 'pending',
            paymentStatus: 'pending',
            gcashPayment: {
                gcashNumber: '09171234567',
                referenceNumber: 'REF-REJECTED-001',
                amountPaid: 1000,
                paymentTime: new Date(),
                status: 'pending'
            },
            changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
            canModify: true
        });
        yield booking2.save();
        // Try to verify second booking - should succeed since first was rejected
        const verifyResponse = yield (0, supertest_1.default)(app)
            .patch(`/api/bookings/${booking2._id}/gcash/verify`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'verified' });
        // This test documents expected behavior: rejected references MAY be reused
        // The system should track this based on business requirements
        expect(verifyResponse.status).toBe(200);
    }));
    it('should handle GCash verification for non-existent booking', () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeBookingId = new mongoose_1.default.Types.ObjectId();
        const response = yield (0, supertest_1.default)(app)
            .patch(`/api/bookings/${fakeBookingId}/gcash/verify`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'verified' });
        expect(response.status).toBe(404);
        expect(response.body.message).toContain('Booking not found');
    }));
    it('should reject GCash verification for non-GCash bookings', () => __awaiter(void 0, void 0, void 0, function* () {
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 5);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 6);
        // Create card payment booking
        const booking = new booking_1.default({
            userId,
            hotelId: testHotel._id,
            firstName: 'Test',
            lastName: 'User',
            email: `test-user-${Date.now()}@example.com`,
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
        yield booking.save();
        const response = yield (0, supertest_1.default)(app)
            .patch(`/api/bookings/${booking._id}/gcash/verify`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'verified' });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('not a GCash booking');
    }));
});

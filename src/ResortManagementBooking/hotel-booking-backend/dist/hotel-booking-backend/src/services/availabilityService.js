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
exports.createAtomicBooking = exports.checkAvailability = void 0;
const booking_1 = __importDefault(require("../models/booking"));
const checkAvailability = (hotelId, checkIn, checkOut, roomIds, cottageIds) => __awaiter(void 0, void 0, void 0, function* () {
    // Build database query with all filtering at query level
    const query = {
        hotelId,
        status: { $in: ['confirmed', 'pending'] },
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn }
    };
    // Add room/cottage filters directly in MongoDB query
    const matchConditions = [];
    if (roomIds && roomIds.length > 0) {
        matchConditions.push({
            'selectedRooms.id': { $in: roomIds }
        });
    }
    if (cottageIds && cottageIds.length > 0) {
        matchConditions.push({
            'selectedCottages.id': { $in: cottageIds }
        });
    }
    if (matchConditions.length > 0) {
        query.$or = matchConditions;
    }
    // Only fetch required fields with projection
    const conflicts = yield booking_1.default.find(query)
        .select('selectedRooms selectedCottages checkIn checkOut status guestName')
        .lean();
    return {
        available: conflicts.length === 0,
        conflicts
    };
});
exports.checkAvailability = checkAvailability;
/**
 * ATOMIC BOOKING SERVICE
 *
 * This function performs an atomic booking operation to prevent race conditions.
 * Instead of "check-then-book" (two separate operations), it uses MongoDB's
 * findOneAndUpdate with $and operator to ensure the booking is only created
 * if the rooms/cottages are still available at the moment of insertion.
 *
 * Logic: Insert booking ONLY IF no conflicting booking exists for the same
 * hotel, dates, and room/cottage IDs with status 'confirmed' or 'pending'.
 */
const createAtomicBooking = (bookingData, options) => __awaiter(void 0, void 0, void 0, function* () {
    const session = options === null || options === void 0 ? void 0 : options.session;
    const { hotelId, checkIn, checkOut, selectedRooms, selectedCottages } = bookingData;
    // Extract room and cottage IDs
    const roomIds = (selectedRooms === null || selectedRooms === void 0 ? void 0 : selectedRooms.map((room) => room.id)) || [];
    const cottageIds = (selectedCottages === null || selectedCottages === void 0 ? void 0 : selectedCottages.map((cottage) => cottage.id)) || [];
    // Skip conflict detection for entrance fee-only bookings (no accommodations selected)
    if (roomIds.length === 0 && cottageIds.length === 0) {
        // This is an entrance fee-only booking, no accommodation conflicts possible
        const booking = new booking_1.default(bookingData);
        if (session) {
            yield booking.save({ session });
        }
        else {
            yield booking.save();
        }
        return { success: true, booking };
    }
    // Build the conflict detection query for accommodation bookings
    const conflictQuery = {
        hotelId,
        status: { $in: ['confirmed', 'pending'] },
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) }
    };
    // Add room/cottage conflict conditions
    const conflictConditions = [];
    if (roomIds.length > 0) {
        conflictConditions.push({
            'selectedRooms.id': { $in: roomIds }
        });
    }
    if (cottageIds.length > 0) {
        conflictConditions.push({
            'selectedCottages.id': { $in: cottageIds }
        });
    }
    if (conflictConditions.length > 0) {
        conflictQuery.$or = conflictConditions;
    }
    try {
        // Use findOneAndUpdate with $and to atomically check and create
        // The $and ensures no conflicting booking exists before insertion
        const result = yield booking_1.default.findOneAndUpdate({
            $and: [
                { _id: { $exists: false } },
                { $nor: [conflictQuery] } // NOR ensures no conflicting booking exists
            ]
        }, bookingData, {
            new: true,
            upsert: true,
            runValidators: true,
            session: session
        });
        if (result) {
            return { success: true, booking: result };
        }
        else {
            // This shouldn't happen with upsert, but handle it
            const booking = new booking_1.default(bookingData);
            if (session) {
                yield booking.save({ session });
            }
            else {
                yield booking.save();
            }
            return { success: true, booking };
        }
    }
    catch (error) {
        // Check for duplicate key error (MongoDB code 11000)
        if (error instanceof Error && error.code === 11000) {
            return {
                success: false,
                error: 'The selected rooms or cottages are no longer available. Please try different dates or accommodations.'
            };
        }
        // Check for write conflict (MongoDB code 112)
        if (error instanceof Error && error.code === 112) {
            return {
                success: false,
                error: 'A booking conflict occurred. Please try again.'
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An error occurred while creating the booking'
        };
    }
});
exports.createAtomicBooking = createAtomicBooking;

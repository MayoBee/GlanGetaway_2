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
exports.checkAvailability = void 0;
const booking_1 = __importDefault(require("../models/booking"));
const checkAvailability = (hotelId, checkIn, checkOut, roomIds, cottageIds) => __awaiter(void 0, void 0, void 0, function* () {
    // Query for overlapping confirmed/pending bookings
    const overlappingBookings = yield booking_1.default.find({
        hotelId,
        status: { $in: ['confirmed', 'pending'] },
        $or: [
            {
                checkIn: { $lt: checkOut },
                checkOut: { $gt: checkIn }
            }
        ]
    });
    const conflicts = [];
    // Check for room conflicts
    if (roomIds && roomIds.length > 0) {
        for (const booking of overlappingBookings) {
            if (booking.selectedRooms) {
                const bookingRoomIds = booking.selectedRooms.map(room => room.id);
                const hasConflict = roomIds.some(roomId => bookingRoomIds.includes(roomId));
                if (hasConflict && !conflicts.includes(booking)) {
                    conflicts.push(booking);
                }
            }
        }
    }
    // Check for cottage conflicts
    if (cottageIds && cottageIds.length > 0) {
        for (const booking of overlappingBookings) {
            if (booking.selectedCottages) {
                const bookingCottageIds = booking.selectedCottages.map(cottage => cottage.id);
                const hasConflict = cottageIds.some(cottageId => bookingCottageIds.includes(cottageId));
                if (hasConflict && !conflicts.includes(booking)) {
                    conflicts.push(booking);
                }
            }
        }
    }
    return {
        available: conflicts.length === 0,
        conflicts
    };
});
exports.checkAvailability = checkAvailability;

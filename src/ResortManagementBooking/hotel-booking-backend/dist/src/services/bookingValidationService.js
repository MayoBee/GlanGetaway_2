"use strict";
/**
 * Booking Validation Service
 *
 * Centralized service for booking-related validation logic including
 * the 8-hour modification window enforcement.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBookingDates = exports.calculateModificationDeadline = exports.checkAndUpdateBookingStatus = exports.canModifyBooking = void 0;
/**
 * Check if a booking can be modified based on the 8-hour window rule.
 *
 * Business Rule: Users can only modify bookings within 8 hours of creation.
 * After 8 hours, the booking is automatically confirmed and cannot be modified
 * without contacting the resort directly.
 *
 * @param booking - The booking document to check
 * @returns ModificationCheckResult with canModify flag and reason if not allowed
 */
const canModifyBooking = (booking) => {
    const now = new Date();
    // If booking is not pending, it cannot be modified
    if (booking.status !== "pending") {
        return {
            canModify: false,
            reason: "Cannot modify booking. Booking is no longer pending.",
            changeWindowDeadline: booking.changeWindowDeadline,
            currentTime: now
        };
    }
    // If no change window deadline is set, assume it can be modified
    if (!booking.changeWindowDeadline) {
        return { canModify: true };
    }
    // Check if the 8-hour window has expired
    if (now > booking.changeWindowDeadline) {
        return {
            canModify: false,
            reason: "Cannot modify booking after 8-hour window. The change window has expired.",
            changeWindowDeadline: booking.changeWindowDeadline,
            currentTime: now
        };
    }
    // If canModify flag is explicitly set to false, respect it
    if (booking.canModify === false) {
        return {
            canModify: false,
            reason: "This booking has been locked from modification.",
            changeWindowDeadline: booking.changeWindowDeadline,
            currentTime: now
        };
    }
    return { canModify: true };
};
exports.canModifyBooking = canModifyBooking;
/**
 * Check and update booking status based on the 8-hour window.
 *
 * This function automatically confirms pending bookings after the 8-hour
 * window has passed, ensuring that bookings are not left in a pending state
 * indefinitely.
 *
 * @param booking - The booking document to check and potentially update
 * @returns Promise<void> - The booking is modified in place
 */
const checkAndUpdateBookingStatus = (booking) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    // If booking is still pending and 8-hour window has passed, auto-confirm
    if (booking.status === "pending" && booking.changeWindowDeadline && now > booking.changeWindowDeadline) {
        booking.status = "confirmed";
        booking.canModify = false;
        yield booking.save();
    }
});
exports.checkAndUpdateBookingStatus = checkAndUpdateBookingStatus;
/**
 * Calculate the 8-hour modification window deadline from a given timestamp.
 *
 * @param timestamp - The base timestamp (usually booking creation time)
 * @returns Date - The deadline for modifications (8 hours after the timestamp)
 */
const calculateModificationDeadline = (timestamp = new Date()) => {
    return new Date(timestamp.getTime() + 8 * 60 * 60 * 1000); // 8 hours in milliseconds
};
exports.calculateModificationDeadline = calculateModificationDeadline;
/**
 * Validate that check-in and check-out dates are valid.
 *
 * Business Rules:
 * - Check-in date cannot be in the past
 * - Check-out date must be after check-in date
 *
 * @param checkIn - The check-in date
 * @param checkOut - The check-out date
 * @returns Object with isValid flag and error message if invalid
 */
const validateBookingDates = (checkIn, checkOut) => {
    const now = new Date();
    // Set to start of day for fair comparison
    now.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    // Validate checkIn is not in the past
    if (checkInDate < now) {
        return {
            isValid: false,
            error: "Check-in date cannot be in the past"
        };
    }
    // Validate checkOut is after checkIn
    if (checkOutDate <= checkInDate) {
        return {
            isValid: false,
            error: "Check-out date must be after check-in date"
        };
    }
    return { isValid: true };
};
exports.validateBookingDates = validateBookingDates;

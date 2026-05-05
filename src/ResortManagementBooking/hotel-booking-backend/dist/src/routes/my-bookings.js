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
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("../middleware/auth"));
const hotel_1 = __importDefault(require("../models/hotel"));
const booking_1 = __importDefault(require("../models/booking"));
const router = express_1.default.Router();
// /api/my-bookings
router.get("/", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // First, get all bookings for this user
        const bookings = yield booking_1.default.find({ userId: new mongoose_1.default.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean();
        if (!bookings || bookings.length === 0) {
            return res.status(200).json([]);
        }
        // Group bookings by hotelId
        const hotelBookingsMap = new Map();
        for (const booking of bookings) {
            const hotelId = (_a = booking.hotelId) === null || _a === void 0 ? void 0 : _a.toString();
            if (!hotelId)
                continue;
            if (!hotelBookingsMap.has(hotelId)) {
                // Fetch hotel info
                const hotel = yield hotel_1.default.findById(hotelId).lean();
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
        res.status(200).send(results);
    }
    catch (error) {
        console.log("Error fetching bookings:", error);
        res.status(500).json({ message: "Unable to fetch bookings" });
    }
}));
// DELETE /api/my-bookings/:bookingId
router.delete("/:bookingId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { bookingId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Find the booking
        const booking = yield booking_1.default.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Check if the booking belongs to the user
        if (booking.userId.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own bookings" });
        }
        // Check if the booking is confirmed by resort owner or cancelled
        if (booking.status !== "confirmed" && booking.status !== "cancelled") {
            return res.status(400).json({
                message: "You can only delete bookings that have been confirmed by the resort owner or have been cancelled"
            });
        }
        // Delete the booking
        yield booking_1.default.findByIdAndDelete(bookingId);
        res.status(200).json({ message: "Booking deleted successfully" });
    }
    catch (error) {
        console.log("Error deleting booking:", error);
        res.status(500).json({ message: "Unable to delete booking" });
    }
}));
// PUT /api/my-bookings/:bookingId
router.put("/:bookingId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { bookingId } = req.params;
        const updateData = req.body;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Find the booking
        const booking = yield booking_1.default.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Check if the booking belongs to the user
        if (booking.userId.toString() !== userId) {
            return res.status(403).json({ message: "You can only update your own bookings" });
        }
        // Check if the booking is still pending (can only edit pending bookings)
        if (booking.status !== "pending") {
            return res.status(400).json({
                message: "You can only edit bookings that are still pending confirmation"
            });
        }
        // Check 8-hour window for modifications
        const bookingTime = new Date(booking.createdAt || booking.checkIn);
        const currentTime = new Date();
        const hoursSinceBooking = (currentTime.getTime() - bookingTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceBooking > 8) {
            return res.status(400).json({
                message: "Booking modifications are only allowed within 8 hours of making the reservation"
            });
        }
        // Update the booking with new data
        const updatedBooking = yield booking_1.default.findByIdAndUpdate(bookingId, Object.assign(Object.assign({}, updateData), { updatedAt: new Date() }), { new: true, runValidators: true });
        res.status(200).json(updatedBooking);
    }
    catch (error) {
        console.log("Error updating booking:", error);
        res.status(500).json({ message: "Unable to update booking" });
    }
}));
exports.default = router;

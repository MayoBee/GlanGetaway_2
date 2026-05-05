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
const booking_1 = __importDefault(require("../models/booking"));
const hotel_1 = __importDefault(require("../models/hotel"));
const user_1 = __importDefault(require("../models/user"));
const auth_1 = __importDefault(require("../middleware/auth"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Function to check and update booking status based on 8-hour window
function checkAndUpdateBookingStatus(booking) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        // If booking is still pending and 8-hour window has passed, auto-confirm
        if (booking.status === "pending" && booking.changeWindowDeadline && now > booking.changeWindowDeadline) {
            booking.status = "confirmed";
            booking.canModify = false;
            yield booking.save();
            console.log(`Booking ${booking._id} automatically confirmed after 8-hour window`);
        }
    });
}
// Function to check if booking can be modified
function canModifyBooking(booking) {
    const now = new Date();
    // Cannot modify cancelled or completed bookings
    if (booking.status === "cancelled" || booking.status === "completed") {
        return { canModify: false, reason: "Cannot modify a cancelled or completed booking" };
    }
    // Check if within 8-hour change window
    if (!booking.canModify || (booking.changeWindowDeadline && now > booking.changeWindowDeadline)) {
        return {
            canModify: false,
            reason: "Cannot modify booking after 8-hour window. The change window has expired.",
            changeWindowDeadline: booking.changeWindowDeadline,
            currentTime: now
        };
    }
    return { canModify: true };
}
// Get all bookings (admin only)
router.get("/", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verify admin status
        const user = yield user_1.default.findById(req.userId);
        const isAdmin = user && ["admin", "superAdmin"].includes(user.role);
        if (!isAdmin) {
            return res.status(403).json({ message: "Access denied. Only admins can view all bookings." });
        }
        const bookings = yield booking_1.default.find()
            .sort({ createdAt: -1 })
            .populate("hotelId", "name city country");
        res.status(200).json(bookings);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to fetch bookings" });
    }
}));
// Get bookings by hotel ID (for hotel owners)
router.get("/hotel/:hotelId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.params;
        // Verify the hotel belongs to the authenticated user
        const hotel = yield hotel_1.default.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        if (hotel.userId !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        const bookings = yield booking_1.default.find({ hotelId })
            .sort({ createdAt: -1 })
            .populate("userId", "firstName lastName email");
        res.status(200).json(bookings);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to fetch hotel bookings" });
    }
}));
// Get booking by ID
router.get("/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield booking_1.default.findById(req.params.id).populate("hotelId", "name city country imageUrls userId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Check user ownership, hotel ownership, or admin status
        const user = yield user_1.default.findById(req.userId);
        const isOwner = booking.userId.toString() === req.userId;
        const isHotelOwner = booking.hotelId && booking.hotelId.userId === req.userId;
        const isAdmin = user && ["admin", "superAdmin"].includes(user.role);
        if (!isOwner && !isHotelOwner && !isAdmin) {
            return res.status(403).json({ message: "Access denied" });
        }
        // Check and update booking status based on 8-hour window
        yield checkAndUpdateBookingStatus(booking);
        res.status(200).json(booking);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to fetch booking" });
    }
}));
// Update booking status
router.patch("/:id/status", auth_1.default, [
    (0, express_validator_1.body)("status")
        .isIn(["pending", "confirmed", "cancelled", "completed", "refunded"])
        .withMessage("Invalid status"),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: ((_a = errors.array()[0]) === null || _a === void 0 ? void 0 : _a.msg) || "Validation error" });
    }
    try {
        const { status, cancellationReason } = req.body;
        const booking = yield booking_1.default.findById(req.params.id).populate('hotelId', 'userId');
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Check user ownership, hotel ownership, or admin status
        const user = yield user_1.default.findById(req.userId);
        const isOwner = booking.userId.toString() === req.userId;
        const isHotelOwner = booking.hotelId && booking.hotelId.userId === req.userId;
        const isAdmin = user && ["admin", "superAdmin"].includes(user.role);
        if (!isOwner && !isHotelOwner && !isAdmin) {
            return res.status(403).json({ message: "Access denied" });
        }
        const updateData = { status };
        if (status === "cancelled" && cancellationReason) {
            updateData.cancellationReason = cancellationReason;
        }
        if (status === "refunded") {
            updateData.refundAmount = req.body.refundAmount || 0;
        }
        // Apply updates
        Object.assign(booking, updateData);
        yield booking.save();
        res.status(200).json(booking);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to update booking" });
    }
}));
// Update payment status
router.patch("/:id/payment", auth_1.default, [
    (0, express_validator_1.body)("paymentStatus")
        .isIn(["pending", "paid", "failed", "refunded"])
        .withMessage("Invalid payment status"),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: ((_b = errors.array()[0]) === null || _b === void 0 ? void 0 : _b.msg) || "Validation error" });
    }
    try {
        const { paymentStatus, paymentMethod } = req.body;
        const booking = yield booking_1.default.findById(req.params.id).populate('hotelId', 'userId');
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Check user ownership, hotel ownership, or admin status
        const user = yield user_1.default.findById(req.userId);
        const isOwner = booking.userId.toString() === req.userId;
        const isHotelOwner = booking.hotelId && booking.hotelId.userId === req.userId;
        const isAdmin = user && ["admin", "superAdmin"].includes(user.role);
        if (!isOwner && !isHotelOwner && !isAdmin) {
            return res.status(403).json({ message: "Access denied" });
        }
        const updateData = { paymentStatus };
        if (paymentMethod) {
            updateData.paymentMethod = paymentMethod;
        }
        // Apply updates
        Object.assign(booking, updateData);
        yield booking.save();
        res.status(200).json(booking);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to update payment status" });
    }
}));
// Delete booking (admin only)
router.delete("/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield booking_1.default.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Verify admin status
        const user = yield user_1.default.findById(req.userId);
        const isAdmin = user && ["admin", "superAdmin"].includes(user.role);
        if (!isAdmin) {
            return res.status(403).json({ message: "Access denied. Only admins can delete bookings." });
        }
        // Update hotel analytics
        yield hotel_1.default.findByIdAndUpdate(booking.hotelId, {
            $inc: {
                totalBookings: -1,
                totalRevenue: -(booking.totalCost || 0),
            },
        });
        // Update user analytics
        yield user_1.default.findByIdAndUpdate(booking.userId, {
            $inc: {
                totalBookings: -1,
                totalSpent: -(booking.totalCost || 0),
            },
        });
        res.status(200).json({ message: "Booking deleted successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to delete booking" });
    }
}));
// Verify booking by resort owner
router.patch("/:id/verify-by-owner", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { verified, verificationNote } = req.body;
        // Find the booking
        const booking = yield booking_1.default.findById(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Get the hotel to check ownership
        const hotel = yield hotel_1.default.findById(booking.hotelId);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        // Check if the user is the resort owner
        if (hotel.userId !== req.userId) {
            return res.status(403).json({ message: "Access denied. Only the resort owner can verify bookings." });
        }
        // Update the booking verification status
        booking.verifiedByOwner = verified;
        booking.ownerVerificationNote = verificationNote || (verified ? "Verified by resort owner" : "Verification rejected");
        booking.ownerVerifiedAt = verified ? new Date() : undefined;
        yield booking.save();
        res.status(200).json({
            message: verified ? "Booking verified successfully" : "Booking verification rejected",
            booking
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to verify booking" });
    }
}));
// User edit booking - Reschedule booking (change dates)
router.patch("/:id/reschedule", auth_1.default, [
    (0, express_validator_1.body)("checkIn").isISO8601().toDate().withMessage("Valid check-in date is required"),
    (0, express_validator_1.body)("checkOut").isISO8601().toDate().withMessage("Valid check-out date is required"),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: ((_c = errors.array()[0]) === null || _c === void 0 ? void 0 : _c.msg) || "Validation error" });
    }
    try {
        const { id } = req.params;
        const { checkIn, checkOut, reason } = req.body;
        // Find the booking
        const booking = yield booking_1.default.findById(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Check if the user owns this booking
        if (booking.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        // Check and update booking status based on 8-hour window
        yield checkAndUpdateBookingStatus(booking);
        // Check if booking can be modified using the new logic
        const modificationCheck = canModifyBooking(booking);
        if (!modificationCheck.canModify) {
            return res.status(400).json({
                message: modificationCheck.reason,
                changeWindowDeadline: modificationCheck.changeWindowDeadline,
                currentTime: modificationCheck.currentTime
            });
        }
        // Store old dates for history
        const oldCheckIn = booking.checkIn;
        const oldCheckOut = booking.checkOut;
        // Update the booking with new dates
        booking.checkIn = new Date(checkIn);
        booking.checkOut = new Date(checkOut);
        booking.rescheduleHistory = booking.rescheduleHistory || [];
        booking.rescheduleHistory.push({
            oldCheckIn,
            oldCheckOut,
            newCheckIn: new Date(checkIn),
            newCheckOut: new Date(checkOut),
            reason: reason || "User requested reschedule",
            requestedAt: new Date(),
            status: "approved" // Auto-approved for now
        });
        yield booking.save();
        res.status(200).json({
            message: "Booking rescheduled successfully",
            booking
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to reschedule booking" });
    }
}));
// User add rooms/amenities to existing booking
router.patch("/:id/add-items", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { selectedRooms, selectedCottages, selectedAmenities, additionalAmount } = req.body;
        // Find the booking
        const booking = yield booking_1.default.findById(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Check if the user owns this booking
        if (booking.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        // Check and update booking status based on 8-hour window
        yield checkAndUpdateBookingStatus(booking);
        // Check if booking can be modified using the new logic
        const modificationCheck = canModifyBooking(booking);
        if (!modificationCheck.canModify) {
            return res.status(400).json({
                message: modificationCheck.reason,
                changeWindowDeadline: modificationCheck.changeWindowDeadline,
                currentTime: modificationCheck.currentTime
            });
        }
        // Add new rooms if provided
        if (selectedRooms && selectedRooms.length > 0) {
            booking.selectedRooms = [
                ...(booking.selectedRooms || []),
                ...selectedRooms
            ];
        }
        // Add new cottages if provided
        if (selectedCottages && selectedCottages.length > 0) {
            booking.selectedCottages = [
                ...(booking.selectedCottages || []),
                ...selectedCottages
            ];
        }
        // Add new amenities if provided
        if (selectedAmenities && selectedAmenities.length > 0) {
            booking.selectedAmenities = [
                ...(booking.selectedAmenities || []),
                ...selectedAmenities
            ];
        }
        // Update total cost
        if (additionalAmount) {
            booking.totalCost = (booking.totalCost || 0) + additionalAmount;
        }
        // Add modification history
        booking.modificationHistory = booking.modificationHistory || [];
        booking.modificationHistory.push({
            type: "add_items",
            addedRooms: (selectedRooms === null || selectedRooms === void 0 ? void 0 : selectedRooms.length) || 0,
            addedCottages: (selectedCottages === null || selectedCottages === void 0 ? void 0 : selectedCottages.length) || 0,
            addedAmenities: (selectedAmenities === null || selectedAmenities === void 0 ? void 0 : selectedAmenities.length) || 0,
            additionalAmount: additionalAmount || 0,
            modifiedAt: new Date()
        });
        yield booking.save();
        res.status(200).json({
            message: "Items added to booking successfully",
            booking
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to add items to booking" });
    }
}));
// User remove items from booking
router.patch("/:id/remove-items", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { removeRoomIds, removeCottageIds, removeAmenityIds, refundAmount } = req.body;
        // Find the booking
        const booking = yield booking_1.default.findById(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Check if the user owns this booking
        if (booking.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        // Check and update booking status based on 8-hour window
        yield checkAndUpdateBookingStatus(booking);
        // Check if booking can be modified using the new logic
        const modificationCheck = canModifyBooking(booking);
        if (!modificationCheck.canModify) {
            return res.status(400).json({
                message: modificationCheck.reason,
                changeWindowDeadline: modificationCheck.changeWindowDeadline,
                currentTime: modificationCheck.currentTime
            });
        }
        // Remove rooms
        if (removeRoomIds && removeRoomIds.length > 0 && booking.selectedRooms) {
            booking.selectedRooms = booking.selectedRooms.filter((room) => !removeRoomIds.includes(room.id));
        }
        // Remove cottages
        if (removeCottageIds && removeCottageIds.length > 0 && booking.selectedCottages) {
            booking.selectedCottages = booking.selectedCottages.filter((cottage) => !removeCottageIds.includes(cottage.id));
        }
        // Remove amenities
        if (removeAmenityIds && removeAmenityIds.length > 0 && booking.selectedAmenities) {
            booking.selectedAmenities = booking.selectedAmenities.filter((amenity) => !removeAmenityIds.includes(amenity.id));
        }
        // Update total cost
        if (refundAmount) {
            booking.totalCost = Math.max(0, (booking.totalCost || 0) - refundAmount);
        }
        // Add modification history
        booking.modificationHistory = booking.modificationHistory || [];
        booking.modificationHistory.push({
            type: "remove_items",
            removedRooms: (removeRoomIds === null || removeRoomIds === void 0 ? void 0 : removeRoomIds.length) || 0,
            removedCottages: (removeCottageIds === null || removeCottageIds === void 0 ? void 0 : removeCottageIds.length) || 0,
            removedAmenities: (removeAmenityIds === null || removeAmenityIds === void 0 ? void 0 : removeAmenityIds.length) || 0,
            refundAmount: refundAmount || 0,
            modifiedAt: new Date()
        });
        yield booking.save();
        res.status(200).json({
            message: "Items removed from booking successfully",
            booking
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to remove items from booking" });
    }
}));
// Verify GCash payment endpoint
router.patch("/:id/gcash/verify", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookingId = req.params.id;
        const { status, rejectionReason } = req.body;
        if (!["verified", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        const booking = yield booking_1.default.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.paymentMethod !== "gcash") {
            return res.status(400).json({ message: "This is not a GCash booking" });
        }
        // Update GCash payment status
        if (booking.gcashPayment) {
            booking.gcashPayment.status = status === "verified" ? "verified" : "rejected";
            if (rejectionReason) {
                booking.gcashPayment.rejectionReason = rejectionReason;
            }
        }
        // Update booking and payment status
        if (status === "verified") {
            booking.paymentStatus = "paid";
            booking.status = "confirmed";
            booking.verifiedByOwner = true;
            booking.ownerVerificationNote = "GCash payment verified";
            booking.ownerVerifiedAt = new Date();
        }
        else {
            booking.paymentStatus = "failed";
            booking.status = "cancelled";
            booking.cancellationReason = rejectionReason || "GCash payment rejected";
        }
        yield booking.save();
        res.status(200).json({
            message: `GCash payment ${status} successfully`,
            booking
        });
    }
    catch (error) {
        console.error("Error verifying GCash payment:", error);
        res.status(500).json({ message: "Unable to verify GCash payment" });
    }
}));
exports.default = router;

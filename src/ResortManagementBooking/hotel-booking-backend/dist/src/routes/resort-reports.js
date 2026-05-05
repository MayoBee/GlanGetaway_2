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
const room_1 = __importDefault(require("../models/room"));
const user_1 = __importDefault(require("../models/user"));
const maintenance_1 = __importDefault(require("../models/maintenance"));
const amenity_booking_1 = __importDefault(require("../models/amenity-booking"));
const activity_booking_1 = __importDefault(require("../models/activity-booking"));
const payment_1 = __importDefault(require("../models/payment"));
const verification_document_1 = __importDefault(require("../models/verification-document"));
const role_based_auth_1 = require("../middleware/role-based-auth");
const router = express_1.default.Router();
// ==================== RESERVATION REPORTS ====================
// Booking Summary Report - ADMIN ONLY
router.get("/reservations/summary", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, startDate, endDate, groupBy } = req.query;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const bookings = yield booking_1.default.find(filter).sort({ createdAt: -1 });
        // Group by period
        const grouped = {};
        bookings.forEach(booking => {
            const date = new Date(booking.createdAt);
            let key;
            switch (groupBy) {
                case "daily":
                    key = date.toISOString().split("T")[0];
                    break;
                case "weekly":
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split("T")[0];
                    break;
                case "monthly":
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    break;
                case "yearly":
                    key = date.getFullYear().toString();
                    break;
                default:
                    key = date.toISOString().split("T")[0];
            }
            if (!grouped[key]) {
                grouped[key] = { bookings: 0, revenue: 0, cancelled: 0 };
            }
            grouped[key].bookings += 1;
            if (booking.paymentStatus === "paid") {
                grouped[key].revenue += booking.totalCost;
            }
            if (booking.status === "cancelled") {
                grouped[key].cancelled += 1;
            }
        });
        res.json({
            success: true,
            data: {
                total: bookings.length,
                revenue: bookings.filter(b => b.paymentStatus === "paid").reduce((sum, b) => sum + b.totalCost, 0),
                cancelled: bookings.filter(b => b.status === "cancelled").length,
                byPeriod: grouped,
            },
        });
    }
    catch (error) {
        console.error("Error generating booking summary:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Occupancy Rate Report - ADMIN ONLY
router.get("/reservations/occupancy", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { hotelId, startDate, endDate } = req.query;
        const roomFilter = { isActive: true };
        if (hotelId)
            roomFilter.hotelId = hotelId;
        const totalRooms = yield room_1.default.countDocuments(roomFilter);
        const bookingFilter = { status: { $in: ["confirmed", "completed"] } };
        if (hotelId)
            bookingFilter.hotelId = hotelId;
        if (startDate && endDate) {
            bookingFilter.checkIn = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        // Calculate occupied room nights
        const occupiedNights = yield booking_1.default.aggregate([
            { $match: bookingFilter },
            { $unwind: "$selectedRooms" },
            {
                $project: {
                    checkIn: 1,
                    checkOut: 1,
                },
            },
            {
                $project: {
                    nights: {
                        $divide: [
                            { $subtract: ["$checkOut", "$checkIn"] },
                            1000 * 60 * 60 * 24,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalNights: { $sum: "$nights" },
                },
            },
        ]);
        // Get available room nights in the period
        const daysInPeriod = startDate && endDate
            ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
            : 30;
        const availableRoomNights = totalRooms * daysInPeriod;
        const occupiedRoomNights = ((_a = occupiedNights[0]) === null || _a === void 0 ? void 0 : _a.totalNights) || 0;
        const occupancyRate = availableRoomNights > 0 ? (occupiedRoomNights / availableRoomNights) * 100 : 0;
        // By room type
        const occupancyByRoomType = yield booking_1.default.aggregate([
            { $match: bookingFilter },
            { $unwind: "$selectedRooms" },
            {
                $group: {
                    _id: "$selectedRooms.type",
                    bookings: { $sum: 1 },
                    revenue: { $sum: "$selectedRooms.pricePerNight" },
                },
            },
        ]);
        res.json({
            success: true,
            data: {
                totalRooms,
                occupiedRoomNights,
                availableRoomNights,
                occupancyRate: Math.round(occupancyRate * 100) / 100,
                daysInPeriod,
                byRoomType: occupancyByRoomType,
            },
        });
    }
    catch (error) {
        console.error("Error generating occupancy report:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Cancelled Reservation Log - ADMIN ONLY
router.get("/reservations/cancelled", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, startDate, endDate, page = 1, limit = 20 } = req.query;
        const filter = { status: "cancelled" };
        if (hotelId)
            filter.hotelId = hotelId;
        if (startDate && endDate) {
            filter.updatedAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const cancelledBookings = yield booking_1.default.find(filter)
            .select("firstName lastName email phone checkIn checkOut totalCost cancellationReason updatedAt")
            .sort({ updatedAt: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield booking_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: cancelledBookings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error generating cancelled reservations report:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// ==================== FINANCIAL REPORTS ====================
// Revenue Report by Category - ADMIN ONLY
router.get("/financial/revenue", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    try {
        const { hotelId, startDate, endDate } = req.query;
        const filter = { paymentStatus: "paid" };
        if (hotelId)
            filter.hotelId = hotelId;
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        // Room revenue
        const roomRevenue = yield booking_1.default.aggregate([
            { $match: filter },
            { $unwind: "$selectedRooms" },
            {
                $group: {
                    _id: "$selectedRooms.type",
                    revenue: { $sum: "$selectedRooms.pricePerNight" },
                    bookings: { $sum: 1 },
                },
            },
        ]);
        // Amenity revenue
        const amenityRevenue = yield booking_1.default.aggregate([
            { $match: filter },
            { $unwind: "$selectedAmenities" },
            {
                $group: {
                    _id: "$selectedAmenities.name",
                    revenue: { $sum: "$selectedAmenities.price" },
                    count: { $sum: 1 },
                },
            },
        ]);
        // Total revenue
        const totalRevenue = yield booking_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalCost" },
                    count: { $sum: 1 },
                },
            },
        ]);
        res.json({
            success: true,
            data: {
                totalRevenue: ((_b = totalRevenue[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
                totalBookings: ((_c = totalRevenue[0]) === null || _c === void 0 ? void 0 : _c.count) || 0,
                byCategory: {
                    rooms: roomRevenue,
                    amenities: amenityRevenue,
                },
            },
        });
    }
    catch (error) {
        console.error("Error generating revenue report:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Daily Transaction Summary - ADMIN ONLY
router.get("/financial/daily", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        const filter = {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        };
        if (hotelId)
            filter.hotelId = hotelId;
        // Transaction summary
        const transactions = yield booking_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$paymentStatus",
                    count: { $sum: 1 },
                    total: { $sum: "$totalCost" },
                },
            },
        ]);
        // Payment methods breakdown
        const byPaymentMethod = yield booking_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    total: { $sum: "$totalCost" },
                },
            },
        ]);
        // Booking status breakdown
        const byStatus = yield booking_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);
        res.json({
            success: true,
            data: {
                date: startOfDay.toISOString().split("T")[0],
                transactions,
                byPaymentMethod,
                byStatus,
            },
        });
    }
    catch (error) {
        console.error("Error generating daily transaction report:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Tax Collection Report - ADMIN ONLY
router.get("/financial/taxes", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        const { hotelId, startDate, endDate } = req.query;
        const filter = { paymentStatus: "paid" };
        if (hotelId)
            filter.hotelId = hotelId;
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        // Calculate from bookings (12% VAT)
        const taxData = yield booking_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalCost" },
                    baseAmount: { $sum: "$basePrice" },
                },
            },
        ]);
        const totalSales = ((_d = taxData[0]) === null || _d === void 0 ? void 0 : _d.totalSales) || 0;
        const baseAmount = ((_e = taxData[0]) === null || _e === void 0 ? void 0 : _e.baseAmount) || 0;
        const taxCollected = totalSales - baseAmount;
        res.json({
            success: true,
            data: {
                totalSales,
                baseAmount,
                taxRate: 0.12,
                taxCollected,
                startDate,
                endDate,
            },
        });
    }
    catch (error) {
        console.error("Error generating tax report:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// ==================== OPERATIONAL REPORTS ====================
// Guest Master List - ADMIN ONLY
router.get("/operational/guests", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, startDate, endDate, page = 1, limit = 20 } = req.query;
        const filter = { status: { $in: ["confirmed", "completed"] } };
        if (hotelId)
            filter.hotelId = hotelId;
        if (startDate && endDate) {
            filter.checkIn = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const guests = yield booking_1.default.find(filter)
            .select("firstName lastName email phone adultCount childCount checkIn checkOut")
            .sort({ checkIn: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield booking_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: guests,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error generating guest list:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Activity Participation Report - ADMIN ONLY
router.get("/operational/activities", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, startDate, endDate } = req.query;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const activityBookings = yield activity_booking_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$activityId",
                    activityName: { $first: "$activityName" },
                    totalParticipants: { $sum: "$totalParticipants" },
                    totalAdults: { $sum: "$adultParticipants" },
                    totalChildren: { $sum: "$childParticipants" },
                    bookings: { $sum: 1 },
                    revenue: { $sum: "$subtotal" },
                },
            },
        ]);
        res.json({
            success: true,
            data: activityBookings,
        });
    }
    catch (error) {
        console.error("Error generating activity participation report:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Room Maintenance History - ADMIN ONLY
router.get("/operational/maintenance", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, roomId, startDate, endDate, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        if (roomId)
            filter.roomId = roomId;
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const maintenance = yield maintenance_1.default.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield maintenance_1.default.countDocuments(filter);
        // Summary stats
        const stats = yield maintenance_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    totalCost: { $sum: "$actualCost" },
                },
            },
        ]);
        res.json({
            success: true,
            data: maintenance,
            stats,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error generating maintenance history:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// ==================== AMENITY USAGE REPORT ====================
// Amenity Usage Report - ADMIN ONLY
router.get("/amenity-usage", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, startDate, endDate } = req.query;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const amenityBookings = yield amenity_booking_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$amenityId",
                    amenityName: { $first: "$amenityName" },
                    totalBookings: { $sum: 1 },
                    totalGuests: { $sum: "$numberOfGuests" },
                    revenue: { $sum: "$subtotal" },
                },
            },
        ]);
        res.json({
            success: true,
            data: amenityBookings,
        });
    }
    catch (error) {
        console.error("Error generating amenity usage report:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// ==================== PENDING BOOKINGS MANAGEMENT ====================
// Get pending bookings with full details - ADMIN/RESORT OWNER ONLY
router.get("/pending-bookings", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, page = 1, limit = 20 } = req.query;
        const filter = { status: "pending" };
        if (hotelId)
            filter.hotelId = hotelId;
        const pendingBookings = yield booking_1.default.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(page));
        const total = yield booking_1.default.countDocuments(filter);
        // Get payment and document details for each booking
        const bookingsWithDetails = yield Promise.all(pendingBookings.map((booking) => __awaiter(void 0, void 0, void 0, function* () {
            var _f;
            const payment = yield payment_1.default.findOne({ bookingId: booking._id });
            const documents = yield verification_document_1.default.find({ bookingId: booking._id });
            // For GCash payments, create a simple payment info object
            let paymentInfo = payment;
            if (!payment && booking.paymentMethod === 'gcash' && booking.gcashPayment) {
                paymentInfo = {
                    paymentMethod: 'gcash',
                    amount: booking.gcashPayment.amountPaid,
                    status: booking.gcashPayment.status || 'pending',
                    referenceNumber: booking.gcashPayment.referenceNumber,
                    screenshotUrl: booking.gcashPayment.screenshotFile ? `${process.env.BACKEND_URL || 'http://localhost:7002'}${booking.gcashPayment.screenshotFile}` : undefined
                };
            }
            // Count documents including GCash screenshot
            let documentCount = documents.length;
            if (booking.paymentMethod === 'gcash' && ((_f = booking.gcashPayment) === null || _f === void 0 ? void 0 : _f.screenshotFile)) {
                documentCount += 1; // Count GCash screenshot as a document
            }
            return Object.assign(Object.assign({}, booking.toObject()), { payment: paymentInfo, documents,
                documentCount });
        })));
        res.json({
            success: true,
            data: bookingsWithDetails,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching pending bookings:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get booking details with payment and documents - ADMIN/RESORT OWNER ONLY
router.get("/booking-details/:bookingId", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        const { bookingId } = req.params;
        const booking = yield booking_1.default.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const payment = yield payment_1.default.findOne({ bookingId });
        const documents = yield verification_document_1.default.find({ bookingId });
        const user = yield user_1.default.findById(booking.userId).select("firstName lastName email phone");
        // For GCash payments, create a simple payment info object
        let paymentInfo = payment;
        if (!payment && booking.paymentMethod === 'gcash' && booking.gcashPayment) {
            paymentInfo = {
                paymentMethod: 'gcash',
                amount: booking.gcashPayment.amountPaid,
                status: booking.gcashPayment.status || 'pending',
                referenceNumber: booking.gcashPayment.referenceNumber,
                screenshotUrl: booking.gcashPayment.screenshotFile ? `${process.env.BACKEND_URL || 'http://localhost:7002'}${booking.gcashPayment.screenshotFile}` : undefined
            };
        }
        // Create a documents array that includes GCash screenshot if present
        let allDocuments = documents;
        if (booking.paymentMethod === 'gcash' && ((_g = booking.gcashPayment) === null || _g === void 0 ? void 0 : _g.screenshotFile)) {
            allDocuments = [
                ...documents,
                {
                    _id: 'gcash-screenshot',
                    documentType: 'other',
                    originalName: 'GCash Payment Screenshot',
                    fileUrl: `${process.env.BACKEND_URL || 'http://localhost:7002'}${booking.gcashPayment.screenshotFile}`,
                    status: booking.paymentStatus === 'paid' ? 'approved' : 'pending'
                }
            ];
        }
        res.json({
            success: true,
            data: {
                booking,
                payment: paymentInfo,
                documents: allDocuments,
                user,
            },
        });
    }
    catch (error) {
        console.error("Error fetching booking details:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Confirm pending booking - ADMIN/RESORT OWNER ONLY
router.patch("/confirm-booking/:bookingId", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const { bookingId } = req.params;
        const { notes } = req.body;
        const booking = yield booking_1.default.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (booking.status !== "pending") {
            return res.status(400).json({ success: false, message: "Booking is not pending" });
        }
        // Update booking status
        booking.status = "confirmed";
        booking.verifiedByOwner = true;
        booking.ownerVerificationNote = notes || "Booking confirmed by resort owner";
        booking.ownerVerifiedAt = new Date();
        yield booking.save();
        // Update payment status if exists
        const payment = yield payment_1.default.findOne({ bookingId });
        if (payment && payment.status === "pending") {
            payment.status = "succeeded";
            payment.verifiedBy = (_h = req.user) === null || _h === void 0 ? void 0 : _h.id;
            payment.verifiedAt = new Date();
            payment.verificationNote = "Auto-verified with booking confirmation";
            yield payment.save();
        }
        res.json({
            success: true,
            message: "Booking confirmed successfully",
            data: booking,
        });
    }
    catch (error) {
        console.error("Error confirming booking:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Cancel pending booking - ADMIN/RESORT OWNER ONLY
router.patch("/cancel-booking/:bookingId", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookingId } = req.params;
        const { reason, refundAmount } = req.body;
        if (!reason) {
            return res.status(400).json({ success: false, message: "Cancellation reason is required" });
        }
        const booking = yield booking_1.default.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (booking.status !== "pending") {
            return res.status(400).json({ success: false, message: "Booking is not pending" });
        }
        // Update booking status
        booking.status = "cancelled";
        booking.cancellationReason = reason;
        booking.refundAmount = refundAmount || 0;
        yield booking.save();
        // Update payment status if exists
        const payment = yield payment_1.default.findOne({ bookingId });
        if (payment) {
            payment.status = "refunded";
            payment.refundAmount = refundAmount || payment.amount;
            payment.refundedAt = new Date();
            payment.refundMethod = "manual";
            yield payment.save();
        }
        res.json({
            success: true,
            message: "Booking cancelled successfully",
            data: booking,
        });
    }
    catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Verify document - ADMIN/RESORT OWNER ONLY
router.patch("/verify-document/:documentId", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    try {
        const { documentId } = req.params;
        const { status, rejectionReason, notes } = req.body;
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }
        if (status === "rejected" && !rejectionReason) {
            return res.status(400).json({ success: false, message: "Rejection reason is required" });
        }
        const document = yield verification_document_1.default.findById(documentId);
        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }
        document.status = status;
        document.verifiedBy = (_j = req.user) === null || _j === void 0 ? void 0 : _j.id;
        document.verifiedAt = new Date();
        document.rejectionReason = rejectionReason;
        document.notes = notes;
        yield document.save();
        res.json({
            success: true,
            message: `Document ${status} successfully`,
            data: document,
        });
    }
    catch (error) {
        console.error("Error verifying document:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;

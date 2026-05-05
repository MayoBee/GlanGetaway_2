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
const hotel_1 = __importDefault(require("../models/hotel"));
const notification_1 = __importDefault(require("../models/notification"));
const maintenance_1 = __importDefault(require("../models/maintenance"));
const role_based_auth_1 = require("../middleware/role-based-auth");
const router = express_1.default.Router();
// Get dashboard overview
router.get("/overview", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "front_desk"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { hotelId } = req.query;
        const filter = hotelId ? { hotelId: hotelId } : {};
        // Get current date for calculations
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        // Get bookings for the current month
        const monthlyBookings = yield booking_1.default.countDocuments(Object.assign(Object.assign({}, filter), { createdAt: { $gte: startOfMonth } }));
        // Get total revenue for the current month
        const monthlyRevenue = yield booking_1.default.aggregate([
            {
                $match: Object.assign(Object.assign({}, filter), { paymentStatus: "paid", createdAt: { $gte: startOfMonth } }),
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalCost" },
                },
            },
        ]);
        // Get total revenue for the year
        const yearlyRevenue = yield booking_1.default.aggregate([
            {
                $match: Object.assign(Object.assign({}, filter), { paymentStatus: "paid", createdAt: { $gte: startOfYear } }),
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalCost" },
                },
            },
        ]);
        // Get total bookings count
        const totalBookings = yield booking_1.default.countDocuments(filter);
        // Get bookings by status
        const bookingsByStatus = yield booking_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);
        // Get upcoming arrivals (next 7 days)
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const upcomingArrivals = yield booking_1.default.find(Object.assign(Object.assign({}, filter), { checkIn: { $gte: today, $lte: nextWeek }, status: { $in: ["confirmed", "pending"] } }))
            .select("firstName lastName checkIn roomNumber")
            .limit(10);
        // Get room occupancy stats
        const totalRooms = yield room_1.default.countDocuments(Object.assign(Object.assign({}, filter), { isActive: true }));
        const occupiedRooms = yield room_1.default.countDocuments(Object.assign(Object.assign({}, filter), { status: { $in: ["occupied", "reserved"] }, isActive: true }));
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
        // Get pending maintenance requests
        const pendingMaintenance = yield maintenance_1.default.countDocuments(Object.assign(Object.assign({}, filter), { status: { $in: ["reported", "assigned", "in_progress"] } }));
        // Get room status breakdown for housekeeping
        const roomStatusBreakdown = yield room_1.default.aggregate([
            { $match: Object.assign(Object.assign({}, filter), { isActive: true }) },
            {
                $group: {
                    _id: "$housekeepingStatus",
                    count: { $sum: 1 },
                },
            },
        ]);
        // Get recent notifications
        const recentNotifications = yield notification_1.default.find(Object.assign(Object.assign({}, filter), { createdAt: { $gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) } }))
            .sort({ createdAt: -1 })
            .limit(10);
        // Get total resorts count
        const totalResorts = yield hotel_1.default.countDocuments({ isApproved: true });
        res.json({
            success: true,
            data: {
                stats: {
                    monthlyBookings,
                    monthlyRevenue: ((_a = monthlyRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
                    yearlyRevenue: ((_b = yearlyRevenue[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
                    totalBookings,
                    occupancyRate,
                    totalRooms,
                    occupiedRooms,
                    availableRooms: totalRooms - occupiedRooms,
                    pendingMaintenance,
                    totalResorts,
                },
                bookingsByStatus,
                roomStatusBreakdown,
                upcomingArrivals,
                recentNotifications,
            },
        });
    }
    catch (error) {
        console.error("Error fetching dashboard overview:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get revenue analytics
router.get("/revenue", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "front_desk"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Daily revenue
        const dailyRevenue = yield booking_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalCost" },
                    bookings: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        // Revenue by room type
        const revenueByRoomType = yield booking_1.default.aggregate([
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
        // Revenue by amenity
        const revenueByAmenity = yield booking_1.default.aggregate([
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
        // Transform dailyRevenue to match frontend expectations (month, revenue, bookings)
        const transformedRevenue = dailyRevenue.map((item) => ({
            month: item._id,
            revenue: item.revenue,
            bookings: item.bookings,
        }));
        res.json({
            success: true,
            data: transformedRevenue,
        });
    }
    catch (error) {
        console.error("Error fetching revenue analytics:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get occupancy analytics
router.get("/occupancy", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "front_desk"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, startDate, endDate } = req.query;
        const bookingFilter = { status: { $in: ["confirmed", "completed"] } };
        if (hotelId)
            bookingFilter.hotelId = hotelId;
        if (startDate && endDate) {
            bookingFilter.checkIn = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        // Occupancy by date
        const occupancyByDate = yield booking_1.default.aggregate([
            { $match: bookingFilter },
            {
                $project: {
                    checkIn: 1,
                    checkOut: 1,
                    adultCount: 1,
                    childCount: 1,
                    selectedRooms: 1,
                },
            },
            { $unwind: "$selectedRooms" },
            {
                $project: {
                    date: "$checkIn",
                    nights: {
                        $divide: [
                            { $subtract: ["$checkOut", "$checkIn"] },
                            1000 * 60 * 60 * 24,
                        ],
                    },
                    rooms: 1,
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    bookings: { $sum: 1 },
                    totalGuests: { $sum: { $add: ["$adultCount", "$childCount"] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        // Occupancy by room type
        const occupancyByRoomType = yield booking_1.default.aggregate([
            { $match: bookingFilter },
            { $unwind: "$selectedRooms" },
            {
                $group: {
                    _id: "$selectedRooms.type",
                    bookings: { $sum: 1 },
                    totalRevenue: { $sum: "$selectedRooms.pricePerNight" },
                },
            },
        ]);
        res.json({
            success: true,
            data: {
                occupancyByDate,
                occupancyByRoomType,
            },
        });
    }
    catch (error) {
        console.error("Error fetching occupancy analytics:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get notifications
router.get("/notifications", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, page = 1, limit = 20, unreadOnly } = req.query;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        if (unreadOnly === "true")
            filter.isRead = false;
        const notifications = yield notification_1.default.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield notification_1.default.countDocuments(filter);
        const unreadCount = yield notification_1.default.countDocuments(Object.assign(Object.assign({}, filter), { isRead: false }));
        res.json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Mark notification as read
router.put("/notifications/:id/read", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const notification = yield notification_1.default.findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true });
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }
        res.json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        });
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Mark all notifications as read
router.put("/notifications/read-all", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.body;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        filter.isRead = false;
        yield notification_1.default.updateMany(filter, { isRead: true, readAt: new Date() });
        res.json({
            success: true,
            message: "All notifications marked as read",
        });
    }
    catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;

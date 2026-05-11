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
const hotel_1 = __importDefault(require("../models/hotel"));
const booking_1 = __importDefault(require("../models/booking"));
const user_1 = __importDefault(require("../models/user"));
const auth_1 = __importDefault(require("../middleware/auth"));
const role_based_auth_1 = require("../middleware/role-based-auth");
const date_fns_1 = require("date-fns");
const router = express_1.default.Router();
// Helper function to calculate date range
function getDateRange(timeRange) {
    const now = new Date();
    let startDate;
    switch (timeRange) {
        case '7d':
            startDate = (0, date_fns_1.subDays)(now, 7);
            break;
        case '30d':
            startDate = (0, date_fns_1.subDays)(now, 30);
            break;
        case '90d':
            startDate = (0, date_fns_1.subDays)(now, 90);
            break;
        case '1y':
            startDate = (0, date_fns_1.subDays)(now, 365);
            break;
        default:
            startDate = (0, date_fns_1.subDays)(now, 30);
    }
    return { startDate, endDate: now };
}
// Helper function to calculate previous period for growth comparison
function getPreviousPeriod(timeRange) {
    const now = new Date();
    let startDate;
    let endDate;
    switch (timeRange) {
        case '7d':
            endDate = (0, date_fns_1.subDays)(now, 7);
            startDate = (0, date_fns_1.subDays)(endDate, 7);
            break;
        case '30d':
            endDate = (0, date_fns_1.subDays)(now, 30);
            startDate = (0, date_fns_1.subDays)(endDate, 30);
            break;
        case '90d':
            endDate = (0, date_fns_1.subDays)(now, 90);
            startDate = (0, date_fns_1.subDays)(endDate, 90);
            break;
        case '1y':
            endDate = (0, date_fns_1.subDays)(now, 365);
            startDate = (0, date_fns_1.subDays)(endDate, 365);
            break;
        default:
            endDate = (0, date_fns_1.subDays)(now, 30);
            startDate = (0, date_fns_1.subDays)(endDate, 30);
    }
    return { startDate, endDate };
}
// Calculate growth percentage
function calculateGrowth(current, previous) {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}
router.get("/business-stats", auth_1.default, role_based_auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const timeRange = req.query.timeRange || '30d';
        const { startDate, endDate } = getDateRange(timeRange);
        const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriod(timeRange);
        // Get current period stats
        const [totalUsers, totalResorts, totalBookings, bookings, users, resorts] = yield Promise.all([
            user_1.default.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
            hotel_1.default.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
            booking_1.default.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
            booking_1.default.find({ createdAt: { $gte: startDate, $lte: endDate } }),
            user_1.default.find({}),
            hotel_1.default.find({ isApproved: true })
        ]);
        // Get previous period stats for growth calculation
        const [prevUsers, prevResorts, prevBookings] = yield Promise.all([
            user_1.default.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),
            hotel_1.default.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),
            booking_1.default.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } })
        ]);
        // Calculate total revenue
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalCost || 0), 0);
        const prevRevenue = yield booking_1.default.aggregate([
            { $match: { createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]).then(result => { var _a; return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.total) || 0; });
        // Calculate average rating
        const totalRating = resorts.reduce((sum, resort) => sum + (resort.averageRating || 0), 0);
        const averageRating = resorts.length > 0 ? totalRating / resorts.length : 0;
        // Calculate occupancy rate (simplified - based on actual bookings vs estimated capacity)
        const totalPossibleBookings = resorts.reduce((sum, resort) => {
            var _a, _b;
            const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            // Estimate capacity based on rooms and cottages (10 guests per room/cottage as a reasonable average)
            const estimatedCapacity = ((((_a = resort.rooms) === null || _a === void 0 ? void 0 : _a.length) || 0) + (((_b = resort.cottages) === null || _b === void 0 ? void 0 : _b.length) || 0)) * 10 * daysInPeriod;
            return sum + Math.max(estimatedCapacity, 100 * daysInPeriod); // Minimum capacity fallback
        }, 0);
        const occupancyRate = totalPossibleBookings > 0 ? (totalBookings / totalPossibleBookings) * 100 : 0;
        // Get top performing resorts
        const resortStats = yield booking_1.default.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $group: {
                    _id: "$hotelId",
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: "$totalCost" }
                } },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            { $lookup: {
                    from: "hotels",
                    localField: "_id",
                    foreignField: "_id",
                    as: "hotel"
                } },
            { $unwind: "$hotel" }
        ]);
        const topPerformingResorts = resortStats.map(stat => ({
            _id: stat._id,
            name: stat.hotel.name,
            totalBookings: stat.totalBookings,
            totalRevenue: stat.totalRevenue,
            averageRating: stat.hotel.averageRating || 0,
            occupancyRate: 0 // Simplified for now
        }));
        // Get recent bookings
        const recentBookings = yield booking_1.default.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('hotelId', 'name')
            .populate('userId', 'firstName lastName');
        const recentBookingsFormatted = recentBookings.map(booking => {
            var _a, _b, _c;
            return ({
                _id: booking._id,
                hotelName: ((_a = booking.hotelId) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                userName: `${(_b = booking.userId) === null || _b === void 0 ? void 0 : _b.firstName} ${(_c = booking.userId) === null || _c === void 0 ? void 0 : _c.lastName}`,
                totalCost: booking.totalCost,
                status: booking.status || 'pending',
                createdAt: booking.createdAt
            });
        });
        // Get user distribution
        const userDistribution = yield Promise.all([
            user_1.default.countDocuments({ role: 'user' }),
            user_1.default.countDocuments({ role: 'resort_owner' }),
            user_1.default.countDocuments({ role: 'admin' })
        ]);
        // Get revenue by month (last 6 months)
        const revenueByMonth = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subDays)(new Date(), i * 30));
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);
            const monthBookings = yield booking_1.default.find({
                createdAt: { $gte: monthStart, $lte: monthEnd }
            });
            const monthRevenue = monthBookings.reduce((sum, booking) => sum + (booking.totalCost || 0), 0);
            revenueByMonth.push({
                month: (0, date_fns_1.format)(monthStart, 'MMM yyyy'),
                revenue: monthRevenue,
                bookings: monthBookings.length
            });
        }
        // Get popular destinations
        const popularDestinations = yield booking_1.default.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $lookup: {
                    from: "hotels",
                    localField: "hotelId",
                    foreignField: "_id",
                    as: "hotel"
                } },
            { $unwind: "$hotel" },
            { $group: {
                    _id: {
                        city: "$hotel.city",
                        country: "$hotel.country"
                    },
                    totalBookings: { $sum: 1 },
                    resortCount: { $addToSet: "$hotelId" }
                } },
            { $project: {
                    city: "$_id.city",
                    country: "$_id.country",
                    totalBookings: 1,
                    resortCount: { $size: "$resortCount" }
                } },
            { $sort: { totalBookings: -1 } },
            { $limit: 5 }
        ]);
        const response = {
            totalUsers: users.length,
            totalResorts: resorts.length,
            totalBookings,
            totalRevenue,
            averageRating,
            occupancyRate,
            monthlyGrowth: {
                users: calculateGrowth(totalUsers, prevUsers),
                resorts: calculateGrowth(totalResorts, prevResorts),
                bookings: calculateGrowth(totalBookings, prevBookings),
                revenue: calculateGrowth(totalRevenue, prevRevenue)
            },
            topPerformingResorts,
            recentBookings: recentBookingsFormatted,
            userDistribution: {
                users: userDistribution[0],
                admins: userDistribution[1],
                superAdmins: userDistribution[2]
            },
            revenueByMonth,
            popularDestinations
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching business stats:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
exports.default = router;

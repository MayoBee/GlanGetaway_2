import express, { Request, Response } from "express";
import Hotel from "../models/hotel";
import Booking from "../models/booking";
import User from "../models/user";
import verifyToken from "../middleware/auth";
import { requireAdmin } from "../middleware/role-based-auth";
import { startOfDay, subDays, startOfMonth, format } from "date-fns";

const router = express.Router();

// Helper function to calculate date range
function getDateRange(timeRange: string) {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case '7d':
      startDate = subDays(now, 7);
      break;
    case '30d':
      startDate = subDays(now, 30);
      break;
    case '90d':
      startDate = subDays(now, 90);
      break;
    case '1y':
      startDate = subDays(now, 365);
      break;
    default:
      startDate = subDays(now, 30);
  }

  return { startDate, endDate: now };
}

// Helper function to calculate previous period for growth comparison
function getPreviousPeriod(timeRange: string) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (timeRange) {
    case '7d':
      endDate = subDays(now, 7);
      startDate = subDays(endDate, 7);
      break;
    case '30d':
      endDate = subDays(now, 30);
      startDate = subDays(endDate, 30);
      break;
    case '90d':
      endDate = subDays(now, 90);
      startDate = subDays(endDate, 90);
      break;
    case '1y':
      endDate = subDays(now, 365);
      startDate = subDays(endDate, 365);
      break;
    default:
      endDate = subDays(now, 30);
      startDate = subDays(endDate, 30);
  }

  return { startDate, endDate };
}

// Calculate growth percentage
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

router.get("/business-stats", verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.timeRange as string || '30d';
    const { startDate, endDate } = getDateRange(timeRange);
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriod(timeRange);

    // Get current period stats
    const [
      totalUsers,
      totalResorts,
      totalBookings,
      bookings,
      users,
      resorts
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Hotel.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Booking.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Booking.find({ createdAt: { $gte: startDate, $lte: endDate } }),
      User.find({}),
      Hotel.find({ isApproved: true })
    ]);

    // Get previous period stats for growth calculation
    const [
      prevUsers,
      prevResorts,
      prevBookings
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),
      Hotel.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),
      Booking.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } })
    ]);

    // Calculate total revenue
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalCost || 0), 0);
    const prevRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
      { $group: { _id: null, total: { $sum: "$totalCost" } } }
    ]).then(result => result[0]?.total || 0);

    // Calculate average rating
    const totalRating = resorts.reduce((sum, resort) => sum + (resort.averageRating || 0), 0);
    const averageRating = resorts.length > 0 ? totalRating / resorts.length : 0;

    // Calculate occupancy rate (simplified - based on actual bookings vs estimated capacity)
    const totalPossibleBookings = resorts.reduce((sum, resort) => {
      const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      // Estimate capacity based on rooms and cottages (10 guests per room/cottage as a reasonable average)
      const estimatedCapacity = ((resort.rooms?.length || 0) + (resort.cottages?.length || 0)) * 10 * daysInPeriod;
      return sum + Math.max(estimatedCapacity, 100 * daysInPeriod); // Minimum capacity fallback
    }, 0);
    const occupancyRate = totalPossibleBookings > 0 ? (totalBookings / totalPossibleBookings) * 100 : 0;

    // Get top performing resorts
    const resortStats = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: "$hotelId",
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: "$totalCost" }
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: "hotels",
        localField: "_id",
        foreignField: "_id",
        as: "hotel"
      }},
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
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('hotelId', 'name')
      .populate('userId', 'firstName lastName');

    const recentBookingsFormatted = recentBookings.map(booking => ({
      _id: booking._id,
      hotelName: (booking.hotelId as any)?.name || 'Unknown',
      userName: `${(booking.userId as any)?.firstName} ${(booking.userId as any)?.lastName}`,
      totalCost: booking.totalCost,
      status: booking.status || 'pending',
      createdAt: booking.createdAt
    }));

    // Get user distribution
    const userDistribution = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'resort_owner' }),
      User.countDocuments({ role: 'admin' })
    ]);

    // Get revenue by month (last 6 months)
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(new Date(), i * 30));
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const monthBookings = await Booking.find({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const monthRevenue = monthBookings.reduce((sum, booking) => sum + (booking.totalCost || 0), 0);

      revenueByMonth.push({
        month: format(monthStart, 'MMM yyyy'),
        revenue: monthRevenue,
        bookings: monthBookings.length
      });
    }

    // Get popular destinations
    const popularDestinations = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $lookup: {
        from: "hotels",
        localField: "hotelId",
        foreignField: "_id",
        as: "hotel"
      }},
      { $unwind: "$hotel" },
      { $group: {
        _id: {
          city: "$hotel.city",
          country: "$hotel.country"
        },
        totalBookings: { $sum: 1 },
        resortCount: { $addToSet: "$hotelId" }
      }},
      { $project: {
        city: "$_id.city",
        country: "$_id.country",
        totalBookings: 1,
        resortCount: { $size: "$resortCount" }
      }},
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
  } catch (error) {
    console.error("Error fetching business stats:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;

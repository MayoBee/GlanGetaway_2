import express, { Request, Response } from "express";
import Booking from "../domains/booking-reservation/models/booking";
import Room from "../models/room";
import Notification from "../models/notification";
import Maintenance from "../models/maintenance";
import Housekeeping from "../models/housekeeping";
import Billing from "../models/billing";
import { verifyToken, requireAdmin, requireRole } from "../middleware/role-based-auth";

const router = express.Router();

// Get dashboard overview
router.get("/overview", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.query;
    const filter = hotelId ? { hotelId: hotelId as string } : {};

    // Get current date for calculations
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get bookings for the current month
    const monthlyBookings = await Booking.countDocuments({
      ...filter,
      createdAt: { $gte: startOfMonth },
    });

    // Get total revenue for the current month
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          ...filter,
          paymentStatus: "paid",
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" },
        },
      },
    ]);

    // Get total revenue for the year
    const yearlyRevenue = await Booking.aggregate([
      {
        $match: {
          ...filter,
          paymentStatus: "paid",
          createdAt: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" },
        },
      },
    ]);

    // Get total bookings count
    const totalBookings = await Booking.countDocuments(filter);

    // Get bookings by status
    const bookingsByStatus = await Booking.aggregate([
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
    const upcomingArrivals = await Booking.find({
      ...filter,
      checkIn: { $gte: today, $lte: nextWeek },
      status: { $in: ["confirmed", "pending"] },
    })
      .select("firstName lastName checkIn roomNumber")
      .limit(10);

    // Get room occupancy stats
    const totalRooms = await Room.countDocuments({ ...filter, isActive: true });
    const occupiedRooms = await Room.countDocuments({
      ...filter,
      status: { $in: ["occupied", "reserved"] },
      isActive: true,
    });
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Get pending maintenance requests
    const pendingMaintenance = await Maintenance.countDocuments({
      ...filter,
      status: { $in: ["reported", "assigned", "in_progress"] },
    });

    // Get room status breakdown for housekeeping
    const roomStatusBreakdown = await Room.aggregate([
      { $match: { ...filter, isActive: true } },
      {
        $group: {
          _id: "$housekeepingStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent notifications
    const recentNotifications = await Notification.find({
      ...filter,
      createdAt: { $gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: {
          monthlyBookings,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          yearlyRevenue: yearlyRevenue[0]?.total || 0,
          totalBookings,
          occupancyRate,
          totalRooms,
          occupiedRooms,
          availableRooms: totalRooms - occupiedRooms,
          pendingMaintenance,
        },
        bookingsByStatus,
        roomStatusBreakdown,
        upcomingArrivals,
        recentNotifications,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get revenue analytics
router.get("/revenue", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, startDate, endDate } = req.query;
    const filter: any = { paymentStatus: "paid" };
    
    if (hotelId) filter.hotelId = hotelId;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Daily revenue
    const dailyRevenue = await Booking.aggregate([
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
    const revenueByRoomType = await Booking.aggregate([
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
    const revenueByAmenity = await Booking.aggregate([
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

    res.json({
      success: true,
      data: {
        dailyRevenue,
        revenueByRoomType,
        revenueByAmenity,
      },
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get occupancy analytics
router.get("/occupancy", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, startDate, endDate } = req.query;
    
    const bookingFilter: any = { status: { $in: ["confirmed", "completed"] } };
    if (hotelId) bookingFilter.hotelId = hotelId;
    if (startDate && endDate) {
      bookingFilter.checkIn = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Occupancy by date
    const occupancyByDate = await Booking.aggregate([
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
    const occupancyByRoomType = await Booking.aggregate([
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
  } catch (error) {
    console.error("Error fetching occupancy analytics:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get notifications
router.get("/notifications", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId, page = 1, limit = 20, unreadOnly } = req.query;
    const filter: any = {};

    if (hotelId) filter.hotelId = hotelId;
    if (unreadOnly === "true") filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

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
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Mark notification as read
router.put("/notifications/:id/read", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Mark all notifications as read
router.put("/notifications/read-all", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.body;
    const filter: any = {};

    if (hotelId) filter.hotelId = hotelId;
    filter.isRead = false;

    await Notification.updateMany(filter, { isRead: true, readAt: new Date() });

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get real-time dashboard data
router.get("/real-time", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.query;
    const filter = hotelId ? { hotelId: hotelId as string } : {};

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Occupancy rate using aggregation
    const occupancyAgg = await Room.aggregate([
      { $match: { ...filter, isActive: true } },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          occupiedRooms: {
            $sum: {
              $cond: [{ $in: ["$status", ["occupied", "reserved"]] }, 1, 0]
            }
          }
        }
      }
    ]);
    const occupancyData = occupancyAgg[0] || { totalRooms: 0, occupiedRooms: 0 };
    const occupancyRate = occupancyData.totalRooms > 0 ? Math.round((occupancyData.occupiedRooms / occupancyData.totalRooms) * 100) : 0;

    // Today's revenue using aggregation
    const todayRevenueAgg = await Booking.aggregate([
      {
        $match: {
          ...filter,
          paymentStatus: "paid",
          createdAt: { $gte: startOfDay, $lt: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" },
        },
      },
    ]);
    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    // Upcoming arrivals (next 7 days) using aggregation
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingArrivalsAgg = await Booking.aggregate([
      {
        $match: {
          ...filter,
          checkIn: { $gte: today, $lte: nextWeek },
          status: { $in: ["confirmed", "pending"] },
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          checkIn: 1,
          roomNumber: 1,
        },
      },
      { $sort: { checkIn: 1 } },
      { $limit: 10 },
    ]);
    const upcomingArrivals = upcomingArrivalsAgg;

    // Pending approvals (pending bookings) using aggregation
    const pendingApprovalsAgg = await Booking.aggregate([
      { $match: { ...filter, status: "pending" } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
    const pendingApprovals = pendingApprovalsAgg[0]?.count || 0;

    // Maintenance alerts (pending maintenance) using aggregation
    const maintenanceAlertsAgg = await Maintenance.aggregate([
      { $match: { ...filter, status: { $in: ["reported", "assigned"] } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
    const maintenanceAlerts = maintenanceAlertsAgg[0]?.count || 0;

    // Recent activity (recent bookings) using aggregation
    const recentActivityAgg = await Booking.aggregate([
      { $match: filter },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          status: 1,
          checkIn: 1,
          updatedAt: 1,
        },
      },
      { $sort: { updatedAt: -1 } },
      { $limit: 10 },
    ]);
    const recentActivity = recentActivityAgg;

    res.json({
      success: true,
      data: {
        occupancyRate,
        todayRevenue,
        upcomingArrivals,
        pendingApprovals,
        maintenanceAlerts,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching real-time dashboard:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get walk-in vs online sales analytics
router.get("/sales-by-source", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, startDate, endDate } = req.query;
    const filter = hotelId ? { hotelId: hotelId as string } : {};

    // Set date range (default to current month)
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    } else {
      dateFilter.$gte = startOfMonth;
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    } else {
      dateFilter.$lte = endOfMonth;
    }

    // Get online bookings stats
    const onlineBookings = await Booking.aggregate([
      {
        $match: {
          ...filter,
          source: "online",
          paymentStatus: "paid",
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: "$totalCost" },
        },
      },
    ]);

    // Get walk-in bookings stats
    const walkInBookings = await Booking.aggregate([
      {
        $match: {
          ...filter,
          source: "walk_in",
          paymentStatus: "paid",
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: "$totalCost" },
        },
      },
    ]);

    // Get daily breakdown for the period
    const dailyBreakdown = await Booking.aggregate([
      {
        $match: {
          ...filter,
          paymentStatus: "paid",
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            source: "$source",
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalCost" },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    const onlineStats = onlineBookings[0] || { count: 0, revenue: 0 };
    const walkInStats = walkInBookings[0] || { count: 0, revenue: 0 };
    const totalRevenue = onlineStats.revenue + walkInStats.revenue;
    const totalBookings = onlineStats.count + walkInStats.count;

    res.json({
      success: true,
      data: {
        summary: {
          online: {
            bookings: onlineStats.count,
            revenue: onlineStats.revenue,
            percentage: totalRevenue > 0 ? (onlineStats.revenue / totalRevenue) * 100 : 0,
          },
          walkIn: {
            bookings: walkInStats.count,
            revenue: walkInStats.revenue,
            percentage: totalRevenue > 0 ? (walkInStats.revenue / totalRevenue) * 100 : 0,
          },
          total: {
            bookings: totalBookings,
            revenue: totalRevenue,
          },
        },
        dailyBreakdown,
        dateRange: {
          start: dateFilter.$gte,
          end: dateFilter.$lte,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching sales by source:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

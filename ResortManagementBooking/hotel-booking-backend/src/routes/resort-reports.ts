import express, { Request, Response } from "express";
import Booking from "../models/booking";
import Room from "../models/room";
import Billing from "../models/billing";
import User from "../models/user";
import Maintenance from "../models/maintenance";
import Housekeeping from "../models/housekeeping";
import AmenityBooking from "../models/amenity-booking";
import ActivityBooking from "../models/activity-booking";
import PaymentTransaction from "../models/payment";
import VerificationDocument from "../models/verification-document";
import { verifyToken, requireRole } from "../middleware/role-based-auth";

const router = express.Router();

// ==================== RESERVATION REPORTS ====================

// Booking Summary Report - ADMIN ONLY
router.get("/reservations/summary", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, startDate, endDate, groupBy } = req.query;
    
    const filter: any = {};
    if (hotelId) filter.hotelId = hotelId;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    // Group by period
    const grouped: any = {};
    bookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      let key: string;
      
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
  } catch (error) {
    console.error("Error generating booking summary:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Occupancy Rate Report - ADMIN ONLY
router.get("/reservations/occupancy", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, startDate, endDate } = req.query;
    
    const roomFilter: any = { isActive: true };
    if (hotelId) roomFilter.hotelId = hotelId;

    const totalRooms = await Room.countDocuments(roomFilter);
    
    const bookingFilter: any = { status: { $in: ["confirmed", "completed"] } };
    if (hotelId) bookingFilter.hotelId = hotelId;
    if (startDate && endDate) {
      bookingFilter.checkIn = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Calculate occupied room nights
    const occupiedNights = await Booking.aggregate([
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
      ? Math.ceil((new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const availableRoomNights = totalRooms * daysInPeriod;
    const occupiedRoomNights = occupiedNights[0]?.totalNights || 0;
    const occupancyRate = availableRoomNights > 0 ? (occupiedRoomNights / availableRoomNights) * 100 : 0;

    // By room type
    const occupancyByRoomType = await Booking.aggregate([
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
  } catch (error) {
    console.error("Error generating occupancy report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Cancelled Reservation Log - ADMIN ONLY
router.get("/reservations/cancelled", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const filter: any = { status: "cancelled" };
    if (hotelId) filter.hotelId = hotelId;
    if (startDate && endDate) {
      filter.updatedAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const cancelledBookings = await Booking.find(filter)
      .select("firstName lastName email phone checkIn checkOut totalCost cancellationReason updatedAt")
      .sort({ updatedAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Booking.countDocuments(filter);

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
  } catch (error) {
    console.error("Error generating cancelled reservations report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==================== FINANCIAL REPORTS ====================

// Revenue Report by Category - ADMIN ONLY
router.get("/financial/revenue", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
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

    // Room revenue
    const roomRevenue = await Booking.aggregate([
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
    const amenityRevenue = await Booking.aggregate([
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
    const totalRevenue = await Booking.aggregate([
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
        totalRevenue: totalRevenue[0]?.total || 0,
        totalBookings: totalRevenue[0]?.count || 0,
        byCategory: {
          rooms: roomRevenue,
          amenities: amenityRevenue,
        },
      },
    });
  } catch (error) {
    console.error("Error generating revenue report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Daily Transaction Summary - ADMIN ONLY
router.get("/financial/daily", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const filter: any = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };
    if (hotelId) filter.hotelId = hotelId;

    // Transaction summary
    const transactions = await Booking.aggregate([
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
    const byPaymentMethod = await Booking.aggregate([
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
    const byStatus = await Booking.aggregate([
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
  } catch (error) {
    console.error("Error generating daily transaction report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Tax Collection Report - ADMIN ONLY
router.get("/financial/taxes", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
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

    // Calculate from bookings (12% VAT)
    const taxData = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalCost" },
          baseAmount: { $sum: "$basePrice" },
        },
      },
    ]);

    const totalSales = taxData[0]?.totalSales || 0;
    const baseAmount = taxData[0]?.baseAmount || 0;
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
  } catch (error) {
    console.error("Error generating tax report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==================== OPERATIONAL REPORTS ====================

// Guest Master List - ADMIN ONLY
router.get("/operational/guests", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const filter: any = { status: { $in: ["confirmed", "completed"] } };
    if (hotelId) filter.hotelId = hotelId;
    if (startDate && endDate) {
      filter.checkIn = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const guests = await Booking.find(filter)
      .select("firstName lastName email phone adultCount childCount checkIn checkOut")
      .sort({ checkIn: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Booking.countDocuments(filter);

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
  } catch (error) {
    console.error("Error generating guest list:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Activity Participation Report - ADMIN ONLY
router.get("/operational/activities", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, startDate, endDate } = req.query;
    
    const filter: any = {};
    if (hotelId) filter.hotelId = hotelId;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const activityBookings = await ActivityBooking.aggregate([
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
  } catch (error) {
    console.error("Error generating activity participation report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Room Maintenance History - ADMIN ONLY
router.get("/operational/maintenance", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, roomId, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (hotelId) filter.hotelId = hotelId;
    if (roomId) filter.roomId = roomId;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const maintenance = await Maintenance.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Maintenance.countDocuments(filter);

    // Summary stats
    const stats = await Maintenance.aggregate([
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
  } catch (error) {
    console.error("Error generating maintenance history:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==================== AMENITY USAGE REPORT ====================

// Amenity Usage Report - ADMIN ONLY
router.get("/amenity-usage", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, startDate, endDate } = req.query;
    
    const filter: any = {};
    if (hotelId) filter.hotelId = hotelId;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const amenityBookings = await AmenityBooking.aggregate([
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
  } catch (error) {
    console.error("Error generating amenity usage report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==================== PENDING BOOKINGS MANAGEMENT ====================

// Get pending bookings with full details - ADMIN/RESORT OWNER ONLY
router.get("/pending-bookings", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, page = 1, limit = 20 } = req.query;
    
    const filter: any = { status: "pending" };
    if (hotelId) filter.hotelId = hotelId;

    const pendingBookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(page));

    const total = await Booking.countDocuments(filter);

    // Get payment and document details for each booking
    const bookingsWithDetails = await Promise.all(
      pendingBookings.map(async (booking) => {
        const payment = await PaymentTransaction.findOne({ bookingId: booking._id });
        const documents = await VerificationDocument.find({ bookingId: booking._id });
        
        // For GCash payments, create a simple payment info object
        let paymentInfo = payment;
        if (!payment && booking.paymentMethod === 'gcash' && booking.gcashPayment) {
          paymentInfo = {
            paymentMethod: 'gcash',
            amount: booking.gcashPayment.amountPaid,
            status: (booking.gcashPayment.status as "pending" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled") || 'pending',
            referenceNumber: booking.gcashPayment.referenceNumber,
            screenshotUrl: booking.gcashPayment.screenshotFile ? `${process.env.BACKEND_URL || 'http://localhost:7002'}${booking.gcashPayment.screenshotFile}` : undefined
          } as any;
        }
        
        // Count documents including GCash screenshot
        let documentCount = documents.length;
        if (booking.paymentMethod === 'gcash' && booking.gcashPayment?.screenshotFile) {
          documentCount += 1; // Count GCash screenshot as a document
        }
        
        return {
          ...booking.toObject(),
          payment: paymentInfo,
          documents,
          documentCount
        };
      })
    );

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
  } catch (error) {
    console.error("Error fetching pending bookings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get booking details with payment and documents - ADMIN/RESORT OWNER ONLY
router.get("/booking-details/:bookingId", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const payment = await PaymentTransaction.findOne({ bookingId });
    const documents = await VerificationDocument.find({ bookingId });
    const user = await User.findById(booking.userId).select("firstName lastName email phone");

    // For GCash payments, create a simple payment info object
    let paymentInfo = payment;
    if (!payment && booking.paymentMethod === 'gcash' && booking.gcashPayment) {
      paymentInfo = {
        paymentMethod: 'gcash',
        amount: booking.gcashPayment.amountPaid,
        status: (booking.gcashPayment.status as "pending" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled") || 'pending',
        referenceNumber: booking.gcashPayment.referenceNumber,
        screenshotUrl: booking.gcashPayment.screenshotFile ? `${process.env.BACKEND_URL || 'http://localhost:7002'}${booking.gcashPayment.screenshotFile}` : undefined
      } as any;
    }

    // Create a documents array that includes GCash screenshot if present
    let allDocuments = documents;
    if (booking.paymentMethod === 'gcash' && booking.gcashPayment?.screenshotFile) {
      allDocuments = [
        ...documents,
        {
          _id: 'gcash-screenshot',
          documentType: 'other',
          originalName: 'GCash Payment Screenshot',
          fileUrl: `${process.env.BACKEND_URL || 'http://localhost:7002'}${booking.gcashPayment.screenshotFile}`,
          status: booking.paymentStatus === 'paid' ? 'approved' : 'pending'
        } as any
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
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Confirm pending booking - ADMIN/RESORT OWNER ONLY
router.patch("/confirm-booking/:bookingId", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { notes } = req.body;

    const booking = await Booking.findById(bookingId);
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
    await booking.save();

    // Update payment status if exists
    const payment = await PaymentTransaction.findOne({ bookingId });
    if (payment && payment.status === "pending") {
      payment.status = "succeeded";
      payment.verifiedBy = req.user?.id;
      payment.verifiedAt = new Date();
      payment.verificationNote = "Auto-verified with booking confirmation";
      await payment.save();
    }

    res.json({
      success: true,
      message: "Booking confirmed successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Error confirming booking:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Cancel pending booking - ADMIN/RESORT OWNER ONLY
router.patch("/cancel-booking/:bookingId", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { reason, refundAmount } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Cancellation reason is required" });
    }

    const booking = await Booking.findById(bookingId);
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
    await booking.save();

    // Update payment status if exists
    const payment = await PaymentTransaction.findOne({ bookingId });
    if (payment) {
      payment.status = "refunded";
      payment.refundAmount = refundAmount || payment.amount;
      payment.refundedAt = new Date();
      payment.refundMethod = "manual";
      await payment.save();
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Verify document - ADMIN/RESORT OWNER ONLY
router.patch("/verify-document/:documentId", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { status, rejectionReason, notes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    if (status === "rejected" && !rejectionReason) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const document = await VerificationDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    document.status = status;
    document.verifiedBy = req.user?.id;
    document.verifiedAt = new Date();
    document.rejectionReason = rejectionReason;
    document.notes = notes;
    await document.save();

    res.json({
      success: true,
      message: `Document ${status} successfully`,
      data: document,
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

import express, { Request, Response } from "express";
import Booking from "../models/booking";
import Hotel from "../models/hotel";
import User from "../models/user";
import verifyToken from "../middleware/auth";
import { body, param, validationResult } from "express-validator";
import { asyncHandler } from "../middleware/errorHandler";
import { canModifyBooking, checkAndUpdateBookingStatus } from "../services/bookingValidationService";

const router = express.Router();

// Get all bookings (admin only)
router.get("/", verifyToken, asyncHandler(async (req: Request, res: Response) => {
  // Verify admin status
  const user = await User.findById(req.userId);
  const isAdmin = user && ["admin", "superAdmin"].includes(user.role);

  if (!isAdmin) {
    return res.status(403).json({ message: "Access denied. Only admins can view all bookings." });
  }

  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .populate("hotelId", "name city country");

  res.status(200).json(bookings);
}));

// Get bookings by hotel ID (for hotel owners)
router.get(
  "/hotel/:hotelId",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { hotelId } = req.params;

    // Verify the hotel belongs to the authenticated user
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.userId !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const bookings = await Booking.find({ hotelId })
      .sort({ createdAt: -1 })
      .populate("userId", "firstName lastName email");

    res.status(200).json(bookings);
  })
);

// Get booking by ID
router.get("/:id", verifyToken, asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findById(req.params.id).populate(
    "hotelId",
    "name city country imageUrls userId"
  );

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Check user ownership, hotel ownership, or admin status
  const user = await User.findById(req.userId);
  const isOwner = booking.userId.toString() === req.userId;
  const isHotelOwner = booking.hotelId && (booking.hotelId as any).userId === req.userId;
  const isAdmin = user && ["admin", "superAdmin"].includes(user.role);

  if (!isOwner && !isHotelOwner && !isAdmin) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Check and update booking status based on 8-hour window
  await checkAndUpdateBookingStatus(booking);

  res.status(200).json(booking);
}));

// Update booking status
router.patch(
  "/:id/status",
  verifyToken,
  [
    body("status")
      .isIn(["pending", "confirmed", "cancelled", "completed", "refunded"])
      .withMessage("Invalid status"),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg || "Validation error" });
    }

    const { status, cancellationReason } = req.body;

    const booking = await Booking.findById(req.params.id).populate('hotelId', 'userId');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check user ownership, hotel ownership, or admin status
    const user = await User.findById(req.userId);
    const isOwner = booking.userId.toString() === req.userId;
    const isHotelOwner = booking.hotelId && (booking.hotelId as any).userId === req.userId;
    const isAdmin = user && ["admin", "superAdmin"].includes(user.role);

    if (!isOwner && !isHotelOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updateData: any = { status };
    if (status === "cancelled" && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    }
    if (status === "refunded") {
      updateData.refundAmount = req.body.refundAmount || 0;
    }

    // Apply updates
    Object.assign(booking, updateData);
    await booking.save();

    res.status(200).json(booking);
  })
);

// Update payment status
router.patch(
  "/:id/payment",
  verifyToken,
  [
    body("paymentStatus")
      .isIn(["pending", "paid", "failed", "refunded"])
      .withMessage("Invalid payment status"),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg || "Validation error" });
    }

    const { paymentStatus, paymentMethod } = req.body;

    const booking = await Booking.findById(req.params.id).populate('hotelId', 'userId');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check user ownership, hotel ownership, or admin status
    const user = await User.findById(req.userId);
    const isOwner = booking.userId.toString() === req.userId;
    const isHotelOwner = booking.hotelId && (booking.hotelId as any).userId === req.userId;
    const isAdmin = user && ["admin", "superAdmin"].includes(user.role);

    if (!isOwner && !isHotelOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updateData: any = { paymentStatus };
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    // Apply updates
    Object.assign(booking, updateData);
    await booking.save();

    res.status(200).json(booking);
  })
);

// Delete booking (admin only)
router.delete("/:id", verifyToken, asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Verify admin status
  const user = await User.findById(req.userId);
  const isAdmin = user && ["admin", "superAdmin"].includes(user.role);

  if (!isAdmin) {
    return res.status(403).json({ message: "Access denied. Only admins can delete bookings." });
  }

  // Update hotel analytics
  await Hotel.findByIdAndUpdate(booking.hotelId, {
    $inc: {
      totalBookings: -1,
      totalRevenue: -(booking.totalCost || 0),
    },
  });

  // Update user analytics
  await User.findByIdAndUpdate(booking.userId, {
    $inc: {
      totalBookings: -1,
      totalSpent: -(booking.totalCost || 0),
    },
  });

  res.status(200).json({ message: "Booking deleted successfully" });
}));

// Verify booking by resort owner
router.patch(
  "/:id/verify-by-owner",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { verified, verificationNote } = req.body;
    
    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Get the hotel to check ownership
    const hotel = await Hotel.findById(booking.hotelId);
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
    
    await booking.save();
    
    res.status(200).json({
      message: verified ? "Booking verified successfully" : "Booking verification rejected",
      booking
    });
  })
);

// User edit booking - Reschedule booking (change dates)
router.patch(
  "/:id/reschedule",
  verifyToken,
  [
    body("checkIn").isISO8601().toDate().withMessage("Valid check-in date is required"),
    body("checkOut").isISO8601().toDate().withMessage("Valid check-out date is required"),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg || "Validation error" });
    }

    const { id } = req.params;
    const { checkIn, checkOut, reason } = req.body;
    
    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check if the user owns this booking
    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Check and update booking status based on 8-hour window
    await checkAndUpdateBookingStatus(booking);
    
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
    
    await booking.save();
    
    res.status(200).json({
      message: "Booking rescheduled successfully",
      booking
    });
  })
);

// User add rooms/amenities to existing booking
router.patch(
  "/:id/add-items",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { selectedRooms, selectedCottages, selectedAmenities, additionalAmount } = req.body;
    
    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check if the user owns this booking
    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Check and update booking status based on 8-hour window
    await checkAndUpdateBookingStatus(booking);
    
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
      addedRooms: selectedRooms?.length || 0,
      addedCottages: selectedCottages?.length || 0,
      addedAmenities: selectedAmenities?.length || 0,
      additionalAmount: additionalAmount || 0,
      modifiedAt: new Date()
    });
    
    await booking.save();
    
    res.status(200).json({
      message: "Items added to booking successfully",
      booking
    });
  })
);

// User remove items from booking
router.patch(
  "/:id/remove-items",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { removeRoomIds, removeCottageIds, removeAmenityIds, refundAmount } = req.body;
    
    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check if the user owns this booking
    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Check and update booking status based on 8-hour window
    await checkAndUpdateBookingStatus(booking);
    
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
      booking.selectedRooms = booking.selectedRooms.filter(
        (room) => !removeRoomIds.includes(room.id)
      );
    }
    
    // Remove cottages
    if (removeCottageIds && removeCottageIds.length > 0 && booking.selectedCottages) {
      booking.selectedCottages = booking.selectedCottages.filter(
        (cottage) => !removeCottageIds.includes(cottage.id)
      );
    }
    
    // Remove amenities
    if (removeAmenityIds && removeAmenityIds.length > 0 && booking.selectedAmenities) {
      booking.selectedAmenities = booking.selectedAmenities.filter(
        (amenity) => !removeAmenityIds.includes(amenity.id)
      );
    }
    
    // Update total cost
    if (refundAmount) {
      booking.totalCost = Math.max(0, (booking.totalCost || 0) - refundAmount);
    }
    
    // Add modification history
    booking.modificationHistory = booking.modificationHistory || [];
    booking.modificationHistory.push({
      type: "remove_items",
      removedRooms: removeRoomIds?.length || 0,
      removedCottages: removeCottageIds?.length || 0,
      removedAmenities: removeAmenityIds?.length || 0,
      refundAmount: refundAmount || 0,
      modifiedAt: new Date()
    });
    
    await booking.save();
    
    res.status(200).json({
      message: "Items removed from booking successfully",
      booking
    });
  })
);

// Verify GCash payment endpoint
router.patch(
  "/:id/gcash/verify",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.id;
    const { status, rejectionReason } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(bookingId);
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
    } else {
      booking.paymentStatus = "failed";
      booking.status = "cancelled";
      booking.cancellationReason = rejectionReason || "GCash payment rejected";
    }

    await booking.save();

    res.status(200).json({
      message: `GCash payment ${status} successfully`,
      booking
    });
  })
);

// Check if payment intent is already used
router.get(
  "/check-payment-intent/:paymentIntentId",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentIntentId } = req.params;

    try {
      // Disable caching for this endpoint
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      console.log("=== PAYMENT INTENT CHECK DEBUG ===");
      console.log("Payment Intent ID:", paymentIntentId);
      console.log("Request from user:", req.userId);
      
      const existingBooking = await Booking.findOne({ paymentIntentId });
      
      console.log("Existing booking found:", !!existingBooking);
      if (existingBooking) {
        console.log("Booking ID:", existingBooking._id);
        console.log("Hotel ID:", existingBooking.hotelId);
        console.log("User ID:", existingBooking.userId);
        console.log("Status:", existingBooking.status);
        console.log("Created at:", existingBooking.createdAt);
      }
      
      const response = {
        exists: !!existingBooking,
        bookingId: existingBooking?._id
      };
      
      console.log("Response:", response);
      console.log("=== END PAYMENT INTENT CHECK DEBUG ===");
      
      res.status(200).json(response);
    } catch (error) {
      console.error("Error checking payment intent:", error);
      res.status(500).json({ message: "Error checking payment intent" });
    }
  })
);

// Temporary endpoint to clear problematic payment intent
router.delete(
  "/cleanup-payment-intent/:paymentIntentId",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentIntentId } = req.params;

    try {
      console.log("=== CLEANUP PAYMENT INTENT ===");
      console.log("Payment Intent ID:", paymentIntentId);
      console.log("Request from user:", req.userId);
      
      // Find and remove the payment intent from existing booking
      const result = await Booking.updateOne(
        { paymentIntentId },
        { $unset: { paymentIntentId: "" } }
      );
      
      console.log("Update result:", result);
      console.log("=== END CLEANUP ===");
      
      res.status(200).json({
        message: "Payment intent cleanup completed",
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error("Error cleaning up payment intent:", error);
      res.status(500).json({ message: "Error cleaning up payment intent" });
    }
  })
);

// Test endpoint to verify logging
router.get(
  "/test-logging",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    console.log("=== TEST LOGGING WORKING ===");
    console.log("User ID:", req.userId);
    console.log("Timestamp:", new Date().toISOString());
    console.log("=== END TEST LOGGING ===");
    
    res.status(200).json({ message: "Logging test successful" });
  })
);

export default router;

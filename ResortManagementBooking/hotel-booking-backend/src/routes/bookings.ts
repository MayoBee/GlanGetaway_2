import express, { Request, Response } from "express";
import Booking from "../models/booking";
import Hotel from "../models/hotel";
import User from "../models/user";
import verifyToken from "../middleware/auth";
import { body, param, validationResult } from "express-validator";

const router = express.Router();

// Function to check and update booking status based on 8-hour window
async function checkAndUpdateBookingStatus(booking: any) {
  const now = new Date();
  
  // If booking is still pending and 8-hour window has passed, auto-confirm
  if (booking.status === "pending" && booking.changeWindowDeadline && now > booking.changeWindowDeadline) {
    booking.status = "confirmed";
    booking.canModify = false;
    await booking.save();
    console.log(`Booking ${booking._id} automatically confirmed after 8-hour window`);
  }
}

// Function to check if booking can be modified
function canModifyBooking(booking: any): { canModify: boolean; reason?: string; changeWindowDeadline?: Date; currentTime?: Date } {
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
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

// Get bookings by hotel ID (for hotel owners)
router.get(
  "/hotel/:hotelId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to fetch hotel bookings" });
    }
  }
);

// Get booking by ID
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch booking" });
  }
});

// Update booking status
router.patch(
  "/:id/status",
  verifyToken,
  [
    body("status")
      .isIn(["pending", "confirmed", "cancelled", "completed", "refunded"])
      .withMessage("Invalid status"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg || "Validation error" });
    }

    try {
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
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to update booking" });
    }
  }
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
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg || "Validation error" });
    }

    try {
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
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to update payment status" });
    }
  }
);

// Delete booking (admin only)
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to delete booking" });
  }
});

// Verify booking by resort owner
router.patch(
  "/:id/verify-by-owner",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to verify booking" });
    }
  }
);

// User edit booking - Reschedule booking (change dates)
router.patch(
  "/:id/reschedule",
  verifyToken,
  [
    body("checkIn").isISO8601().toDate().withMessage("Valid check-in date is required"),
    body("checkOut").isISO8601().toDate().withMessage("Valid check-out date is required"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg || "Validation error" });
    }

    try {
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
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to reschedule booking" });
    }
  }
);

// User add rooms/amenities to existing booking
router.patch(
  "/:id/add-items",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to add items to booking" });
    }
  }
);

// User remove items from booking
router.patch(
  "/:id/remove-items",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to remove items from booking" });
    }
  }
);

// Verify GCash payment endpoint
router.patch(
  "/:id/gcash/verify",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      console.error("Error verifying GCash payment:", error);
      res.status(500).json({ message: "Unable to verify GCash payment" });
    }
  }
);

export default router;

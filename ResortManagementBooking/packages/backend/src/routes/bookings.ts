import express, { Request, Response } from "express";
import Booking from "../domains/booking-reservation/models/booking";
import Hotel from "../models/hotel";
import User from "../models/user";
import verifyToken from "../middleware/auth";
import { body, param, query, validationResult } from "express-validator";
import { generateReceiptData, generateHTMLReceipt, generateTextReceipt } from "../utils/receiptGenerator";

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
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate("hotelId", "name city country");

    res.status(200).json(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

// Filter bookings (admin only)
router.get("/filter", verifyToken, async (req: Request, res: Response) => {
  try {
    const { resortId, status, startDate, endDate } = req.query;

    const query: any = {};

    if (resortId) {
      query.hotelId = resortId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) {
        query.checkIn.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.checkIn.$lte = new Date(endDate as string);
      }
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate("hotelId")
      .populate("userId");

    res.status(200).json(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch filtered bookings" });
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
      "name city country imageUrls"
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
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

      const updateData: any = { status };
      if (status === "cancelled" && cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }
      if (status === "refunded") {
        updateData.refundAmount = req.body.refundAmount || 0;
      }

      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

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

      const updateData: any = { paymentStatus };
      if (paymentMethod) {
        updateData.paymentMethod = paymentMethod;
      }

      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

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
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
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

// Create walk-in booking (resort owner/staff only)
router.post(
  "/walk-in",
  verifyToken,
  [
    body("hotelId").notEmpty().withMessage("Hotel ID is required"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").notEmpty().withMessage("Phone number is required"),
    body("adultCount").isInt({ min: 1 }).withMessage("Adult count must be at least 1"),
    body("childCount").isInt({ min: 0 }).withMessage("Child count must be non-negative"),
    body("checkIn").isISO8601().toDate().withMessage("Valid check-in date is required"),
    body("checkOut").isISO8601().toDate().withMessage("Valid check-out date is required"),
    body("selectedRooms").isArray().withMessage("Selected rooms must be an array"),
    body("walkInDetails.paymentMethod").isIn(["cash", "card", "gcash", "other"]).withMessage("Invalid payment method"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg || "Validation error" });
    }

    try {
      const {
        hotelId,
        firstName,
        lastName,
        email,
        phone,
        adultCount,
        childCount,
        checkIn,
        checkOut,
        checkInTime,
        checkOutTime,
        selectedRooms,
        selectedCottages,
        selectedAmenities,
        walkInDetails,
        specialRequests,
        isPwdBooking,
        isSeniorCitizenBooking,
      } = req.body;

      // Verify the hotel belongs to the authenticated user (resort owner)
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      if (hotel.userId !== req.userId) {
        return res.status(403).json({ message: "Access denied. Only resort owners can create walk-in bookings." });
      }

      // Calculate total cost
      let totalCost = 0;
      let basePrice = 0;

      if (selectedRooms && selectedRooms.length > 0) {
        selectedRooms.forEach((room: any) => {
          const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
          const roomCost = room.pricePerNight * nights;
          totalCost += roomCost;
          basePrice += roomCost;
        });
      }

      if (selectedCottages && selectedCottages.length > 0) {
        selectedCottages.forEach((cottage: any) => {
          const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
          const cottageCost = cottage.pricePerNight * nights;
          totalCost += cottageCost;
          basePrice += cottageCost;
        });
      }

      if (selectedAmenities && selectedAmenities.length > 0) {
        selectedAmenities.forEach((amenity: any) => {
          totalCost += amenity.price;
        });
      }

      // Apply discounts if applicable
      let discountApplied = null;
      if (isPwdBooking || isSeniorCitizenBooking) {
        const discountPercentage = isPwdBooking ? 0.20 : 0.12; // 20% for PWD, 12% for Senior
        const discountAmount = totalCost * discountPercentage;
        totalCost -= discountAmount;
        discountApplied = {
          type: isPwdBooking ? "pwd" : "senior_citizen",
          percentage: discountPercentage * 100,
          amount: discountAmount,
        };
      }

      // Create walk-in booking
      const newBooking = new Booking({
        userId: undefined, // Walk-in bookings may not have a user account
        hotelId,
        firstName,
        lastName,
        email,
        phone,
        adultCount,
        childCount,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        checkInTime: checkInTime || "12:00",
        checkOutTime: checkOutTime || "11:00",
        totalCost,
        basePrice,
        selectedRooms: selectedRooms || [],
        selectedCottages: selectedCottages || [],
        selectedAmenities: selectedAmenities || [],
        status: "confirmed", // Walk-ins are immediately confirmed
        paymentStatus: "paid", // Walk-ins are paid on-site
        paymentMethod: walkInDetails.paymentMethod,
        specialRequests: specialRequests || "",
        isPwdBooking: isPwdBooking || false,
        isSeniorCitizenBooking: isSeniorCitizenBooking || false,
        discountApplied,
        source: "walk_in", // Mark as walk-in booking
        walkInDetails: {
          guestId: walkInDetails.guestId,
          paymentMethod: walkInDetails.paymentMethod,
          idType: walkInDetails.idType,
          idNumber: walkInDetails.idNumber,
          notes: walkInDetails.notes,
          processedByStaffId: req.userId, // Staff member who created the booking
        },
        canModify: false, // Walk-ins cannot be modified online
        verifiedByOwner: true, // Auto-verified by owner since processed on-site
        ownerVerificationNote: "Walk-in booking processed on-site",
        ownerVerifiedAt: new Date(),
      });

      await newBooking.save();

      // Update hotel analytics
      await Hotel.findByIdAndUpdate(hotelId, {
        $inc: {
          totalBookings: 1,
          totalRevenue: totalCost,
        },
      });

      // Update user analytics if user account exists
      if (req.userId) {
        await User.findByIdAndUpdate(req.userId, {
          $inc: {
            totalBookings: 1,
            totalSpent: totalCost,
          },
        });
      }

      res.status(201).json({
        message: "Walk-in booking created successfully",
        booking: newBooking,
      });
    } catch (error) {
      console.error("Error creating walk-in booking:", error);
      res.status(500).json({ message: "Unable to create walk-in booking" });
    }
  }
);

// Generate receipt for booking
router.get(
  "/:id/receipt",
  verifyToken,
  [
    param("id").notEmpty().withMessage("Booking ID is required"),
    query("format").optional().isIn(["html", "json", "text"]).withMessage("Invalid format"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg || "Validation error" });
    }

    try {
      const { id } = req.params;
      const format = (req.query.format as string) || "json";

      const booking = await Booking.findById(id).populate("hotelId", "name city country");
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user has access to this booking
      const hotel = await Hotel.findById(booking.hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Allow access if: booking owner, hotel owner, or admin
      const isBookingOwner = booking.userId && booking.userId.toString() === req.userId;
      const isHotelOwner = hotel.userId === req.userId;
      
      if (!isBookingOwner && !isHotelOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate receipt data
      const hotelAddress = `${hotel.city}, ${hotel.country}`;
      const receiptData = generateReceiptData(booking, hotel.name, hotelAddress);

      // Return based on requested format
      if (format === "html") {
        res.setHeader("Content-Type", "text/html");
        res.send(generateHTMLReceipt(receiptData));
      } else if (format === "text") {
        res.setHeader("Content-Type", "text/plain");
        res.send(generateTextReceipt(receiptData));
      } else {
        res.json(receiptData);
      }
    } catch (error) {
      console.error("Error generating receipt:", error);
      res.status(500).json({ message: "Unable to generate receipt" });
    }
  }
);

export default router;

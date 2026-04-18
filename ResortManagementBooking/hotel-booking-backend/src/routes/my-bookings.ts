import express, { Request, Response } from "express";
import mongoose from "mongoose";
import verifyToken from "../middleware/auth";
import Hotel from "../models/hotel";
import Booking from "../models/booking";

const router = express.Router();

// /api/my-bookings
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // First, get all bookings for this user
    const bookings = await Booking.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
    
    if (!bookings || bookings.length === 0) {
      return res.status(200).json([]);
    }
    
    // Group bookings by hotelId
    const hotelBookingsMap = new Map();
    
    for (const booking of bookings) {
      const hotelId = booking.hotelId?.toString();
      if (!hotelId) continue;
      
      if (!hotelBookingsMap.has(hotelId)) {
        // Fetch hotel info
        const hotel = await Hotel.findById(hotelId).lean();
        if (hotel) {
          hotelBookingsMap.set(hotelId, {
            ...hotel,
            bookings: []
          });
        }
      }
      
      const hotelData = hotelBookingsMap.get(hotelId);
      if (hotelData) {
        hotelData.bookings.push(booking);
      }
    }
    
    // Convert map to array
    const results = Array.from(hotelBookingsMap.values());
    
    res.status(200).send(results);
  } catch (error) {
    console.log("Error fetching bookings:", error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

// DELETE /api/my-bookings/:bookingId
router.delete("/:bookingId", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find the booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check if the booking belongs to the user
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own bookings" });
    }
    
    // Check if the booking is confirmed by resort owner or cancelled
    if (booking.status !== "confirmed" && booking.status !== "cancelled") {
      return res.status(400).json({ 
        message: "You can only delete bookings that have been confirmed by the resort owner or have been cancelled" 
      });
    }
    
    // Delete the booking
    await Booking.findByIdAndDelete(bookingId);
    
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.log("Error deleting booking:", error);
    res.status(500).json({ message: "Unable to delete booking" });
  }
});

// PUT /api/my-bookings/:bookingId
router.put("/:bookingId", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.params;
    const updateData = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find the booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check if the booking belongs to the user
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only update your own bookings" });
    }
    
    // Check if the booking is still pending (can only edit pending bookings)
    if (booking.status !== "pending") {
      return res.status(400).json({ 
        message: "You can only edit bookings that are still pending confirmation" 
      });
    }
    
    // Check 8-hour window for modifications
    const bookingTime = new Date(booking.createdAt || booking.checkIn);
    const currentTime = new Date();
    const hoursSinceBooking = (currentTime.getTime() - bookingTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceBooking > 8) {
      return res.status(400).json({ 
        message: "Booking modifications are only allowed within 8 hours of making the reservation" 
      });
    }
    
    // Update the booking with new data
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedBooking);
  } catch (error) {
    console.log("Error updating booking:", error);
    res.status(500).json({ message: "Unable to update booking" });
  }
});

export default router;

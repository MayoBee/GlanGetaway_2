import express, { Request, Response } from "express";
import Billing from "../models/billing";
import Booking from "../models/booking";
import { verifyToken, requireRole } from "../middleware/role-based-auth";

const router = express.Router();

// Generate folio number
const generateFolioNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FOLIO-${timestamp}-${random}`;
};

// Get all billing records
router.get("/", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, paymentStatus, status, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (hotelId) filter.hotelId = hotelId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (status) filter.status = status;

    const billings = await Billing.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Billing.countDocuments(filter);

    res.json({
      success: true,
      data: billings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching billing records:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get billing by ID
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const billing = await Billing.findById(id);
    if (!billing) {
      return res.status(404).json({ success: false, message: "Billing record not found" });
    }

    res.json({
      success: true,
      data: billing,
    });
  } catch (error) {
    console.error("Error fetching billing:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get billing by booking ID
router.get("/booking/:bookingId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    let billing = await Billing.findOne({ bookingId });

    if (!billing) {
      // Create a new billing record from booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
      }

      const nights = Math.ceil(
        (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
      );

      const roomCharges = (booking.selectedRooms || []).map(room => ({
        description: `${room.name} - ${room.type}`,
        roomNumber: room.name,
        nights,
        rate: room.pricePerNight,
        amount: room.pricePerNight * nights,
      }));

      const amenityCharges = (booking.selectedAmenities || []).map(amenity => ({
        amenityId: amenity.id,
        amenityName: amenity.name,
        date: new Date(),
        quantity: 1,
        rate: amenity.price,
        amount: amenity.price,
      }));

      const subtotal = roomCharges.reduce((sum, rc) => sum + rc.amount, 0) + 
                       amenityCharges.reduce((sum, ac) => sum + ac.amount, 0);
      const taxAmount = subtotal * 0.12;
      const totalAmount = subtotal + taxAmount;

      billing = new Billing({
        hotelId: booking.hotelId,
        bookingId: booking._id.toString(),
        guestId: booking.userId,
        guestName: `${booking.firstName} ${booking.lastName}`,
        roomCharges,
        amenityCharges,
        subtotal,
        taxRate: 0.12,
        taxAmount,
        totalAmount,
        balanceDue: totalAmount,
        folioNumber: generateFolioNumber(),
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
      });

      await billing.save();
    }

    res.json({
      success: true,
      data: billing,
    });
  } catch (error) {
    console.error("Error fetching billing by booking:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Add charge to billing
router.post("/:id/charges", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, charge } = req.body; // type: 'room' | 'amenity' | 'activity' | 'service'

    const billing = await Billing.findById(id);
    if (!billing) {
      return res.status(404).json({ success: false, message: "Billing record not found" });
    }

    switch (type) {
      case "room":
        billing.roomCharges.push(charge);
        break;
      case "amenity":
        billing.amenityCharges.push(charge);
        break;
      case "activity":
        billing.activityCharges.push(charge);
        break;
      case "service":
        billing.serviceCharges.push(charge);
        break;
    }

    // Recalculate totals
    billing.subtotal = 
      billing.roomCharges.reduce((sum, rc) => sum + rc.amount, 0) +
      billing.amenityCharges.reduce((sum, ac) => sum + ac.amount, 0) +
      billing.activityCharges.reduce((sum, ac) => sum + ac.amount, 0) +
      billing.serviceCharges.reduce((sum, sc) => sum + sc.amount, 0);
    
    // Apply discounts
    const discountTotal = billing.discounts.reduce((sum, d) => sum + d.amount, 0);
    billing.subtotal -= discountTotal;
    
    billing.taxAmount = billing.subtotal * billing.taxRate;
    billing.totalAmount = billing.subtotal + billing.taxAmount;
    billing.balanceDue = billing.totalAmount - billing.totalPaid;

    await billing.save();

    res.json({
      success: true,
      message: "Charge added successfully",
      data: billing,
    });
  } catch (error) {
    console.error("Error adding charge:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Add discount to billing
router.post("/:id/discounts", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, type, amount } = req.body;

    const billing = await Billing.findById(id);
    if (!billing) {
      return res.status(404).json({ success: false, message: "Billing record not found" });
    }

    billing.discounts.push({ code, type, amount });

    // Recalculate totals
    const subtotalBeforeDiscount = 
      billing.roomCharges.reduce((sum, rc) => sum + rc.amount, 0) +
      billing.amenityCharges.reduce((sum, ac) => sum + ac.amount, 0) +
      billing.activityCharges.reduce((sum, ac) => sum + ac.amount, 0) +
      billing.serviceCharges.reduce((sum, sc) => sum + sc.amount, 0);
    
    const discountTotal = billing.discounts.reduce((sum, d) => sum + d.amount, 0);
    billing.subtotal = subtotalBeforeDiscount - discountTotal;
    billing.taxAmount = billing.subtotal * billing.taxRate;
    billing.totalAmount = billing.subtotal + billing.taxAmount;
    billing.balanceDue = billing.totalAmount - billing.totalPaid;

    await billing.save();

    res.json({
      success: true,
      message: "Discount applied successfully",
      data: billing,
    });
  } catch (error) {
    console.error("Error adding discount:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Process payment
router.post("/:id/payments", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, amount, referenceNumber } = req.body;

    const billing = await Billing.findById(id);
    if (!billing) {
      return res.status(404).json({ success: false, message: "Billing record not found" });
    }

    const payment = {
      paymentId: `PAY-${Date.now()}`,
      paymentMethod,
      amount,
      referenceNumber,
      processedAt: new Date(),
      processedBy: req.userId,
      status: "completed" as const,
    };

    billing.payments.push(payment);
    billing.totalPaid += amount;
    billing.balanceDue = billing.totalAmount - billing.totalPaid;

    // Update payment status
    if (billing.balanceDue <= 0) {
      billing.paymentStatus = "paid";
    } else if (billing.totalPaid > 0) {
      billing.paymentStatus = "partial";
    }

    await billing.save();

    res.json({
      success: true,
      message: "Payment processed successfully",
      data: billing,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Close folio
router.post("/:id/close", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const billing = await Billing.findById(id);
    if (!billing) {
      return res.status(404).json({ success: false, message: "Billing record not found" });
    }

    // Only allow closing if fully paid
    if (billing.balanceDue > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot close folio with outstanding balance" 
      });
    }

    billing.status = "closed";
    if (notes) billing.notes = notes;

    await billing.save();

    // Update booking status to completed if applicable
    await Booking.findByIdAndUpdate(billing.bookingId, { status: "completed" });

    res.json({
      success: true,
      message: "Folio closed successfully",
      data: billing,
    });
  } catch (error) {
    console.error("Error closing folio:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Generate receipt
router.get("/:id/receipt", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const billing = await Billing.findById(id);
    if (!billing) {
      return res.status(404).json({ success: false, message: "Billing record not found" });
    }

    // Generate receipt data
    const receipt = {
      folioNumber: billing.folioNumber,
      guestName: billing.guestName,
      checkInDate: billing.checkInDate,
      checkOutDate: billing.checkOutDate,
      roomCharges: billing.roomCharges,
      amenityCharges: billing.amenityCharges,
      activityCharges: billing.activityCharges,
      serviceCharges: billing.serviceCharges,
      discounts: billing.discounts,
      subtotal: billing.subtotal,
      taxRate: billing.taxRate,
      taxAmount: billing.taxAmount,
      totalAmount: billing.totalAmount,
      payments: billing.payments,
      totalPaid: billing.totalPaid,
      balanceDue: billing.balanceDue,
      generatedAt: new Date(),
    };

    res.json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

import express, { Request, Response } from "express";
import Pricing from "../models/pricing";
import { verifyToken, requireRole } from "../middleware/role-based-auth";
import { check, validationResult } from "express-validator";

const router = express.Router();

// Get pricing configuration for a hotel
router.get("/:hotelId", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;

    let pricing = await Pricing.findOne({ hotelId });

    if (!pricing) {
      // Create default pricing if not exists
      pricing = new Pricing({ hotelId });
      await pricing.save();
    }

    res.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update pricing configuration
router.put("/:hotelId", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const updates = req.body;

    let pricing = await Pricing.findOne({ hotelId });

    if (!pricing) {
      pricing = new Pricing({ hotelId, ...updates });
    } else {
      // Update specific sections
      if (updates.seasonalRates) {
        pricing.seasonalRates = updates.seasonalRates;
      }
      if (updates.eventPricing) {
        pricing.eventPricing = updates.eventPricing;
      }
      if (updates.discounts) {
        pricing.discounts = updates.discounts;
      }
      if (updates.pricingRules) {
        pricing.pricingRules = updates.pricingRules;
      }
    }

    await pricing.save();

    res.json({
      success: true,
      message: "Pricing updated successfully",
      data: pricing,
    });
  } catch (error) {
    console.error("Error updating pricing:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Add seasonal rate
router.post("/:hotelId/seasonal-rates", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { name, startDate, endDate, multiplier, description, isActive } = req.body;

    const pricing = await Pricing.findOne({ hotelId });
    if (!pricing) {
      return res.status(404).json({ success: false, message: "Pricing configuration not found" });
    }

    pricing.seasonalRates.push({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      multiplier,
      description,
      isActive: isActive !== false,
    });

    await pricing.save();

    res.status(201).json({
      success: true,
      message: "Seasonal rate added successfully",
      data: pricing,
    });
  } catch (error) {
    console.error("Error adding seasonal rate:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update seasonal rate
router.put("/:hotelId/seasonal-rates/:rateId", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, rateId } = req.params;
    const updates = req.body;

    const pricing = await Pricing.findOne({ hotelId });
    if (!pricing) {
      return res.status(404).json({ success: false, message: "Pricing configuration not found" });
    }

    const rateIndex = pricing.seasonalRates.findIndex((r, index) => index.toString() === rateId);
    if (rateIndex === -1) {
      return res.status(404).json({ success: false, message: "Seasonal rate not found" });
    }

    Object.assign(pricing.seasonalRates[rateIndex], updates);
    await pricing.save();

    res.json({
      success: true,
      message: "Seasonal rate updated successfully",
      data: pricing,
    });
  } catch (error) {
    console.error("Error updating seasonal rate:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Delete seasonal rate
router.delete("/:hotelId/seasonal-rates/:rateId", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, rateId } = req.params;

    const pricing = await Pricing.findOne({ hotelId });
    if (!pricing) {
      return res.status(404).json({ success: false, message: "Pricing configuration not found" });
    }

    pricing.seasonalRates = pricing.seasonalRates.filter((r, index) => index.toString() !== rateId);
    await pricing.save();

    res.json({
      success: true,
      message: "Seasonal rate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting seasonal rate:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Add discount
router.post("/:hotelId/discounts", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const discountData = req.body;

    const pricing = await Pricing.findOne({ hotelId });
    if (!pricing) {
      return res.status(404).json({ success: false, message: "Pricing configuration not found" });
    }

    // Check if discount code already exists
    const existingCode = pricing.discounts.find(d => d.code === discountData.code);
    if (existingCode) {
      return res.status(400).json({ success: false, message: "Discount code already exists" });
    }

    pricing.discounts.push({
      ...discountData,
      currentUses: 0,
      validFrom: new Date(discountData.validFrom),
      validUntil: new Date(discountData.validUntil),
    });

    await pricing.save();

    res.status(201).json({
      success: true,
      message: "Discount added successfully",
      data: pricing,
    });
  } catch (error) {
    console.error("Error adding discount:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Validate discount code
router.post("/validate-discount", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId, code, bookingAmount, roomTypes } = req.body;

    const pricing = await Pricing.findOne({ hotelId });
    if (!pricing) {
      return res.status(404).json({ success: false, message: "Pricing configuration not found" });
    }

    const now = new Date();
    const discount = pricing.discounts.find(d => 
      d.code === code && 
      d.isActive && 
      d.validFrom <= now && 
      d.validUntil >= now &&
      (d.maxUses === 0 || d.currentUses < d.maxUses)
    );

    if (!discount) {
      return res.status(400).json({ success: false, message: "Invalid or expired discount code" });
    }

    // Check minimum booking amount
    if (bookingAmount && bookingAmount < discount.minBookingAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum booking amount of ${discount.minBookingAmount} required for this discount` 
      });
    }

    // Check room type applicability
    if (roomTypes && discount.applicableRoomTypes.length > 0) {
      const isApplicable = roomTypes.some((rt: string) => discount.applicableRoomTypes.includes(rt));
      if (!isApplicable) {
        return res.status(400).json({ 
          success: false, 
          message: "This discount is not applicable to the selected room types" 
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === "percentage") {
      discountAmount = bookingAmount * (discount.value / 100);
      if (discount.maxDiscount) {
        discountAmount = Math.min(discountAmount, discount.maxDiscount);
      }
    } else {
      discountAmount = discount.value;
    }

    res.json({
      success: true,
      data: {
        code: discount.code,
        name: discount.name,
        discountType: discount.type,
        discountValue: discount.value,
        discountAmount,
        discountCategory: discount.discountCategory,
        requiredDocuments: discount.requiredDocuments,
      },
    });
  } catch (error) {
    console.error("Error validating discount:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Apply discount (increment usage count)
router.post("/:hotelId/discounts/:code/apply", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, code } = req.params;

    const pricing = await Pricing.findOne({ hotelId });
    if (!pricing) {
      return res.status(404).json({ success: false, message: "Pricing configuration not found" });
    }

    const discount = pricing.discounts.find(d => d.code === code);
    if (!discount) {
      return res.status(404).json({ success: false, message: "Discount not found" });
    }

    if (discount.maxUses > 0 && discount.currentUses >= discount.maxUses) {
      return res.status(400).json({ success: false, message: "Discount usage limit reached" });
    }

    discount.currentUses += 1;
    await pricing.save();

    res.json({
      success: true,
      message: "Discount applied successfully",
    });
  } catch (error) {
    console.error("Error applying discount:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Delete discount
router.delete("/:hotelId/discounts/:discountId", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, discountId } = req.params;

    const pricing = await Pricing.findOne({ hotelId });
    if (!pricing) {
      return res.status(404).json({ success: false, message: "Pricing configuration not found" });
    }

    pricing.discounts = pricing.discounts.filter((d, index) => index.toString() !== discountId);
    await pricing.save();

    res.json({
      success: true,
      message: "Discount deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting discount:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Calculate room price with all applicable pricing
router.post("/calculate-price", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId, roomId, basePrice, checkInDate, checkOutDate, discountCode } = req.body;

    const pricing = await Pricing.findOne({ hotelId });
    if (!pricing) {
      return res.json({ success: true, data: { finalPrice: basePrice, breakdown: [] } });
    }

    let finalPrice = basePrice;
    const breakdown: any[] = [];

    // Calculate number of nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Apply seasonal rates
    const now = new Date();
    const applicableSeasonalRate = pricing.seasonalRates.find(sr => 
      sr.isActive && 
      sr.startDate <= now && 
      sr.endDate >= now
    );

    if (applicableSeasonalRate) {
      const seasonalMultiplier = applicableSeasonalRate.multiplier;
      const seasonalPrice = basePrice * seasonalMultiplier;
      const seasonalIncrease = seasonalPrice - basePrice;
      finalPrice += seasonalIncrease;
      breakdown.push({
        type: "seasonal",
        name: applicableSeasonalRate.name,
        multiplier: seasonalMultiplier,
        amount: seasonalIncrease * nights,
      });
    }

    // Apply event pricing
    const applicableEventPricing = pricing.eventPricing.find(ep => 
      ep.isActive && 
      ep.startDate <= now && 
      ep.endDate >= now
    );

    if (applicableEventPricing) {
      let eventIncrease = 0;
      if (applicableEventPricing.percentageIncrease) {
        eventIncrease = basePrice * (applicableEventPricing.percentageIncrease / 100);
      } else if (applicableEventPricing.flatRate) {
        eventIncrease = applicableEventPricing.flatRate;
      }
      finalPrice += eventIncrease;
      breakdown.push({
        type: "event",
        name: applicableEventPricing.name,
        amount: eventIncrease * nights,
      });
    }

    // Apply discount code if provided
    if (discountCode) {
      const discount = pricing.discounts.find(d => 
        d.code === discountCode && 
        d.isActive && 
        d.validFrom <= now && 
        d.validUntil >= now
      );

      if (discount) {
        let discountAmount = 0;
        if (discount.type === "percentage") {
          discountAmount = finalPrice * (discount.value / 100);
          if (discount.maxDiscount) {
            discountAmount = Math.min(discountAmount, discount.maxDiscount);
          }
        } else {
          discountAmount = discount.value;
        }
        finalPrice -= discountAmount;
        finalPrice = Math.max(0, finalPrice);
        breakdown.push({
          type: "discount",
          name: discount.name,
          code: discountCode,
          amount: -discountAmount,
        });
      }
    }

    res.json({
      success: true,
      data: {
        basePrice,
        finalPrice: finalPrice * nights,
        perNight: finalPrice,
        nights,
        breakdown,
      },
    });
  } catch (error) {
    console.error("Error calculating price:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

import express, { Request, Response } from "express";
import Amenity from "../models/amenity";
import Activity from "../models/activity";
import { verifyToken, requireRole } from "../middleware/role-based-auth";
import { check, validationResult } from "express-validator";

const router = express.Router();

// ==================== AMENITIES ====================

// Get all amenities
router.get("/amenities", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, type, status, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (hotelId) filter.hotelId = hotelId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const amenities = await Amenity.find(filter)
      .sort({ name: 1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Amenity.countDocuments(filter);

    res.json({
      success: true,
      data: amenities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching amenities:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get amenity by ID
router.get("/amenities/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const amenity = await Amenity.findById(id);
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }

    res.json({
      success: true,
      data: amenity,
    });
  } catch (error) {
    console.error("Error fetching amenity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Create amenity
router.post("/amenities", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const amenityData = req.body;

    const amenity = new Amenity(amenityData);
    await amenity.save();

    res.status(201).json({
      success: true,
      message: "Amenity created successfully",
      data: amenity,
    });
  } catch (error) {
    console.error("Error creating amenity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update amenity
router.put("/amenities/:id", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const amenity = await Amenity.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }

    res.json({
      success: true,
      message: "Amenity updated successfully",
      data: amenity,
    });
  } catch (error) {
    console.error("Error updating amenity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update amenity status
router.patch("/amenities/:id/status", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const amenity = await Amenity.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }

    res.json({
      success: true,
      message: "Amenity status updated successfully",
      data: amenity,
    });
  } catch (error) {
    console.error("Error updating amenity status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Delete amenity
router.delete("/amenities/:id", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const amenity = await Amenity.findByIdAndDelete(id);
    
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }

    res.json({
      success: true,
      message: "Amenity deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting amenity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==================== ACTIVITIES ====================

// Get all activities
router.get("/activities", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, type, status, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (hotelId) filter.hotelId = hotelId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const activities = await Activity.find(filter)
      .sort({ name: 1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Activity.countDocuments(filter);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get activity by ID
router.get("/activities/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Create activity
router.post("/activities", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const activityData = req.body;

    const activity = new Activity(activityData);
    await activity.save();

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update activity
router.put("/activities/:id", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const activity = await Activity.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    res.json({
      success: true,
      message: "Activity updated successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update activity status
router.patch("/activities/:id/status", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const activity = await Activity.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    res.json({
      success: true,
      message: "Activity status updated successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Error updating activity status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Delete activity
router.delete("/activities/:id", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByIdAndDelete(id);
    
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    res.json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get availability for amenity on specific date
router.get("/amenities/:id/availability", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const amenity = await Amenity.findById(id);
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }

    // Get existing bookings for this amenity on the date
    // This would query the AmenityBooking model
    
    res.json({
      success: true,
      data: {
        amenity,
        date,
        availableSlots: [], // Would be calculated based on existing bookings
      },
    });
  } catch (error) {
    console.error("Error checking amenity availability:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

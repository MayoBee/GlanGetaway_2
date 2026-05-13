import express, { Request, Response } from "express";
import Room from "../models/room";
import { verifyToken, requireRole } from "../middleware/role-based-auth";
import { check, validationResult } from "express-validator";

const router = express.Router();

// Get all rooms
router.get("/", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, status, roomType, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (hotelId) filter.hotelId = hotelId;
    if (status) filter.status = status;
    if (roomType) filter.roomType = roomType;

    const rooms = await Room.find(filter)
      .sort({ floor: 1, roomNumber: 1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Room.countDocuments(filter);

    res.json({
      success: true,
      data: rooms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get room by ID
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Create a new room
router.post(
  "/",
  verifyToken,
  requireRole(["admin", "resort_owner"]),
  [
    check("hotelId", "Hotel ID is required").isString(),
    check("roomNumber", "Room number is required").isString(),
    check("roomType", "Room type is required").isIn(["standard", "deluxe", "suite", "family", "cottage"]),
    check("description", "Description is required").isString(),
    check("maxOccupancy", "Max occupancy must be a number").isNumeric(),
    check("basePrice", "Base price must be a number").isNumeric(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array() });
    }

    try {
      const roomData = req.body;
      
      // Check if room number already exists for this hotel
      const existingRoom = await Room.findOne({
        hotelId: roomData.hotelId,
        roomNumber: roomData.roomNumber,
      });
      
      if (existingRoom) {
        return res.status(400).json({ success: false, message: "Room number already exists for this hotel" });
      }

      const room = new Room({
        ...roomData,
        currentPrice: roomData.basePrice,
        status: "available",
        housekeepingStatus: "clean",
      });

      await room.save();

      res.status(201).json({
        success: true,
        message: "Room created successfully",
        data: room,
      });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// Update a room
router.put("/:id", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow changing hotelId or roomNumber
    delete updates.hotelId;
    delete updates.roomNumber;

    const room = await Room.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update room status
router.patch("/:id/status", verifyToken, requireRole(["admin", "resort_owner", "front_desk", "housekeeping"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, housekeepingStatus } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (housekeepingStatus) updateData.housekeepingStatus = housekeepingStatus;

    const room = await Room.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({
      success: true,
      message: "Room status updated successfully",
      data: room,
    });
  } catch (error) {
    console.error("Error updating room status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Delete a room
router.delete("/:id", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const room = await Room.findByIdAndDelete(id);
    
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get room availability for date range
router.get("/availability/check", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId, checkIn, checkOut, roomType } = req.query;

    if (!hotelId || !checkIn || !checkOut) {
      return res.status(400).json({ success: false, message: "Hotel ID, check-in and check-out dates are required" });
    }

    const filter: any = {
      hotelId: hotelId as string,
      status: { $in: ["available", "reserved"] },
    };

    if (roomType) {
      filter.roomType = roomType;
    }

    const rooms = await Room.find(filter);

    // Get bookings that overlap with the requested dates
    const bookings = await Room.find({
      hotelId: hotelId as string,
      status: "occupied",
      // Add logic to check date overlap
    });

    // Filter out rooms that are booked during the requested period
    const availableRooms = rooms.filter(room => {
      // Add overlap checking logic
      return true; // Simplified for now
    });

    res.json({
      success: true,
      data: {
        totalRooms: rooms.length,
        availableRooms: availableRooms.length,
        rooms: availableRooms,
      },
    });
  } catch (error) {
    console.error("Error checking room availability:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Bulk create rooms
router.post("/bulk", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, rooms } = req.body;

    if (!hotelId || !rooms || !Array.isArray(rooms)) {
      return res.status(400).json({ success: false, message: "Hotel ID and rooms array are required" });
    }

    const createdRooms = [];
    const errors = [];

    for (const roomData of rooms) {
      const existingRoom = await Room.findOne({
        hotelId,
        roomNumber: roomData.roomNumber,
      });

      if (existingRoom) {
        errors.push(`Room ${roomData.roomNumber} already exists`);
        continue;
      }

      const room = new Room({
        ...roomData,
        hotelId,
        currentPrice: roomData.basePrice || roomData.pricePerNight,
        status: "available",
        housekeepingStatus: "clean",
      });

      await room.save();
      createdRooms.push(room);
    }

    res.status(201).json({
      success: true,
      message: `${createdRooms.length} rooms created successfully`,
      data: createdRooms,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error bulk creating rooms:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

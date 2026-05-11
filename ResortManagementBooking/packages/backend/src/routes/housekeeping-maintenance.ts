import express, { Request, Response } from "express";
import Housekeeping from "../models/housekeeping";
import Maintenance from "../models/maintenance";
import Room from "../models/room";
import { verifyToken, requireRole } from "../middleware/role-based-auth";

const router = express.Router();

// ==================== HOUSEKEEPING ====================

// Get all housekeeping tasks
router.get("/housekeeping", verifyToken, requireRole(["admin", "resort_owner", "housekeeping", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, status, priority, assignedTo, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (hotelId) filter.hotelId = hotelId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Housekeeping.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Housekeeping.countDocuments(filter);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching housekeeping tasks:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Create housekeeping task
router.post("/housekeeping", verifyToken, requireRole(["admin", "resort_owner", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const taskData = req.body;

    const task = new Housekeeping(taskData);
    await task.save();

    // Update room status
    if (task.status === "in_progress") {
      await Room.findByIdAndUpdate(task.roomId, { status: "cleaning" });
    }

    res.status(201).json({
      success: true,
      message: "Housekeeping task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error creating housekeeping task:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update housekeeping task
router.put("/housekeeping/:id", verifyToken, requireRole(["admin", "resort_owner", "housekeeping"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Housekeeping.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Update room status based on task status
    if (task.status === "completed") {
      await Room.findByIdAndUpdate(task.roomId, { 
        status: "available",
        housekeepingStatus: "clean",
        lastCleaned: new Date()
      });
    }

    res.json({
      success: true,
      message: "Housekeeping task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error updating housekeeping task:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Assign housekeeping task
router.patch("/housekeeping/:id/assign", verifyToken, requireRole(["admin", "resort_owner", "housekeeping"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedToName } = req.body;

    const task = await Housekeeping.findByIdAndUpdate(
      id,
      { assignedTo, assignedToName, status: "in_progress" },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({
      success: true,
      message: "Task assigned successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error assigning housekeeping task:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Complete housekeeping task
router.patch("/housekeeping/:id/complete", verifyToken, requireRole(["admin", "resort_owner", "housekeeping"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, issues } = req.body;

    const task = await Housekeeping.findByIdAndUpdate(
      id,
      { 
        status: "completed", 
        completedAt: new Date(),
        notes,
        issues 
      },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Update room status
    await Room.findByIdAndUpdate(task.roomId, { 
      status: "available",
      housekeepingStatus: "clean",
      lastCleaned: new Date()
    });

    res.json({
      success: true,
      message: "Task completed successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error completing housekeeping task:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==================== MAINTENANCE ====================

// Get all maintenance requests
router.get("/maintenance", verifyToken, requireRole(["admin", "resort_owner", "housekeeping", "front_desk"]), async (req: Request, res: Response) => {
  try {
    const { hotelId, status, priority, category, assignedTo, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (hotelId) filter.hotelId = hotelId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;

    const requests = await Maintenance.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Maintenance.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get maintenance request by ID
router.get("/maintenance/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const request = await Maintenance.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Maintenance request not found" });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Error fetching maintenance request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Create maintenance request
router.post("/maintenance", verifyToken, async (req: Request, res: Response) => {
  try {
    const requestData = req.body;

    const request = new Maintenance(requestData);
    await request.save();

    // Update room/amenity status if applicable
    if (requestData.roomId) {
      await Room.findByIdAndUpdate(requestData.roomId, { status: "maintenance" });
    }

    res.status(201).json({
      success: true,
      message: "Maintenance request created successfully",
      data: request,
    });
  } catch (error) {
    console.error("Error creating maintenance request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update maintenance request
router.put("/maintenance/:id", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const request = await Maintenance.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    
    if (!request) {
      return res.status(404).json({ success: false, message: "Maintenance request not found" });
    }

    res.json({
      success: true,
      message: "Maintenance request updated successfully",
      data: request,
    });
  } catch (error) {
    console.error("Error updating maintenance request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Assign maintenance request
router.patch("/maintenance/:id/assign", verifyToken, requireRole(["admin", "resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedToName } = req.body;

    const request = await Maintenance.findByIdAndUpdate(
      id,
      { assignedTo, assignedToName, status: "assigned", assignedAt: new Date() },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ success: false, message: "Maintenance request not found" });
    }

    res.json({
      success: true,
      message: "Request assigned successfully",
      data: request,
    });
  } catch (error) {
    console.error("Error assigning maintenance request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Start maintenance work
router.patch("/maintenance/:id/start", verifyToken, requireRole(["admin", "resort_owner", "maintenance"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const request = await Maintenance.findByIdAndUpdate(
      id,
      { status: "in_progress", startedAt: new Date() },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ success: false, message: "Maintenance request not found" });
    }

    res.json({
      success: true,
      message: "Maintenance started",
      data: request,
    });
  } catch (error) {
    console.error("Error starting maintenance:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Complete maintenance request
router.patch("/maintenance/:id/complete", verifyToken, requireRole(["admin", "resort_owner", "maintenance"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actualCost, parts, laborHours, notes } = req.body;

    const request = await Maintenance.findByIdAndUpdate(
      id,
      { 
        status: "completed", 
        completedAt: new Date(),
        actualCost,
        parts,
        laborHours,
        $push: { notes: { $each: notes || [] } }
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ success: false, message: "Maintenance request not found" });
    }

    // Update room/amenity status back to available
    if (request.roomId) {
      await Room.findByIdAndUpdate(request.roomId, { status: "available" });
    }

    res.json({
      success: true,
      message: "Maintenance completed successfully",
      data: request,
    });
  } catch (error) {
    console.error("Error completing maintenance:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Add note to maintenance request
router.post("/maintenance/:id/notes", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, author, authorName } = req.body;

    const request = await Maintenance.findByIdAndUpdate(
      id,
      { 
        $push: { 
          notes: { 
            content, 
            author, 
            authorName, 
            createdAt: new Date() 
          } 
        } 
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ success: false, message: "Maintenance request not found" });
    }

    res.json({
      success: true,
      message: "Note added successfully",
      data: request,
    });
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import HousekeepingTask from "../models/housekeeping-task";
import Room from "../models/room";
import Booking from "../models/booking";

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    (req as any).userId = (decoded as JwtPayload).userId;
    next();
  } catch {
    return res.status(401).json({ message: "unauthorized" });
  }
};

const router = express.Router();

/**
 * POST /api/housekeeping-tasks/create-checkout-task
 * Create a checkout task when guest requests checkout
 */
router.post("/create-checkout-task", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId, bookingId, roomId, roomNumber } = req.body;
    const createdBy = (req as any).userId;

    // Generate unique QR code
    const qrCode = `HK-${hotelId.substring(0, 6)}-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const task = new HousekeepingTask({
      hotelId,
      bookingId,
      roomId,
      roomNumber,
      taskType: "checkout",
      priority: "high",
      status: "pending",
      qrCode,
      qrCodeGeneratedAt: new Date(),
      checklist: (HousekeepingTask as any).getDefaultCheckoutChecklist(),
      scheduledAt: new Date(),
    });

    await task.save();

    // Update room status
    await Room.findByIdAndUpdate(roomId, { status: "cleaning" });

    res.status(201).json({
      message: "Checkout task created",
      task: {
        id: task._id,
        roomNumber: task.roomNumber,
        qrCode: task.qrCode,
        scheduledAt: task.scheduledAt,
      },
    });
  } catch (error) {
    console.error("Error creating checkout task:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
});

/**
 * GET /api/housekeeping-tasks/:hotelId
 * Get tasks for a hotel
 */
router.get("/:hotelId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { status, assignedTo } = req.query;

    const query: any = { hotelId };
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await HousekeepingTask.find(query)
      .sort({ scheduledAt: -1, priority: -1 })
      .limit(50);

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

/**
 * GET /api/housekeeping-tasks/staff/:staffId
 * Get tasks assigned to staff member
 */
router.get("/staff/:staffId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { status } = req.query;

    const query: any = { assignedTo: staffId };
    if (status) query.status = status;
    else query.status = { $in: ["pending", "assigned", "in_progress"] };

    const tasks = await HousekeepingTask.find(query)
      .sort({ scheduledAt: 1, priority: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch staff tasks" });
  }
});

/**
 * POST /api/housekeeping-tasks/:taskId/scan
 * Scan QR code to start task
 */
router.post("/:taskId/scan", verifyToken, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const staffId = (req as any).userId;

    const task = await HousekeepingTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status === "completed") {
      return res.status(400).json({ message: "Task already completed" });
    }

    // Assign and start task
    task.assignedTo = staffId;
    task.status = "in_progress";
    task.qrCodeScannedAt = new Date();
    task.startedAt = new Date();
    await task.save();

    res.json({
      message: "Task started",
      task: {
        id: task._id,
        roomNumber: task.roomNumber,
        taskType: task.taskType,
        checklist: task.checklist,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to scan QR code" });
  }
});

/**
 * POST /api/housekeeping-tasks/:taskId/checklist
 * Update checklist item
 */
router.post("/:taskId/checklist", verifyToken, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { itemIndex, status, notes, photoUrl } = req.body;

    const task = await HousekeepingTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.checklist && task.checklist[itemIndex]) {
      task.checklist[itemIndex].status = status;
      if (notes) task.checklist[itemIndex].notes = notes;
      if (photoUrl) task.checklist[itemIndex].photoUrl = photoUrl;
      task.checklist[itemIndex].completedAt = new Date();
    }

    await task.save();

    res.json({ message: "Checklist updated", checklist: task.checklist });
  } catch (error) {
    res.status(500).json({ message: "Failed to update checklist" });
  }
});

/**
 * POST /api/housekeeping-tasks/:taskId/complete
 * Complete task and trigger refund if applicable
 */
router.post("/:taskId/complete", verifyToken, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { depositAmount, depositMethod, damagesFound, missingItems, damageDescription, barConsumption, completionNotes } = req.body;

    const task = await HousekeepingTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update task status
    task.status = "completed";
    task.completedAt = new Date();
    task.completionNotes = completionNotes;

    // Add inspection details if checkout
    if (task.taskType === "checkout") {
      task.checkoutInspection = {
        guestPresent: false,
        earlyCheckout: false,
        damagesFound: damagesFound || false,
        missingItems: missingItems || false,
        damageDescription,
        barConsumption: barConsumption || [],
      };
    }

    await task.save();

    // If checkout with deposit, process refund
    let refundProcessed = false;
    let refundAmount = 0;

    if (task.taskType === "checkout" && depositAmount && !damagesFound && !missingItems) {
      // Process automatic refund via payment system
      refundProcessed = true;
      refundAmount = depositAmount;

      // Update task with refund info
      task.depositRefund = {
        amount: depositAmount,
        method: depositMethod || "gcash",
        refundedAt: new Date(),
        refundedBy: (req as any).userId,
      };
      await task.save();

      // In production, integrate with payment API to process refund
      console.log(`[Housekeeping] Processing automatic refund of PHP ${depositAmount} for booking ${task.bookingId}`);
    }

    // Update room status
    await Room.findByIdAndUpdate(task.roomId, {
      status: "available",
      housekeepingStatus: "clean",
      lastCleaned: new Date(),
    });

    res.json({
      message: refundProcessed ? "Task completed and refund processed" : "Task completed",
      task: {
        id: task._id,
        status: task.status,
        completedAt: task.completedAt,
        depositRefund: task.depositRefund,
      },
      refundProcessed,
      refundAmount,
    });
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({ message: "Failed to complete task" });
  }
});

/**
 * GET /api/housekeeping-tasks/qr/:qrCode
 * Get task by QR code (for mobile scanning)
 */
router.get("/qr/:qrCode", async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.params;

    const task = await HousekeepingTask.findOne({ qrCode });
    if (!task) {
      return res.status(404).json({ message: "Invalid QR code" });
    }

    res.json({
      task: {
        id: task._id,
        roomNumber: task.roomNumber,
        taskType: task.taskType,
        status: task.status,
        checklist: task.checklist,
        isWeatherLocked: false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task" });
  }
});

/**
 * POST /api/housekeeping-tasks/:taskId/verify
 * Verify completed task (supervisor)
 */
router.post("/:taskId/verify", verifyToken, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const verifiedBy = (req as any).userId;

    const task = await HousekeepingTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status !== "completed") {
      return res.status(400).json({ message: "Task must be completed before verification" });
    }

    task.status = "verified";
    task.verifiedAt = new Date();
    await task.save();

    res.json({ message: "Task verified", task });
  } catch (error) {
    res.status(500).json({ message: "Failed to verify task" });
  }
});

/**
 * GET /api/housekeeping-tasks/stats/:hotelId
 * Get housekeeping statistics
 */
router.get("/stats/:hotelId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    const dateQuery: any = {};
    if (startDate) dateQuery.$gte = new Date(startDate as string);
    if (endDate) dateQuery.$lte = new Date(endDate as string);

    const query: any = { hotelId };
    if (Object.keys(dateQuery).length > 0) query.createdAt = dateQuery;

    const tasks = await HousekeepingTask.find(query);

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      completed: tasks.filter(t => t.status === "completed").length,
      verified: tasks.filter(t => t.status === "verified").length,
      avgCompletionTime: 0, // Calculate based on startedAt and completedAt
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;

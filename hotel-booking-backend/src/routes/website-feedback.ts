import express, { Request, Response } from "express";
import mongoose from "mongoose";
import WebsiteFeedback, { WebsiteFeedbackDocument } from "../models/website-feedback";
import verifyToken from "../middleware/auth";

const router = express.Router();

// Create website feedback
router.post("/", async (req: Request, res: Response) => {
  try {
    const { type, message, email, pageUrl, userAgent, timestamp } = req.body;

    // Validate required fields
    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, message",
      });
    }

    // Validate feedback type
    const validTypes = ["bug", "feature", "issue", "feedback", "compliment"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback type",
      });
    }

    // Get client IP
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    const feedback = new WebsiteFeedback({
      type,
      message,
      email: email || undefined,
      pageUrl: pageUrl || req.headers.referer || "Unknown",
      userAgent: userAgent || req.headers["user-agent"] || "Unknown",
      ipAddress: clientIP as string,
    });

    // Save feedback to database
    await feedback.save();

    // Log feedback for admin monitoring
    console.log(`📝 New Website Feedback [${type.toUpperCase()}]:`);
    console.log(`   ID: ${feedback._id}`);
    console.log(`   Message: ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`);
    console.log(`   Email: ${email || "Not provided"}`);
    console.log(`   Page: ${feedback.pageUrl}`);
    console.log(`   Time: ${feedback.createdAt}`);
    console.log(`   IP: ${feedback.ipAddress}`);
    console.log("---");

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully. Thank you for helping us improve!",
      data: {
        id: feedback._id,
        type: feedback.type,
        timestamp: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving website feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all feedback (authenticated users)
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 10, type } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const feedback = await WebsiteFeedback.find(filter)
      .populate("assignedTo", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await WebsiteFeedback.countDocuments(filter);

    res.json({
      success: true,
      data: feedback,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get feedback statistics (authenticated users)
router.get("/stats", verifyToken, async (req: Request, res: Response) => {
  try {
    const [total, typeStats, statusStats, recent] = await Promise.all([
      WebsiteFeedback.countDocuments(),
      WebsiteFeedback.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]),
      WebsiteFeedback.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      WebsiteFeedback.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("assignedTo", "firstName lastName email")
    ]);

    const byType = typeStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = statusStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        total,
        byType,
        byStatus,
        recent,
      },
    });
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get feedback by ID (authenticated users)
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID",
      });
    }

    const feedback = await WebsiteFeedback.findById(id)
      .populate("assignedTo", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName email");

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update feedback status (authenticated users)
router.put("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, priority, assignedTo } = req.body;
    const adminId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID",
      });
    }

    const validStatuses = ["new", "reviewed", "resolved", "dismissed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "resolved" || status === "dismissed") {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = adminId;
      }
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    if (priority) {
      updateData.priority = priority;
    }
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    const feedback = await WebsiteFeedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("assignedTo", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName email");

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    res.json({
      success: true,
      message: "Feedback updated successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Delete feedback (authenticated users)
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID",
      });
    }

    const feedback = await WebsiteFeedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    console.log(`🗑️ Deleted feedback #${id}`);
    
    res.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;

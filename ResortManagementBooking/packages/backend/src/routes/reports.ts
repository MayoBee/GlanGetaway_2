import express, { Request, Response } from "express";
import Report, { ReportDocument } from "../models/report";
import { verifyToken, requireAdmin } from "../middleware/role-based-auth";
import mongoose from "mongoose";

const router = express.Router();

// Create a new report
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { reportedItemId, reportedItemType, reason, description, priority } = req.body;
    const reporterId = req.userId;

    // Validate required fields
    if (!reportedItemId || !reportedItemType || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: reportedItemId, reportedItemType, reason, description",
      });
    }

    // Check if user already reported this item
    const existingReport = await Report.findOne({
      reporterId,
      reportedItemId,
      reportedItemType,
      status: { $in: ["pending", "under_review"] },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this item. It is currently under review.",
      });
    }

    const newReport = new Report({
      reporterId,
      reportedItemId,
      reportedItemType,
      reason,
      description,
      priority: priority || "medium",
    });

    await newReport.save();

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: newReport,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all reports (admin only)
router.get("/", verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate("reporterId", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get report by ID
router.get("/:id", verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const report = await Report.findById(id)
      .populate("reporterId", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName email");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update report status (admin only)
router.put("/:id", verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const validStatuses = ["pending", "under_review", "resolved", "dismissed"];
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

    const report = await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("reporterId", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName email");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.json({
      success: true,
      message: "Report updated successfully",
      data: report,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Delete report (admin only)
router.delete("/:id", verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get reports by reporter
router.get("/my-reports", verifyToken, async (req: Request, res: Response) => {
  try {
    const reporterId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const filter: any = { reporterId };
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate("resolvedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching user reports:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;

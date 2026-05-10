import express, { Request, Response } from "express";
import Hotel from "../models/hotel";
import User from "../models/user";
import { verifyToken, AuthRequest } from "../middleware/role-based-auth";
import { param, validationResult, body } from "express-validator";

const router = express.Router();

// Get all pending resorts (for admin approval)
router.get("/pending", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const pendingResorts = await Hotel.find({ isApproved: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstName lastName email");

    const total = await Hotel.countDocuments({ isApproved: false });

    res.json({
      data: pendingResorts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pending resorts:", error);
    res.status(500).json({ message: "Error fetching pending resorts" });
  }
});

// Get all resorts (including unapproved) for admin
router.get("/all", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    let query = {};
    if (status === "approved") {
      query = { isApproved: true };
    } else if (status === "pending") {
      query = { isApproved: false };
    }

    const resorts = await Hotel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstName lastName email");

    const total = await Hotel.countDocuments(query);

    res.json({
      data: resorts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all resorts:", error);
    res.status(500).json({ message: "Error fetching resorts" });
  }
});

// Approve a resort
router.post(
  "/:resortId/approve",
  verifyToken,
  [param("resortId").notEmpty().withMessage("Resort ID is required")],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const resort = await Hotel.findById(req.params.resortId);
      if (!resort) {
        return res.status(404).json({ message: "Resort not found" });
      }

      if (resort.isApproved) {
        return res.status(400).json({ message: "Resort is already approved" });
      }

      // Update resort with approval details
      await Hotel.findByIdAndUpdate(req.params.resortId, {
        isApproved: true,
        approvedBy: req.userId,
        approvedAt: new Date(),
        rejectionReason: undefined,
      });

      // Get resort owner details for notification
      const resortOwner = await User.findById(resort.userId);

      res.json({
        message: "Resort approved successfully",
        resort: {
          id: resort._id,
          name: resort.name,
          owner: resortOwner?.firstName + " " + resortOwner?.lastName,
        },
      });
    } catch (error) {
      console.error("Error approving resort:", error);
      res.status(500).json({ message: "Error approving resort" });
    }
  }
);

// Reject a resort
router.post(
  "/:resortId/reject",
  verifyToken,
  [
    param("resortId").notEmpty().withMessage("Resort ID is required"),
    body("rejectionReason").notEmpty().withMessage("Rejection reason is required"),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const resort = await Hotel.findById(req.params.resortId);
      if (!resort) {
        return res.status(404).json({ message: "Resort not found" });
      }

      if (resort.isApproved) {
        return res.status(400).json({ message: "Cannot reject an approved resort" });
      }

      const { rejectionReason } = req.body;

      // Update resort with rejection details
      await Hotel.findByIdAndUpdate(req.params.resortId, {
        isApproved: false,
        approvedBy: undefined,
        approvedAt: undefined,
        rejectionReason,
      });

      // Get resort owner details for notification
      const resortOwner = await User.findById(resort.userId);

      res.json({
        message: "Resort rejected successfully",
        resort: {
          id: resort._id,
          name: resort.name,
          owner: resortOwner?.firstName + " " + resortOwner?.lastName,
          rejectionReason,
        },
      });
    } catch (error) {
      console.error("Error rejecting resort:", error);
      res.status(500).json({ message: "Error rejecting resort" });
    }
  }
);

// Get resort approval statistics
router.get("/stats", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const totalResorts = await Hotel.countDocuments();
    const approvedResorts = await Hotel.countDocuments({ isApproved: true });
    const pendingResorts = await Hotel.countDocuments({ isApproved: false });

    res.json({
      total: totalResorts,
      approved: approvedResorts,
      pending: pendingResorts,
      approvalRate: totalResorts > 0 ? (approvedResorts / totalResorts) * 100 : 0,
    });
  } catch (error) {
    console.error("Error fetching approval stats:", error);
    res.status(500).json({ message: "Error fetching approval statistics" });
  }
});

export default router;

import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { verifyToken } from "../middleware/role-based-auth";
import RolePromotionRequest from "../models/role-promotion-request";
import User from "../models/user";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'promotion-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image and document files
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

const router = express.Router();

// GET requests - for users returns their own requests, for admins returns all requests
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // Check user role by finding the user
    const user = await User.findById(req.userId);
    const isAdmin = user?.role === 'admin';
    
    let requests;
    let pagination;
    
    if (isAdmin) {
      // Admin gets all requests with pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      
      let query: any = {};
      if (status) query.status = status;
      
      requests = await RolePromotionRequest.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "firstName lastName email profileImage");
      
      const total = await RolePromotionRequest.countDocuments(query);
      pagination = { total, page, pages: Math.ceil(total / limit) };
    } else {
      // Regular user gets only their own requests
      requests = await RolePromotionRequest.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .populate("userId", "firstName lastName email profileImage");
      pagination = { total: requests.length, page: 1, pages: 1 };
    }
    
    res.json({ data: requests, pagination });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

// POST create request with multer upload - for users to submit
router.post(
  "/",
  verifyToken,
  upload.single('businessPermit'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Business permit file is required" });
      }

      let businessPermitImageUrl: string;

      // Check if Cloudinary is configured
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
          folder: "business-permits",
          resource_type: "auto",
        });
        businessPermitImageUrl = uploadResponse.secure_url;
      } else {
        // Save locally
        businessPermitImageUrl = `/uploads/${req.file.filename}`;
      }

      const newRequest = new RolePromotionRequest({
        userId: req.userId,
        businessPermitImageUrl,
      });

      await newRequest.save();

      res.status(201).json({ message: "Promotion request created successfully", request: newRequest });
    } catch (error) {
      console.error("Error creating promotion request:", error);
      res.status(500).json({ message: "Failed to create promotion request" });
    }
  }
);

// GET pending requests - admin only
router.get("/pending", verifyToken, async (req: Request, res: Response) => {
  try {
    const pendingRequests = await RolePromotionRequest.find({ status: 'pending' }).populate('userId', "firstName lastName email profileImage");

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ message: "Failed to fetch pending requests" });
  }
});

// GET stats - admin only
router.get("/stats", verifyToken, async (req: Request, res: Response) => {
  try {
    const pending = await RolePromotionRequest.countDocuments({ status: 'pending' });
    const approved = await RolePromotionRequest.countDocuments({ status: 'approved' });
    const declined = await RolePromotionRequest.countDocuments({ status: 'declined' });
    
    res.json({
      pending,
      approved,
      declined
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// POST approve request - admin only
router.post("/:id/approve", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await RolePromotionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: "Request is not pending" });
    }

    await RolePromotionRequest.findByIdAndUpdate(id, {
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: req.userId
    });

    // Also update the user's role to resort_owner
    await User.findByIdAndUpdate(request.userId, { role: "resort_owner" });

    res.json({ message: "Request approved successfully" });
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({ message: "Failed to approve request" });
  }
});

// POST decline request - admin only
router.post("/:id/decline", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const request = await RolePromotionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: "Request is not pending" });
    }

    await RolePromotionRequest.findByIdAndUpdate(id, {
      status: 'declined',
      reviewedAt: new Date(),
      reviewedBy: req.userId,
      rejectionReason
    });

    res.json({ message: "Request declined successfully" });
  } catch (error) {
    console.error("Error declining request:", error);
    res.status(500).json({ message: "Failed to decline request" });
  }
});

// DELETE request - admin only
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await RolePromotionRequest.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({ message: "Failed to delete request" });
  }
});

export default router;

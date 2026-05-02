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

// POST create request with multiple file uploads - for users to submit
router.post(
  "/",
  verifyToken,
  upload.fields([
    { name: 'dtiPermit', maxCount: 1 },
    { name: 'municipalEngineeringCertification', maxCount: 1 },
    { name: 'municipalHealthCertification', maxCount: 1 },
    { name: 'menroCertification', maxCount: 1 },
    { name: 'bfpPermit', maxCount: 1 },
    { name: 'businessPermit', maxCount: 1 },
    { name: 'nationalId', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { resortName, resortAddress, resortDescription, contactNumber } = req.body;

      // Validate required files
      const requiredFiles = ['dtiPermit', 'municipalEngineeringCertification', 'municipalHealthCertification', 
                           'menroCertification', 'bfpPermit', 'businessPermit', 'nationalId'];
      
      const missingFiles = requiredFiles.filter(fieldName => !files[fieldName] || files[fieldName].length === 0);
      if (missingFiles.length > 0) {
        return res.status(400).json({ 
          message: "Missing required files", 
          missingFiles 
        });
      }

      // Validate required application details
      if (!resortName || !resortAddress || !resortDescription || !contactNumber) {
        return res.status(400).json({ 
          message: "Missing required application details",
          required: ['resortName', 'resortAddress', 'resortDescription', 'contactNumber']
        });
      }

      // Upload files to Cloudinary or save locally
      const documents: any = {};
      
      for (const fieldName of requiredFiles) {
        const file = files[fieldName][0];
        
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          // Upload to Cloudinary
          const uploadResponse = await cloudinary.uploader.upload(file.path, {
            folder: `resort-applications/${fieldName}`,
            resource_type: "auto",
          });
          documents[fieldName] = uploadResponse.secure_url;
        } else {
          // Save locally
          documents[fieldName] = `/uploads/${file.filename}`;
        }
      }

      const newRequest = new RolePromotionRequest({
        userId: req.userId,
        documents,
        applicationDetails: {
          resortName,
          resortAddress,
          resortDescription,
          contactNumber,
        },
      });

      await newRequest.save();

      res.status(201).json({ 
        message: "Resort owner application submitted successfully", 
        request: newRequest 
      });
    } catch (error) {
      console.error("Error creating promotion request:", error);
      res.status(500).json({ message: "Failed to submit application" });
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

// GET application details for review - admin only
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await RolePromotionRequest.findById(id)
      .populate("userId", "firstName lastName email phone address")
      .populate("reviewedBy", "firstName lastName email");
    
    if (!request) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ request });
  } catch (error) {
    console.error("Error fetching application details:", error);
    res.status(500).json({ message: "Failed to fetch application details" });
  }
});

// PUT update document review status - admin only
router.put("/:id/review-document", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentType, reviewed, notes } = req.body;
    
    const request = await RolePromotionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Update review status for specific document
    const updateField = `reviewStatus.${documentType}`;
    await RolePromotionRequest.findByIdAndUpdate(id, {
      [updateField]: reviewed,
      status: 'under_review',
      adminNotes: notes || request.adminNotes,
    });

    res.json({ message: "Document review status updated successfully" });
  } catch (error) {
    console.error("Error updating document review:", error);
    res.status(500).json({ message: "Failed to update document review status" });
  }
});

// POST approve request - admin only (only if all documents reviewed)
router.post("/:id/approve", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await RolePromotionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    if (request.status === 'approved') {
      return res.status(400).json({ message: "Application already approved" });
    }

    // Check if all documents have been reviewed
    const allReviewed = Object.values(request.reviewStatus).every(status => status === true);
    if (!allReviewed) {
      return res.status(400).json({ 
        message: "All documents must be reviewed before approval",
        pendingReviews: Object.entries(request.reviewStatus)
          .filter(([_, reviewed]) => !reviewed)
          .map(([docType]) => docType)
      });
    }

    await RolePromotionRequest.findByIdAndUpdate(id, {
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: req.userId
    });

    // Also update the user's role to resort_owner
    await User.findByIdAndUpdate(request.userId, { role: "resort_owner" });

    res.json({ message: "Application approved and user promoted to resort owner successfully" });
  } catch (error) {
    console.error("Error approving application:", error);
    res.status(500).json({ message: "Failed to approve application" });
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

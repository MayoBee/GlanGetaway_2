import express, { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import RolePromotionRequest from "../domains/identity-access/models/role-promotion-request";
import verifyToken from "../middleware/auth";

const router = express.Router();

// Configure memory storage for Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/role-promotion-requests - Submit a new role promotion request
router.post(
  "/",
  verifyToken,
  upload.fields([
    { name: "dtiPermit", maxCount: 1 },
    { name: "municipalEngineeringCert", maxCount: 1 },
    { name: "municipalHealthCert", maxCount: 1 },
    { name: "menroCert", maxCount: 1 },
    { name: "bfpPermit", maxCount: 1 },
    { name: "businessPermit", maxCount: 1 },
    { name: "nationalId", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      console.log("🔍 Role promotion request - User ID:", userId);

      // Check if user already has a pending request
      const existingRequest = await RolePromotionRequest.findOne({
        userId,
        status: "pending",
      });

      if (existingRequest) {
        console.log("❌ User already has a pending request:", existingRequest._id);
        return res.status(400).json({
          message: "You already have a pending resort owner application",
        });
      }

      // Get uploaded files
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      console.log("📁 Uploaded files:", files ? Object.keys(files) : "None");

      if (!files) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Upload files to Cloudinary
      console.log("Uploading files to Cloudinary...");
      const uploadPromises = Object.keys(files).map(async (fieldname) => {
        const file = files[fieldname][0];
        console.log(`Processing file: ${fieldname}, size: ${file.size}, type: ${file.mimetype}`);
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "resort-owner-applications", resource_type: "auto" },
            (error, result) => {
              if (error) {
                console.error(`Cloudinary upload error for ${fieldname}:`, error);
                reject(error);
              } else {
                console.log(`Cloudinary upload success for ${fieldname}:`, result?.secure_url);
                resolve({ fieldname, url: result?.secure_url || "" });
              }
            }
          ).end(file.buffer);
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      const documentUrls: Record<string, string> = {};
      uploadResults.forEach((result: any) => {
        documentUrls[result.fieldname] = result.url;
      });
      console.log("Document URLs:", documentUrls);

      // Check if all required documents were uploaded successfully
      const requiredDocs = [
        "dtiPermit",
        "municipalEngineeringCert",
        "municipalHealthCert",
        "menroCert",
        "bfpPermit",
        "businessPermit",
        "nationalId",
      ];

      const missingDocs = requiredDocs.filter(doc => !documentUrls[doc]);
      if (missingDocs.length > 0) {
        console.error("Missing document URLs:", missingDocs);
        return res.status(400).json({
          message: "Failed to upload some documents. Please try again.",
          missingDocs,
        });
      }

      // Create new role promotion request
      const request = new RolePromotionRequest({
        userId,
        requestedRole: "resort_owner",
        status: "pending",
        documents: {
          dtiPermit: documentUrls.dtiPermit,
          municipalEngineeringCert: documentUrls.municipalEngineeringCert,
          municipalHealthCert: documentUrls.municipalHealthCert,
          menroCert: documentUrls.menroCert,
          bfpPermit: documentUrls.bfpPermit,
          businessPermit: documentUrls.businessPermit,
          nationalId: documentUrls.nationalId,
        },
      });

      await request.save();

      res.status(201).json({
        message: "Resort owner application submitted successfully",
        requestId: request._id,
      });
    } catch (error) {
      console.error("Error submitting role promotion request:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

// GET /api/role-promotion-requests - Get all role promotion requests (admin only)
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const requests = await RolePromotionRequest.find()
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching role promotion requests:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// GET /api/role-promotion-requests/pending - Get pending requests
router.get("/pending", verifyToken, async (req: Request, res: Response) => {
  try {
    const requests = await RolePromotionRequest.find({ status: "pending" })
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// PATCH /api/role-promotion-requests/:requestId/approve - Approve a request
router.patch(
  "/:requestId/approve",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const adminId = req.userId;

      const request = await RolePromotionRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({
          message: "Request has already been processed",
        });
      }

      request.status = "approved";
      request.reviewedBy = adminId;
      request.reviewedAt = new Date();

      await request.save();

      // TODO: Update user role to resort_owner
      // This will be implemented in the next step

      res.json({
        message: "Request approved successfully",
        request,
      });
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

// PATCH /api/role-promotion-requests/:requestId/decline - Decline a request
router.patch(
  "/:requestId/decline",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      const adminId = req.userId;

      const request = await RolePromotionRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({
          message: "Request has already been processed",
        });
      }

      request.status = "rejected";
      request.reviewedBy = adminId as any;
      request.reviewedAt = new Date();
      request.rejectionReason = reason;

      await request.save();

      res.json({
        message: "Request declined successfully",
        request,
      });
    } catch (error) {
      console.error("Error declining request:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

export default router;

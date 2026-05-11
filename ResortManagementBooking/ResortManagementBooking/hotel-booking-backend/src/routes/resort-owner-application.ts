import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import mongoose from "mongoose";
import ResortOwnerApplication from "../models/resort-owner-application";
import User from "../models/user";
import { verifyToken, AuthRequest } from "../middleware/role-based-auth";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Debug middleware to log all requests to this route
router.use((req, res, next) => {
  console.log('🔍 Resort Owner Application Route Hit:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    contentType: req.headers['content-type']
  });
  next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/resort-owner-applications"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Accept common document and image formats
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDF documents are allowed.'));
    }
  },
});

// Submit resort owner application
router.post(
  "/",
  verifyToken,
  upload.fields([
    { name: 'dtiPermit', maxCount: 1 },
    { name: 'municipalEngineeringCert', maxCount: 1 },
    { name: 'municipalHealthCert', maxCount: 1 },
    { name: 'menroCert', maxCount: 1 },
    { name: 'bfpPermit', maxCount: 1 },
    { name: 'businessPermit', maxCount: 1 },
    { name: 'nationalId', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      console.log('📋 Resort Owner Application Request:', {
        userId: req.userId,
        headers: req.headers,
        contentType: req.headers['content-type'],
        files: req.files,
        body: req.body
      });

      // Check if user already has a pending application
      console.log('🔍 Searching for existing application with criteria:', {
        userId: req.userId,
        status: 'pending'
      });

      const existingApplication = await ResortOwnerApplication.findOne({
        userId: req.userId,
        status: 'pending'
      });

      console.log('🔍 Existing application check:', {
        userId: req.userId,
        existingApplication: existingApplication ? 'found' : 'not found',
        applicationId: existingApplication ? existingApplication._id : 'none',
        applicationData: existingApplication ? {
          id: existingApplication._id,
          status: existingApplication.status,
          submittedAt: existingApplication.submittedAt
        } : 'none'
      });

      // Also check all applications for this user
      const allUserApplications = await ResortOwnerApplication.find({
        userId: req.userId
      });

      console.log('🔍 All user applications:', {
        userId: req.userId,
        count: allUserApplications.length,
        applications: allUserApplications.map(app => ({
          id: app._id,
          status: app.status,
          submittedAt: app.submittedAt
        }))
      });

      if (existingApplication) {
        console.log('❌ User already has pending application');
        return res.status(400).json({
          message: "You already have a pending application. Please wait for it to be reviewed."
        });
      }

      console.log('📁 Files received:', req.files);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Verify all required files are present
      const requiredFields = [
        'dtiPermit',
        'municipalEngineeringCert',
        'municipalHealthCert',
        'menroCert',
        'bfpPermit',
        'businessPermit',
        'nationalId'
      ];

      console.log('🔍 File validation:', {
        files: files,
        filesKeys: files ? Object.keys(files) : 'undefined',
        requiredFields: requiredFields
      });

      const missingFields = requiredFields.filter(field => !files[field] || files[field].length === 0);
      
      console.log('📝 Missing fields analysis:', {
        missingFields: missingFields,
        fieldDetails: requiredFields.map(field => ({
          field,
          exists: files && files[field],
          count: files && files[field] ? files[field].length : 0,
          file: files && files[field] && files[field][0] ? files[field][0].originalname : 'none'
        }))
      });
      
      if (missingFields.length > 0) {
        console.log('❌ Missing required documents:', missingFields);
        return res.status(400).json({
          message: `Missing required documents: ${missingFields.join(', ')}`
        });
      }

      // Create application record
      const application = new ResortOwnerApplication({
        userId: req.userId,
        dtiPermit: files.dtiPermit[0].filename,
        municipalEngineeringCert: files.municipalEngineeringCert[0].filename,
        municipalHealthCert: files.municipalHealthCert[0].filename,
        menroCert: files.menroCert[0].filename,
        bfpPermit: files.bfpPermit[0].filename,
        businessPermit: files.businessPermit[0].filename,
        nationalId: files.nationalId[0].filename,
        status: 'pending',
        submittedAt: new Date(),
      });

      await application.save();

      res.status(201).json({
        message: "Resort owner application submitted successfully",
        applicationId: application._id,
        status: application.status,
        submittedAt: application.submittedAt,
      });
    } catch (error) {
      console.error("Error submitting resort owner application:", error);
      res.status(500).json({
        message: "Error submitting application",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// Get user's application status
router.get("/my-application", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const application = await ResortOwnerApplication.findOne({ userId: req.userId })
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ submittedAt: -1 });

    if (!application) {
      return res.status(404).json({
        message: "No application found"
      });
    }

    // Add full URLs for documents
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const applicationWithUrls = {
      id: application._id,
      status: application.status,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      rejectionReason: application.rejectionReason,
      reviewedBy: application.reviewedBy,
      documents: {
        dtiPermit: application.dtiPermit ? `${baseUrl}/uploads/resort-owner-applications/${application.dtiPermit}` : null,
        municipalEngineeringCert: application.municipalEngineeringCert ? `${baseUrl}/uploads/resort-owner-applications/${application.municipalEngineeringCert}` : null,
        municipalHealthCert: application.municipalHealthCert ? `${baseUrl}/uploads/resort-owner-applications/${application.municipalHealthCert}` : null,
        menroCert: application.menroCert ? `${baseUrl}/uploads/resort-owner-applications/${application.menroCert}` : null,
        bfpPermit: application.bfpPermit ? `${baseUrl}/uploads/resort-owner-applications/${application.bfpPermit}` : null,
        businessPermit: application.businessPermit ? `${baseUrl}/uploads/resort-owner-applications/${application.businessPermit}` : null,
        nationalId: application.nationalId ? `${baseUrl}/uploads/resort-owner-applications/${application.nationalId}` : null,
      }
    };

    res.json({
      application: applicationWithUrls
    });
  } catch (error) {
    console.error("Error fetching application status:", error);
    res.status(500).json({
      message: "Error fetching application status"
    });
  }
});

// Get all applications (for admin)
router.get("/all", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    let query = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = { status };
    }

    const applications = await ResortOwnerApplication.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add full URLs for documents
    const applicationsWithUrls = applications.map(app => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return {
        ...app.toObject(),
        documents: {
          dtiPermit: app.dtiPermit ? `${baseUrl}/uploads/resort-owner-applications/${app.dtiPermit}` : null,
          municipalEngineeringCert: app.municipalEngineeringCert ? `${baseUrl}/uploads/resort-owner-applications/${app.municipalEngineeringCert}` : null,
          municipalHealthCert: app.municipalHealthCert ? `${baseUrl}/uploads/resort-owner-applications/${app.municipalHealthCert}` : null,
          menroCert: app.menroCert ? `${baseUrl}/uploads/resort-owner-applications/${app.menroCert}` : null,
          bfpPermit: app.bfpPermit ? `${baseUrl}/uploads/resort-owner-applications/${app.bfpPermit}` : null,
          businessPermit: app.businessPermit ? `${baseUrl}/uploads/resort-owner-applications/${app.businessPermit}` : null,
          nationalId: app.nationalId ? `${baseUrl}/uploads/resort-owner-applications/${app.nationalId}` : null,
        }
      };
    });

    const total = await ResortOwnerApplication.countDocuments(query);

    res.json({
      data: applicationsWithUrls,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      message: "Error fetching applications"
    });
  }
});

// Approve application
router.post(
  "/:applicationId/approve",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const application = await ResortOwnerApplication.findById(req.params.applicationId);
      
      if (!application) {
        return res.status(404).json({
          message: "Application not found"
        });
      }

      if (application.status !== 'pending') {
        return res.status(400).json({
          message: "Application has already been reviewed"
        });
      }

      // Update application status
      application.status = 'approved';
      application.reviewedAt = new Date();
      application.reviewedBy = new mongoose.Types.ObjectId(req.userId);
      await application.save();

      // Update user role to resort_owner
      console.log('🔍 Updating user role:', {
        applicationId: application._id,
        userId: application.userId,
        newRole: 'resort_owner'
      });
      
      try {
        const updatedUser = await User.findByIdAndUpdate(
          application.userId,
          { role: 'resort_owner', updatedAt: new Date() },
          { new: true }
        );
        
        console.log('✅ User role updated successfully:', {
          userId: application.userId,
          updatedRole: updatedUser.role,
          success: true
        });
      } catch (error) {
        console.error('❌ Error updating user role:', error);
        throw error;
      }

      res.json({
        message: "Application approved successfully",
        applicationId: application._id,
      });
    } catch (error) {
      console.error("Error approving application:", error);
      res.status(500).json({
        message: "Error approving application"
      });
    }
  }
);

// Reject application
router.post(
  "/:applicationId/reject",
  verifyToken,
  [
    body("rejectionReason").notEmpty().withMessage("Rejection reason is required"),
  ],
  async (req: AuthRequest, res: Response) => {
    console.log('📋 Resort Owner Application Request:', {
      userId: req.userId,
      headers: req.headers,
      files: req.files,
      body: req.body
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array(),
        details: 'Please check all required documents are uploaded and are valid format'
      });
    }

    try {
      const application = await ResortOwnerApplication.findById(req.params.applicationId);
      
      if (!application) {
        return res.status(404).json({
          message: "Application not found"
        });
      }

      if (application.status !== 'pending') {
        return res.status(400).json({
          message: "Application has already been reviewed"
        });
      }

      const { rejectionReason } = req.body;

      application.status = 'rejected';
      application.rejectionReason = rejectionReason;
      application.reviewedAt = new Date();
      application.reviewedBy = new mongoose.Types.ObjectId(req.userId);

      await application.save();

      res.json({
        message: "Application rejected successfully",
        applicationId: application._id,
        rejectionReason,
      });
    } catch (error) {
      console.error("Error rejecting application:", error);
      res.status(500).json({
        message: "Error rejecting application"
      });
    }
  }
);

export default router;

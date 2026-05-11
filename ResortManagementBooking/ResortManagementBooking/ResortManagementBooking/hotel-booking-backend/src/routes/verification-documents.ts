import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import VerificationDocument from "../models/verification-document";
import Booking from "../models/booking";
import verifyToken from "../middleware/auth";

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, `verification-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, PDF, and DOC/DOCX files are allowed"));
    }
  }
});

/**
 * POST /api/verification-documents/upload
 * Upload verification document for discount eligibility
 */
router.post("/upload", verifyToken, upload.single("document"), async (req: Request, res: Response) => {
  try {
    const { bookingId, documentType } = req.body;
    const userId = req.userId;

    if (!bookingId || !documentType) {
      return res.status(400).json({ 
        success: false, 
        message: "Booking ID and document type are required" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    // Check if document already exists for this booking and type
    const existingDocument = await VerificationDocument.findOne({ 
      bookingId, 
      documentType 
    });
    
    if (existingDocument) {
      // Delete old file
      const oldFilePath = path.join(process.cwd(), existingDocument.fileUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      
      // Update existing document
      existingDocument.fileName = req.file.filename;
      existingDocument.originalName = req.file.originalname;
      existingDocument.fileUrl = `/uploads/${req.file.filename}`;
      existingDocument.fileSize = req.file.size;
      existingDocument.mimeType = req.file.mimetype;
      existingDocument.status = "pending";
      existingDocument.verifiedBy = undefined;
      existingDocument.verifiedAt = undefined;
      existingDocument.rejectionReason = undefined;
      await existingDocument.save();

      return res.json({
        success: true,
        message: "Document updated successfully",
        data: existingDocument
      });
    }

    // Create new verification document
    const verificationDocument = new VerificationDocument({
      bookingId,
      userId,
      hotelId: booking.hotelId,
      documentType,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: "pending"
    });

    await verificationDocument.save();

    // Update booking with discount flags
    if (documentType === "senior_citizen_id") {
      booking.isSeniorCitizenBooking = true;
      booking.discountApplied = {
        type: "senior_citizen",
        percentage: 20,
        amount: booking.totalCost * 0.2
      };
    } else if (documentType === "pwd_id") {
      booking.isPwdBooking = true;
      booking.discountApplied = {
        type: "pwd",
        percentage: 20,
        amount: booking.totalCost * 0.2
      };
    }
    
    await booking.save();

    res.json({
      success: true,
      message: "Document uploaded successfully",
      data: verificationDocument
    });

  } catch (error) {
    console.error("Error uploading verification document:", error);
    
    // Clean up uploaded file if error occurred
    if (req.file) {
      const filePath = path.join(uploadDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

/**
 * GET /api/verification-documents/booking/:bookingId
 * Get all verification documents for a booking
 */
router.get("/booking/:bookingId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    const documents = await VerificationDocument.find({ bookingId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: documents
    });

  } catch (error) {
    console.error("Error fetching verification documents:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

/**
 * DELETE /api/verification-documents/:documentId
 * Delete a verification document
 */
router.delete("/:documentId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.userId;

    const document = await VerificationDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: "Document not found" 
      });
    }

    // Verify ownership
    const booking = await Booking.findById(document.bookingId);
    if (!booking || booking.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete document from database
    await VerificationDocument.findByIdAndDelete(documentId);

    // Update booking flags if this was the only document of its type
    const remainingDocuments = await VerificationDocument.find({ 
      bookingId: document.bookingId, 
      documentType: document.documentType 
    });

    if (remainingDocuments.length === 0) {
      if (document.documentType === "senior_citizen_id") {
        booking.isSeniorCitizenBooking = false;
      } else if (document.documentType === "pwd_id") {
        booking.isPwdBooking = false;
      }
      
      // Recalculate discount if no discount documents remain
      const hasAnyDiscountDocs = await VerificationDocument.findOne({
        bookingId: document.bookingId,
        documentType: { $in: ["senior_citizen_id", "pwd_id"] }
      });

      if (!hasAnyDiscountDocs) {
        booking.discountApplied = undefined;
      }
      
      await booking.save();
    }

    res.json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting verification document:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

export default router;

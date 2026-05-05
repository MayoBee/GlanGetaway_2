"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const verification_document_1 = __importDefault(require("../models/verification-document"));
const booking_1 = __importDefault(require("../models/booking"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
// Configure multer for file uploads
const uploadDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, `verification-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error("Only JPEG, PNG, PDF, and DOC/DOCX files are allowed"));
        }
    }
});
/**
 * POST /api/verification-documents/upload
 * Upload verification document for discount eligibility
 */
router.post("/upload", auth_1.default, upload.single("document"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const booking = yield booking_1.default.findById(bookingId);
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
        const existingDocument = yield verification_document_1.default.findOne({
            bookingId,
            documentType
        });
        if (existingDocument) {
            // Delete old file
            const oldFilePath = path_1.default.join(process.cwd(), existingDocument.fileUrl);
            if (fs_1.default.existsSync(oldFilePath)) {
                fs_1.default.unlinkSync(oldFilePath);
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
            yield existingDocument.save();
            return res.json({
                success: true,
                message: "Document updated successfully",
                data: existingDocument
            });
        }
        // Create new verification document
        const verificationDocument = new verification_document_1.default({
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
        yield verificationDocument.save();
        // Update booking with discount flags
        if (documentType === "senior_citizen_id") {
            booking.isSeniorCitizenBooking = true;
            booking.discountApplied = {
                type: "senior_citizen",
                percentage: 20,
                amount: booking.totalCost * 0.2
            };
        }
        else if (documentType === "pwd_id") {
            booking.isPwdBooking = true;
            booking.discountApplied = {
                type: "pwd",
                percentage: 20,
                amount: booking.totalCost * 0.2
            };
        }
        yield booking.save();
        res.json({
            success: true,
            message: "Document uploaded successfully",
            data: verificationDocument
        });
    }
    catch (error) {
        console.error("Error uploading verification document:", error);
        // Clean up uploaded file if error occurred
        if (req.file) {
            const filePath = path_1.default.join(uploadDir, req.file.filename);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}));
/**
 * GET /api/verification-documents/booking/:bookingId
 * Get all verification documents for a booking
 */
router.get("/booking/:bookingId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookingId } = req.params;
        const userId = req.userId;
        // Verify booking exists and belongs to user
        const booking = yield booking_1.default.findById(bookingId);
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
        const documents = yield verification_document_1.default.find({ bookingId })
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: documents
        });
    }
    catch (error) {
        console.error("Error fetching verification documents:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}));
/**
 * DELETE /api/verification-documents/:documentId
 * Delete a verification document
 */
router.delete("/:documentId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { documentId } = req.params;
        const userId = req.userId;
        const document = yield verification_document_1.default.findById(documentId);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }
        // Verify ownership
        const booking = yield booking_1.default.findById(document.bookingId);
        if (!booking || booking.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }
        // Delete file from filesystem
        const filePath = path_1.default.join(process.cwd(), document.fileUrl);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Delete document from database
        yield verification_document_1.default.findByIdAndDelete(documentId);
        // Update booking flags if this was the only document of its type
        const remainingDocuments = yield verification_document_1.default.find({
            bookingId: document.bookingId,
            documentType: document.documentType
        });
        if (remainingDocuments.length === 0) {
            if (document.documentType === "senior_citizen_id") {
                booking.isSeniorCitizenBooking = false;
            }
            else if (document.documentType === "pwd_id") {
                booking.isPwdBooking = false;
            }
            // Recalculate discount if no discount documents remain
            const hasAnyDiscountDocs = yield verification_document_1.default.findOne({
                bookingId: document.bookingId,
                documentType: { $in: ["senior_citizen_id", "pwd_id"] }
            });
            if (!hasAnyDiscountDocs) {
                booking.discountApplied = undefined;
            }
            yield booking.save();
        }
        res.json({
            success: true,
            message: "Document deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting verification document:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}));
exports.default = router;

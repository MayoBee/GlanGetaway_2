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
const cloudinary_1 = require("cloudinary");
const role_based_auth_1 = require("../middleware/role-based-auth");
const role_promotion_request_1 = __importDefault(require("../models/role-promotion-request"));
const user_1 = __importDefault(require("../models/user"));
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'promotion-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        try {
            // Accept only image and document files
            if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
                cb(null, true);
            }
            else {
                console.log('Rejected file type:', file.mimetype);
                cb(new Error('Only image and PDF files are allowed'));
            }
        }
        catch (error) {
            console.error('Error in fileFilter:', error);
            cb(error);
        }
    }
});
const router = express_1.default.Router();
// GET requests - for users returns their own requests, for admins returns all requests
router.get("/", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check user role by finding the user
        const user = yield user_1.default.findById(req.userId);
        const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === 'admin';
        let requests;
        let pagination;
        if (isAdmin) {
            // Admin gets all requests with pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status;
            let query = {};
            if (status)
                query.status = status;
            requests = yield role_promotion_request_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("userId", "firstName lastName email profileImage");
            const total = yield role_promotion_request_1.default.countDocuments(query);
            pagination = { total, page, pages: Math.ceil(total / limit) };
        }
        else {
            // Regular user gets only their own requests
            requests = yield role_promotion_request_1.default.find({ userId: req.userId })
                .sort({ createdAt: -1 })
                .populate("userId", "firstName lastName email profileImage");
            pagination = { total: requests.length, page: 1, pages: 1 };
        }
        res.json({ data: requests, pagination });
    }
    catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ message: "Failed to fetch requests" });
    }
}));
// POST create request with multiple file uploads - for users to submit
router.post("/", role_based_auth_1.verifyToken, upload.fields([
    { name: 'dtiPermit', maxCount: 1 },
    { name: 'municipalEngineeringCert', maxCount: 1 },
    { name: 'municipalHealthCert', maxCount: 1 },
    { name: 'menroCert', maxCount: 1 },
    { name: 'bfpPermit', maxCount: 1 },
    { name: 'businessPermit', maxCount: 1 },
    { name: 'nationalId', maxCount: 1 },
]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("=== Resort Owner Application Submission Started ===");
        console.log("Received resort owner application request");
        console.log("User ID from token:", req.userId);
        const files = req.files;
        console.log("Files received:", Object.keys(files || {}));
        // Validate required files
        const requiredFiles = ['dtiPermit', 'municipalEngineeringCert', 'municipalHealthCert',
            'menroCert', 'bfpPermit', 'businessPermit', 'nationalId'];
        const missingFiles = requiredFiles.filter(fieldName => !files[fieldName] || files[fieldName].length === 0);
        if (missingFiles.length > 0) {
            console.log("Missing files:", missingFiles);
            return res.status(400).json({
                message: "Missing required files",
                missingFiles
            });
        }
        // Upload files to Cloudinary or save locally
        const documents = {};
        for (const fieldName of requiredFiles) {
            const file = files[fieldName][0];
            console.log(`Processing file: ${fieldName}, path: ${file.path}`);
            if (false && process.env.CLOUDINARY_CLOUD_NAME) { // Temporarily disabled for testing
                // Upload to Cloudinary
                try {
                    console.log(`Uploading ${fieldName} to Cloudinary...`);
                    const uploadResponse = yield cloudinary_1.v2.uploader.upload(file.path, {
                        folder: `resort-applications/${fieldName}`,
                        resource_type: "auto",
                    });
                    documents[fieldName] = uploadResponse.secure_url;
                    console.log(`Successfully uploaded ${fieldName} to Cloudinary`);
                }
                catch (uploadError) {
                    console.error(`Failed to upload ${fieldName} to Cloudinary:`, uploadError);
                    // Fallback to local storage
                    documents[fieldName] = `/uploads/${file.filename}`;
                }
            }
            else {
                // Save locally
                documents[fieldName] = `/uploads/${file.filename}`;
                console.log(`Saved ${fieldName} locally: ${documents[fieldName]}`);
            }
        }
        console.log("Creating role promotion request in database");
        console.log("Documents object:", JSON.stringify(documents, null, 2));
        const newRequest = new role_promotion_request_1.default({
            userId: req.userId,
            documents,
        });
        console.log("New request object created:", JSON.stringify(newRequest.toObject(), null, 2));
        console.log("Attempting to save to database...");
        yield newRequest.save();
        console.log("Role promotion request saved successfully with ID:", newRequest._id);
        res.status(201).json({
            message: "Resort owner application submitted successfully",
            request: newRequest
        });
    }
    catch (error) {
        console.error("Error creating promotion request:", error);
        res.status(500).json({ message: "Failed to submit application", error: String(error) });
    }
}));
// GET pending requests - admin only
router.get("/pending", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("=== PENDING REQUESTS ENDPOINT CALLED ===");
        console.log("User ID from token:", req.userId);
        // Check user role by finding the user
        const user = yield user_1.default.findById(req.userId);
        const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === 'admin';
        console.log("User found:", user ? { id: user._id, email: user.email, role: user.role } : null);
        console.log("Is admin:", isAdmin);
        if (!isAdmin) {
            console.log("Access denied: User is not admin");
            return res.status(403).json({ message: "Access denied. Admin role required." });
        }
        console.log("Fetching pending requests...");
        const pendingRequests = yield role_promotion_request_1.default.find({ status: 'pending' }).populate('userId', "firstName lastName email profileImage");
        console.log("Found pending requests:", pendingRequests.length);
        console.log("Pending requests data:", JSON.stringify(pendingRequests, null, 2));
        res.json({ requests: pendingRequests });
    }
    catch (error) {
        console.error("Error fetching pending requests:", error);
        res.status(500).json({ message: "Failed to fetch pending requests" });
    }
}));
// GET stats - admin only
router.get("/stats", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pending = yield role_promotion_request_1.default.countDocuments({ status: 'pending' });
        const approved = yield role_promotion_request_1.default.countDocuments({ status: 'approved' });
        const declined = yield role_promotion_request_1.default.countDocuments({ status: 'declined' });
        res.json({
            pending,
            approved,
            declined
        });
    }
    catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Failed to fetch stats" });
    }
}));
// GET application details for review - admin only
router.get("/:id", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const request = yield role_promotion_request_1.default.findById(id)
            .populate("userId", "firstName lastName email phone address")
            .populate("reviewedBy", "firstName lastName email");
        if (!request) {
            return res.status(404).json({ message: "Application not found" });
        }
        res.json({ request });
    }
    catch (error) {
        console.error("Error fetching application details:", error);
        res.status(500).json({ message: "Failed to fetch application details" });
    }
}));
// PUT update document review status - admin only
router.put("/:id/review-document", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { documentType, reviewed, notes } = req.body;
        const request = yield role_promotion_request_1.default.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Application not found" });
        }
        // Update review status for specific document
        const updateField = `reviewStatus.${documentType}`;
        yield role_promotion_request_1.default.findByIdAndUpdate(id, {
            [updateField]: reviewed,
            status: 'under_review',
            adminNotes: notes || request.adminNotes,
        });
        res.json({ message: "Document review status updated successfully" });
    }
    catch (error) {
        console.error("Error updating document review:", error);
        res.status(500).json({ message: "Failed to update document review status" });
    }
}));
// POST approve request - admin only
router.post("/:id/approve", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("=== APPROVE REQUEST ENDPOINT CALLED ===");
        console.log("Request ID:", req.params.id);
        console.log("User ID from token:", req.userId);
        const { id } = req.params;
        const request = yield role_promotion_request_1.default.findById(id);
        if (!request) {
            console.log("Request not found");
            return res.status(404).json({ message: "Application not found" });
        }
        if (request.status === 'approved') {
            console.log("Request already approved");
            return res.status(400).json({ message: "Application already approved" });
        }
        console.log("Approving request for user:", request.userId);
        // Update the request status
        yield role_promotion_request_1.default.findByIdAndUpdate(id, {
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: req.userId
        });
        // Also update the user's role to resort_owner
        const updatedUser = yield user_1.default.findByIdAndUpdate(request.userId, { role: "resort_owner" }, { new: true });
        console.log("User role updated:", updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.email, "new role:", updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.role);
        res.json({
            message: "Application approved and user promoted to resort owner successfully",
            user: updatedUser
        });
    }
    catch (error) {
        console.error("Error approving application:", error);
        res.status(500).json({ message: "Failed to approve application" });
    }
}));
// POST decline request - admin only
router.post("/:id/decline", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("=== DECLINE REQUEST ENDPOINT CALLED ===");
        console.log("Request ID:", req.params.id);
        console.log("Request body:", req.body);
        console.log("User ID from token:", req.userId);
        const { id } = req.params;
        const { rejectionReason } = req.body;
        const request = yield role_promotion_request_1.default.findById(id);
        console.log("Found request:", request ? {
            id: request._id,
            currentStatus: request.status,
            userId: request.userId
        } : null);
        if (!request) {
            console.log("Request not found");
            return res.status(404).json({ message: "Request not found" });
        }
        if (request.status !== 'pending') {
            console.log("Request is not pending, current status:", request.status);
            return res.status(400).json({ message: "Request is not pending" });
        }
        console.log("Updating request status to declined...");
        const updatedRequest = yield role_promotion_request_1.default.findByIdAndUpdate(id, {
            status: 'declined',
            reviewedAt: new Date(),
            reviewedBy: req.userId,
            rejectionReason
        }, { new: true }); // Return the updated document
        console.log("Updated request:", {
            id: updatedRequest._id,
            newStatus: updatedRequest.status,
            reviewedAt: updatedRequest.reviewedAt,
            reviewedBy: updatedRequest.reviewedBy,
            rejectionReason: updatedRequest.rejectionReason
        });
        res.json({ message: "Request declined successfully" });
    }
    catch (error) {
        console.error("Error declining request:", error);
        res.status(500).json({ message: "Failed to decline request" });
    }
}));
// DELETE request - admin only
router.delete("/:id", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const request = yield role_promotion_request_1.default.findByIdAndDelete(id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        res.json({ message: "Request deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting request:", error);
        res.status(500).json({ message: "Failed to delete request" });
    }
}));
exports.default = router;

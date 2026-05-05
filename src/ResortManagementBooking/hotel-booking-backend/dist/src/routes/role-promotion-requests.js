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
const cloudinary_1 = require("cloudinary");
const role_based_auth_1 = require("../middleware/role-based-auth");
const role_promotion_request_1 = __importDefault(require("../models/role-promotion-request"));
const user_1 = __importDefault(require("../models/user"));
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
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
        // Accept only image and document files
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only image and PDF files are allowed'));
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
// POST create request with multer upload - for users to submit
router.post("/", role_based_auth_1.verifyToken, upload.single('businessPermit'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Business permit file is required" });
        }
        let businessPermitImageUrl;
        // Check if Cloudinary is configured
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            // Upload to Cloudinary
            const uploadResponse = yield cloudinary_1.v2.uploader.upload(req.file.path, {
                folder: "business-permits",
                resource_type: "auto",
            });
            businessPermitImageUrl = uploadResponse.secure_url;
        }
        else {
            // Save locally
            businessPermitImageUrl = `/uploads/${req.file.filename}`;
        }
        const newRequest = new role_promotion_request_1.default({
            userId: req.userId,
            businessPermitImageUrl,
        });
        yield newRequest.save();
        res.status(201).json({ message: "Promotion request created successfully", request: newRequest });
    }
    catch (error) {
        console.error("Error creating promotion request:", error);
        res.status(500).json({ message: "Failed to create promotion request" });
    }
}));
// GET pending requests - admin only
router.get("/pending", role_based_auth_1.verifyToken, role_based_auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pendingRequests = yield role_promotion_request_1.default.find({ status: 'pending' }).populate('userId', "firstName lastName email profileImage");
        res.json({ requests: pendingRequests });
    }
    catch (error) {
        console.error("Error fetching pending requests:", error);
        res.status(500).json({ message: "Failed to fetch pending requests" });
    }
}));
// GET stats - admin only
router.get("/stats", role_based_auth_1.verifyToken, role_based_auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
// POST approve request - admin only
router.post("/:id/approve", role_based_auth_1.verifyToken, role_based_auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const request = yield role_promotion_request_1.default.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: "Request is not pending" });
        }
        yield role_promotion_request_1.default.findByIdAndUpdate(id, {
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: req.userId
        });
        // Also update the user's role to resort_owner
        yield user_1.default.findByIdAndUpdate(request.userId, { role: "resort_owner" });
        res.json({ message: "Request approved successfully" });
    }
    catch (error) {
        console.error("Error approving request:", error);
        res.status(500).json({ message: "Failed to approve request" });
    }
}));
// POST decline request - admin only
router.post("/:id/decline", role_based_auth_1.verifyToken, role_based_auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        const request = yield role_promotion_request_1.default.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: "Request is not pending" });
        }
        yield role_promotion_request_1.default.findByIdAndUpdate(id, {
            status: 'declined',
            reviewedAt: new Date(),
            reviewedBy: req.userId,
            rejectionReason
        });
        res.json({ message: "Request declined successfully" });
    }
    catch (error) {
        console.error("Error declining request:", error);
        res.status(500).json({ message: "Failed to decline request" });
    }
}));
// DELETE request - admin only
router.delete("/:id", role_based_auth_1.verifyToken, role_based_auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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

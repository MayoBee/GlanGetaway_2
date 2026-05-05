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
const mongoose_1 = __importDefault(require("mongoose"));
const website_feedback_1 = __importDefault(require("../models/website-feedback"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
// Create website feedback
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, message, email, pageUrl, userAgent, timestamp } = req.body;
        // Validate required fields
        if (!type || !message) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: type, message",
            });
        }
        // Validate feedback type
        const validTypes = ["bug", "feature", "issue", "feedback", "compliment"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback type",
            });
        }
        // Get client IP
        const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const feedback = new website_feedback_1.default({
            type,
            message,
            email: email || undefined,
            pageUrl: pageUrl || req.headers.referer || "Unknown",
            userAgent: userAgent || req.headers["user-agent"] || "Unknown",
            ipAddress: clientIP,
        });
        // Save feedback to database
        yield feedback.save();
        // Log feedback for admin monitoring
        console.log(`📝 New Website Feedback [${type.toUpperCase()}]:`);
        console.log(`   ID: ${feedback._id}`);
        console.log(`   Message: ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`);
        console.log(`   Email: ${email || "Not provided"}`);
        console.log(`   Page: ${feedback.pageUrl}`);
        console.log(`   Time: ${feedback.createdAt}`);
        console.log(`   IP: ${feedback.ipAddress}`);
        console.log("---");
        res.status(201).json({
            success: true,
            message: "Feedback submitted successfully. Thank you for helping us improve!",
            data: {
                id: feedback._id,
                type: feedback.type,
                timestamp: feedback.createdAt,
            },
        });
    }
    catch (error) {
        console.error("Error saving website feedback:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
// Get all feedback (authenticated users)
router.get("/", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, page = 1, limit = 10, type } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        const feedback = yield website_feedback_1.default.find(filter)
            .populate("assignedTo", "firstName lastName email")
            .populate("resolvedBy", "firstName lastName email")
            .sort({ createdAt: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield website_feedback_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: feedback,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
// Get feedback statistics (authenticated users)
router.get("/stats", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [total, typeStats, statusStats, recent] = yield Promise.all([
            website_feedback_1.default.countDocuments(),
            website_feedback_1.default.aggregate([
                { $group: { _id: "$type", count: { $sum: 1 } } }
            ]),
            website_feedback_1.default.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            website_feedback_1.default.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("assignedTo", "firstName lastName email")
        ]);
        const byType = typeStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});
        const byStatus = statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                total,
                byType,
                byStatus,
                recent,
            },
        });
    }
    catch (error) {
        console.error("Error fetching feedback stats:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
// Get feedback by ID (authenticated users)
router.get("/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback ID",
            });
        }
        const feedback = yield website_feedback_1.default.findById(id)
            .populate("assignedTo", "firstName lastName email")
            .populate("resolvedBy", "firstName lastName email");
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found",
            });
        }
        res.json({
            success: true,
            data: feedback,
        });
    }
    catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
// Update feedback status (authenticated users)
router.put("/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, adminNotes, priority, assignedTo } = req.body;
        const adminId = req.userId;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback ID",
            });
        }
        const validStatuses = ["new", "reviewed", "resolved", "dismissed"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }
        const updateData = {};
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
        if (priority) {
            updateData.priority = priority;
        }
        if (assignedTo) {
            updateData.assignedTo = assignedTo;
        }
        const feedback = yield website_feedback_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate("assignedTo", "firstName lastName email")
            .populate("resolvedBy", "firstName lastName email");
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found",
            });
        }
        res.json({
            success: true,
            message: "Feedback updated successfully",
            data: feedback,
        });
    }
    catch (error) {
        console.error("Error updating feedback:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
// Delete feedback (authenticated users)
router.delete("/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback ID",
            });
        }
        const feedback = yield website_feedback_1.default.findByIdAndDelete(id);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found",
            });
        }
        console.log(`🗑️ Deleted feedback #${id}`);
        res.json({
            success: true,
            message: "Feedback deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting feedback:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
exports.default = router;

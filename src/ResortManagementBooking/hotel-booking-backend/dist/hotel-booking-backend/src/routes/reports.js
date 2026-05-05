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
const report_1 = __importDefault(require("../models/report"));
const role_based_auth_1 = require("../middleware/role-based-auth");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
// Create a new report
router.post("/", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reportedItemId, reportedItemType, reason, description, priority } = req.body;
        const reporterId = req.userId;
        // Validate required fields
        if (!reportedItemId || !reportedItemType || !reason || !description) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: reportedItemId, reportedItemType, reason, description",
            });
        }
        // Check if user already reported this item
        const existingReport = yield report_1.default.findOne({
            reporterId,
            reportedItemId,
            reportedItemType,
            status: { $in: ["pending", "under_review"] },
        });
        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: "You have already reported this item. It is currently under review.",
            });
        }
        const newReport = new report_1.default({
            reporterId,
            reportedItemId,
            reportedItemType,
            reason,
            description,
            priority: priority || "medium",
        });
        yield newReport.save();
        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            data: newReport,
        });
    }
    catch (error) {
        console.error("Error creating report:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
// Get all reports (admin only)
router.get("/", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (status) {
            filter.status = status;
        }
        const reports = yield report_1.default.find(filter)
            .populate("reporterId", "firstName lastName email")
            .populate("resolvedBy", "firstName lastName email")
            .sort({ createdAt: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield report_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: reports,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
// Get report by ID
router.get("/:id", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID",
            });
        }
        const report = yield report_1.default.findById(id)
            .populate("reporterId", "firstName lastName email")
            .populate("resolvedBy", "firstName lastName email");
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        console.error("Error fetching report:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
// Update report status (admin only)
router.put("/:id", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const adminId = req.userId;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID",
            });
        }
        const validStatuses = ["pending", "under_review", "resolved", "dismissed"];
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
        const report = yield report_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate("reporterId", "firstName lastName email")
            .populate("resolvedBy", "firstName lastName email");
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }
        res.json({
            success: true,
            message: "Report updated successfully",
            data: report,
        });
    }
    catch (error) {
        console.error("Error updating report:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
// Delete report (admin only)
router.delete("/:id", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID",
            });
        }
        const report = yield report_1.default.findByIdAndDelete(id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }
        res.json({
            success: true,
            message: "Report deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting report:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
// Get reports by reporter
router.get("/my-reports", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reporterId = req.userId;
        const { status, page = 1, limit = 10 } = req.query;
        const filter = { reporterId };
        if (status) {
            filter.status = status;
        }
        const reports = yield report_1.default.find(filter)
            .populate("resolvedBy", "firstName lastName email")
            .sort({ createdAt: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield report_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: reports,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching user reports:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
exports.default = router;

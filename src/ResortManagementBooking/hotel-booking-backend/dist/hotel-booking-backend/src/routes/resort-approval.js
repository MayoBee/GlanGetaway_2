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
const hotel_1 = __importDefault(require("../models/hotel"));
const user_1 = __importDefault(require("../models/user"));
const role_based_auth_1 = require("../middleware/role-based-auth");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Get all pending resorts (for admin approval)
router.get("/pending", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const pendingResorts = yield hotel_1.default.find({ isApproved: false })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "firstName lastName email");
        const total = yield hotel_1.default.countDocuments({ isApproved: false });
        res.json({
            data: pendingResorts,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("Error fetching pending resorts:", error);
        res.status(500).json({ message: "Error fetching pending resorts" });
    }
}));
// Get all resorts (including unapproved) for admin
router.get("/all", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        let query = {};
        if (status === "approved") {
            query = { isApproved: true };
        }
        else if (status === "pending") {
            query = { isApproved: false };
        }
        const resorts = yield hotel_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "firstName lastName email");
        const total = yield hotel_1.default.countDocuments(query);
        res.json({
            data: resorts,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("Error fetching all resorts:", error);
        res.status(500).json({ message: "Error fetching resorts" });
    }
}));
// Approve a resort
router.post("/:resortId/approve", role_based_auth_1.verifyToken, [(0, express_validator_1.param)("resortId").notEmpty().withMessage("Resort ID is required")], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const resort = yield hotel_1.default.findById(req.params.resortId);
        if (!resort) {
            return res.status(404).json({ message: "Resort not found" });
        }
        if (resort.isApproved) {
            return res.status(400).json({ message: "Resort is already approved" });
        }
        // Update resort with approval details
        yield hotel_1.default.findByIdAndUpdate(req.params.resortId, {
            isApproved: true,
            approvedBy: req.userId,
            approvedAt: new Date(),
            rejectionReason: undefined,
        });
        // Get resort owner details for notification
        const resortOwner = yield user_1.default.findById(resort.userId);
        res.json({
            message: "Resort approved successfully",
            resort: {
                id: resort._id,
                name: resort.name,
                owner: (resortOwner === null || resortOwner === void 0 ? void 0 : resortOwner.firstName) + " " + (resortOwner === null || resortOwner === void 0 ? void 0 : resortOwner.lastName),
            },
        });
    }
    catch (error) {
        console.error("Error approving resort:", error);
        res.status(500).json({ message: "Error approving resort" });
    }
}));
// Reject a resort
router.post("/:resortId/reject", role_based_auth_1.verifyToken, [
    (0, express_validator_1.param)("resortId").notEmpty().withMessage("Resort ID is required"),
    (0, express_validator_1.body)("rejectionReason").notEmpty().withMessage("Rejection reason is required"),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const resort = yield hotel_1.default.findById(req.params.resortId);
        if (!resort) {
            return res.status(404).json({ message: "Resort not found" });
        }
        if (resort.isApproved) {
            return res.status(400).json({ message: "Cannot reject an approved resort" });
        }
        const { rejectionReason } = req.body;
        // Update resort with rejection details
        yield hotel_1.default.findByIdAndUpdate(req.params.resortId, {
            isApproved: false,
            approvedBy: undefined,
            approvedAt: undefined,
            rejectionReason,
        });
        // Get resort owner details for notification
        const resortOwner = yield user_1.default.findById(resort.userId);
        res.json({
            message: "Resort rejected successfully",
            resort: {
                id: resort._id,
                name: resort.name,
                owner: (resortOwner === null || resortOwner === void 0 ? void 0 : resortOwner.firstName) + " " + (resortOwner === null || resortOwner === void 0 ? void 0 : resortOwner.lastName),
                rejectionReason,
            },
        });
    }
    catch (error) {
        console.error("Error rejecting resort:", error);
        res.status(500).json({ message: "Error rejecting resort" });
    }
}));
// Get resort approval statistics
router.get("/stats", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalResorts = yield hotel_1.default.countDocuments();
        const approvedResorts = yield hotel_1.default.countDocuments({ isApproved: true });
        const pendingResorts = yield hotel_1.default.countDocuments({ isApproved: false });
        res.json({
            total: totalResorts,
            approved: approvedResorts,
            pending: pendingResorts,
            approvalRate: totalResorts > 0 ? (approvedResorts / totalResorts) * 100 : 0,
        });
    }
    catch (error) {
        console.error("Error fetching approval stats:", error);
        res.status(500).json({ message: "Error fetching approval statistics" });
    }
}));
exports.default = router;

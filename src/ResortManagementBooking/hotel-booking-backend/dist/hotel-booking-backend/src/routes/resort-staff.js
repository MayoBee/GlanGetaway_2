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
const user_1 = __importDefault(require("../models/user"));
const hotel_1 = __importDefault(require("../models/hotel"));
const role_based_auth_1 = require("../middleware/role-based-auth");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Get all staff for current owner's resorts
router.get("/", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ownerUserId = req.userId;
        // Get all resorts owned by this owner
        const ownerResorts = yield hotel_1.default.find({ userId: ownerUserId }).select("_id name staff");
        // Collect all staff from all resorts
        const staffMap = new Map();
        for (const resort of ownerResorts) {
            if (resort.staff && Array.isArray(resort.staff)) {
                for (const staffMember of resort.staff) {
                    if (staffMember.isActive) {
                        const staffId = staffMember.staffUserId;
                        if (!staffMap.has(staffId)) {
                            staffMap.set(staffId, {
                                _id: staffId,
                                firstName: staffMember.firstName,
                                lastName: staffMember.lastName,
                                email: staffMember.email,
                                role: staffMember.role,
                                isActive: staffMember.isActive,
                                mustChangePassword: staffMember.mustChangePassword,
                                permissions: staffMember.permissions,
                                assignedResorts: [],
                            });
                        }
                        staffMap.get(staffId).assignedResorts.push({
                            resortId: resort._id.toString(),
                            resortName: resort.name,
                            role: staffMember.role,
                        });
                    }
                }
            }
        }
        res.json({
            success: true,
            data: Array.from(staffMap.values()),
        });
    }
    catch (error) {
        console.error("Error fetching resort staff:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Create a new front desk staff member (resort owner only)
router.post("/", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["resort_owner"]), [
    (0, express_validator_1.check)("email", "Email is required").isEmail(),
    (0, express_validator_1.check)("password", "Password with 6 or more characters required").isLength({ min: 6 }),
    (0, express_validator_1.check)("firstName", "First name is required").isString(),
    (0, express_validator_1.check)("lastName", "Last name is required").isString(),
    (0, express_validator_1.check)("role", "Role is required").isIn(["front_desk", "housekeeping"]),
    (0, express_validator_1.check)("resortIds", "At least one resort must be assigned").isArray({ min: 1 }),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array() });
    }
    try {
        const { email, password, firstName, lastName, role, resortIds, permissions } = req.body;
        const ownerUserId = req.userId;
        // Check if user already exists
        const existingUser = yield user_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email already exists" });
        }
        // Validate that all resortIds belong to the current owner
        const ownerResorts = yield hotel_1.default.find({ userId: ownerUserId }).select("_id");
        const ownerResortIds = ownerResorts.map(r => r._id.toString());
        const invalidIds = resortIds.filter((id) => !ownerResortIds.includes(id));
        if (invalidIds.length > 0) {
            return res.status(403).json({
                success: false,
                message: "You can only assign staff to your own resorts",
                invalidIds
            });
        }
        // Create staff user with hashed password
        const user = new user_1.default({
            email,
            password,
            firstName,
            lastName,
            role,
            mustChangePassword: true,
            permissions: permissions || {
                canManageBookings: role === "front_desk",
                canManageRooms: role === "front_desk",
                canManagePricing: false,
                canManageAmenities: false,
                canManageActivities: role === "front_desk",
                canViewReports: role === "front_desk",
                canManageBilling: role === "front_desk",
                canManageHousekeeping: role === "housekeeping",
                canManageMaintenance: false,
                canManageUsers: false,
            },
        });
        yield user.save();
        // Add staff to each resort's staff array
        const staffEntry = {
            staffUserId: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            isActive: true,
            mustChangePassword: user.mustChangePassword,
            assignedAt: new Date(),
        };
        yield hotel_1.default.updateMany({ _id: { $in: resortIds } }, { $push: { staff: staffEntry } });
        res.status(201).json({
            success: true,
            message: "Staff member created successfully",
            data: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
            },
        });
    }
    catch (error) {
        console.error("Error creating resort staff:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Update staff member (resort owner only)
router.put("/:staffId", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { staffId } = req.params;
        const { firstName, lastName, phone, permissions, isActive, resortIds } = req.body;
        const ownerUserId = req.userId;
        // Update user fields
        const user = yield user_1.default.findById(staffId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }
        if (firstName)
            user.firstName = firstName;
        if (lastName)
            user.lastName = lastName;
        if (phone)
            user.phone = phone;
        if (permissions)
            user.permissions = permissions;
        if (isActive !== undefined)
            user.isActive = isActive;
        yield user.save();
        // Update resort assignments if provided
        if (resortIds && Array.isArray(resortIds)) {
            // Validate resort ownership
            const ownerResorts = yield hotel_1.default.find({ userId: ownerUserId }).select("_id");
            const ownerResortIds = ownerResorts.map(r => r._id.toString());
            const invalidIds = resortIds.filter((id) => !ownerResortIds.includes(id));
            if (invalidIds.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: "You can only assign staff to your own resorts",
                    invalidIds
                });
            }
            // Remove staff from all owner's resorts first
            yield hotel_1.default.updateMany({ userId: ownerUserId }, { $pull: { staff: { staffUserId: staffId } } });
            // Add staff to new resorts
            const staffEntry = {
                staffUserId: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                isActive: user.isActive,
                mustChangePassword: user.mustChangePassword,
                assignedAt: new Date(),
            };
            yield hotel_1.default.updateMany({ _id: { $in: resortIds } }, { $push: { staff: staffEntry } });
        }
        res.json({
            success: true,
            message: "Staff member updated successfully",
            data: user,
        });
    }
    catch (error) {
        console.error("Error updating resort staff:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Deactivate staff member (resort owner only)
router.delete("/:staffId", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { staffId } = req.params;
        const ownerUserId = req.userId;
        // Remove staff from all owner's resorts
        const result = yield hotel_1.default.updateMany({ userId: ownerUserId }, { $pull: { staff: { staffUserId: staffId } } });
        if (result.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: "Staff member not found or not assigned to your resorts" });
        }
        // Deactivate user
        const user = yield user_1.default.findById(staffId);
        if (user) {
            user.isActive = false;
            yield user.save();
        }
        res.json({
            success: true,
            message: "Staff member deactivated successfully",
        });
    }
    catch (error) {
        console.error("Error deactivating resort staff:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Toggle staff status (activate/deactivate)
router.patch("/:staffId/toggle-status", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { staffId } = req.params;
        const ownerUserId = req.userId;
        // Find the staff user
        const staffUser = yield user_1.default.findById(staffId);
        if (!staffUser) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }
        // Check if this staff is assigned to any of the owner's resorts
        const ownerResorts = yield hotel_1.default.find({
            userId: ownerUserId,
            "staff.staffUserId": staffId
        });
        if (ownerResorts.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Staff member is not assigned to your resorts"
            });
        }
        // Toggle user status
        staffUser.isActive = !staffUser.isActive;
        yield staffUser.save();
        // Update staff status in all owner's resorts
        yield hotel_1.default.updateMany({
            userId: ownerUserId,
            "staff.staffUserId": staffId
        }, { $set: { "staff.$.isActive": staffUser.isActive } });
        res.json({
            success: true,
            message: `Staff member ${staffUser.isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                staffId: staffUser._id,
                isActive: staffUser.isActive
            }
        });
    }
    catch (error) {
        console.error("Error toggling staff status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get resorts assigned to current front desk user
router.get("/assigned-resorts", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["front_desk", "housekeeping"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const staffUserId = req.userId;
        // Find all hotels where this staff user is assigned and active
        const hotels = yield hotel_1.default.find({
            "staff.staffUserId": staffUserId,
            "staff.isActive": true,
        });
        res.json({
            success: true,
            data: hotels,
        });
    }
    catch (error) {
        console.error("Error fetching assigned resorts:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;

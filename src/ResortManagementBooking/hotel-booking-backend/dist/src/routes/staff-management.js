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
const role_based_auth_1 = require("../middleware/role-based-auth");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Get all staff members (admin only)
router.get("/staff", role_based_auth_1.verifyToken, role_based_auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, department, role, page = 1, limit = 20 } = req.query;
        const filter = {
            role: { $in: ["front_desk", "housekeeping", "resort_owner", "admin"] }
        };
        if (department) {
            filter["staffProfile.department"] = department;
        }
        if (role) {
            filter.role = role;
        }
        const staff = yield user_1.default.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield user_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: staff,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching staff:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Create a new staff member (admin only)
router.post("/staff", role_based_auth_1.verifyToken, role_based_auth_1.requireAdmin, [
    (0, express_validator_1.check)("email", "Email is required").isEmail(),
    (0, express_validator_1.check)("password", "Password with 6 or more characters required").isLength({ min: 6 }),
    (0, express_validator_1.check)("firstName", "First name is required").isString(),
    (0, express_validator_1.check)("lastName", "Last name is required").isString(),
    (0, express_validator_1.check)("role", "Role is required").isIn(["front_desk", "housekeeping", "admin"]),
    (0, express_validator_1.check)("department", "Department is required").isIn(["front_desk", "housekeeping", "maintenance", "food_beverage", "activities"]),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array() });
    }
    try {
        const { email, password, firstName, lastName, role, department, phone, staffProfile } = req.body;
        // Check if user already exists
        const existingUser = yield user_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email already exists" });
        }
        // Create staff user
        const user = new user_1.default({
            email,
            password,
            firstName,
            lastName,
            role,
            phone,
            staffProfile: {
                department,
                employeeId: staffProfile === null || staffProfile === void 0 ? void 0 : staffProfile.employeeId,
                hireDate: (staffProfile === null || staffProfile === void 0 ? void 0 : staffProfile.hireDate) || new Date(),
                shiftSchedule: staffProfile === null || staffProfile === void 0 ? void 0 : staffProfile.shiftSchedule,
                hourlyRate: staffProfile === null || staffProfile === void 0 ? void 0 : staffProfile.hourlyRate,
                isActive: true,
            },
            permissions: {
                canManageBookings: role === "front_desk" || role === "resort_owner",
                canManageRooms: role === "front_desk" || role === "resort_owner",
                canManagePricing: role === "resort_owner",
                canManageAmenities: role === "resort_owner",
                canManageActivities: role === "resort_owner" || role === "front_desk",
                canViewReports: role === "resort_owner" || role === "front_desk",
                canManageBilling: role === "front_desk" || role === "resort_owner",
                canManageHousekeeping: role === "housekeeping" || role === "resort_owner",
                canManageMaintenance: role === "resort_owner",
                canManageUsers: role === "resort_owner",
            },
        });
        yield user.save();
        res.status(201).json({
            success: true,
            message: "Staff member created successfully",
            data: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                staffProfile: user.staffProfile,
            },
        });
    }
    catch (error) {
        console.error("Error creating staff:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Update staff member (admin only)
router.put("/staff/:id", role_based_auth_1.verifyToken, role_based_auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { firstName, lastName, phone, role, department, staffProfile, permissions, isActive } = req.body;
        const user = yield user_1.default.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }
        // Update fields
        if (firstName)
            user.firstName = firstName;
        if (lastName)
            user.lastName = lastName;
        if (phone)
            user.phone = phone;
        if (role)
            user.role = role;
        if (department && user.staffProfile) {
            user.staffProfile.department = department;
        }
        if (staffProfile) {
            if (user.staffProfile) {
                if (staffProfile.employeeId)
                    user.staffProfile.employeeId = staffProfile.employeeId;
                if (staffProfile.shiftSchedule)
                    user.staffProfile.shiftSchedule = staffProfile.shiftSchedule;
                if (staffProfile.hourlyRate)
                    user.staffProfile.hourlyRate = staffProfile.hourlyRate;
                if (staffProfile.isActive !== undefined)
                    user.staffProfile.isActive = staffProfile.isActive;
            }
        }
        if (permissions)
            user.permissions = permissions;
        if (isActive !== undefined)
            user.isActive = isActive;
        yield user.save();
        res.json({
            success: true,
            message: "Staff member updated successfully",
            data: user,
        });
    }
    catch (error) {
        console.error("Error updating staff:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Deactivate staff member (admin only)
router.delete("/staff/:id", role_based_auth_1.verifyToken, role_based_auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_1.default.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }
        user.isActive = false;
        if (user.staffProfile) {
            user.staffProfile.isActive = false;
        }
        yield user.save();
        res.json({
            success: true,
            message: "Staff member deactivated successfully",
        });
    }
    catch (error) {
        console.error("Error deactivating staff:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get staff by ID
router.get("/staff/:id", role_based_auth_1.verifyToken, role_based_auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_1.default.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error("Error fetching staff:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;

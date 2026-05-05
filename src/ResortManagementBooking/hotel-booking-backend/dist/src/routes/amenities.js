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
const amenity_1 = __importDefault(require("../models/amenity"));
const activity_1 = __importDefault(require("../models/activity"));
const role_based_auth_1 = require("../middleware/role-based-auth");
const router = express_1.default.Router();
// ==================== AMENITIES ====================
// Get all amenities
router.get("/amenities", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "front_desk"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, type, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        if (type)
            filter.type = type;
        if (status)
            filter.status = status;
        const amenities = yield amenity_1.default.find(filter)
            .sort({ name: 1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield amenity_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: amenities,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching amenities:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get amenity by ID
router.get("/amenities/:id", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const amenity = yield amenity_1.default.findById(id);
        if (!amenity) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }
        res.json({
            success: true,
            data: amenity,
        });
    }
    catch (error) {
        console.error("Error fetching amenity:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Create amenity
router.post("/amenities", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const amenityData = req.body;
        const amenity = new amenity_1.default(amenityData);
        yield amenity.save();
        res.status(201).json({
            success: true,
            message: "Amenity created successfully",
            data: amenity,
        });
    }
    catch (error) {
        console.error("Error creating amenity:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Update amenity
router.put("/amenities/:id", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updates = req.body;
        const amenity = yield amenity_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!amenity) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }
        res.json({
            success: true,
            message: "Amenity updated successfully",
            data: amenity,
        });
    }
    catch (error) {
        console.error("Error updating amenity:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Update amenity status
router.patch("/amenities/:id/status", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const amenity = yield amenity_1.default.findByIdAndUpdate(id, { status }, { new: true });
        if (!amenity) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }
        res.json({
            success: true,
            message: "Amenity status updated successfully",
            data: amenity,
        });
    }
    catch (error) {
        console.error("Error updating amenity status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Delete amenity
router.delete("/amenities/:id", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const amenity = yield amenity_1.default.findByIdAndDelete(id);
        if (!amenity) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }
        res.json({
            success: true,
            message: "Amenity deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting amenity:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// ==================== ACTIVITIES ====================
// Get all activities
router.get("/activities", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "front_desk"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, type, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        if (type)
            filter.type = type;
        if (status)
            filter.status = status;
        const activities = yield activity_1.default.find(filter)
            .sort({ name: 1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield activity_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: activities,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get activity by ID
router.get("/activities/:id", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const activity = yield activity_1.default.findById(id);
        if (!activity) {
            return res.status(404).json({ success: false, message: "Activity not found" });
        }
        res.json({
            success: true,
            data: activity,
        });
    }
    catch (error) {
        console.error("Error fetching activity:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Create activity
router.post("/activities", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activityData = req.body;
        const activity = new activity_1.default(activityData);
        yield activity.save();
        res.status(201).json({
            success: true,
            message: "Activity created successfully",
            data: activity,
        });
    }
    catch (error) {
        console.error("Error creating activity:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Update activity
router.put("/activities/:id", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updates = req.body;
        const activity = yield activity_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!activity) {
            return res.status(404).json({ success: false, message: "Activity not found" });
        }
        res.json({
            success: true,
            message: "Activity updated successfully",
            data: activity,
        });
    }
    catch (error) {
        console.error("Error updating activity:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Update activity status
router.patch("/activities/:id/status", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const activity = yield activity_1.default.findByIdAndUpdate(id, { status }, { new: true });
        if (!activity) {
            return res.status(404).json({ success: false, message: "Activity not found" });
        }
        res.json({
            success: true,
            message: "Activity status updated successfully",
            data: activity,
        });
    }
    catch (error) {
        console.error("Error updating activity status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Delete activity
router.delete("/activities/:id", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const activity = yield activity_1.default.findByIdAndDelete(id);
        if (!activity) {
            return res.status(404).json({ success: false, message: "Activity not found" });
        }
        res.json({
            success: true,
            message: "Activity deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting activity:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get availability for amenity on specific date
router.get("/amenities/:id/availability", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { date } = req.query;
        const amenity = yield amenity_1.default.findById(id);
        if (!amenity) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }
        // Get existing bookings for this amenity on the date
        // This would query the AmenityBooking model
        res.json({
            success: true,
            data: {
                amenity,
                date,
                availableSlots: [], // Would be calculated based on existing bookings
            },
        });
    }
    catch (error) {
        console.error("Error checking amenity availability:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;

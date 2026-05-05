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
const housekeeping_1 = __importDefault(require("../models/housekeeping"));
const maintenance_1 = __importDefault(require("../models/maintenance"));
const room_1 = __importDefault(require("../models/room"));
const role_based_auth_1 = require("../middleware/role-based-auth");
const router = express_1.default.Router();
// ==================== HOUSEKEEPING ====================
// Get all housekeeping tasks
router.get("/housekeeping", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "housekeeping", "front_desk"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, status, priority, assignedTo, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        if (status)
            filter.status = status;
        if (priority)
            filter.priority = priority;
        if (assignedTo)
            filter.assignedTo = assignedTo;
        const tasks = yield housekeeping_1.default.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield housekeeping_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: tasks,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching housekeeping tasks:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Create housekeeping task
router.post("/housekeeping", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "front_desk"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskData = req.body;
        const task = new housekeeping_1.default(taskData);
        yield task.save();
        // Update room status
        if (task.status === "in_progress") {
            yield room_1.default.findByIdAndUpdate(task.roomId, { status: "cleaning" });
        }
        res.status(201).json({
            success: true,
            message: "Housekeeping task created successfully",
            data: task,
        });
    }
    catch (error) {
        console.error("Error creating housekeeping task:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Update housekeeping task
router.put("/housekeeping/:id", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "housekeeping"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updates = req.body;
        const task = yield housekeeping_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        // Update room status based on task status
        if (task.status === "completed") {
            yield room_1.default.findByIdAndUpdate(task.roomId, {
                status: "available",
                housekeepingStatus: "clean",
                lastCleaned: new Date()
            });
        }
        res.json({
            success: true,
            message: "Housekeeping task updated successfully",
            data: task,
        });
    }
    catch (error) {
        console.error("Error updating housekeeping task:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Assign housekeeping task
router.patch("/housekeeping/:id/assign", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "housekeeping"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { assignedTo, assignedToName } = req.body;
        const task = yield housekeeping_1.default.findByIdAndUpdate(id, { assignedTo, assignedToName, status: "in_progress" }, { new: true });
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        res.json({
            success: true,
            message: "Task assigned successfully",
            data: task,
        });
    }
    catch (error) {
        console.error("Error assigning housekeeping task:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Complete housekeeping task
router.patch("/housekeeping/:id/complete", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "housekeeping"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { notes, issues } = req.body;
        const task = yield housekeeping_1.default.findByIdAndUpdate(id, {
            status: "completed",
            completedAt: new Date(),
            notes,
            issues
        }, { new: true });
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        // Update room status
        yield room_1.default.findByIdAndUpdate(task.roomId, {
            status: "available",
            housekeepingStatus: "clean",
            lastCleaned: new Date()
        });
        res.json({
            success: true,
            message: "Task completed successfully",
            data: task,
        });
    }
    catch (error) {
        console.error("Error completing housekeeping task:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// ==================== MAINTENANCE ====================
// Get all maintenance requests
router.get("/maintenance", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "housekeeping", "front_desk"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, status, priority, category, assignedTo, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        if (status)
            filter.status = status;
        if (priority)
            filter.priority = priority;
        if (category)
            filter.category = category;
        if (assignedTo)
            filter.assignedTo = assignedTo;
        const requests = yield maintenance_1.default.find(filter)
            .sort({ priority: -1, createdAt: -1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield maintenance_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: requests,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching maintenance requests:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get maintenance request by ID
router.get("/maintenance/:id", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const request = yield maintenance_1.default.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Maintenance request not found" });
        }
        res.json({
            success: true,
            data: request,
        });
    }
    catch (error) {
        console.error("Error fetching maintenance request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Create maintenance request
router.post("/maintenance", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requestData = req.body;
        const request = new maintenance_1.default(requestData);
        yield request.save();
        // Update room/amenity status if applicable
        if (requestData.roomId) {
            yield room_1.default.findByIdAndUpdate(requestData.roomId, { status: "maintenance" });
        }
        res.status(201).json({
            success: true,
            message: "Maintenance request created successfully",
            data: request,
        });
    }
    catch (error) {
        console.error("Error creating maintenance request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Update maintenance request
router.put("/maintenance/:id", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updates = req.body;
        const request = yield maintenance_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!request) {
            return res.status(404).json({ success: false, message: "Maintenance request not found" });
        }
        res.json({
            success: true,
            message: "Maintenance request updated successfully",
            data: request,
        });
    }
    catch (error) {
        console.error("Error updating maintenance request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Assign maintenance request
router.patch("/maintenance/:id/assign", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { assignedTo, assignedToName } = req.body;
        const request = yield maintenance_1.default.findByIdAndUpdate(id, { assignedTo, assignedToName, status: "assigned", assignedAt: new Date() }, { new: true });
        if (!request) {
            return res.status(404).json({ success: false, message: "Maintenance request not found" });
        }
        res.json({
            success: true,
            message: "Request assigned successfully",
            data: request,
        });
    }
    catch (error) {
        console.error("Error assigning maintenance request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Start maintenance work
router.patch("/maintenance/:id/start", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "maintenance"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const request = yield maintenance_1.default.findByIdAndUpdate(id, { status: "in_progress", startedAt: new Date() }, { new: true });
        if (!request) {
            return res.status(404).json({ success: false, message: "Maintenance request not found" });
        }
        res.json({
            success: true,
            message: "Maintenance started",
            data: request,
        });
    }
    catch (error) {
        console.error("Error starting maintenance:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Complete maintenance request
router.patch("/maintenance/:id/complete", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "maintenance"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { actualCost, parts, laborHours, notes } = req.body;
        const request = yield maintenance_1.default.findByIdAndUpdate(id, {
            status: "completed",
            completedAt: new Date(),
            actualCost,
            parts,
            laborHours,
            $push: { notes: { $each: notes || [] } }
        }, { new: true });
        if (!request) {
            return res.status(404).json({ success: false, message: "Maintenance request not found" });
        }
        // Update room/amenity status back to available
        if (request.roomId) {
            yield room_1.default.findByIdAndUpdate(request.roomId, { status: "available" });
        }
        res.json({
            success: true,
            message: "Maintenance completed successfully",
            data: request,
        });
    }
    catch (error) {
        console.error("Error completing maintenance:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Add note to maintenance request
router.post("/maintenance/:id/notes", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content, author, authorName } = req.body;
        const request = yield maintenance_1.default.findByIdAndUpdate(id, {
            $push: {
                notes: {
                    content,
                    author,
                    authorName,
                    createdAt: new Date()
                }
            }
        }, { new: true });
        if (!request) {
            return res.status(404).json({ success: false, message: "Maintenance request not found" });
        }
        res.json({
            success: true,
            message: "Note added successfully",
            data: request,
        });
    }
    catch (error) {
        console.error("Error adding note:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;

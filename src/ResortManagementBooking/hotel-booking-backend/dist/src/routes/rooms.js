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
const room_1 = __importDefault(require("../models/room"));
const role_based_auth_1 = require("../middleware/role-based-auth");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Get all rooms
router.get("/", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "front_desk"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, status, roomType, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (hotelId)
            filter.hotelId = hotelId;
        if (status)
            filter.status = status;
        if (roomType)
            filter.roomType = roomType;
        const rooms = yield room_1.default.find(filter)
            .sort({ floor: 1, roomNumber: 1 })
            .limit(Number(limit) * Number(page))
            .skip((Number(page) - 1) * Number(limit));
        const total = yield room_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: rooms,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get room by ID
router.get("/:id", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const room = yield room_1.default.findById(id);
        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }
        res.json({
            success: true,
            data: room,
        });
    }
    catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Create a new room
router.post("/", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), [
    (0, express_validator_1.check)("hotelId", "Hotel ID is required").isString(),
    (0, express_validator_1.check)("roomNumber", "Room number is required").isString(),
    (0, express_validator_1.check)("roomType", "Room type is required").isIn(["standard", "deluxe", "suite", "family", "cottage"]),
    (0, express_validator_1.check)("description", "Description is required").isString(),
    (0, express_validator_1.check)("maxOccupancy", "Max occupancy must be a number").isNumeric(),
    (0, express_validator_1.check)("basePrice", "Base price must be a number").isNumeric(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array() });
    }
    try {
        const roomData = req.body;
        // Check if room number already exists for this hotel
        const existingRoom = yield room_1.default.findOne({
            hotelId: roomData.hotelId,
            roomNumber: roomData.roomNumber,
        });
        if (existingRoom) {
            return res.status(400).json({ success: false, message: "Room number already exists for this hotel" });
        }
        const room = new room_1.default(Object.assign(Object.assign({}, roomData), { currentPrice: roomData.basePrice, status: "available", housekeepingStatus: "clean" }));
        yield room.save();
        res.status(201).json({
            success: true,
            message: "Room created successfully",
            data: room,
        });
    }
    catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Update a room
router.put("/:id", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Don't allow changing hotelId or roomNumber
        delete updates.hotelId;
        delete updates.roomNumber;
        const room = yield room_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }
        res.json({
            success: true,
            message: "Room updated successfully",
            data: room,
        });
    }
    catch (error) {
        console.error("Error updating room:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Update room status
router.patch("/:id/status", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner", "front_desk", "housekeeping"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, housekeepingStatus } = req.body;
        const updateData = {};
        if (status)
            updateData.status = status;
        if (housekeepingStatus)
            updateData.housekeepingStatus = housekeepingStatus;
        const room = yield room_1.default.findByIdAndUpdate(id, updateData, { new: true });
        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }
        res.json({
            success: true,
            message: "Room status updated successfully",
            data: room,
        });
    }
    catch (error) {
        console.error("Error updating room status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Delete a room
router.delete("/:id", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const room = yield room_1.default.findByIdAndDelete(id);
        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }
        res.json({
            success: true,
            message: "Room deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting room:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Get room availability for date range
router.get("/availability/check", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, checkIn, checkOut, roomType } = req.query;
        if (!hotelId || !checkIn || !checkOut) {
            return res.status(400).json({ success: false, message: "Hotel ID, check-in and check-out dates are required" });
        }
        const filter = {
            hotelId: hotelId,
            status: { $in: ["available", "reserved"] },
        };
        if (roomType) {
            filter.roomType = roomType;
        }
        const rooms = yield room_1.default.find(filter);
        // Get bookings that overlap with the requested dates
        const bookings = yield room_1.default.find({
            hotelId: hotelId,
            status: "occupied",
            // Add logic to check date overlap
        });
        // Filter out rooms that are booked during the requested period
        const availableRooms = rooms.filter(room => {
            // Add overlap checking logic
            return true; // Simplified for now
        });
        res.json({
            success: true,
            data: {
                totalRooms: rooms.length,
                availableRooms: availableRooms.length,
                rooms: availableRooms,
            },
        });
    }
    catch (error) {
        console.error("Error checking room availability:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// Bulk create rooms
router.post("/bulk", role_based_auth_1.verifyToken, (0, role_based_auth_1.requireRole)(["admin", "resort_owner"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, rooms } = req.body;
        if (!hotelId || !rooms || !Array.isArray(rooms)) {
            return res.status(400).json({ success: false, message: "Hotel ID and rooms array are required" });
        }
        const createdRooms = [];
        const errors = [];
        for (const roomData of rooms) {
            const existingRoom = yield room_1.default.findOne({
                hotelId,
                roomNumber: roomData.roomNumber,
            });
            if (existingRoom) {
                errors.push(`Room ${roomData.roomNumber} already exists`);
                continue;
            }
            const room = new room_1.default(Object.assign(Object.assign({}, roomData), { hotelId, currentPrice: roomData.basePrice || roomData.pricePerNight, status: "available", housekeepingStatus: "clean" }));
            yield room.save();
            createdRooms.push(room);
        }
        res.status(201).json({
            success: true,
            message: `${createdRooms.length} rooms created successfully`,
            data: createdRooms,
            errors: errors.length > 0 ? errors : undefined,
        });
    }
    catch (error) {
        console.error("Error bulk creating rooms:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;

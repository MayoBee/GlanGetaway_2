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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const room_block_1 = __importDefault(require("../models/room-block"));
const room_1 = __importDefault(require("../models/room"));
// Extended Request interface with user - using auth.ts declaration
// Inline verifyToken middleware
const verifyToken = (req, res, next) => {
    var _a;
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    else {
        token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.session_id;
    }
    if (!token) {
        return res.status(401).json({ message: "unauthorized" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        req.userId = decoded.userId;
        req.user = { id: req.userId, _id: req.userId };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "unauthorized" });
    }
};
const router = express_1.default.Router();
// Quick block duration in minutes
const QUICK_BLOCK_DURATION = 15;
/**
 * POST /api/room-blocks/quick-block
 * Create a quick block for 15 minutes (phone inquiry)
 */
router.post("/quick-block", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { hotelId, roomId, guestName, guestPhone, reason } = req.body;
        const blockedBy = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) || req.userId;
        if (!hotelId || !roomId) {
            return res.status(400).json({ message: "Hotel ID and Room ID are required" });
        }
        // Check if room exists
        const room = yield room_1.default.findOne({ _id: roomId, hotelId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check for existing active blocks on this room
        const existingBlock = yield room_block_1.default.findOne({
            roomId,
            status: "active",
            expiresAt: { $gt: new Date() },
        });
        if (existingBlock) {
            return res.status(409).json({
                message: "Room is already blocked",
                existingBlock: {
                    id: existingBlock._id,
                    expiresAt: existingBlock.expiresAt,
                    guestName: existingBlock.guestName,
                },
            });
        }
        // Calculate expiration time
        const now = new Date();
        const expiresAt = new Date(now.getTime() + QUICK_BLOCK_DURATION * 60 * 1000);
        // Create the quick block
        const roomBlock = new room_block_1.default({
            hotelId,
            roomId,
            blockedBy,
            blockType: "quick_block",
            reason: reason || "Phone inquiry - awaiting deposit",
            guestName,
            guestPhone,
            startsAt: now,
            expiresAt,
            status: "active",
        });
        yield roomBlock.save();
        // Schedule automatic release after 15 minutes
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const block = yield room_block_1.default.findById(roomBlock._id);
                if (block && block.status === "active") {
                    block.status = "expired";
                    yield block.save();
                    console.log(`[Quick-Block] Room ${roomId} block automatically released`);
                }
            }
            catch (error) {
                console.error("[Quick-Block] Error releasing expired block:", error);
            }
        }), QUICK_BLOCK_DURATION * 60 * 1000);
        res.status(201).json({
            message: "Room successfully blocked for 15 minutes",
            block: {
                id: roomBlock._id,
                roomId: roomBlock.roomId,
                roomNumber: room.roomNumber,
                expiresAt: roomBlock.expiresAt,
                minutesRemaining: QUICK_BLOCK_DURATION,
            },
        });
    }
    catch (error) {
        console.error("Error creating quick block:", error);
        res.status(500).json({ message: "Failed to create room block" });
    }
}));
/**
 * GET /api/room-blocks/:hotelId
 * Get all active blocks for a hotel
 */
router.get("/:hotelId", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.params;
        const { status } = req.query;
        const query = { hotelId };
        if (status) {
            query.status = status;
        }
        else {
            query.status = "active";
            query.expiresAt = { $gt: new Date() };
        }
        const blocks = yield room_block_1.default.find(query)
            .populate("roomId", "roomNumber roomType")
            .sort({ createdAt: -1 });
        res.json(blocks);
    }
    catch (error) {
        console.error("Error fetching room blocks:", error);
        res.status(500).json({ message: "Failed to fetch room blocks" });
    }
}));
/**
 * GET /api/room-blocks/room/:roomId
 * Check if a room has active blocks
 */
router.get("/room/:roomId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.params;
        const activeBlock = yield room_block_1.default.findOne({
            roomId,
            status: "active",
            expiresAt: { $gt: new Date() },
        });
        if (activeBlock) {
            const minutesRemaining = Math.max(0, Math.ceil((new Date(activeBlock.expiresAt).getTime() - Date.now()) / 60000));
            return res.json({
                isBlocked: true,
                block: {
                    id: activeBlock._id,
                    blockType: activeBlock.blockType,
                    guestName: activeBlock.guestName,
                    guestPhone: activeBlock.guestPhone,
                    reason: activeBlock.reason,
                    expiresAt: activeBlock.expiresAt,
                    minutesRemaining,
                },
            });
        }
        res.json({ isBlocked: false });
    }
    catch (error) {
        console.error("Error checking room block:", error);
        res.status(500).json({ message: "Failed to check room status" });
    }
}));
/**
 * POST /api/room-blocks/:blockId/convert
 * Convert a quick block to a booking
 */
router.post("/:blockId/convert", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { blockId } = req.params;
        const { bookingId } = req.body;
        const block = yield room_block_1.default.findById(blockId);
        if (!block) {
            return res.status(404).json({ message: "Block not found" });
        }
        if (block.status !== "active") {
            return res.status(400).json({ message: "Block is not active" });
        }
        if (new Date() > block.expiresAt) {
            block.status = "expired";
            yield block.save();
            return res.status(400).json({ message: "Block has expired" });
        }
        // Convert to booking
        block.status = "converted";
        block.convertedToBookingId = bookingId;
        yield block.save();
        res.json({
            message: "Block converted to booking successfully",
            blockId: block._id,
            bookingId,
        });
    }
    catch (error) {
        console.error("Error converting block:", error);
        res.status(500).json({ message: "Failed to convert block" });
    }
}));
/**
 * POST /api/room-blocks/:blockId/release
 * Manually release a room block
 */
router.post("/:blockId/release", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { blockId } = req.params;
        const block = yield room_block_1.default.findById(blockId);
        if (!block) {
            return res.status(404).json({ message: "Block not found" });
        }
        block.status = "released";
        yield block.save();
        res.json({
            message: "Block released successfully",
            blockId: block._id,
        });
    }
    catch (error) {
        console.error("Error releasing block:", error);
        res.status(500).json({ message: "Failed to release block" });
    }
}));
/**
 * POST /api/room-blocks/:blockId/extend
 * Extend a quick block by additional minutes
 */
router.post("/:blockId/extend", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { blockId } = req.params;
        const { additionalMinutes } = req.body;
        const extendBy = additionalMinutes || 15;
        const block = yield room_block_1.default.findById(blockId);
        if (!block) {
            return res.status(404).json({ message: "Block not found" });
        }
        if (block.status !== "active") {
            return res.status(400).json({ message: "Block is not active" });
        }
        // Add extension time
        const newExpiresAt = new Date(block.expiresAt.getTime() + extendBy * 60 * 1000);
        block.expiresAt = newExpiresAt;
        yield block.save();
        const minutesRemaining = Math.ceil((newExpiresAt.getTime() - Date.now()) / 60000);
        res.json({
            message: `Block extended by ${extendBy} minutes`,
            block: {
                id: block._id,
                expiresAt: block.expiresAt,
                minutesRemaining,
            },
        });
    }
    catch (error) {
        console.error("Error extending block:", error);
        res.status(500).json({ message: "Failed to extend block" });
    }
}));
exports.default = router;

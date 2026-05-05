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
const mongoose_1 = __importDefault(require("mongoose"));
const roomBlockSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true, index: true },
    roomId: { type: String, required: true, index: true },
    blockedBy: { type: String, required: true },
    blockType: {
        type: String,
        enum: ["quick_block", "reserved", "maintenance"],
        default: "quick_block",
    },
    reason: { type: String, default: "Phone inquiry - awaiting deposit" },
    guestName: { type: String },
    guestPhone: { type: String },
    startsAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    status: {
        type: String,
        enum: ["active", "converted", "released", "expired"],
        default: "active",
    },
    convertedToBookingId: { type: String },
}, {
    timestamps: true,
});
// Compound indexes
roomBlockSchema.index({ hotelId: 1, roomId: 1, status: 1 });
roomBlockSchema.index({ expiresAt: 1, status: 1 });
// Method to check if block is expired
roomBlockSchema.methods.isExpired = function () {
    return new Date() > this.expiresAt;
};
// Static method to find active blocks for a room
roomBlockSchema.statics.findActiveBlocksForRoom = function (roomId) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.find({
            roomId,
            status: "active",
            expiresAt: { $gt: new Date() },
        });
    });
};
exports.default = mongoose_1.default.model("RoomBlock", roomBlockSchema);

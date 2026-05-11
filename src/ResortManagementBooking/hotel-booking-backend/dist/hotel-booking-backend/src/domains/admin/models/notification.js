"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: ["reservation", "maintenance", "housekeeping", "billing", "system", "message"],
        required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    relatedEntityType: {
        type: String,
        enum: ["booking", "room", "amenity", "activity", "billing", "maintenance", "housekeeping"],
    },
    relatedEntityId: { type: String },
    actionUrl: { type: String },
}, {
    timestamps: true,
});
// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ hotelId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model("Notification", notificationSchema);

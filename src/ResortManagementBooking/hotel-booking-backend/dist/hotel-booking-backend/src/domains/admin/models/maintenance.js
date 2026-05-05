"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const maintenanceSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true },
    roomId: { type: String },
    roomNumber: { type: String },
    amenityId: { type: String },
    amenityName: { type: String },
    category: {
        type: String,
        enum: ["plumbing", "electrical", "hvac", "furniture", "appliance", "structural", "other"],
        required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "emergency"],
        default: "medium",
    },
    status: {
        type: String,
        enum: ["reported", "assigned", "in_progress", "completed", "verified", "cancelled"],
        default: "reported",
        index: true,
    },
    reportedBy: { type: String, required: true },
    reportedByName: { type: String },
    assignedTo: { type: String },
    assignedToName: { type: String },
    reportedAt: { type: Date, default: Date.now },
    assignedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    parts: [
        {
            name: { type: String },
            quantity: { type: Number, default: 0 },
            cost: { type: Number, default: 0 },
        },
    ],
    laborHours: { type: Number, default: 0 },
    laborRate: { type: Number, default: 0 },
    notes: [
        {
            content: { type: String },
            author: { type: String },
            authorName: { type: String },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    images: [{ type: String }],
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String },
}, {
    timestamps: true,
});
// Indexes
maintenanceSchema.index({ hotelId: 1, status: 1 });
maintenanceSchema.index({ hotelId: 1, category: 1 });
maintenanceSchema.index({ assignedTo: 1, status: 1 });
exports.default = mongoose_1.default.model("Maintenance", maintenanceSchema);

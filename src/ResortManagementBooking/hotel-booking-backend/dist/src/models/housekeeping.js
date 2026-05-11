"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const housekeepingSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true, index: true },
    roomId: { type: String, required: true },
    roomNumber: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "in_progress", "completed", "inspected"],
        default: "pending",
        index: true,
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
    },
    taskType: {
        type: String,
        enum: ["checkout", "stayover", "deep_cleaning", "turnover", "inspection"],
        required: true,
    },
    assignedTo: { type: String },
    assignedToName: { type: String },
    notes: { type: String },
    completedAt: { type: Date },
    inspectedBy: { type: String },
    inspectedAt: { type: Date },
    issues: [
        {
            description: { type: String },
            severity: { type: String, enum: ["low", "medium", "high"] },
            resolved: { type: Boolean, default: false },
        },
    ],
    supplies: [
        {
            item: { type: String },
            quantity: { type: Number, default: 0 },
        },
    ],
}, {
    timestamps: true,
});
// Indexes
housekeepingSchema.index({ hotelId: 1, status: 1 });
housekeepingSchema.index({ hotelId: 1, assignedTo: 1 });
housekeepingSchema.index({ roomId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model("Housekeeping", housekeepingSchema);

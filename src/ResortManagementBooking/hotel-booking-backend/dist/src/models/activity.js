"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const activitySchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true },
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ["tour", "water_activity", "land_activity", "entertainment", "rental", "workshop", "other"],
        required: true,
    },
    description: { type: String, required: true },
    location: { type: String },
    duration: { type: Number, required: true },
    maxParticipants: { type: Number, required: true },
    minParticipants: { type: Number, default: 1 },
    pricing: {
        adultPrice: { type: Number, required: true },
        childPrice: { type: Number, default: 0 },
        groupPrice: { type: Number, default: 0 },
        minimumGroupSize: { type: Number, default: 0 },
    },
    schedule: {
        daysOfWeek: [{ type: String }],
        startTime: { type: String },
        endTime: { type: String },
        customDates: [{ type: Date }],
    },
    images: [{ type: String }],
    requirements: [{ type: String }],
    includedItems: [{ type: String }],
    ageRestriction: {
        minimumAge: { type: Number, default: 0 },
        maximumAge: { type: Number, default: 999 },
    },
    equipmentRequired: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, default: 0 },
            provided: { type: Boolean, default: true },
        },
    ],
    instructorRequired: { type: Boolean, default: false },
    requiresReservation: { type: Boolean, default: true },
    cancellationPolicy: { type: String },
    status: {
        type: String,
        enum: ["active", "inactive", "seasonal"],
        default: "active",
    },
    seasonStart: { type: Date },
    seasonEnd: { type: Date },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});
// Indexes
activitySchema.index({ hotelId: 1, type: 1 });
activitySchema.index({ hotelId: 1, status: 1 });
exports.default = mongoose_1.default.model("Activity", activitySchema);

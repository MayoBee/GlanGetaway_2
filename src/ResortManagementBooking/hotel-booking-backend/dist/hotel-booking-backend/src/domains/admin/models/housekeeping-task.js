"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const housekeepingTaskSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true },
    bookingId: { type: String },
    roomId: { type: String, required: true, index: true },
    roomNumber: { type: String, required: true },
    taskType: {
        type: String,
        enum: ["checkout", "checkin", "turnover", "deep_clean", "maintenance"],
        default: "turnover",
    },
    priority: {
        type: String,
        enum: ["urgent", "high", "normal", "low"],
        default: "normal",
    },
    status: {
        type: String,
        enum: ["pending", "assigned", "in_progress", "completed", "verified", "cancelled"],
        default: "pending",
    },
    assignedTo: { type: String },
    assignedBy: { type: String },
    // QR Code specific
    qrCode: { type: String, required: true, unique: true },
    qrCodeGeneratedAt: { type: Date, default: Date.now },
    qrCodeScannedAt: { type: Date },
    // Checklist items
    checklist: [
        {
            item: { type: String, required: true },
            status: {
                type: String,
                enum: ["pending", "passed", "failed", "na"],
                default: "pending",
            },
            notes: { type: String },
            photoUrl: { type: String },
            completedAt: { type: Date },
        },
    ],
    // Room condition photos
    conditionPhotos: [{ type: String }],
    // Check-out specific
    checkoutInspection: {
        guestPresent: { type: Boolean, default: false },
        earlyCheckout: { type: Boolean, default: false },
        damagesFound: { type: Boolean, default: false },
        missingItems: { type: Boolean, default: false },
        barConsumption: [
            {
                item: { type: String },
                quantity: { type: Number },
                price: { type: Number },
            },
        ],
        damageDescription: { type: String },
        guestSignature: { type: String },
    },
    // Deposit refund
    depositRefund: {
        amount: { type: Number },
        method: {
            type: String,
            enum: ["cash", "gcash", "bank_transfer", "ewallet"],
        },
        referenceNumber: { type: String },
        refundedAt: { type: Date },
        refundedBy: { type: String },
        refusedReason: { type: String },
    },
    // Timing
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    verifiedAt: { type: Date },
    // Notes
    notes: { type: String },
    completionNotes: { type: String },
    // Staff comments
    staffComments: [
        {
            staffId: { type: String },
            comment: { type: String },
            timestamp: { type: Date, default: Date.now },
        },
    ],
}, {
    timestamps: true,
});
// Compound indexes
housekeepingTaskSchema.index({ hotelId: 1, status: 1 });
housekeepingTaskSchema.index({ assignedTo: 1, status: 1 });
housekeepingTaskSchema.index({ bookingId: 1 });
// Default checklist for checkout
housekeepingTaskSchema.statics.getDefaultCheckoutChecklist = () => [
    { item: "Check all drawers and cabinets", status: "pending" },
    { item: "Check under beds", status: "pending" },
    { item: "Check bathroom for personal items", status: "pending" },
    { item: "Check closet for items left behind", status: "pending" },
    { item: "Check mini-bar/fridge", status: "pending" },
    { item: "Check TV remote and controls", status: "pending" },
    { item: "Check air conditioning unit", status: "pending" },
    { item: "Check for damages to walls/furniture", status: "pending" },
    { item: "Check bathroom fixtures", status: "pending" },
    { item: "Check towels and linens", status: "pending" },
    { item: "Check room keys/cards returned", status: "pending" },
    { item: "Take photos of room condition", status: "pending" },
];
exports.default = mongoose_1.default.model("HousekeepingTask", housekeepingTaskSchema);

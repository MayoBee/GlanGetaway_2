"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const billingSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true },
    bookingId: { type: String, required: true },
    guestId: { type: String, required: true },
    guestName: { type: String, required: true },
    roomCharges: [
        {
            description: { type: String },
            roomNumber: { type: String },
            nights: { type: Number, default: 0 },
            rate: { type: Number, default: 0 },
            amount: { type: Number, default: 0 },
        },
    ],
    amenityCharges: [
        {
            amenityId: { type: String },
            amenityName: { type: String },
            date: { type: Date },
            quantity: { type: Number, default: 0 },
            rate: { type: Number, default: 0 },
            amount: { type: Number, default: 0 },
        },
    ],
    activityCharges: [
        {
            activityId: { type: String },
            activityName: { type: String },
            date: { type: Date },
            participants: { type: Number, default: 0 },
            rate: { type: Number, default: 0 },
            amount: { type: Number, default: 0 },
        },
    ],
    serviceCharges: [
        {
            description: { type: String },
            amount: { type: Number, default: 0 },
        },
    ],
    discounts: [
        {
            code: { type: String },
            type: { type: String, enum: ["percentage", "fixed"] },
            amount: { type: Number, default: 0 },
        },
    ],
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0.12 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    payments: [
        {
            paymentId: { type: String },
            paymentMethod: {
                type: String,
                enum: ["cash", "credit_card", "debit_card", "gcash", "bank_transfer", "other"],
            },
            amount: { type: Number, default: 0 },
            referenceNumber: { type: String },
            processedAt: { type: Date },
            processedBy: { type: String },
            status: {
                type: String,
                enum: ["pending", "completed", "failed", "refunded"],
                default: "pending",
            },
        },
    ],
    totalPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentStatus: {
        type: String,
        enum: ["pending", "partial", "paid", "overdue"],
        default: "pending",
    },
    folioNumber: { type: String, required: true },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    status: {
        type: String,
        enum: ["open", "closed", "cancelled"],
        default: "open",
    },
    notes: { type: String },
}, {
    timestamps: true,
});
// Indexes
billingSchema.index({ hotelId: 1, bookingId: 1 }, { unique: true });
billingSchema.index({ hotelId: 1, paymentStatus: 1 });
billingSchema.index({ hotelId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model("Billing", billingSchema);

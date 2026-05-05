"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const paymentTransactionSchema = new mongoose_1.default.Schema({
    bookingId: { type: String, required: true },
    hotelId: { type: String, required: true },
    guestId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "PHP" },
    type: {
        type: String,
        enum: ["deposit", "full", "incidentals"],
        default: "deposit",
    },
    status: {
        type: String,
        enum: ["pending", "processing", "succeeded", "failed", "refunded", "cancelled"],
        default: "pending",
    },
    paymentMethod: {
        type: String,
        enum: ["gcash", "bank_transfer", "stripe", "card", "cash"],
        default: "gcash",
    },
    // Stripe specific fields
    stripePaymentIntentId: { type: String },
    stripePaymentMethodId: { type: String },
    stripeCustomerId: { type: String },
    // Manual payment verification fields
    referenceNumber: { type: String },
    screenshotUrl: { type: String },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    verificationNote: { type: String },
    // Deposit settings
    depositPercentage: { type: Number },
    depositAmount: { type: Number },
    remainingAmount: { type: Number },
    // Refund details
    refundAmount: { type: Number },
    refundedAt: { type: Date },
    refundMethod: { type: String },
    // Metadata
    guestName: { type: String, required: true },
    guestEmail: { type: String },
    guestPhone: { type: String },
    notes: { type: String },
}, {
    timestamps: true,
});
// Compound indexes
paymentTransactionSchema.index({ bookingId: 1, status: 1 });
paymentTransactionSchema.index({ hotelId: 1, createdAt: -1 });
paymentTransactionSchema.index({ stripePaymentIntentId: 1 });
exports.default = mongoose_1.default.model("PaymentTransaction", paymentTransactionSchema);

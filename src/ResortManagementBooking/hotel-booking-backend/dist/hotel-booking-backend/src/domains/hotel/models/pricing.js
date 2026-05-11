"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pricingSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true },
    seasonalRates: [
        {
            name: { type: String, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            multiplier: { type: Number, required: true, default: 1.0 },
            description: String,
            isActive: { type: Boolean, default: true },
        },
    ],
    eventPricing: [
        {
            name: { type: String, required: true },
            eventName: { type: String, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            flatRate: Number,
            percentageIncrease: Number,
            description: String,
            isActive: { type: Boolean, default: true },
        },
    ],
    discounts: [
        {
            code: { type: String, required: true },
            name: { type: String, required: true },
            type: { type: String, enum: ["percentage", "fixed"], required: true },
            value: { type: Number, required: true },
            minBookingAmount: { type: Number, default: 0 },
            maxDiscount: Number,
            applicableRoomTypes: [{ type: String }],
            validFrom: { type: Date, required: true },
            validUntil: { type: Date, required: true },
            maxUses: { type: Number, default: 0 },
            currentUses: { type: Number, default: 0 },
            isActive: { type: Boolean, default: true },
            discountCategory: {
                type: String,
                enum: ["senior_citizen", "pwd", "corporate", "promotional", "loyalty", "group"],
            },
            requiredDocuments: [{ type: String }],
        },
    ],
    pricingRules: [
        {
            name: { type: String, required: true },
            condition: {
                dayOfWeek: [{ type: String }],
                minNights: Number,
                maxNights: Number,
                bookingLeadDays: Number,
            },
            adjustment: {
                type: { type: String, enum: ["percentage", "fixed"] },
                value: Number,
            },
            isActive: { type: Boolean, default: true },
        },
    ],
}, {
    timestamps: true,
});
// Index for efficient queries
pricingSchema.index({ hotelId: 1 });
exports.default = mongoose_1.default.model("Pricing", pricingSchema);

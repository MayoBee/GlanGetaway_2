"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const analyticsSchema = new mongoose_1.default.Schema({
    date: { type: Date, required: true, index: true },
    metrics: {
        totalBookings: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        totalUsers: { type: Number, default: 0 },
        totalHotels: { type: Number, default: 0 },
        averageBookingValue: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
        cancellationRate: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
    },
    breakdown: {
        byStatus: {
            pending: { type: Number, default: 0 },
            confirmed: { type: Number, default: 0 },
            cancelled: { type: Number, default: 0 },
            completed: { type: Number, default: 0 },
            refunded: { type: Number, default: 0 },
        },
        byPaymentStatus: {
            pending: { type: Number, default: 0 },
            paid: { type: Number, default: 0 },
            failed: { type: Number, default: 0 },
            refunded: { type: Number, default: 0 },
        },
        byDestination: [
            {
                city: String,
                bookings: Number,
                revenue: Number,
            },
        ],
        byHotelType: [
            {
                type: String,
                bookings: Number,
                revenue: Number,
            },
        ],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});
// Add compound indexes for better query performance
analyticsSchema.index({ date: 1 });
analyticsSchema.index({ "metrics.totalRevenue": -1 });
exports.default = mongoose_1.default.model("Analytics", analyticsSchema);

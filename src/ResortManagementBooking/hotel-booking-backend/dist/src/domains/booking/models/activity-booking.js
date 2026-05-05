"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const activityBookingSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true },
    bookingId: { type: String },
    guestId: { type: String, required: true },
    guestName: { type: String, required: true },
    activityId: { type: String, required: true },
    activityName: { type: String, required: true },
    activityType: { type: String },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    adultParticipants: { type: Number, default: 0 },
    childParticipants: { type: Number, default: 0 },
    totalParticipants: { type: Number, default: 0 },
    equipment: [
        {
            equipmentId: { type: String },
            name: { type: String },
            quantity: { type: Number, default: 0 },
            price: { type: Number, default: 0 },
        },
    ],
    adultPrice: { type: Number, default: 0 },
    childPrice: { type: Number, default: 0 },
    equipmentCost: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending",
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending",
    },
    paymentMethod: { type: String },
    specialRequests: { type: String },
    notes: { type: String },
}, {
    timestamps: true,
});
// Indexes
activityBookingSchema.index({ hotelId: 1, activityId: 1, date: 1 });
activityBookingSchema.index({ bookingId: 1 });
activityBookingSchema.index({ guestId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model("ActivityBooking", activityBookingSchema);

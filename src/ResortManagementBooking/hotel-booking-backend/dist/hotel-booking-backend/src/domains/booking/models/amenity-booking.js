"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const amenityBookingSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true },
    bookingId: { type: String },
    guestId: { type: String, required: true },
    guestName: { type: String, required: true },
    amenityId: { type: String, required: true },
    amenityName: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    numberOfGuests: { type: Number, default: 1 },
    equipment: [
        {
            equipmentId: { type: String },
            name: { type: String },
            quantity: { type: Number, default: 0 },
            price: { type: Number, default: 0 },
        },
    ],
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
}, {
    timestamps: true,
});
// Indexes
amenityBookingSchema.index({ hotelId: 1, amenityId: 1, date: 1 });
amenityBookingSchema.index({ bookingId: 1 });
amenityBookingSchema.index({ guestId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model("AmenityBooking", amenityBookingSchema);

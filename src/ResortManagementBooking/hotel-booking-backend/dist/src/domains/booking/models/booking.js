"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bookingSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    hotelId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    adultCount: { type: Number, required: true },
    childCount: { type: Number, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    checkInTime: { type: String, required: true, default: "12:00" },
    checkOutTime: { type: String, required: true, default: "11:00" },
    totalCost: { type: Number, required: true },
    basePrice: { type: Number, required: true },
    selectedRooms: [{
            id: { type: String, required: true },
            name: { type: String, required: true },
            type: { type: String, required: true },
            pricePerNight: { type: Number, required: true },
            maxOccupancy: { type: Number, required: true },
            description: { type: String }
        }],
    // Note: selectedCottages temporarily disabled to fix parallel arrays issue
    // selectedCottages: [{
    //   id: { type: String, required: true },
    //   name: { type: String, required: true },
    //   type: { type: String, required: true },
    //   pricePerNight: { type: Number, required: true },
    //   maxOccupancy: { type: Number, required: true },
    //   description: { type: String }
    // }],
    selectedAmenities: [{
            id: { type: String, required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String }
        }],
    roomIds: [{ type: String }],
    cottageIds: [{ type: String }],
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed", "refunded"],
        default: "pending",
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
    },
    paymentMethod: { type: String },
    specialRequests: { type: String },
    cancellationReason: { type: String },
    refundAmount: { type: Number, default: 0 },
    // PWD/Senior Citizen tracking
    isPwdBooking: { type: Boolean, default: false },
    isSeniorCitizenBooking: { type: Boolean, default: false },
    discountApplied: {
        type: {
            type: String,
            enum: ["pwd", "senior_citizen", null],
            default: null
        },
        percentage: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
    },
    // 8-hour change window
    changeWindowDeadline: { type: Date },
    canModify: { type: Boolean, default: true },
    // Resort owner verification
    verifiedByOwner: { type: Boolean, default: false },
    ownerVerificationNote: { type: String },
    ownerVerifiedAt: { type: Date },
    // Modification history
    rescheduleHistory: [{
            oldCheckIn: { type: Date },
            oldCheckOut: { type: Date },
            newCheckIn: { type: Date },
            newCheckOut: { type: Date },
            reason: { type: String },
            requestedAt: { type: Date },
            status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" }
        }],
    modificationHistory: [{
            type: { type: String, enum: ["add_items", "remove_items", "reschedule"] },
            addedRooms: { type: Number, default: 0 },
            addedCottages: { type: Number, default: 0 },
            addedAmenities: { type: Number, default: 0 },
            removedRooms: { type: Number, default: 0 },
            removedCottages: { type: Number, default: 0 },
            removedAmenities: { type: Number, default: 0 },
            additionalAmount: { type: Number, default: 0 },
            refundAmount: { type: Number, default: 0 },
            modifiedAt: { type: Date }
        }],
    // GCash payment details
    gcashPayment: {
        gcashNumber: { type: String },
        referenceNumber: { type: String },
        amountPaid: { type: Number, default: 0 },
        paymentTime: { type: Date },
        status: { type: String, default: 'pending' },
        screenshotFile: { type: String },
        rejectionReason: { type: String }
    },
    // Audit fields
    // createdAt and updatedAt are automatically handled by timestamps: true
}, {
    timestamps: true,
});
// Add compound indexes for better query performance
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ hotelId: 1, checkIn: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ paymentStatus: 1, createdAt: -1 });
bookingSchema.index({ checkIn: 1, status: 1 });
bookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1, status: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model("Booking", bookingSchema);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const reviewSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    hotelId: { type: String, required: true },
    bookingId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    categories: {
        cleanliness: { type: Number, required: true, min: 1, max: 5 },
        service: { type: Number, required: true, min: 1, max: 5 },
        location: { type: Number, required: true, min: 1, max: 5 },
        value: { type: Number, required: true, min: 1, max: 5 },
        amenities: { type: Number, required: true, min: 1, max: 5 },
    },
    isVerified: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});
// Add compound indexes for better query performance
reviewSchema.index({ hotelId: 1, rating: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ hotelId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model("Review", reviewSchema);

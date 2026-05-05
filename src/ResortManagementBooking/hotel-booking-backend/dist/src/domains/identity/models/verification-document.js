"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const verificationDocumentSchema = new mongoose_1.default.Schema({
    bookingId: { type: String, required: true, ref: "Booking" },
    userId: { type: String, required: true, ref: "User" },
    hotelId: { type: String, required: true, ref: "Hotel" },
    documentType: {
        type: String,
        enum: ["pwd_id", "senior_citizen_id", "government_id", "other"],
        required: true,
    },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "expired"],
        default: "pending",
    },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
}, {
    timestamps: true,
});
// Compound indexes
verificationDocumentSchema.index({ bookingId: 1, documentType: 1 });
verificationDocumentSchema.index({ hotelId: 1, status: 1 });
verificationDocumentSchema.index({ userId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model("VerificationDocument", verificationDocumentSchema);

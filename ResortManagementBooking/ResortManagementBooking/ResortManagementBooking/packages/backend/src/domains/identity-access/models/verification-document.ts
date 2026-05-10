import mongoose, { Document } from "mongoose";

export interface IVerificationDocument extends Document {
  _id: string;
  bookingId: string;
  userId: string;
  hotelId: string;
  documentType: "pwd_id" | "senior_citizen_id" | "government_id" | "other";
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: "pending" | "approved" | "rejected" | "expired";
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const verificationDocumentSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes
verificationDocumentSchema.index({ bookingId: 1, documentType: 1 });
verificationDocumentSchema.index({ hotelId: 1, status: 1 });
verificationDocumentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IVerificationDocument>(
  "VerificationDocument",
  verificationDocumentSchema
);

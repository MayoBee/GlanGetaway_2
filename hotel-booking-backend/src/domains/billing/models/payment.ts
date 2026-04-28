import mongoose, { Document } from "mongoose";

export interface IPaymentTransaction extends Document {
  _id: string;
  bookingId: string;
  hotelId: string;
  guestId: string;
  amount: number;
  currency: string;
  type: "deposit" | "full" | "incidentals";
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled";
  paymentMethod: "gcash" | "bank_transfer" | "stripe" | "card" | "cash";
  // Stripe specific fields
  stripePaymentIntentId?: string;
  stripePaymentMethodId?: string;
  stripeCustomerId?: string;
  // Manual payment verification fields
  referenceNumber?: string;
  screenshotUrl?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNote?: string;
  // Deposit settings
  depositPercentage?: number; // 50 for 50%, 30 for 30%
  depositAmount?: number;
  remainingAmount?: number;
  // Refund details
  refundAmount?: number;
  refundedAt?: Date;
  refundMethod?: string;
  // Metadata
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  notes?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes
paymentTransactionSchema.index({ bookingId: 1, status: 1 });
paymentTransactionSchema.index({ hotelId: 1, createdAt: -1 });
paymentTransactionSchema.index({ stripePaymentIntentId: 1 });

export default mongoose.model<IPaymentTransaction>(
  "PaymentTransaction",
  paymentTransactionSchema
);

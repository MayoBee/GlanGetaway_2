import mongoose, { Document } from "mongoose";

export interface IBilling extends Document {
  _id: string;
  hotelId: string;
  bookingId: string;
  guestId: string;
  guestName: string;
  roomCharges: Array<{
    description: string;
    roomNumber: string;
    nights: number;
    rate: number;
    amount: number;
  }>;
  amenityCharges: Array<{
    amenityId: string;
    amenityName: string;
    date: Date;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  activityCharges: Array<{
    activityId: string;
    activityName: string;
    date: Date;
    participants: number;
    rate: number;
    amount: number;
  }>;
  serviceCharges: Array<{
    description: string;
    amount: number;
  }>;
  discounts: Array<{
    code: string;
    type: "percentage" | "fixed";
    amount: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  payments: Array<{
    paymentId: string;
    paymentMethod: "cash" | "credit_card" | "debit_card" | "gcash" | "bank_transfer" | "other";
    amount: number;
    referenceNumber: string;
    processedAt: Date;
    processedBy: string;
    status: "pending" | "completed" | "failed" | "refunded";
  }>;
  totalPaid: number;
  balanceDue: number;
  paymentStatus: "pending" | "partial" | "paid" | "overdue";
  folioNumber: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: "open" | "closed" | "cancelled";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const billingSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    bookingId: { type: String, required: true },
    guestId: { type: String, required: true },
    guestName: { type: String, required: true },
    roomCharges: [
      {
        description: { type: String },
        roomNumber: { type: String },
        nights: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    amenityCharges: [
      {
        amenityId: { type: String },
        amenityName: { type: String },
        date: { type: Date },
        quantity: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    activityCharges: [
      {
        activityId: { type: String },
        activityName: { type: String },
        date: { type: Date },
        participants: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    serviceCharges: [
      {
        description: { type: String },
        amount: { type: Number, default: 0 },
      },
    ],
    discounts: [
      {
        code: { type: String },
        type: { type: String, enum: ["percentage", "fixed"] },
        amount: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0.12 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    payments: [
      {
        paymentId: { type: String },
        paymentMethod: {
          type: String,
          enum: ["cash", "credit_card", "debit_card", "gcash", "bank_transfer", "other"],
        },
        amount: { type: Number, default: 0 },
        referenceNumber: { type: String },
        processedAt: { type: Date },
        processedBy: { type: String },
        status: {
          type: String,
          enum: ["pending", "completed", "failed", "refunded"],
          default: "pending",
        },
      },
    ],
    totalPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
    },
    folioNumber: { type: String, required: true },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    status: {
      type: String,
      enum: ["open", "closed", "cancelled"],
      default: "open",
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
billingSchema.index({ hotelId: 1, bookingId: 1 }, { unique: true });
billingSchema.index({ hotelId: 1, paymentStatus: 1 });
billingSchema.index({ hotelId: 1, createdAt: -1 });

export default mongoose.model<IBilling>("Billing", billingSchema);

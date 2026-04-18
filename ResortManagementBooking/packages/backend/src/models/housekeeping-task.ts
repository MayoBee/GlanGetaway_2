import mongoose, { Document } from "mongoose";

export interface IHousekeepingTask extends Document {
  _id: string;
  hotelId: string;
  bookingId?: string;
  roomId: string;
  roomNumber: string;
  taskType: "checkout" | "checkin" | "turnover" | "deep_clean" | "maintenance";
  priority: "urgent" | "high" | "normal" | "low";
  status: "pending" | "assigned" | "in_progress" | "completed" | "verified" | "cancelled";
  assignedTo?: string; // Staff ID
  assignedBy?: string;
  // QR Code specific
  qrCode: string;
  qrCodeGeneratedAt: Date;
  qrCodeScannedAt?: Date;
  // Checklist items
  checklist: {
    item: string;
    status: "pending" | "passed" | "failed" | "na";
    notes?: string;
    photoUrl?: string;
    completedAt?: Date;
  }[];
  // Room condition photos
  conditionPhotos?: string[];
  // Check-out specific
  checkoutInspection?: {
    guestPresent: boolean;
    earlyCheckout: boolean;
    damagesFound: boolean;
    missingItems: boolean;
    barConsumption?: {
      item: string;
      quantity: number;
      price: number;
    }[];
    damageDescription?: string;
    guestSignature?: string;
  };
  // Deposit refund
  depositRefund?: {
    amount: number;
    method: "cash" | "gcash" | "bank_transfer" | "ewallet";
    referenceNumber?: string;
    refundedAt?: Date;
    refundedBy?: string;
    refusedReason?: string;
  };
  // Timing
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  // Notes
  notes?: string;
  completionNotes?: string;
  // Staff comments
  staffComments?: {
    staffId: string;
    comment: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const housekeepingTaskSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    bookingId: { type: String },
    roomId: { type: String, required: true, index: true },
    roomNumber: { type: String, required: true },
    taskType: {
      type: String,
      enum: ["checkout", "checkin", "turnover", "deep_clean", "maintenance"],
      default: "turnover",
    },
    priority: {
      type: String,
      enum: ["urgent", "high", "normal", "low"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed", "verified", "cancelled"],
      default: "pending",
    },
    assignedTo: { type: String },
    assignedBy: { type: String },
    // QR Code specific
    qrCode: { type: String, required: true, unique: true },
    qrCodeGeneratedAt: { type: Date, default: Date.now },
    qrCodeScannedAt: { type: Date },
    // Checklist items
    checklist: [
      {
        item: { type: String, required: true },
        status: {
          type: String,
          enum: ["pending", "passed", "failed", "na"],
          default: "pending",
        },
        notes: { type: String },
        photoUrl: { type: String },
        completedAt: { type: Date },
      },
    ],
    // Room condition photos
    conditionPhotos: [{ type: String }],
    // Check-out specific
    checkoutInspection: {
      guestPresent: { type: Boolean, default: false },
      earlyCheckout: { type: Boolean, default: false },
      damagesFound: { type: Boolean, default: false },
      missingItems: { type: Boolean, default: false },
      barConsumption: [
        {
          item: { type: String },
          quantity: { type: Number },
          price: { type: Number },
        },
      ],
      damageDescription: { type: String },
      guestSignature: { type: String },
    },
    // Deposit refund
    depositRefund: {
      amount: { type: Number },
      method: {
        type: String,
        enum: ["cash", "gcash", "bank_transfer", "ewallet"],
      },
      referenceNumber: { type: String },
      refundedAt: { type: Date },
      refundedBy: { type: String },
      refusedReason: { type: String },
    },
    // Timing
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    verifiedAt: { type: Date },
    // Notes
    notes: { type: String },
    completionNotes: { type: String },
    // Staff comments
    staffComments: [
      {
        staffId: { type: String },
        comment: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes
housekeepingTaskSchema.index({ hotelId: 1, status: 1 });
housekeepingTaskSchema.index({ assignedTo: 1, status: 1 });
housekeepingTaskSchema.index({ bookingId: 1 });

// Default checklist for checkout
housekeepingTaskSchema.statics.getDefaultCheckoutChecklist = () => [
  { item: "Check all drawers and cabinets", status: "pending" as const },
  { item: "Check under beds", status: "pending" as const },
  { item: "Check bathroom for personal items", status: "pending" as const },
  { item: "Check closet for items left behind", status: "pending" as const },
  { item: "Check mini-bar/fridge", status: "pending" as const },
  { item: "Check TV remote and controls", status: "pending" as const },
  { item: "Check air conditioning unit", status: "pending" as const },
  { item: "Check for damages to walls/furniture", status: "pending" as const },
  { item: "Check bathroom fixtures", status: "pending" as const },
  { item: "Check towels and linens", status: "pending" as const },
  { item: "Check room keys/cards returned", status: "pending" as const },
  { item: "Take photos of room condition", status: "pending" as const },
];

export default mongoose.model<IHousekeepingTask>(
  "HousekeepingTask",
  housekeepingTaskSchema
);

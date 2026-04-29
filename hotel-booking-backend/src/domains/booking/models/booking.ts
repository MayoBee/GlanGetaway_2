import mongoose, { Document } from "mongoose";

export interface IBooking extends Document {
  _id: string;
  userId: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  adultCount: number;
  childCount: number;
  checkIn: Date;
  checkOut: Date;
  checkInTime: string;
  checkOutTime: string;
  totalCost: number;
  basePrice: number;
  // Combined selected items to avoid parallel array indexing issues
  selectedItems?: Array<{
    id: string;
    name: string;
    type: 'room' | 'cottage' | 'amenity';
    pricePerNight?: number;
    maxOccupancy?: number;
    description?: string;
  }>;
  selectedAmenities?: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
  }>;
  roomIds: string[];
  cottageIds: string[];
  status: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: string;
  paymentIntentId?: string; // For Stripe payments
  specialRequests: string;
  cancellationReason: string;
  refundAmount: number;
  // PWD/Senior Citizen tracking
  isPwdBooking: boolean;
  isSeniorCitizenBooking: boolean;
  discountApplied?: {
    type: "pwd" | "senior_citizen" | null;
    percentage: number;
    amount: number;
  };
  // 8-hour change window
  changeWindowDeadline?: Date;
  canModify?: boolean;
  // Resort owner verification
  verifiedByOwner?: boolean;
  ownerVerificationNote?: string;
  ownerVerifiedAt?: Date;
  // Modification history
  rescheduleHistory?: Array<{
    oldCheckIn: Date;
    oldCheckOut: Date;
    newCheckIn: Date;
    newCheckOut: Date;
    reason: string;
    requestedAt: Date;
    status: "pending" | "approved" | "rejected";
  }>;
  modificationHistory?: Array<{
    type: "add_items" | "remove_items" | "reschedule";
    addedRooms?: number;
    addedCottages?: number;
    addedAmenities?: number;
    removedRooms?: number;
    removedCottages?: number;
    removedAmenities?: number;
    additionalAmount?: number;
    refundAmount?: number;
    modifiedAt: Date;
  }>;
  // GCash payment details
  gcashPayment?: {
    gcashNumber?: string;
    referenceNumber?: string;
    amountPaid?: number;
    paymentTime?: Date;
    status?: string;
    screenshotFile?: string;
    rejectionReason?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const bookingSchema = new mongoose.Schema(
  {
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
    // Combined selected items to avoid parallel array indexing
    selectedItems: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, required: true, enum: ['room', 'cottage', 'amenity'] },
      pricePerNight: { type: Number },
      maxOccupancy: { type: Number },
      description: { type: String }
    }],
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
    paymentIntentId: { type: String }, // For Stripe payments
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
  },
  {
    timestamps: true,
  }
);

// Add compound indexes for better query performance
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ hotelId: 1, checkIn: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ paymentStatus: 1, createdAt: -1 });
bookingSchema.index({ checkIn: 1, status: 1 });
bookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1, status: 1 });
// Removed problematic indexes with array fields to prevent parallel array conflicts
// Availability checking now relies on application logic and basic indexes

// Additional required indexes
bookingSchema.index({ hotelId: 1, status: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ createdAt: -1 });

export default mongoose.model<IBooking>("Booking", bookingSchema);

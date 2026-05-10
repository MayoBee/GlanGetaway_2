import mongoose, { Document } from "mongoose";

export interface IBooking extends Document {
  userId?: string; // Made optional for walk-in bookings
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
  // Walk-in/Kiosk support
  source: "online" | "walk_in"; // Distinguish between online and walk-in bookings
  walkInDetails?: {
    guestId?: string; // Guest ID for walk-in customers
    paymentMethod: "cash" | "card" | "gcash" | "other";
    idType?: "government_id" | "driver_license" | "passport" | "other";
    idNumber?: string;
    notes?: string;
    processedByStaffId: string; // Staff member who processed the walk-in
  };
  selectedRooms?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    maxOccupancy: number;
    description?: string;
  }>;
  selectedCottages?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    maxOccupancy: number;
    description?: string;
  }>;
  selectedAmenities?: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
  }>;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: string;
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
    userId: { type: String, required: false }, // Made optional for walk-in bookings
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
    // Walk-in/Kiosk support
    source: {
      type: String,
      enum: ["online", "walk_in"],
      default: "online",
      required: true
    },
    walkInDetails: {
      guestId: { type: String },
      paymentMethod: {
        type: String,
        enum: ["cash", "card", "gcash", "other"],
        required: true
      },
      idType: {
        type: String,
        enum: ["government_id", "driver_license", "passport", "other"]
      },
      idNumber: { type: String },
      notes: { type: String },
      processedByStaffId: { type: String, required: true }
    },
    selectedRooms: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, required: true },
      pricePerNight: { type: Number, required: true },
      maxOccupancy: { type: Number, required: true },
      description: { type: String }
    }],
    selectedCottages: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, required: true },
      pricePerNight: { type: Number, required: true },
      maxOccupancy: { type: Number, required: true },
      description: { type: String }
    }],
    selectedAmenities: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String }
    }],
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
// Walk-in/kiosk specific indexes
bookingSchema.index({ source: 1, createdAt: -1 });
bookingSchema.index({ hotelId: 1, source: 1, createdAt: -1 });
bookingSchema.index({ "walkInDetails.processedByStaffId": 1, createdAt: -1 });

// Critical unique compound index to prevent double bookings
// This enforces at database level that same room cannot be booked for overlapping dates
bookingSchema.index(
  { 
    hotelId: 1, 
    "selectedRooms.id": 1, 
    checkIn: 1, 
    checkOut: 1,
    status: 1 
  }, 
  { 
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
    name: "unique_room_booking_date"
  }
);

// For cottages
bookingSchema.index(
  { 
    hotelId: 1, 
    "selectedCottages.id": 1, 
    checkIn: 1, 
    checkOut: 1,
    status: 1 
  }, 
  { 
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
    name: "unique_cottage_booking_date"
  }
);

export default mongoose.model<IBooking>("Booking", bookingSchema);

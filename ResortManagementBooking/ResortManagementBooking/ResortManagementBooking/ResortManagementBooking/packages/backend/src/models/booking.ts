// LEGACY BOOKING MODEL - DEPRECATED
// This file is kept for backwards compatibility but the actual model is now in domains/booking-reservation/models/booking.ts
// All imports should use the domain-driven model going forward
// This file only exports the interface for type compatibility, the model is NOT registered here

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

// NOTE: The model is NOT registered here to avoid conflicts with the domain-driven model
// The actual Booking model is registered in domains/booking-reservation/models/booking.ts

import mongoose, { Document } from "mongoose";

export interface IAmenityBooking extends Document {
  _id: string;
  hotelId: string;
  bookingId: string;
  guestId: string;
  guestName: string;
  amenityId: string;
  amenityName: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  numberOfGuests: number;
  equipment: Array<{
    equipmentId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod: string;
  specialRequests: string;
  createdAt: Date;
  updatedAt: Date;
}

const amenityBookingSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    bookingId: { type: String },
    guestId: { type: String, required: true },
    guestName: { type: String, required: true },
    amenityId: { type: String, required: true },
    amenityName: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    numberOfGuests: { type: Number, default: 1 },
    equipment: [
      {
        equipmentId: { type: String },
        name: { type: String },
        quantity: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentMethod: { type: String },
    specialRequests: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
amenityBookingSchema.index({ hotelId: 1, amenityId: 1, date: 1 });
amenityBookingSchema.index({ bookingId: 1 });
amenityBookingSchema.index({ guestId: 1, createdAt: -1 });

export default mongoose.model<IAmenityBooking>("AmenityBooking", amenityBookingSchema);

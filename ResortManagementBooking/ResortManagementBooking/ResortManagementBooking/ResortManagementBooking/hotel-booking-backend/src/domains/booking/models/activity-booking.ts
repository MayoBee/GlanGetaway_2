import mongoose, { Document } from "mongoose";

export interface IActivityBooking extends Document {
  _id: string;
  hotelId: string;
  bookingId: string;
  guestId: string;
  guestName: string;
  activityId: string;
  activityName: string;
  activityType: string;
  date: Date;
  startTime: string;
  endTime: string;
  adultParticipants: number;
  childParticipants: number;
  totalParticipants: number;
  equipment: {
    equipmentId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  adultPrice: number;
  childPrice: number;
  equipmentCost: number;
  subtotal: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod: string;
  specialRequests: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const activityBookingSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    bookingId: { type: String },
    guestId: { type: String, required: true },
    guestName: { type: String, required: true },
    activityId: { type: String, required: true },
    activityName: { type: String, required: true },
    activityType: { type: String },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    adultParticipants: { type: Number, default: 0 },
    childParticipants: { type: Number, default: 0 },
    totalParticipants: { type: Number, default: 0 },
    equipment: [
      {
        equipmentId: { type: String },
        name: { type: String },
        quantity: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
      },
    ],
    adultPrice: { type: Number, default: 0 },
    childPrice: { type: Number, default: 0 },
    equipmentCost: { type: Number, default: 0 },
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
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
activityBookingSchema.index({ hotelId: 1, activityId: 1, date: 1 });
activityBookingSchema.index({ bookingId: 1 });
activityBookingSchema.index({ guestId: 1, createdAt: -1 });

export default mongoose.model<IActivityBooking>("ActivityBooking", activityBookingSchema);

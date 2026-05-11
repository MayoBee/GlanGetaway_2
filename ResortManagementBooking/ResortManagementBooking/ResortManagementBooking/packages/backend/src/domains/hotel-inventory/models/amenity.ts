import mongoose, { Document } from "mongoose";

export interface IAmenity extends Document {
  _id: string;
  hotelId: string;
  name: string;
  type: "pool" | "gazebo" | "beach" | "spa" | "gym" | "restaurant" | "bar" | "function_hall" | "kidsClub" | "other";
  description: string;
  location: string;
  capacity: number;
  operatingHours: {
    monday: { open: string; close: string; isClosed: boolean };
    tuesday: { open: string; close: string; isClosed: boolean };
    wednesday: { open: string; close: string; isClosed: boolean };
    thursday: { open: string; close: string; isClosed: boolean };
    friday: { open: string; close: string; isClosed: boolean };
    saturday: { open: string; close: string; isClosed: boolean };
    sunday: { open: string; close: string; isClosed: boolean };
  };
  pricing: {
    isFree: boolean;
    hourlyRate: number;
    perPersonRate: number;
    dayPassRate: number;
  };
  images: string[];
  amenities: string[];
  rules: string[];
  maxAdvanceBookingDays: number;
  minBookingDuration: number;
  maxBookingDuration: number;
  requiresReservation: boolean;
  equipmentAvailable: {
    name: string;
    quantity: number;
    available: number;
    pricePerUnit: number;
  }[];
  status: "operational" | "maintenance" | "closed";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const amenitySchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["pool", "gazebo", "beach", "spa", "gym", "restaurant", "bar", "function_hall", "kidsClub", "other"],
      required: true,
    },
    description: { type: String, required: true },
    location: { type: String },
    capacity: { type: Number, default: 0 },
    operatingHours: {
      monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    },
    pricing: {
      isFree: { type: Boolean, default: true },
      hourlyRate: { type: Number, default: 0 },
      perPersonRate: { type: Number, default: 0 },
      dayPassRate: { type: Number, default: 0 },
    },
    images: [{ type: String }],
    amenities: [{ type: String }],
    rules: [{ type: String }],
    maxAdvanceBookingDays: { type: Number, default: 7 },
    minBookingDuration: { type: Number, default: 1 },
    maxBookingDuration: { type: Number, default: 8 },
    requiresReservation: { type: Boolean, default: false },
    equipmentAvailable: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
        pricePerUnit: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ["operational", "maintenance", "closed"],
      default: "operational",
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
amenitySchema.index({ hotelId: 1, type: 1 });
amenitySchema.index({ hotelId: 1, status: 1 });

export default mongoose.model<IAmenity>("Amenity", amenitySchema);

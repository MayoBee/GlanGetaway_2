import mongoose, { Document } from "mongoose";

export interface IActivity extends Document {
  _id: string;
  hotelId: string;
  name: string;
  type: "tour" | "water_activity" | "land_activity" | "entertainment" | "rental" | "workshop" | "other";
  description: string;
  location: string;
  duration: number; // in minutes
  maxParticipants: number;
  minParticipants: number;
  pricing: {
    adultPrice: number;
    childPrice: number;
    groupPrice: number;
    minimumGroupSize: number;
  };
  schedule: {
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    customDates: Date[];
  };
  images: string[];
  requirements: string[];
  includedItems: string[];
  ageRestriction: {
    minimumAge: number;
    maximumAge: number;
  };
  equipmentRequired: Array<{
    name: string;
    quantity: number;
    provided: boolean;
  }>;
  instructorRequired: boolean;
  requiresReservation: boolean;
  cancellationPolicy: string;
  status: "active" | "inactive" | "seasonal";
  seasonStart: Date;
  seasonEnd: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["tour", "water_activity", "land_activity", "entertainment", "rental", "workshop", "other"],
      required: true,
    },
    description: { type: String, required: true },
    location: { type: String },
    duration: { type: Number, required: true },
    maxParticipants: { type: Number, required: true },
    minParticipants: { type: Number, default: 1 },
    pricing: {
      adultPrice: { type: Number, required: true },
      childPrice: { type: Number, default: 0 },
      groupPrice: { type: Number, default: 0 },
      minimumGroupSize: { type: Number, default: 0 },
    },
    schedule: {
      daysOfWeek: [{ type: String }],
      startTime: { type: String },
      endTime: { type: String },
      customDates: [{ type: Date }],
    },
    images: [{ type: String }],
    requirements: [{ type: String }],
    includedItems: [{ type: String }],
    ageRestriction: {
      minimumAge: { type: Number, default: 0 },
      maximumAge: { type: Number, default: 999 },
    },
    equipmentRequired: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 0 },
        provided: { type: Boolean, default: true },
      },
    ],
    instructorRequired: { type: Boolean, default: false },
    requiresReservation: { type: Boolean, default: true },
    cancellationPolicy: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "seasonal"],
      default: "active",
    },
    seasonStart: { type: Date },
    seasonEnd: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
activitySchema.index({ hotelId: 1, type: 1 });
activitySchema.index({ hotelId: 1, status: 1 });

export default mongoose.model<IActivity>("Activity", activitySchema);

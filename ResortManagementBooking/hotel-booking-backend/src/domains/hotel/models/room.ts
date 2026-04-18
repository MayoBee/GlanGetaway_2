import mongoose, { Document } from "mongoose";

export interface IRoom extends Document {
  _id: string;
  hotelId: string;
  roomNumber: string;
  floor: number;
  roomType: "standard" | "deluxe" | "suite" | "family" | "cottage";
  description: string;
  minOccupancy: number;
  maxOccupancy: number;
  basePrice: number;
  currentPrice: number;
  amenities: string[];
  images: string[];
  status: "available" | "occupied" | "reserved" | "maintenance" | "cleaning";
  housekeepingStatus: "clean" | "dirty" | "inspected";
  lastCleaned: Date;
  assignedHousekeeper: string;
  bedConfiguration: {
    kingBeds: number;
    queenBeds: number;
    singleBeds: number;
  };
  roomFeatures: {
    hasBalcony: boolean;
    hasOceanView: boolean;
    hasAirConditioning: boolean;
    hasFan: boolean;
    hasTV: boolean;
    hasMiniBar: boolean;
    hasSafe: boolean;
    hasWiFi: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    roomNumber: { type: String, required: true },
    floor: { type: Number, required: true, default: 1 },
    roomType: {
      type: String,
      enum: ["standard", "deluxe", "suite", "family", "cottage"],
      required: true,
    },
    description: { type: String, required: true },
    minOccupancy: { type: Number, required: true, default: 1 },
    maxOccupancy: { type: Number, required: true, default: 2 },
    basePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    amenities: [{ type: String }],
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "maintenance", "cleaning"],
      default: "available",
      index: true,
    },
    housekeepingStatus: {
      type: String,
      enum: ["clean", "dirty", "inspected"],
      default: "clean",
    },
    lastCleaned: { type: Date },
    assignedHousekeeper: { type: String },
    bedConfiguration: {
      kingBeds: { type: Number, default: 0 },
      queenBeds: { type: Number, default: 0 },
      singleBeds: { type: Number, default: 0 },
    },
    roomFeatures: {
      hasBalcony: { type: Boolean, default: false },
      hasOceanView: { type: Boolean, default: false },
      hasAirConditioning: { type: Boolean, default: true },
      hasFan: { type: Boolean, default: false },
      hasTV: { type: Boolean, default: true },
      hasMiniBar: { type: Boolean, default: false },
      hasSafe: { type: Boolean, default: false },
      hasWiFi: { type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ hotelId: 1, status: 1 });
roomSchema.index({ hotelId: 1, roomType: 1 });

export default mongoose.model<IRoom>("Room", roomSchema);

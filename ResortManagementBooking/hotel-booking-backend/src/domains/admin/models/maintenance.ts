import mongoose, { Document } from "mongoose";

export interface IMaintenance extends Document {
  _id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  amenityId: string;
  amenityName: string;
  category: "plumbing" | "electrical" | "hvac" | "furniture" | "appliance" | "structural" | "other";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "emergency";
  status: "reported" | "assigned" | "in_progress" | "completed" | "verified" | "cancelled";
  reportedBy: string;
  reportedByName: string;
  assignedTo: string;
  assignedToName: string;
  reportedAt: Date;
  assignedAt: Date;
  startedAt: Date;
  completedAt: Date;
  estimatedCost: number;
  actualCost: number;
  parts: {
    name: string;
    quantity: number;
    cost: number;
  }[];
  laborHours: number;
  laborRate: number;
  notes: {
    content: string;
    author: string;
    authorName: string;
    createdAt: Date;
  }[];
  images: string[];
  isRecurring: boolean;
  recurringFrequency: string;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    roomId: { type: String },
    roomNumber: { type: String },
    amenityId: { type: String },
    amenityName: { type: String },
    category: {
      type: String,
      enum: ["plumbing", "electrical", "hvac", "furniture", "appliance", "structural", "other"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "emergency"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["reported", "assigned", "in_progress", "completed", "verified", "cancelled"],
      default: "reported",
      index: true,
    },
    reportedBy: { type: String, required: true },
    reportedByName: { type: String },
    assignedTo: { type: String },
    assignedToName: { type: String },
    reportedAt: { type: Date, default: Date.now },
    assignedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    parts: [
      {
        name: { type: String },
        quantity: { type: Number, default: 0 },
        cost: { type: Number, default: 0 },
      },
    ],
    laborHours: { type: Number, default: 0 },
    laborRate: { type: Number, default: 0 },
    notes: [
      {
        content: { type: String },
        author: { type: String },
        authorName: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    images: [{ type: String }],
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
maintenanceSchema.index({ hotelId: 1, status: 1 });
maintenanceSchema.index({ hotelId: 1, category: 1 });
maintenanceSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model<IMaintenance>("Maintenance", maintenanceSchema);

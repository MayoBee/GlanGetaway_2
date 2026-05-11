import mongoose, { Document } from "mongoose";

export interface IHousekeeping extends Document {
  _id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  status: "pending" | "in_progress" | "completed" | "inspected";
  priority: "low" | "medium" | "high" | "urgent";
  taskType: "checkout" | "stayover" | "deep_cleaning" | "turnover" | "inspection";
  assignedTo: string;
  assignedToName: string;
  notes: string;
  completedAt: Date;
  inspectedBy: string;
  inspectedAt: Date;
  issues: Array<{
    description: string;
    severity: "low" | "medium" | "high";
    resolved: boolean;
  }>;
  supplies: Array<{
    item: string;
    quantity: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const housekeepingSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, index: true },
    roomId: { type: String, required: true },
    roomNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "inspected"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    taskType: {
      type: String,
      enum: ["checkout", "stayover", "deep_cleaning", "turnover", "inspection"],
      required: true,
    },
    assignedTo: { type: String },
    assignedToName: { type: String },
    notes: { type: String },
    completedAt: { type: Date },
    inspectedBy: { type: String },
    inspectedAt: { type: Date },
    issues: [
      {
        description: { type: String },
        severity: { type: String, enum: ["low", "medium", "high"] },
        resolved: { type: Boolean, default: false },
      },
    ],
    supplies: [
      {
        item: { type: String },
        quantity: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
housekeepingSchema.index({ hotelId: 1, status: 1 });
housekeepingSchema.index({ hotelId: 1, assignedTo: 1 });
housekeepingSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.model<IHousekeeping>("Housekeeping", housekeepingSchema);

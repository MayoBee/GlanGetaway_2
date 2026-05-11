import mongoose, { Document } from "mongoose";

export interface INotification extends Document {
  _id: string;
  hotelId: string;
  userId: string;
  type: "reservation" | "maintenance" | "housekeeping" | "billing" | "system" | "message";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  isRead: boolean;
  readAt: Date;
  relatedEntityType: "booking" | "room" | "amenity" | "activity" | "billing" | "maintenance" | "housekeeping";
  relatedEntityId: string;
  actionUrl: string;
  createdAt: Date;
}

const notificationSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["reservation", "maintenance", "housekeeping", "billing", "system", "message"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    relatedEntityType: {
      type: String,
      enum: ["booking", "room", "amenity", "activity", "billing", "maintenance", "housekeeping"],
    },
    relatedEntityId: { type: String },
    actionUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ hotelId: 1, createdAt: -1 });

export default mongoose.model<INotification>("Notification", notificationSchema);

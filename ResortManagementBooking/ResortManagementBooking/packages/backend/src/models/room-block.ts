import mongoose, { Document } from "mongoose";

export interface IRoomBlock extends Document {
  _id: string;
  hotelId: string;
  roomId: string;
  blockedBy: string; // Staff/owner who blocked
  blockType: "quick_block" | "reserved" | "maintenance";
  reason: string;
  guestName?: string;
  guestPhone?: string;
  startsAt: Date;
  expiresAt: Date;
  status: "active" | "converted" | "released" | "expired";
  convertedToBookingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const roomBlockSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, index: true },
    roomId: { type: String, required: true, index: true },
    blockedBy: { type: String, required: true },
    blockType: {
      type: String,
      enum: ["quick_block", "reserved", "maintenance"],
      default: "quick_block",
    },
    reason: { type: String, default: "Phone inquiry - awaiting deposit" },
    guestName: { type: String },
    guestPhone: { type: String },
    startsAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "converted", "released", "expired"],
      default: "active",
    },
    convertedToBookingId: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
roomBlockSchema.index({ hotelId: 1, roomId: 1, status: 1 });
roomBlockSchema.index({ expiresAt: 1, status: 1 });

// Method to check if block is expired
roomBlockSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

// Static method to find active blocks for a room
roomBlockSchema.statics.findActiveBlocksForRoom = async function (
  roomId: string
): Promise<IRoomBlock[]> {
  return this.find({
    roomId,
    status: "active",
    expiresAt: { $gt: new Date() },
  });
};

export default mongoose.model<IRoomBlock>("RoomBlock", roomBlockSchema);

import mongoose, { Document } from "mongoose";

export interface IPricing extends Document {
  _id: string;
  hotelId: string;
  // Seasonal pricing
  seasonalRates: Array<{
    name: string;
    startDate: Date;
    endDate: Date;
    multiplier: number;
    description: string;
    isActive: boolean;
  }>;
  // Event-based pricing
  eventPricing: Array<{
    name: string;
    eventName: string;
    startDate: Date;
    endDate: Date;
    flatRate: number;
    percentageIncrease: number;
    description: string;
    isActive: boolean;
  }>;
  // Discounts
  discounts: Array<{
    code: string;
    name: string;
    type: "percentage" | "fixed";
    value: number;
    minBookingAmount: number;
    maxDiscount: number;
    applicableRoomTypes: string[];
    validFrom: Date;
    validUntil: Date;
    maxUses: number;
    currentUses: number;
    isActive: boolean;
    // Special discount categories
    discountCategory: "senior_citizen" | "pwd" | "corporate" | "promotional" | "loyalty" | "group";
    requiredDocuments: string[];
  }>;
  // Special pricing rules
  pricingRules: Array<{
    name: string;
    condition: {
      dayOfWeek: string[];
      minNights: number;
      maxNights: number;
      bookingLeadDays: number;
    };
    adjustment: {
      type: "percentage" | "fixed";
      value: number;
    };
    isActive: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const pricingSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    seasonalRates: [
      {
        name: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        multiplier: { type: Number, required: true, default: 1.0 },
        description: String,
        isActive: { type: Boolean, default: true },
      },
    ],
    eventPricing: [
      {
        name: { type: String, required: true },
        eventName: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        flatRate: Number,
        percentageIncrease: Number,
        description: String,
        isActive: { type: Boolean, default: true },
      },
    ],
    discounts: [
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ["percentage", "fixed"], required: true },
        value: { type: Number, required: true },
        minBookingAmount: { type: Number, default: 0 },
        maxDiscount: Number,
        applicableRoomTypes: [{ type: String }],
        validFrom: { type: Date, required: true },
        validUntil: { type: Date, required: true },
        maxUses: { type: Number, default: 0 },
        currentUses: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        discountCategory: {
          type: String,
          enum: ["senior_citizen", "pwd", "corporate", "promotional", "loyalty", "group"],
        },
        requiredDocuments: [{ type: String }],
      },
    ],
    pricingRules: [
      {
        name: { type: String, required: true },
        condition: {
          dayOfWeek: [{ type: String }],
          minNights: Number,
          maxNights: Number,
          bookingLeadDays: Number,
        },
        adjustment: {
          type: { type: String, enum: ["percentage", "fixed"] },
          value: Number,
        },
        isActive: { type: Boolean, default: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
pricingSchema.index({ hotelId: 1 });

export default mongoose.model<IPricing>("Pricing", pricingSchema);

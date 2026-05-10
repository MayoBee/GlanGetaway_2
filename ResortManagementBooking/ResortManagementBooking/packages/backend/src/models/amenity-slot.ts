import mongoose, { Document } from "mongoose";

export interface IAmenitySlot extends Document {
  _id: string;
  hotelId: string;
  amenityId: string;
  amenityName: string;
  // Time slot configuration
  slotDate: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration: number; // in minutes
  // Availability
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  // Pricing (dynamic yield management)
  basePrice: number;
  currentPrice: number;
  priceMultiplier: number; // 1.0 = base, 1.5 = 50% increase
  // Weather lock
  isWeatherLocked: boolean;
  weatherLockReason?: string;
  lockedAt?: Date;
  // Status
  status: "available" | "full" | "locked" | "cancelled";
  // Equipment tracking (for boats, etc.)
  equipmentId?: string;
  equipmentName?: string;
  // Bookings in this slot
  bookings: string[]; // Booking IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface IAmenityWeatherLock extends Document {
  _id: string;
  hotelId: string;
  amenityId: string;
  amenityName: string;
  // Lock configuration
  lockDate: Date;
  lockType: "automatic" | "manual";
  reason: string;
  // Weather data that triggered the lock
  weatherData?: {
    windSpeed?: number;
    waveHeight?: number;
    rainProbability?: number;
    weatherCode?: number;
    description?: string;
  };
  // Lock metadata
  lockedBy?: string;
  lockedAt: Date;
  unlockedAt?: Date;
  isActive: boolean;
  // Override
  manualOverride?: {
    overrideBy: string;
    overrideReason: string;
    overrideAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Water activity types that should be weather-locked
const WATER_ACTIVITY_TYPES = [
  "banana_boat",
  "speed_boat",
  "jet_ski",
  "kayak",
  "paddle_board",
  "parasailing",
  "diving",
  "snorkeling",
];

const amenitySlotSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, index: true },
    amenityId: { type: String, required: true, index: true },
    amenityName: { type: String, required: true },
    // Time slot configuration
    slotDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true }, // HH:mm format
    endTime: { type: String, required: true },
    duration: { type: Number, required: true }, // in minutes
    // Availability
    totalSlots: { type: Number, required: true, default: 1 },
    availableSlots: { type: Number, required: true, default: 1 },
    bookedSlots: { type: Number, default: 0 },
    // Pricing (dynamic yield management)
    basePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    priceMultiplier: { type: Number, default: 1.0 },
    // Weather lock
    isWeatherLocked: { type: Boolean, default: false },
    weatherLockReason: { type: String },
    lockedAt: { type: Date },
    // Status
    status: {
      type: String,
      enum: ["available", "full", "locked", "cancelled"],
      default: "available",
    },
    // Equipment tracking
    equipmentId: { type: String },
    equipmentName: { type: String },
    // Bookings in this slot
    bookings: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const amenityWeatherLockSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, index: true },
    amenityId: { type: String, required: true, index: true },
    amenityName: { type: String, required: true },
    // Lock configuration
    lockDate: { type: Date, required: true, index: true },
    lockType: {
      type: String,
      enum: ["automatic", "manual"],
      default: "automatic",
    },
    reason: { type: String, required: true },
    // Weather data
    weatherData: {
      windSpeed: { type: Number },
      waveHeight: { type: Number },
      rainProbability: { type: Number },
      weatherCode: { type: Number },
      description: { type: String },
    },
    // Lock metadata
    lockedBy: { type: String },
    lockedAt: { type: Date, default: Date.now },
    unlockedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    // Override
    manualOverride: {
      overrideBy: { type: String },
      overrideReason: { type: String },
      overrideAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
amenitySlotSchema.index(
  { hotelId: 1, amenityId: 1, slotDate: 1 },
  { unique: true }
);
amenitySlotSchema.index({ hotelId: 1, status: 1, slotDate: 1 });
amenitySlotSchema.index({ isWeatherLocked: 1, slotDate: 1 });
amenityWeatherLockSchema.index({ hotelId: 1, amenityId: 1, lockDate: 1 });

// Static method to generate time slots for a day
amenitySlotSchema.statics.generateDaySlots = async function(
  hotelId: string,
  amenityId: string,
  amenityName: string,
  date: Date,
  config: {
    operatingHours: { open: string; close: string };
    slotDuration: number; // minutes
    basePrice: number;
    totalEquipment?: number;
  }
) {
  const slots = [];
  const [openHour, openMin] = config.operatingHours.open.split(":").map(Number);
  const [closeHour, closeMin] = config.operatingHours.close.split(":").map(Number);

  let currentHour = openHour;
  let currentMin = openMin;

  const totalMinutesInDay = closeHour * 60 + closeMin - (openHour * 60 + openMin);
  const numSlots = Math.floor(totalMinutesInDay / config.slotDuration);

  const equipmentCount = config.totalEquipment || 1;

  for (let i = 0; i < numSlots; i++) {
    const startTime = `${currentHour.toString().padStart(2, "0")}:${currentMin
      .toString()
      .padStart(2, "0")}`;
    const startMinutes = currentHour * 60 + currentMin;
    const endMinutes = startMinutes + config.slotDuration;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMin
      .toString()
      .padStart(2, "0")}`;

    // Calculate dynamic pricing based on time
    // Peak hours (10am-2pm, 4pm-6pm) get higher multiplier
    const hour = currentHour;
    let multiplier = 1.0;
    if ((hour >= 10 && hour < 14) || (hour >= 16 && hour < 18)) {
      multiplier = 1.25; // 25% increase for peak times
    } else if (hour >= 8 && hour < 10) {
      multiplier = 1.1; // 10% increase for morning
    }

    slots.push({
      hotelId,
      amenityId,
      amenityName,
      slotDate: new Date(date).setHours(0, 0, 0, 0),
      startTime,
      endTime,
      duration: config.slotDuration,
      totalSlots: equipmentCount,
      availableSlots: equipmentCount,
      bookedSlots: 0,
      basePrice: config.basePrice,
      currentPrice: Math.round(config.basePrice * multiplier * 100) / 100,
      priceMultiplier: multiplier,
      isWeatherLocked: false,
      status: "available",
      bookings: [],
    });

    currentMin += config.slotDuration;
    if (currentMin >= 60) {
      currentHour += 1;
      currentMin -= 60;
    }
  }

  return this.insertMany(slots);
};

export const AmenitySlot = mongoose.model<IAmenitySlot>(
  "AmenitySlot",
  amenitySlotSchema
);
export const AmenityWeatherLock = mongoose.model<IAmenityWeatherLock>(
  "AmenityWeatherLock",
  amenityWeatherLockSchema
);
export { WATER_ACTIVITY_TYPES };

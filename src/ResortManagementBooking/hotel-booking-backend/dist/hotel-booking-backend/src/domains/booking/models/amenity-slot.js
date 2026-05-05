"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WATER_ACTIVITY_TYPES = exports.AmenityWeatherLock = exports.AmenitySlot = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
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
exports.WATER_ACTIVITY_TYPES = WATER_ACTIVITY_TYPES;
const amenitySlotSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true, index: true },
    amenityId: { type: String, required: true, index: true },
    amenityName: { type: String, required: true },
    // Time slot configuration
    slotDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
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
}, {
    timestamps: true,
});
const amenityWeatherLockSchema = new mongoose_1.default.Schema({
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
}, {
    timestamps: true,
});
// Compound indexes
amenitySlotSchema.index({ hotelId: 1, amenityId: 1, slotDate: 1 }, { unique: true });
amenitySlotSchema.index({ hotelId: 1, status: 1, slotDate: 1 });
amenitySlotSchema.index({ isWeatherLocked: 1, slotDate: 1 });
amenityWeatherLockSchema.index({ hotelId: 1, amenityId: 1, lockDate: 1 });
// Static method to generate time slots for a day
amenitySlotSchema.statics.generateDaySlots = function (hotelId, amenityId, amenityName, date, config) {
    return __awaiter(this, void 0, void 0, function* () {
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
            }
            else if (hour >= 8 && hour < 10) {
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
    });
};
exports.AmenitySlot = mongoose_1.default.model("AmenitySlot", amenitySlotSchema);
exports.AmenityWeatherLock = mongoose_1.default.model("AmenityWeatherLock", amenityWeatherLockSchema);

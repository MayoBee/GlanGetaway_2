"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RebookingToken = exports.WeatherAlert = exports.WeatherTrigger = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const weatherTriggerSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true, index: true },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        city: { type: String, required: true },
        country: { type: String, default: "Philippines" },
    },
    weatherApiProvider: {
        type: String,
        enum: ["openweather", "weatherapi"],
        default: "openweather",
    },
    apiKey: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    triggerConditions: {
        minWindSpeed: { type: Number, default: 10 },
        minRainProbability: { type: Number, default: 70 },
        weatherCodes: [{ type: Number }],
        severeWeatherTypes: [{ type: String }],
    },
    rebookingSettings: {
        allowRebooking: { type: Boolean, default: true },
        rebookingWindowDays: { type: Number, default: 7 },
        maxRebookingAttempts: { type: Number, default: 2 },
        autoApproveRebooking: { type: Boolean, default: true },
        refundPolicy: {
            type: String,
            enum: ["full", "deposit_only", "no_refund"],
            default: "full",
        },
    },
    notificationSettings: {
        notifyGuests: { type: Boolean, default: true },
        notifyStaff: { type: Boolean, default: true },
        notifyBeforeDays: { type: Number, default: 3 },
        emailTemplateId: { type: String },
        smsTemplateId: { type: String },
    },
}, {
    timestamps: true,
});
const weatherAlertSchema = new mongoose_1.default.Schema({
    hotelId: { type: String, required: true },
    bookingId: { type: String },
    alertType: {
        type: String,
        enum: ["severe_weather", "typhoon", "heavy_rain", "high_winds", "flood"],
        required: true,
    },
    severity: {
        type: String,
        enum: ["watch", "warning", "emergency"],
        default: "warning",
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    weatherData: {
        temperature: { type: Number },
        humidity: { type: Number },
        windSpeed: { type: Number },
        windGust: { type: Number },
        rainProbability: { type: Number },
        weatherCode: { type: Number },
        weatherDescription: { type: String },
    },
    affectedCheckIn: { type: Date, required: true },
    affectedCheckOut: { type: Date, required: true },
    actionTaken: {
        type: String,
        enum: [
            "auto_rebook_link_sent",
            "manual_review",
            "booking_cancelled",
            "no_action",
        ],
        default: "no_action",
    },
    rebookLinkSentAt: { type: Date },
    rebookLinkExpiry: { type: Date },
    rebookLinkUsed: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolutionNote: { type: String },
}, {
    timestamps: true,
});
const rebookingTokenSchema = new mongoose_1.default.Schema({
    bookingId: { type: String, required: true },
    hotelId: { type: String, required: true },
    guestId: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    newCheckIn: { type: Date },
    newCheckOut: { type: Date },
    status: {
        type: String,
        enum: ["active", "used", "expired"],
        default: "active",
    },
}, {
    timestamps: true,
});
// Indexes
weatherAlertSchema.index({ hotelId: 1, alertType: 1 });
weatherAlertSchema.index({ bookingId: 1, status: 1 });
rebookingTokenSchema.index({ expiresAt: 1, status: 1 });
exports.WeatherTrigger = mongoose_1.default.model("WeatherTrigger", weatherTriggerSchema);
exports.WeatherAlert = mongoose_1.default.model("WeatherAlert", weatherAlertSchema);
exports.RebookingToken = mongoose_1.default.model("RebookingToken", rebookingTokenSchema);

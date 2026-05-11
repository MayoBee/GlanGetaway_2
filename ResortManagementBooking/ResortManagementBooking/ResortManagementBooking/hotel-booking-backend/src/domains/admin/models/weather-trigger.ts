import mongoose, { Document } from "mongoose";

export interface IWeatherTrigger extends Document {
  _id: string;
  hotelId: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  // Weather API configuration
  weatherApiProvider: "openweather" | "weatherapi";
  apiKey: string;
  isActive: boolean;
  // Alert thresholds
  triggerConditions: {
    minWindSpeed?: number; // in m/s
    minRainProbability?: number; // percentage 0-100
    weatherCodes?: number[]; // OpenWeather condition codes
    severeWeatherTypes?: string[]; // "thunderstorm", "heavy_rain", "typhoon"
  };
  // Rebooking settings
  rebookingSettings: {
    allowRebooking: boolean;
    rebookingWindowDays: number; // days within which rebooking is allowed
    maxRebookingAttempts: number;
    autoApproveRebooking: boolean;
    refundPolicy: "full" | "deposit_only" | "no_refund";
  };
  // Notification settings
  notificationSettings: {
    notifyGuests: boolean;
    notifyStaff: boolean;
    notifyBeforeDays: number; // days before check-in to check weather
    emailTemplateId?: string;
    smsTemplateId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IWeatherAlert extends Document {
  _id: string;
  hotelId: string;
  bookingId?: string;
  alertType: "severe_weather" | "typhoon" | "heavy_rain" | "high_winds" | "flood";
  severity: "watch" | "warning" | "emergency";
  title: string;
  description: string;
  // Weather data at time of alert
  weatherData: {
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    windGust?: number;
    rainProbability?: number;
    weatherCode?: number;
    weatherDescription?: string;
  };
  // Affected dates
  affectedCheckIn: Date;
  affectedCheckOut: Date;
  // Action taken
  actionTaken: "auto_rebook_link_sent" | "manual_review" | "booking_cancelled" | "no_action";
  rebookLinkSentAt?: Date;
  rebookLinkExpiry?: Date;
  rebookLinkUsed: boolean;
  // Resolution
  resolved: boolean;
  resolvedAt?: Date;
  resolutionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRebookingToken extends Document {
  _id: string;
  bookingId: string;
  hotelId: string;
  guestId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  newCheckIn?: Date;
  newCheckOut?: Date;
  status: "active" | "used" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

const weatherTriggerSchema = new mongoose.Schema(
  {
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
      minWindSpeed: { type: Number, default: 10 }, // 10 m/s = ~36 km/h
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
  },
  {
    timestamps: true,
  }
);

const weatherAlertSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

const rebookingTokenSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Indexes
weatherAlertSchema.index({ hotelId: 1, alertType: 1 });
weatherAlertSchema.index({ bookingId: 1, status: 1 });
rebookingTokenSchema.index({ expiresAt: 1, status: 1 });

export const WeatherTrigger = mongoose.model<IWeatherTrigger>(
  "WeatherTrigger",
  weatherTriggerSchema
);
export const WeatherAlert = mongoose.model<IWeatherAlert>(
  "WeatherAlert",
  weatherAlertSchema
);
export const RebookingToken = mongoose.model<IRebookingToken>(
  "RebookingToken",
  rebookingTokenSchema
);

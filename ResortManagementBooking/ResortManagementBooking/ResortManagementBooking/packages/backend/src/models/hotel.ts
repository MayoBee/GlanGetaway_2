import mongoose from "mongoose";
import { HotelType } from "../types";

// Define subdocument schemas explicitly
const RoomSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  pricePerNight: { type: Number, required: true },
  minOccupancy: { type: Number, required: true },
  maxOccupancy: { type: Number, required: true },
  description: { type: String, default: '' },
  amenities: [{ type: String }],
  imageUrl: { type: String, default: '' },
}, { _id: false });

const CottageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  pricePerNight: { type: Number, default: 0 },
  dayRate: { type: Number, default: 0 },
  nightRate: { type: Number, default: 0 },
  hasDayRate: { type: Boolean, default: false },
  hasNightRate: { type: Boolean, default: false },
  minOccupancy: { type: Number, required: true },
  maxOccupancy: { type: Number, required: true },
  description: { type: String, default: '' },
  amenities: [{ type: String }],
  imageUrl: { type: String, default: '' },
}, { _id: false });

const AmenitySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { _id: false });

const PackageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  includedCottages: [{ type: String }],
  includedRooms: [{ type: String }],
  includedAmenities: [{ type: String }],
  includedAdultEntranceFee: { type: Boolean, default: false },
  includedChildEntranceFee: { type: Boolean, default: false },
}, { _id: false });

const hotelSchema = new mongoose.Schema<HotelType>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    description: { type: String, required: true },
    type: [{ type: String, required: true }],
    facilities: [{ type: String, required: true }],
    dayRate: { type: Number, required: true },
    nightRate: { type: Number, required: true },
    hasDayRate: { type: Boolean, default: true },
    hasNightRate: { type: Boolean, default: true },
    starRating: { type: Number, required: true, min: 1, max: 5 },
    imageUrls: [{ type: String, required: true }],
    lastUpdated: { type: Date, required: true },
    // Remove embedded bookings - we'll use separate collection
    // bookings: [bookingSchema],

    // New fields for better hotel management and analytics
    location: {
      latitude: Number,
      longitude: Number,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },
    contact: {
      phone: String,
      email: String,
      website: String,
      facebook: String,
      instagram: String,
      tiktok: String,
    },
    policies: {
      checkInTime: String,
      checkOutTime: String,
      dayCheckInTime: String,
      dayCheckOutTime: String,
      nightCheckInTime: String,
      nightCheckOutTime: String,
      resortPolicies: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          description: { type: String, required: true },
          isConfirmed: { type: Boolean, default: false },
        },
      ],
    },
    amenities: [AmenitySchema],
    rooms: [RoomSchema],
    cottages: [CottageSchema],
    packages: [PackageSchema],
    // Analytics and performance fields
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    occupancyRate: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    // Discount system fields
    discounts: {
      seniorCitizenEnabled: { type: Boolean, default: true },
      seniorCitizenPercentage: { type: Number, default: 20 },
      pwdEnabled: { type: Boolean, default: true },
      pwdPercentage: { type: Number, default: 20 },
      customDiscounts: [
        {
          id: String,
          name: String,
          percentage: Number,
          promoCode: String,
          isEnabled: { type: Boolean, default: true },
          maxUses: Number,
          validUntil: Date,
        },
      ],
    },
    // Approval system fields
    isApproved: { type: Boolean, default: true },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    // Entrance fee fields
    adultEntranceFee: {
      dayRate: { type: Number, default: 0 },
      nightRate: { type: Number, default: 0 },
      pricingModel: { type: String, enum: ["per_head", "per_group"], default: "per_head" },
      groupQuantity: { type: Number, default: 1 },
    },
    childEntranceFee: [
      {
        id: { type: String, required: true },
        minAge: { type: Number, required: true },
        maxAge: { type: Number, required: true },
        dayRate: { type: Number, required: true },
        nightRate: { type: Number, required: true },
        pricingModel: { type: String, enum: ["per_head", "per_group"], default: "per_head" },
        groupQuantity: { type: Number, default: 1 },
        isConfirmed: { type: Boolean, default: false },
      },
    ],
    downPaymentPercentage: { type: Number, default: 50, min: 10, max: 100 },
    gcashNumber: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^09\d{9}$/.test(v);
        },
        message: 'GCash number must be 11 digits starting with 09 (e.g., 09XXXXXXXXX)'
      }
    },
    // Staff management - directly stored in hotel
    staff: [
      {
        staffUserId: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        role: { type: String, enum: ["front_desk", "housekeeping"], required: true },
        permissions: {
          canManageBookings: { type: Boolean, default: true },
          canManageRooms: { type: Boolean, default: true },
          canManagePricing: { type: Boolean, default: false },
          canManageAmenities: { type: Boolean, default: false },
          canManageActivities: { type: Boolean, default: true },
          canViewReports: { type: Boolean, default: true },
          canManageBilling: { type: Boolean, default: true },
          canManageHousekeeping: { type: Boolean, default: false },
          canManageMaintenance: { type: Boolean, default: false },
          canManageUsers: { type: Boolean, default: false },
        },
        isActive: { type: Boolean, default: true },
        mustChangePassword: { type: Boolean, default: false },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    // Audit fields
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Add compound indexes for better query performance
hotelSchema.index({ city: 1, starRating: 1 });
hotelSchema.index({ dayRate: 1, nightRate: 1, starRating: 1 });
hotelSchema.index({ userId: 1, createdAt: -1 });

const Hotel = mongoose.model<HotelType>("Hotel", hotelSchema);
export default Hotel;

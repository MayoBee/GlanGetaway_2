import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole, UserDocument } from "../types";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Use random hash for OAuth users
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    image: { type: String }, // Profile image URL (from Google OAuth)
    // Role-based access for resort management system
    role: {
      type: String,
      enum: ["user", "admin", "resort_owner", "front_desk", "housekeeping"],
      default: "user",
    },
    // Staff-specific fields
    staffProfile: {
      department: {
        type: String,
        enum: ["front_desk", "housekeeping", "maintenance", "food_beverage", "activities"],
      },
      employeeId: String,
      hireDate: Date,
      shiftSchedule: {
        monday: { start: String, end: String },
        tuesday: { start: String, end: String },
        wednesday: { start: String, end: String },
        thursday: { start: String, end: String },
        friday: { start: String, end: String },
        saturday: { start: String, end: String },
        sunday: { start: String, end: String },
      },
      hourlyRate: Number,
      isActive: { type: Boolean, default: true },
    },
    // Permissions for fine-grained access control
    permissions: {
      canManageBookings: { type: Boolean, default: false },
      canManageRooms: { type: Boolean, default: false },
      canManagePricing: { type: Boolean, default: false },
      canManageAmenities: { type: Boolean, default: false },
      canManageActivities: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false },
      canManageBilling: { type: Boolean, default: false },
      canManageHousekeeping: { type: Boolean, default: false },
      canManageMaintenance: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
    },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    preferences: {
      preferredDestinations: [String],
      preferredHotelTypes: [String],
      budgetRange: {
        min: Number,
        max: Number,
      },
    },
    // Analytics and tracking fields
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    // Birthdate (required for account creation - optional for seed data)
    birthdate: { type: Date },
    // PWD (Person With Disability) fields
    isPWD: { type: Boolean, default: false },
    pwdId: { type: String }, // PWD ID number
    pwdIdVerified: { type: Boolean, default: false }, // Verified by super admin
    pwdVerifiedBy: { type: String }, // ID of super admin who verified
    pwdVerifiedAt: { type: Date },
    // Account verification (required for PWD discount eligibility)
    accountVerified: { type: Boolean, default: false }, // Verified by super admin
    accountVerifiedBy: { type: String }, // ID of super admin who verified
    accountVerifiedAt: { type: Date },
    // Password reset requirement for staff accounts
    mustChangePassword: { type: Boolean, default: false },
    // Audit fields
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    // Reduced from 8 to 4 rounds for faster login performance
    this.password = await bcrypt.hash(this.password, 4);
  }
  next();
});

// Optimized indexes for better performance
userSchema.index({ email: 1, isActive: 1 }); // Compound index for active users
userSchema.index({ createdAt: -1 }); // For user listing queries

const User = mongoose.model<UserDocument>("User", userSchema);

export default User;

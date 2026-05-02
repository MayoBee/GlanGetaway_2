import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole, UserDocument } from "../../../types";

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
      enum: ["user", "admin", "resort_owner", "front_desk", "housekeeping", "superAdmin"],
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
    // Password management fields
    mustChangePassword: { type: Boolean, default: false }, // Force password change on next login
    passwordChangedAt: { type: Date }, // Track when password was last changed
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
    // Recommended secure cost factor (2^12 iterations)
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Auto-assign default permissions based on role
  if (this.isModified("role") || this.isNew) {
    switch (this.role) {
      case "front_desk":
        this.permissions.canManageBookings = true;
        this.permissions.canViewReports = true;
        this.permissions.canManageRooms = true;
        this.permissions.canManageBilling = true;
        this.permissions.canManageActivities = true;
        // Reset all other permissions
        this.permissions.canManagePricing = false;
        this.permissions.canManageAmenities = false;
        this.permissions.canManageHousekeeping = false;
        this.permissions.canManageMaintenance = false;
        this.permissions.canManageUsers = false;
        break;
      case "housekeeping":
        this.permissions.canManageHousekeeping = true;
        this.permissions.canManageMaintenance = true;
        // Reset all other permissions
        this.permissions.canManageBookings = false;
        this.permissions.canViewReports = false;
        this.permissions.canManageRooms = false;
        this.permissions.canManageBilling = false;
        this.permissions.canManagePricing = false;
        this.permissions.canManageAmenities = false;
        this.permissions.canManageActivities = false;
        this.permissions.canManageUsers = false;
        break;
      case "resort_owner":
        // Full resort permissions
        this.permissions.canManageBookings = true;
        this.permissions.canViewReports = true;
        this.permissions.canManageRooms = true;
        this.permissions.canManageBilling = true;
        this.permissions.canManagePricing = true;
        this.permissions.canManageAmenities = true;
        this.permissions.canManageActivities = true;
        this.permissions.canManageHousekeeping = true;
        this.permissions.canManageMaintenance = true;
        this.permissions.canManageUsers = true;
        break;
      case "admin":
      case "superAdmin":
        // Full system permissions
        for (const key in this.permissions) {
          this.permissions[key as keyof typeof this.permissions] = true;
        }
        break;
      default:
        // Default user permissions - no staff permissions
        for (const key in this.permissions) {
          this.permissions[key as keyof typeof this.permissions] = false;
        }
    }
  }
  next();
});

/**
 * Compare password and automatically rehash with stronger cost factor if needed
 * @param candidatePassword Plain text password to verify
 * @returns Boolean indicating if password matches
 */
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  
  // Temporarily disabled: auto password rehash causing login failures for seed data
  // if (isMatch) {
  //   // Check current hash cost factor and rehash if needed (12 rounds is current standard)
  //   const currentCost = parseInt(this.password.split('$')[2], 10);
  //   if (currentCost < 12) {
  //     // Rehash password with modern cost factor and save
  //     this.password = candidatePassword;
  //     await this.save();
  //   }
  // }
  
  return isMatch;
};

// Optimized indexes for better performance
userSchema.index({ email: 1, isActive: 1 }); // Compound index for active users
userSchema.index({ createdAt: -1 }); // For user listing queries

// Additional required indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model<UserDocument>("User", userSchema);

export default User;

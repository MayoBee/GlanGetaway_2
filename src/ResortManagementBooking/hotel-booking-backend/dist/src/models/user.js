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
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    image: { type: String },
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
    pwdId: { type: String },
    pwdIdVerified: { type: Boolean, default: false },
    pwdVerifiedBy: { type: String },
    pwdVerifiedAt: { type: Date },
    // Account verification (required for PWD discount eligibility)
    accountVerified: { type: Boolean, default: false },
    accountVerifiedBy: { type: String },
    accountVerifiedAt: { type: Date },
    // Audit fields
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified("password")) {
            // Recommended secure cost factor (2^12 iterations)
            this.password = yield bcryptjs_1.default.hash(this.password, 12);
        }
        next();
    });
});
/**
 * Compare password and automatically rehash with stronger cost factor if needed
 * @param candidatePassword Plain text password to verify
 * @returns Boolean indicating if password matches
 */
userSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const isMatch = yield bcryptjs_1.default.compare(candidatePassword, this.password);
        if (isMatch) {
            // Check current hash cost factor and rehash if needed (12 rounds is current standard)
            const currentCost = parseInt(this.password.split('$')[2], 10);
            if (currentCost < 12) {
                // Rehash password with modern cost factor and save
                this.password = candidatePassword;
                yield this.save();
            }
        }
        return isMatch;
    });
};
// Optimized indexes for better performance
userSchema.index({ email: 1, isActive: 1 }); // Compound index for active users
userSchema.index({ createdAt: -1 }); // For user listing queries
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;

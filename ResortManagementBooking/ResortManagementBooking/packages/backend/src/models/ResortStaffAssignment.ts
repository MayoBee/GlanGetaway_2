import mongoose from "mongoose";

const resortStaffAssignmentSchema = new mongoose.Schema(
  {
    resortId: { type: String, required: true },
    staffUserId: { type: String, required: true },
    ownerUserId: { type: String, required: true },
    role: {
      type: String,
      enum: ["front_desk", "housekeeping"],
      required: true,
    },
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
    assignedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
resortStaffAssignmentSchema.index({ resortId: 1, isActive: 1 });
resortStaffAssignmentSchema.index({ staffUserId: 1, isActive: 1 });
resortStaffAssignmentSchema.index({ ownerUserId: 1, isActive: 1 });

const ResortStaffAssignment = mongoose.model("ResortStaffAssignment", resortStaffAssignmentSchema);

export default ResortStaffAssignment;

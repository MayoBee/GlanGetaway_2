import mongoose from "mongoose";

const rolePromotionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedRole: {
      type: String,
      enum: ["resort_owner"],
      default: "resort_owner",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Document URLs (stored in Cloudinary)
    documents: {
      dtiPermit: { type: String, required: true },
      municipalEngineeringCert: { type: String, required: true },
      municipalHealthCert: { type: String, required: true },
      menroCert: { type: String, required: true },
      bfpPermit: { type: String, required: true },
      businessPermit: { type: String, required: true },
      nationalId: { type: String, required: true },
    },
    // Admin review details
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    // Audit fields
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
rolePromotionRequestSchema.index({ userId: 1, status: 1 });
rolePromotionRequestSchema.index({ status: 1, createdAt: -1 });

const RolePromotionRequest = mongoose.model(
  "RolePromotionRequest",
  rolePromotionRequestSchema
);

export default RolePromotionRequest;

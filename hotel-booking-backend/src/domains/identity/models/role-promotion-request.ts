import mongoose from "mongoose";

const rolePromotionRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  businessPermitImageUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "declined"],
    default: "pending",
  },
  requestedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectionReason: String,
}, {
  timestamps: true,
});

// Add indexes for query performance
rolePromotionRequestSchema.index({ userId: 1 });
rolePromotionRequestSchema.index({ status: 1 });

export default mongoose.model("RolePromotionRequest", rolePromotionRequestSchema);

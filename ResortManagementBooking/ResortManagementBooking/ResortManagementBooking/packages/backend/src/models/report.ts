import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportedItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reportedItemType: {
    type: String,
    enum: ["hotel", "booking", "review", "user"],
    required: true,
  },
  reason: {
    type: String,
    enum: [
      "inappropriate_content",
      "fake_listing",
      "spam",
      "harassment",
      "fraud",
      "violence",
      "copyright",
      "other"
    ],
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ["pending", "under_review", "resolved", "dismissed"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  adminNotes: {
    type: String,
    maxlength: 2000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// Update the updatedAt field before saving
reportSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Report = mongoose.model<ReportDocument>("Report", reportSchema);

export default Report;

// TypeScript interface for Report
export interface ReportDocument {
  _id: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reportedItemId: mongoose.Types.ObjectId;
  reportedItemType: "hotel" | "booking" | "review" | "user";
  reason: "inappropriate_content" | "fake_listing" | "spam" | "harassment" | "fraud" | "violence" | "copyright" | "other";
  description: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "urgent";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
}

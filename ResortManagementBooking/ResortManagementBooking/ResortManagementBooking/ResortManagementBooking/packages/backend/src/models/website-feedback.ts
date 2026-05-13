import mongoose from "mongoose";

const websiteFeedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["bug", "feature", "issue", "feedback", "compliment"],
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  email: {
    type: String,
    maxlength: 255,
  },
  pageUrl: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    maxlength: 45, // IPv6 can be up to 45 characters
  },
  status: {
    type: String,
    enum: ["new", "reviewed", "resolved", "dismissed"],
    default: "new",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  adminNotes: {
    type: String,
    maxlength: 1000,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
});

// Update the updatedAt field before saving
websiteFeedbackSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const WebsiteFeedback = mongoose.model("WebsiteFeedback", websiteFeedbackSchema);

export default WebsiteFeedback;

// TypeScript interface
export interface WebsiteFeedbackDocument {
  _id: mongoose.Types.ObjectId;
  type: "bug" | "feature" | "issue" | "feedback" | "compliment";
  message: string;
  email?: string;
  pageUrl: string;
  userAgent: string;
  ipAddress?: string;
  status: "new" | "reviewed" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "urgent";
  adminNotes?: string;
  assignedTo?: mongoose.Types.ObjectId;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

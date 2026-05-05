"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const websiteFeedbackSchema = new mongoose_1.default.Schema({
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
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
    },
    resolvedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const WebsiteFeedback = mongoose_1.default.model("WebsiteFeedback", websiteFeedbackSchema);
exports.default = WebsiteFeedback;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const reportSchema = new mongoose_1.default.Schema({
    reporterId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reportedItemId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
    },
});
// Update the updatedAt field before saving
reportSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});
const Report = mongoose_1.default.model("Report", reportSchema);
exports.default = Report;

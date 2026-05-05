"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const rolePromotionRequestSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    businessPermitImageUrl: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "approved", "declined"],
        default: "pending",
    },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    reviewedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: String,
}, {
    timestamps: true,
});
// Add indexes for query performance
rolePromotionRequestSchema.index({ userId: 1 });
rolePromotionRequestSchema.index({ status: 1 });
exports.default = mongoose_1.default.model("RolePromotionRequest", rolePromotionRequestSchema);

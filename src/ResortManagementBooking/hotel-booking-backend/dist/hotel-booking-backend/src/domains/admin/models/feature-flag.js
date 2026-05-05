"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const featureFlagSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    enabled: { type: Boolean, default: false },
    rolloutPercentage: { type: Number, default: 0, min: 0, max: 100 },
    allowedUsers: [{ type: String }],
    allowedRoles: [{ type: String }],
    allowedEmails: [{ type: String }],
    environment: { type: String, default: "all", enum: ["all", "development", "staging", "production"] },
    metadata: { type: Map, of: mongoose_1.default.Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date },
}, {
    timestamps: true,
});
featureFlagSchema.index({ key: 1 }, { unique: true });
featureFlagSchema.index({ enabled: 1, environment: 1 });
exports.default = mongoose_1.default.model("FeatureFlag", featureFlagSchema);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const rolePromotionRequestSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    // Multiple document fields for resort owner application
    documents: {
        dtiPermit: { type: String, required: true },
        municipalEngineeringCert: { type: String, required: true },
        municipalHealthCert: { type: String, required: true },
        menroCert: { type: String, required: true },
        bfpPermit: { type: String, required: true },
        businessPermit: { type: String, required: true },
        nationalId: { type: String, required: true },
    },
    status: {
        type: String,
        enum: ["pending", "under_review", "approved", "declined"],
        default: "pending",
    },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    reviewedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: String,
    adminNotes: String,
    // Review tracking
    reviewStatus: {
        dtiPermit: { type: Boolean, default: false },
        municipalEngineeringCert: { type: Boolean, default: false },
        municipalHealthCert: { type: Boolean, default: false },
        menroCert: { type: Boolean, default: false },
        bfpPermit: { type: Boolean, default: false },
        businessPermit: { type: Boolean, default: false },
        nationalId: { type: Boolean, default: false },
    },
}, {
    timestamps: true,
});
// Add indexes for query performance
rolePromotionRequestSchema.index({ userId: 1 });
rolePromotionRequestSchema.index({ status: 1 });
rolePromotionRequestSchema.index({ requestedAt: -1 });
// Virtual to check if all documents are reviewed
rolePromotionRequestSchema.virtual('allDocumentsReviewed').get(function () {
    return Object.values(this.reviewStatus).every(status => status === true);
});
exports.default = mongoose_1.default.model("RolePromotionRequest", rolePromotionRequestSchema);

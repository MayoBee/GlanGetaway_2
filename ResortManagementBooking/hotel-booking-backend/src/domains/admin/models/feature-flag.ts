import mongoose, { Document } from "mongoose";

export interface IFeatureFlag extends Document {
  _id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  allowedUsers: string[];
  allowedRoles: string[];
  allowedEmails: string[];
  environment: string;
  metadata: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const featureFlagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    enabled: { type: Boolean, default: false },
    rolloutPercentage: { type: Number, default: 0, min: 0, max: 100 },
    allowedUsers: [{ type: String }],
    allowedRoles: [{ type: String }],
    allowedEmails: [{ type: String }],
    environment: { type: String, default: "all", enum: ["all", "development", "staging", "production"] },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

featureFlagSchema.index({ key: 1 }, { unique: true });
featureFlagSchema.index({ enabled: 1, environment: 1 });

export default mongoose.model<IFeatureFlag>("FeatureFlag", featureFlagSchema);

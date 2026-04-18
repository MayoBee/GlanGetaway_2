import { createHash } from "crypto";
import FeatureFlag, { IFeatureFlag } from "../models/feature-flag";

export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  environment?: string;
}

const DEFAULT_FLAGS: Record<string, boolean> = {
  // All existing features are enabled by default for backwards compatibility
};

let cachedFlags: Map<string, IFeatureFlag> = new Map();
let lastCacheUpdate = 0;
const CACHE_TTL = 30000; // 30 seconds cache

export class FeatureFlagService {
  private static async loadFlags(): Promise<void> {
    const now = Date.now();
    if (now - lastCacheUpdate < CACHE_TTL) return;

    try {
      const flags = await FeatureFlag.find({});
      cachedFlags = new Map(flags.map(flag => [flag.key, flag]));
      lastCacheUpdate = now;
    } catch (error) {
      // If model is not yet initialized or database not connected, use empty cache
      console.warn("FeatureFlag model not yet initialized, using empty cache");
      cachedFlags = new Map();
      lastCacheUpdate = now;
    }
  }

  private static isUserInRollout(userId: string, percentage: number): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    const hash = createHash("sha256")
      .update(userId)
      .digest("hex");
    
    const hashValue = parseInt(hash.substring(0, 8), 16);
    const bucket = hashValue % 100;

    return bucket < percentage;
  }

  private static matchesEnvironment(flag: IFeatureFlag, env?: string): boolean {
    if (flag.environment === "all") return true;
    if (!env) return false;
    return flag.environment === env;
  }

  public static async isEnabled(flagKey: string, context: FeatureFlagContext = {}): Promise<boolean> {
    // Check env vars first (highest precedence)
    const envVar = process.env[`FEATURE_${flagKey.toUpperCase().replace(/-/g, "_")}`];
    if (envVar !== undefined) {
      return envVar === "true" || envVar === "1";
    }

    // Default to true for backwards compatibility
    if (DEFAULT_FLAGS[flagKey] === true) return true;

    await this.loadFlags();
    const flag = cachedFlags.get(flagKey);

    if (!flag) return true; // Default enabled for unknown flags
    if (!flag.enabled) return false;
    if (!this.matchesEnvironment(flag, context.environment)) return false;

    // Check expiration
    if (flag.expiresAt && new Date() > flag.expiresAt) return false;

    // Full rollout
    if (flag.rolloutPercentage >= 100) return true;

    // User specific allowlist
    if (context.userId && flag.allowedUsers.includes(context.userId)) return true;

    // Email allowlist
    if (context.userEmail && flag.allowedEmails.some(email => 
      context.userEmail?.toLowerCase() === email.toLowerCase()
    )) return true;

    // Role allowlist
    if (context.userRole && flag.allowedRoles.includes(context.userRole)) return true;

    // Percentage based rollout
    if (context.userId && this.isUserInRollout(context.userId, flag.rolloutPercentage)) return true;

    return false;
  }

  public static async getAllFlags(context: FeatureFlagContext = {}): Promise<Record<string, boolean>> {
    await this.loadFlags();
    const result: Record<string, boolean> = {};

    for (const [key] of cachedFlags) {
      result[key] = await this.isEnabled(key, context);
    }

    // Add default flags
    Object.entries(DEFAULT_FLAGS).forEach(([key, value]) => {
      if (!(key in result)) result[key] = value;
    });

    return result;
  }

  // Admin methods
  public static async createFlag(data: Partial<IFeatureFlag>): Promise<IFeatureFlag> {
    const flag = new FeatureFlag(data);
    await flag.save();
    cachedFlags.set(flag.key, flag);
    return flag;
  }

  public static async updateFlag(key: string, data: Partial<IFeatureFlag>): Promise<IFeatureFlag | null> {
    const flag = await FeatureFlag.findOneAndUpdate({ key }, data, { new: true });
    if (flag) cachedFlags.set(key, flag);
    return flag;
  }

  public static async deleteFlag(key: string): Promise<void> {
    await FeatureFlag.deleteOne({ key });
    cachedFlags.delete(key);
  }

  public static clearCache(): void {
    lastCacheUpdate = 0;
  }
}

export default FeatureFlagService;

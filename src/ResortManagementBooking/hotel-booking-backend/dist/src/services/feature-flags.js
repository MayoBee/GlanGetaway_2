"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagService = void 0;
const crypto_1 = require("crypto");
const feature_flag_1 = require("../models/feature-flag");
const DEFAULT_FLAGS = {
// All existing features are enabled by default for backwards compatibility
};
let cachedFlags = new Map();
let lastCacheUpdate = 0;
const CACHE_TTL = 30000; // 30 seconds cache
class FeatureFlagService {
    static loadFlags() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            if (now - lastCacheUpdate < CACHE_TTL)
                return;
            try {
                const flags = yield feature_flag_1.FeatureFlag.find({});
                cachedFlags = new Map(flags.map(flag => [flag.key, flag]));
                lastCacheUpdate = now;
            }
            catch (error) {
                // If model is not yet initialized or database not connected, use empty cache
                console.warn("FeatureFlag model not yet initialized, using empty cache");
                cachedFlags = new Map();
                lastCacheUpdate = now;
            }
        });
    }
    static isUserInRollout(userId, percentage) {
        if (percentage >= 100)
            return true;
        if (percentage <= 0)
            return false;
        const hash = (0, crypto_1.createHash)("sha256")
            .update(userId)
            .digest("hex");
        const hashValue = parseInt(hash.substring(0, 8), 16);
        const bucket = hashValue % 100;
        return bucket < percentage;
    }
    static matchesEnvironment(flag, env) {
        if (flag.environment === "all")
            return true;
        if (!env)
            return false;
        return flag.environment === env;
    }
    static isEnabled(flagKey, context = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check env vars first (highest precedence)
            const envVar = process.env[`FEATURE_${flagKey.toUpperCase().replace(/-/g, "_")}`];
            if (envVar !== undefined) {
                return envVar === "true" || envVar === "1";
            }
            // Default to true for backwards compatibility
            if (DEFAULT_FLAGS[flagKey] === true)
                return true;
            yield this.loadFlags();
            const flag = cachedFlags.get(flagKey);
            if (!flag)
                return true; // Default enabled for unknown flags
            if (!flag.enabled)
                return false;
            if (!this.matchesEnvironment(flag, context.environment))
                return false;
            // Check expiration
            if (flag.expiresAt && new Date() > flag.expiresAt)
                return false;
            // Full rollout
            if (flag.rolloutPercentage >= 100)
                return true;
            // User specific allowlist
            if (context.userId && flag.allowedUsers.includes(context.userId))
                return true;
            // Email allowlist
            if (context.userEmail && flag.allowedEmails.some(email => { var _a; return ((_a = context.userEmail) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === email.toLowerCase(); }))
                return true;
            // Role allowlist
            if (context.userRole && flag.allowedRoles.includes(context.userRole))
                return true;
            // Percentage based rollout
            if (context.userId && this.isUserInRollout(context.userId, flag.rolloutPercentage))
                return true;
            return false;
        });
    }
    static getAllFlags(context = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadFlags();
            const result = {};
            for (const [key] of cachedFlags) {
                result[key] = yield this.isEnabled(key, context);
            }
            // Add default flags
            Object.entries(DEFAULT_FLAGS).forEach(([key, value]) => {
                if (!(key in result))
                    result[key] = value;
            });
            return result;
        });
    }
    // Admin methods
    static createFlag(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const flag = new feature_flag_1.FeatureFlag(data);
            yield flag.save();
            cachedFlags.set(flag.key, flag);
            return flag;
        });
    }
    static updateFlag(key, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const flag = yield feature_flag_1.FeatureFlag.findOneAndUpdate({ key }, data, { new: true });
            if (flag)
                cachedFlags.set(key, flag);
            return flag;
        });
    }
    static deleteFlag(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield feature_flag_1.FeatureFlag.deleteOne({ key });
            cachedFlags.delete(key);
        });
    }
    static clearCache() {
        lastCacheUpdate = 0;
    }
}
exports.FeatureFlagService = FeatureFlagService;
exports.default = FeatureFlagService;

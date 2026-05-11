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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureFlagRoute = exports.requireFeatureFlag = exports.featureFlagMiddleware = void 0;
const feature_flags_1 = __importDefault(require("../services/feature-flags"));
const featureFlagMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const context = {
        userId: (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(),
        userRole: (_c = req.user) === null || _c === void 0 ? void 0 : _c.role,
        userEmail: (_d = req.user) === null || _d === void 0 ? void 0 : _d.email,
        environment: process.env.NODE_ENV,
    };
    req.featureFlags = yield feature_flags_1.default.getAllFlags(context);
    next();
});
exports.featureFlagMiddleware = featureFlagMiddleware;
const requireFeatureFlag = (flagKey) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const context = {
            userId: (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(),
            userRole: (_c = req.user) === null || _c === void 0 ? void 0 : _c.role,
            userEmail: (_d = req.user) === null || _d === void 0 ? void 0 : _d.email,
            environment: process.env.NODE_ENV,
        };
        const isEnabled = yield feature_flags_1.default.isEnabled(flagKey, context);
        if (!isEnabled) {
            return res.status(403).json({
                success: false,
                message: "This feature is currently unavailable",
                error: "FEATURE_DISABLED",
            });
        }
        next();
    });
};
exports.requireFeatureFlag = requireFeatureFlag;
const featureFlagRoute = (flagKey, enabledHandler, disabledHandler) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const context = {
            userId: (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(),
            userRole: (_c = req.user) === null || _c === void 0 ? void 0 : _c.role,
            userEmail: (_d = req.user) === null || _d === void 0 ? void 0 : _d.email,
            environment: process.env.NODE_ENV,
        };
        const isEnabled = yield feature_flags_1.default.isEnabled(flagKey, context);
        if (isEnabled) {
            return enabledHandler(req, res, next);
        }
        else if (disabledHandler) {
            return disabledHandler(req, res, next);
        }
        next();
    });
};
exports.featureFlagRoute = featureFlagRoute;

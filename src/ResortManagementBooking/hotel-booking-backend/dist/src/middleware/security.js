"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCsrfToken = exports.csrfMiddleware = exports.cookieParserMiddleware = exports.setupRateLimiting = exports.setupTrustProxy = exports.securityMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Security middleware export with cross-origin resource policy override for images
exports.securityMiddleware = (0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
});
// Trust proxy for production (fixes rate limiting issues)
const setupTrustProxy = (app) => {
    app.set("trust proxy", 1);
};
exports.setupTrustProxy = setupTrustProxy;
// Rate limiting - more lenient for payment endpoints
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
// Special limiter for payment endpoints
const paymentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: "Too many payment requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
const setupRateLimiting = (app) => {
    app.use("/api/", generalLimiter);
    app.use("/api/hotels/*/bookings/payment-intent", paymentLimiter);
};
exports.setupRateLimiting = setupRateLimiting;
// Parse cookies
exports.cookieParserMiddleware = (0, cookie_parser_1.default)();
// CSRF middleware is a no-op: this API uses JWT Bearer tokens stored in
// localStorage, so it is not vulnerable to CSRF attacks. Cookie-based CSRF
// protection would only interfere with normal login/mutation flows.
const csrfMiddleware = (_req, _res, next) => {
    next();
};
exports.csrfMiddleware = csrfMiddleware;
// Stub for the CSRF token endpoint (kept for backwards-compat with bootstrap.ts)
const getCsrfToken = (_req, res) => {
    res.json({ csrfToken: "" });
};
exports.getCsrfToken = getCsrfToken;

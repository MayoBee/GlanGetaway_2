"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
// Parse and validate allowed origins from environment
const parseAllowedOrigins = () => {
    const origins = [];
    // Add primary frontend URL
    if (process.env.FRONTEND_URL) {
        origins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
    }
    // Add additional trusted origins from env var (comma separated)
    if (process.env.ALLOWED_ORIGINS) {
        process.env.ALLOWED_ORIGINS.split(",").forEach(origin => {
            const trimmed = origin.trim().replace(/\/$/, "");
            if (trimmed)
                origins.push(trimmed);
        });
    }
    // Development localhost origins (only added in development mode)
    if (process.env.NODE_ENV !== "production") {
        origins.push("http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5000" // Add backend for static file access
        );
    }
    // Deduplicate and filter valid origins
    return [...new Set(origins)].filter(Boolean);
};
const allowedOrigins = parseAllowedOrigins();
// Secure CORS origin validation
const corsOriginValidator = (origin, callback) => {
    // Allow requests with no origin ONLY in development
    if (!origin) {
        if (process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }
        return callback(new Error("Origin header required"), false);
    }
    // Normalize origin by removing trailing slash
    const normalizedOrigin = origin.replace(/\/$/, "");
    // Exact match validation only
    if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
    }
    // Log blocked origins in development
    if (process.env.NODE_ENV === "development") {
        console.log("CORS blocked origin:", origin);
    }
    return callback(new Error("Not allowed by CORS"), false);
};
// Single CORS configuration (no duplicate OPTIONS handler)
exports.corsMiddleware = (0, cors_1.default)({
    origin: corsOriginValidator,
    credentials: true,
    optionsSuccessStatus: 204,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cookie",
        "X-Requested-With",
    ],
    preflightContinue: false,
});

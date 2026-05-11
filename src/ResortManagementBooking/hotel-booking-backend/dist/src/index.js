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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const imageService_1 = __importDefault(require("./services/imageService"));
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const csurf_1 = __importDefault(require("csurf"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const my_hotels_1 = __importDefault(require("./routes/my-hotels"));
const hotels_1 = __importDefault(require("./routes/hotels"));
const my_bookings_1 = __importDefault(require("./routes/my-bookings"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const health_1 = __importDefault(require("./routes/health"));
const business_insights_1 = __importDefault(require("./routes/business-insights"));
const reports_1 = __importDefault(require("./routes/reports"));
const website_feedback_1 = __importDefault(require("./routes/website-feedback"));
const resort_approval_1 = __importDefault(require("./routes/resort-approval"));
const admin_management_1 = __importDefault(require("./routes/admin-management"));
const admin_1 = __importDefault(require("./routes/admin"));
const role_promotion_requests_1 = __importDefault(require("./routes/role-promotion-requests"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./swagger");
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorHandler_1 = require("./middleware/errorHandler");
// New Resort Management Routes
const staff_management_1 = __importDefault(require("./routes/staff-management"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const rooms_1 = __importDefault(require("./routes/rooms"));
const pricing_1 = __importDefault(require("./routes/pricing"));
const amenities_1 = __importDefault(require("./routes/amenities"));
const housekeeping_maintenance_1 = __importDefault(require("./routes/housekeeping-maintenance"));
const billing_1 = __importDefault(require("./routes/billing"));
const resort_reports_1 = __importDefault(require("./routes/resort-reports"));
const debug_auth_1 = __importDefault(require("./routes/debug-auth"));
const quick_fix_admin_1 = __importDefault(require("./routes/quick-fix-admin"));
// Smart Features Routes
const room_blocks_1 = __importDefault(require("./routes/room-blocks"));
const payments_1 = __importDefault(require("./routes/payments"));
const identity_verification_1 = __importDefault(require("./routes/identity-verification"));
const verification_documents_1 = __importDefault(require("./routes/verification-documents"));
const weather_triggers_1 = __importDefault(require("./routes/weather-triggers"));
const amenity_slots_1 = __importDefault(require("./routes/amenity-slots"));
const housekeeping_tasks_1 = __importDefault(require("./routes/housekeeping-tasks"));
// Environment Variables Validation
const requiredEnvVars = [
    "MONGODB_CONNECTION_STRING",
    "JWT_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingEnvVars.forEach((envVar) => console.error(`   - ${envVar}`));
    process.exit(1);
}
console.log("✅ All required environment variables are present");
console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "Not set"}`);
console.log(`🔗 Backend URL: ${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}`);
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
const isCloudinaryConfigured = cloudinaryCloudName &&
    cloudinaryApiKey &&
    cloudinaryApiSecret &&
    !cloudinaryCloudName.includes("your-") &&
    !cloudinaryApiKey.includes("your-") &&
    !cloudinaryApiSecret.includes("your-");
if (isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: cloudinaryCloudName,
        api_key: cloudinaryApiKey,
        api_secret: cloudinaryApiSecret,
    });
    console.log("☁️  Cloudinary configured successfully");
}
else {
    console.log("☁️  Cloudinary configuration skipped (credentials not provided)");
}
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '..', '..', 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    console.log("📁 Created uploads directory");
}
// MongoDB Connection with Error Handling
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("📡 Attempting to connect to MongoDB...");
        yield mongoose_1.default.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("✅ MongoDB connected successfully");
        console.log(`📦 Database: ${mongoose_1.default.connection.db.databaseName}`);
    }
    catch (error) {
        console.error("❌ MongoDB connection error:", error);
        console.error("💡 Please check your MONGODB_CONNECTION_STRING");
        process.exit(1);
    }
});
// Handle MongoDB connection events
mongoose_1.default.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
});
mongoose_1.default.connection.on("error", (error) => {
    console.error("❌ MongoDB connection error:", error);
});
mongoose_1.default.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected successfully");
});
connectDB();
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// Trust proxy for production (fixes rate limiting issues)
app.set("trust proxy", 1);
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
app.use("/api/", generalLimiter);
app.use("/api/hotels/*/bookings/payment-intent", paymentLimiter);
// Compression middleware
app.use((0, compression_1.default)());
// Logging middleware
app.use((0, morgan_1.default)("combined"));
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
        origins.push("http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:3000");
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
app.use((0, cors_1.default)({
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
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// CSRF Protection
const csrfProtection = (0, csurf_1.default)({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
    },
});
// CSRF middleware is disabled - using JWT Bearer tokens instead
// Expose CSRF token endpoint for backwards compatibility
app.get("/api/csrf-token", (req, res) => {
    res.json({ csrfToken: "" });
});
app.use((req, res, next) => {
    // Ensure Vary header for CORS
    res.header("Vary", "Origin");
    next();
});
app.get("/", (req, res) => {
    res.send("<h1>Hotel Booking Backend API is running 🚀</h1>");
});
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/my-hotels", my_hotels_1.default);
app.use("/api/hotels", hotels_1.default);
app.use("/api/my-bookings", my_bookings_1.default);
app.use("/api/bookings", bookings_1.default);
app.use("/api/health", health_1.default);
app.use("/api/business-insights", business_insights_1.default);
app.use("/api/reports", reports_1.default);
app.use("/api/website-feedback", website_feedback_1.default);
app.use("/api/resort-approval", resort_approval_1.default);
app.use("/api/admin-management", admin_management_1.default);
app.use("/api/role-promotion-requests", role_promotion_requests_1.default);
app.use("/api/admin", admin_1.default);
// New Resort Management API Routes
app.use("/api/staff", staff_management_1.default);
app.use("/api/dashboard", dashboard_1.default);
app.use("/api/rooms", rooms_1.default);
app.use("/api/pricing", pricing_1.default);
app.use("/api/amenities", amenities_1.default);
app.use("/api/operations", housekeeping_maintenance_1.default);
app.use("/api/billing", billing_1.default);
app.use("/api/resort-reports", resort_reports_1.default);
app.use("/api/debug-auth", debug_auth_1.default);
app.use("/api/quick-fix-admin", quick_fix_admin_1.default);
// Smart Features API Routes
app.use("/api/room-blocks", room_blocks_1.default);
app.use("/api/payments", payments_1.default);
app.use("/api/identity-verification", identity_verification_1.default);
app.use("/api/verification-documents", verification_documents_1.default);
app.use("/api/weather-triggers", weather_triggers_1.default);
app.use("/api/amenity-slots", amenity_slots_1.default);
app.use("/api/housekeeping-tasks", housekeeping_tasks_1.default);
// Swagger API Documentation
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Hotel Booking API Documentation",
}));
// Serve uploaded files using the new image service
app.get('/uploads/:filename', (req, res) => {
    // Set CORS headers for image serving
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    imageService_1.default.serveImage(req, res);
});
// Also handle the old static route for backwards compatibility
app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express_1.default.static(path_1.default.join(__dirname, '..', '..', 'uploads')));
// 404 Handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.originalUrl} not found`,
            code: 'NOT_FOUND',
            statusCode: 404
        }
    });
});
// Global Error Handler - MUST be the LAST middleware
app.use(errorHandler_1.errorHandler);
// Setup process level error handlers
(0, errorHandler_1.setupProcessErrorHandlers)();
// Dynamic Port Configuration (for Render, Coolify/VPS and local development)
const PORT = process.env.PORT || 5000;
const backendBaseUrl = ((_a = process.env.BACKEND_URL) === null || _a === void 0 ? void 0 : _a.replace(/\/$/, "")) || `http://localhost:${PORT}`;
const server = app.listen(PORT, () => {
    console.log("🚀 ============================================");
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🔗 Public: ${backendBaseUrl}`);
    console.log(`📚 API Docs: ${backendBaseUrl}/api-docs`);
    console.log(`💚 Health Check: ${backendBaseUrl}/api/health`);
    console.log("🚀 ============================================");
});
// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);
    server.close(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log("🔒 HTTP server closed");
        try {
            yield mongoose_1.default.connection.close();
            console.log("🔒 MongoDB connection closed");
            console.log("✅ Graceful shutdown completed");
            process.exit(0);
        }
        catch (error) {
            console.error("❌ Error during shutdown:", error);
            process.exit(1);
        }
    }));
    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error("⚠️  Forced shutdown after timeout");
        process.exit(1);
    }, 30000);
};
// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

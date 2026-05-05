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
exports.createGracefulShutdown = exports.createAndConfigureApp = exports.setupMongoEventHandlers = exports.connectDB = exports.createUploadsDirectory = exports.configureCloudinary = exports.validateEnvironment = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = require("./middleware/errorHandler");
const cors_1 = require("./middleware/cors");
const security_1 = require("./middleware/security");
const compliance_1 = require("./middleware/compliance");
const routes_1 = require("./routes");
const feature_flag_1 = require("./middleware/feature-flag");
const metrics_1 = require("./core/metrics");
// Environment Variables Validation
const requiredEnvVars = [
    "MONGODB_CONNECTION_STRING",
    "JWT_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
];
const validateEnvironment = () => {
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
};
exports.validateEnvironment = validateEnvironment;
const configureCloudinary = () => {
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
};
exports.configureCloudinary = configureCloudinary;
const createUploadsDirectory = () => {
    const uploadsDir = path_1.default.join(__dirname, '..', '..', 'uploads');
    if (!fs_1.default.existsSync(uploadsDir)) {
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        console.log("📁 Created uploads directory");
    }
};
exports.createUploadsDirectory = createUploadsDirectory;
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
exports.connectDB = connectDB;
const setupMongoEventHandlers = () => {
    mongoose_1.default.connection.on("disconnected", () => {
        console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });
    mongoose_1.default.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
    });
    mongoose_1.default.connection.on("reconnected", () => {
        console.log("✅ MongoDB reconnected successfully");
    });
};
exports.setupMongoEventHandlers = setupMongoEventHandlers;
const createAndConfigureApp = () => {
    const app = (0, express_1.default)();
    // Metrics middleware - first in stack to capture all requests
    app.use(metrics_1.metrics.expressMiddleware());
    app.use(security_1.securityMiddleware);
    (0, security_1.setupTrustProxy)(app);
    (0, security_1.setupRateLimiting)(app);
    (0, compliance_1.applyComplianceMiddleware)(app);
    app.use((0, compression_1.default)());
    app.use((0, morgan_1.default)("combined"));
    // Observability endpoints
    app.get("/health", metrics_1.metrics.getHealthCheckHandler.bind(metrics_1.metrics));
    app.get("/metrics", metrics_1.metrics.getMetricsHandler.bind(metrics_1.metrics));
    app.use(cors_1.corsMiddleware);
    app.use(security_1.cookieParserMiddleware);
    app.use(express_1.default.json({ limit: '50mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
    app.use(security_1.csrfMiddleware);
    app.use(feature_flag_1.featureFlagMiddleware);
    app.get("/api/csrf-token", security_1.getCsrfToken);
    app.use((req, res, next) => {
        // Ensure Vary header for CORS
        res.header("Vary", "Origin");
        next();
    });
    (0, routes_1.mountRoutes)(app);
    // Global Error Handler - MUST be the LAST middleware
    app.use(errorHandler_1.errorHandler);
    (0, errorHandler_1.setupProcessErrorHandlers)();
    return app;
};
exports.createAndConfigureApp = createAndConfigureApp;
// Graceful Shutdown Handler
const createGracefulShutdown = (server) => {
    return (signal) => {
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
};
exports.createGracefulShutdown = createGracefulShutdown;

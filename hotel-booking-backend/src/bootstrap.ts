import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import compression from "compression";
import morgan from "morgan";
import { errorHandler, setupProcessErrorHandlers } from "./middleware/errorHandler";

import { corsMiddleware } from "./middleware/cors";
import { 
  securityMiddleware,
  setupTrustProxy,
  setupRateLimiting,
  cookieParserMiddleware,
  csrfMiddleware,
  getCsrfToken
} from "./middleware/security";
import { applyComplianceMiddleware } from "./middleware/compliance";
import { mountRoutes } from "./routes";
import { featureFlagMiddleware } from "./middleware/feature-flag";
import { metrics } from "./core/metrics";

// Environment Variables Validation
const requiredEnvVars = [
  "MONGODB_CONNECTION_STRING",
  "JWT_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
];

export const validateEnvironment = () => {
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingEnvVars.forEach((envVar) => console.error(`   - ${envVar}`));
    process.exit(1);
  }

  console.log("✅ All required environment variables are present");
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "Not set"}`);
  console.log(
    `🔗 Backend URL: ${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}`
  );
};

export const configureCloudinary = () => {
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

  const isCloudinaryConfigured =
    cloudinaryCloudName &&
    cloudinaryApiKey &&
    cloudinaryApiSecret &&
    !cloudinaryCloudName.includes("your-") &&
    !cloudinaryApiKey.includes("your-") &&
    !cloudinaryApiSecret.includes("your-");

  if (isCloudinaryConfigured) {
    cloudinary.config({
      cloud_name: cloudinaryCloudName,
      api_key: cloudinaryApiKey,
      api_secret: cloudinaryApiSecret,
    });
    console.log("☁️  Cloudinary configured successfully");
  } else {
    console.log("☁️  Cloudinary configuration skipped (credentials not provided)");
  }
};

export const createUploadsDirectory = () => {
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("📁 Created uploads directory");
  }
};

// MongoDB Connection with Error Handling
export const connectDB = async () => {
  try {
    console.log("📡 Attempting to connect to MongoDB...");
    
    const connectionString = (process.env.MONGODB_CONNECTION_STRING || "").trim();
    
    if (!connectionString) {
      throw new Error("MONGODB_CONNECTION_STRING is empty");
    }
    
    if (!connectionString.startsWith("mongodb://") && !connectionString.startsWith("mongodb+srv://")) {
      throw new Error(`Invalid MongoDB connection string scheme. Must start with "mongodb://" or "mongodb+srv://". Received: ${connectionString.substring(0, 30)}...`);
    }
    
    // Set a 10-second timeout for connection to fail fast
    const connectionTimeoutMs = 10000;
    
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: connectionTimeoutMs,
      socketTimeoutMS: connectionTimeoutMs,
    });
    console.log("✅ MongoDB connected successfully");
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error instanceof Error ? error.message : error);
    console.error("💡 Please check your MONGODB_CONNECTION_STRING environment variable on Render");
    process.exit(1);
  }
};

export const setupMongoEventHandlers = () => {
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("error", (error) => {
    console.error("❌ MongoDB connection error:", error);
  });

  mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected successfully");
  });
};

export const createAndConfigureApp = () => {
  const app = express();

  // Metrics middleware - first in stack to capture all requests
  app.use(metrics.expressMiddleware());

  app.use(securityMiddleware);
  setupTrustProxy(app);
  setupRateLimiting(app);
  applyComplianceMiddleware(app);
  
  app.use(compression());
  app.use(morgan("combined"));

  // Static file serving for uploaded images
  app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

  // Observability endpoints
  app.get("/health", metrics.getHealthCheckHandler.bind(metrics));
  app.get("/metrics", metrics.getMetricsHandler.bind(metrics));
  

  
  app.use(corsMiddleware);
  
  app.use(cookieParserMiddleware);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  app.use(csrfMiddleware);
  app.use(featureFlagMiddleware);
  app.get("/api/csrf-token", getCsrfToken);
  
  app.use((req, res, next) => {
    // Ensure Vary header for CORS
    res.header("Vary", "Origin");
    next();
  });

  mountRoutes(app);

  // Global Error Handler - MUST be the LAST middleware
  app.use(errorHandler);

  setupProcessErrorHandlers();

  return app;
};

// Graceful Shutdown Handler
export const createGracefulShutdown = (server: any) => {
  return (signal: string) => {
    console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      console.log("🔒 HTTP server closed");

      try {
        await mongoose.connection.close();
        console.log("🔒 MongoDB connection closed");
        console.log("✅ Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error("⚠️  Forced shutdown after timeout");
      process.exit(1);
    }, 30000);
  };
};

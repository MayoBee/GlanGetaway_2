import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { specs } from "./swagger";
import path from "path";
import imageService from "./services/imageService";
import mongoose from "mongoose";

import { configureSecurityMiddleware } from "./middleware/security";
import { configureCors } from "./middleware/cors";
import { registerRoutes } from "./routes";
import { connectDB } from "./config/database";

export const createServer = async () => {
  const app = express();

  configureCors(app);
  configureSecurityMiddleware(app);

  app.get("/", (req: Request, res: Response) => {
    res.send("<h1>Hotel Booking Backend API is running 🚀</h1>");
  });

  registerRoutes(app);

  // Swagger Documentation
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Hotel Booking API Documentation",
    })
  );

  // Serve uploaded files statically with CORS headers
  const uploadsPath = path.join(__dirname, '..', '..', 'uploads');
  console.log('🔧 Static uploads path:', uploadsPath);

  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    console.log('📁 Serving static file:', req.path);
    next();
  }, express.static(uploadsPath));

  return app;
};

export const startServer = async () => {
  await connectDB();
  const app = await createServer();

  const PORT = process.env.PORT || 5000;
  const backendBaseUrl =
    process.env.BACKEND_URL?.replace(/\/$/, "") || `http://localhost:${PORT}`;

  const server = app.listen(PORT, () => {
    console.log("🚀 ============================================");
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🔗 Public: ${backendBaseUrl}`);
    console.log(`📚 API Docs: ${backendBaseUrl}/api-docs`);
    console.log(`💚 Health Check: ${backendBaseUrl}/api/health`);
    console.log("🚀 ============================================");
  });

  // Graceful Shutdown
  const gracefulShutdown = (signal: string) => {
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

    setTimeout(() => {
      console.error("⚠️  Forced shutdown after timeout");
      process.exit(1);
    }, 30000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  });
  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("UNHANDLED_REJECTION");
  });

  return server;
};

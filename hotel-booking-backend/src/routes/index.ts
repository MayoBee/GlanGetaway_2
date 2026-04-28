import express, { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { specs } from "../swagger";
import imageService from "../services/imageService";
import path from "path";

import userRoutes from "./users";
import authRoutes from "./auth";
import myHotelRoutes from "./my-hotels";
import hotelRoutes from "./hotels";
import bookingRoutes from "./my-bookings";
import bookingsManagementRoutes from "./bookings";
import healthRoutes from "./health";
import businessInsightsRoutes from "./business-insights";
import reportRoutes from "./reports";
import websiteFeedbackRoutes from "./website-feedback";
import resortApprovalRoutes from "./resort-approval";
import adminManagementRoutes from "./admin-management";
import adminRoutes from "./admin";
import rolePromotionRoutes from "./role-promotion-requests";

// New Resort Management Routes
import staffManagementRoutes from "./staff-management";
import dashboardRoutes from "./dashboard";
import roomRoutes from "./rooms";
import pricingRoutes from "./pricing";
import amenitiesRoutes from "./amenities";
import housekeepingRoutes from "./housekeeping-maintenance";
import billingRoutes from "./billing";
import resortReportsRoutes from "./resort-reports";


// Smart Features Routes
import roomBlocksRoutes from "./room-blocks";
import paymentsRoutes from "./payments";
import identityVerificationRoutes from "./identity-verification";
import verificationDocumentsRoutes from "./verification-documents";
import weatherTriggerRoutes from "./weather-triggers";
import amenitySlotsRoutes from "./amenity-slots";
import housekeepingTasksRoutes from "./housekeeping-tasks";
import featureFlagRoutes from "./feature-flags";
import resortStaffRoutes from "./resort-staff";

export const mountRoutes = (app: Express) => {
  app.get("/", (req: Request, res: Response) => {
    res.send("<h1>Hotel Booking Backend API is running 🚀</h1>");
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/my-hotels", myHotelRoutes);
  app.use("/api/hotels", hotelRoutes);
  app.use("/api/my-bookings", bookingRoutes);
  app.use("/api/bookings", bookingsManagementRoutes);
  app.use("/api/health", healthRoutes);
  app.use("/api/business-insights", businessInsightsRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/website-feedback", websiteFeedbackRoutes);
  app.use("/api/resort-approval", resortApprovalRoutes);
  app.use("/api/admin-management", adminManagementRoutes);
  app.use("/api/role-promotion-requests", rolePromotionRoutes);
  app.use("/api/admin", adminRoutes);

  // New Resort Management API Routes
  app.use("/api/staff", staffManagementRoutes);
  app.use("/api/resort-staff", resortStaffRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/pricing", pricingRoutes);
  app.use("/api/amenities", amenitiesRoutes);
  app.use("/api/operations", housekeepingRoutes);
  app.use("/api/billing", billingRoutes);
  app.use("/api/resort-reports", resortReportsRoutes);

  // Smart Features API Routes
  app.use("/api/room-blocks", roomBlocksRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/identity-verification", identityVerificationRoutes);
  app.use("/api/verification-documents", verificationDocumentsRoutes);
  app.use("/api/weather-triggers", weatherTriggerRoutes);
  app.use("/api/amenity-slots", amenitySlotsRoutes);
  app.use("/api/housekeeping-tasks", housekeepingTasksRoutes);
  app.use("/api/feature-flags", featureFlagRoutes);

  // Swagger API Documentation
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Hotel Booking API Documentation",
    })
  );

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
    
    imageService.serveImage(req, res);
  });

  // Also handle the old static route for backwards compatibility
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.join(__dirname, '..', '..', 'uploads')));

  // 404 Handler for undefined routes
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Route ${req.method} ${req.originalUrl} not found`,
        code: 'NOT_FOUND',
        statusCode: 404
      }
    });
  });
};

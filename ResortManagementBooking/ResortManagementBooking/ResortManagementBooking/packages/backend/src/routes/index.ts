import { Express } from "express";

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
import staffManagementRoutes from "./staff-management";
import dashboardRoutes from "./dashboard";
import roomRoutes from "./rooms";
import pricingRoutes from "./pricing";
import amenitiesRoutes from "./amenities";
import housekeepingRoutes from "./housekeeping-maintenance";
import billingRoutes from "./billing";
import resortReportsRoutes from "./resort-reports";
import debugAuthRoutes from "./debug-auth";
import quickFixAdminRoutes from "./quick-fix-admin";
import roomBlocksRoutes from "./room-blocks";
import paymentsRoutes from "./payments";
import identityVerificationRoutes from "./identity-verification";
import verificationDocumentsRoutes from "./verification-documents";
import weatherTriggerRoutes from "./weather-triggers";
import amenitySlotsRoutes from "./amenity-slots";
import housekeepingTasksRoutes from "./housekeeping-tasks";
import rolePromotionRoutes from "./role-promotion-requests";
import resortStaffRoutes from "./resort-staff";

export const registerRoutes = (app: Express): void => {
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
  app.use("/api/admin", adminRoutes);

  // Resort Management Routes
  app.use("/api/staff", staffManagementRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/pricing", pricingRoutes);
  app.use("/api/amenities", amenitiesRoutes);
  app.use("/api/operations", housekeepingRoutes);
  app.use("/api/billing", billingRoutes);
  app.use("/api/resort-reports", resortReportsRoutes);
  app.use("/api/debug-auth", debugAuthRoutes);
  app.use("/api/quick-fix-admin", quickFixAdminRoutes);

  // Smart Features Routes
  app.use("/api/room-blocks", roomBlocksRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/identity-verification", identityVerificationRoutes);
  app.use("/api/verification-documents", verificationDocumentsRoutes);
  app.use("/api/weather-triggers", weatherTriggerRoutes);
  app.use("/api/amenity-slots", amenitySlotsRoutes);
  app.use("/api/housekeeping-tasks", housekeepingTasksRoutes);
  app.use("/api/resort-staff", resortStaffRoutes);
  app.use("/api/role-promotion-requests", rolePromotionRoutes);
};

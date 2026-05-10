import express, { Express } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";

export const configureSecurityMiddleware = (app: Express): void => {
  app.use(helmet());
  app.set("trust proxy", 1);

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 10000 : 200, // Further increased for development to prevent 429 during testing
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: "Too many payment requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", generalLimiter);
  app.use("/api/hotels/*/bookings/payment-intent", paymentLimiter);

  app.use(compression());
  app.use(morgan("combined"));

  app.use(cookieParser());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
};

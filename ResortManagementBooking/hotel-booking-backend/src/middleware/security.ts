import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { Request, Response, NextFunction } from "express";

// Security middleware export with cross-origin resource policy override for images
export const securityMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Trust proxy for production (fixes rate limiting issues)
export const setupTrustProxy = (app: any) => {
  app.set("trust proxy", 1);
};

// Rate limiting - more lenient for payment endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit for general requests
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Special limiter for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Higher limit for payment requests
  message: "Too many payment requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const setupRateLimiting = (app: any) => {
  app.use("/api/", generalLimiter);
  app.use("/api/hotels/*/bookings/payment-intent", paymentLimiter);
};

// Parse cookies
export const cookieParserMiddleware = cookieParser();

// CSRF middleware is a no-op: this API uses JWT Bearer tokens stored in
// localStorage, so it is not vulnerable to CSRF attacks. Cookie-based CSRF
// protection would only interfere with normal login/mutation flows.
export const csrfMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

// Stub for the CSRF token endpoint (kept for backwards-compat with bootstrap.ts)
export const getCsrfToken = (_req: Request, res: Response) => {
  res.json({ csrfToken: "" });
};

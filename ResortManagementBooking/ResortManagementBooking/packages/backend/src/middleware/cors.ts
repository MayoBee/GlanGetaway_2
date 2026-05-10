import cors from "cors";
import { Express } from "express";

export const configureCors = (app: Express): void => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGINS,
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5173",
    "http://127.0.0.1:55112",
    "https://mern-booking-hotel.netlify.app",
    "https://mern-booking-hotel.netlify.app/",
    "https://hotel-mern-booking.vercel.app",
    "https://hotel-mern-booking.vercel.app/",
    "https://glan-getaway-tjuzxei5z-mayobees-projects.vercel.app",
    "https://glan-getaway-2-c8sjgvg59-mayobees-projects.vercel.app",
  ].filter((origin): origin is string => Boolean(origin));

  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);

      if (origin.includes("netlify.app") || origin.includes("vercel.app")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV === "development") {
        console.log("CORS blocked origin:", origin);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 204,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
    ],
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  app.use((req, res, next) => {
    res.header("Vary", "Origin");
    next();
  });
};

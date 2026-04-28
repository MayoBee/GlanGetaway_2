import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { WeatherTrigger, WeatherAlert, RebookingToken } from "../models/weather-trigger";
import Booking from "../models/booking";

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    (req as any).userId = (decoded as JwtPayload).userId;
    next();
  } catch {
    return res.status(401).json({ message: "unauthorized" });
  }
};

const router = express.Router();

// OpenWeather API
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

/**
 * POST /api/weather-triggers/configure
 * Configure weather trigger settings for a hotel
 */
router.post("/configure", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId, latitude, longitude, city, apiKey, triggerConditions, rebookingSettings } = req.body;

    if (!hotelId || !latitude || !longitude || !city) {
      return res.status(400).json({ message: "Hotel location data is required" });
    }

    let trigger = await WeatherTrigger.findOne({ hotelId });

    if (trigger) {
      trigger.location = { latitude, longitude, city, country: "Philippines" };
      trigger.apiKey = apiKey || trigger.apiKey;
      if (triggerConditions) trigger.triggerConditions = triggerConditions;
      if (rebookingSettings) trigger.rebookingSettings = { ...trigger.rebookingSettings, ...rebookingSettings };
      trigger.isActive = true;
    } else {
      trigger = new WeatherTrigger({
        hotelId,
        location: { latitude, longitude, city, country: "Philippines" },
        apiKey: apiKey || OPENWEATHER_API_KEY,
        weatherApiProvider: "openweather",
        isActive: true,
        triggerConditions: triggerConditions || {
          minWindSpeed: 10,
          minRainProbability: 70,
          severeWeatherTypes: ["thunderstorm", "heavy_rain", "typhoon"],
        },
        rebookingSettings: rebookingSettings || {
          allowRebooking: true,
          rebookingWindowDays: 7,
          maxRebookingAttempts: 2,
          autoApproveRebooking: true,
          refundPolicy: "full",
        },
      });
    }

    await trigger.save();
    res.json({ message: "Weather trigger configured", trigger });
  } catch (error) {
    console.error("Error configuring weather trigger:", error);
    res.status(500).json({ message: "Failed to configure weather trigger" });
  }
});

/**
 * GET /api/weather-triggers/:hotelId
 * Get weather trigger settings
 */
router.get("/:hotelId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const trigger = await WeatherTrigger.findOne({ hotelId });
    res.json(trigger || { isActive: false });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch weather trigger" });
  }
});

/**
 * GET /api/weather-triggers/:hotelId/check-weather
 * Check weather for upcoming bookings
 */
router.get("/:hotelId/check-weather", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const trigger = await WeatherTrigger.findOne({ hotelId });

    if (!trigger || !trigger.isActive) {
      return res.json({ message: "Weather monitoring not active", alerts: [] });
    }

    // Get bookings for the next 7 days
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);

    const bookings = await Booking.find({
      hotelId,
      checkIn: { $lte: upcomingDate },
      checkOut: { $gte: new Date() },
      status: { $in: ["confirmed", "pending"] },
    });

    const alerts: any[] = [];

    for (const booking of bookings) {
      const checkInDate = new Date(booking.checkIn);
      const weatherData = await fetchWeatherData(
        trigger.location.latitude,
        trigger.location.longitude,
        trigger.apiKey
      );

      if (shouldTriggerAlert(weatherData, trigger.triggerConditions)) {
        const alert = await WeatherAlert.findOne({
          bookingId: booking._id,
          resolved: false,
        });

        if (!alert) {
          const newAlert = new WeatherAlert({
            hotelId,
            bookingId: booking._id.toString(),
            alertType: getAlertType(weatherData),
            severity: getSeverity(weatherData),
            title: `Weather Alert: ${booking.firstName} ${booking.lastName}`,
            description: `Severe weather expected during your stay`,
            weatherData: {
              temperature: weatherData.main?.temp,
              humidity: weatherData.main?.humidity,
              windSpeed: weatherData.wind?.speed,
              rainProbability: weatherData.rain?.["1h"] ? 80 : 0,
              weatherCode: weatherData.weather?.[0]?.id,
              weatherDescription: weatherData.weather?.[0]?.description,
            },
            affectedCheckIn: booking.checkIn,
            affectedCheckOut: booking.checkOut,
            actionTaken: "no_action",
          });

          await newAlert.save();
          alerts.push(newAlert);
        }
      }
    }

    res.json({ message: "Weather check complete", alerts });
  } catch (error) {
    console.error("Error checking weather:", error);
    res.status(500).json({ message: "Failed to check weather" });
  }
});

/**
 * POST /api/weather-triggers/:alertId/send-rebook-link
 * Send rebooking link to guest
 */
router.post("/:alertId/send-rebook-link", verifyToken, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    const alert = await WeatherAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    // Generate unique token
    const token = require("crypto").randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const rebookToken = new RebookingToken({
      bookingId: alert.bookingId,
      hotelId: alert.hotelId,
      guestId: "",
      token,
      expiresAt,
      status: "active",
    });

    await rebookToken.save();

    // Update alert
    alert.actionTaken = "auto_rebook_link_sent";
    alert.rebookLinkSentAt = new Date();
    alert.rebookLinkExpiry = expiresAt;
    await alert.save();

    // In production, send email with link
    const rebookLink = `${process.env.FRONTEND_URL}/rebook/${token}`;

    res.json({
      message: "Rebooking link sent",
      link: rebookLink,
      expiresAt,
    });
  } catch (error) {
    console.error("Error sending rebook link:", error);
    res.status(500).json({ message: "Failed to send rebook link" });
  }
});

/**
 * POST /api/weather-triggers/rebook/:token
 * Use rebooking token to reschedule
 */
router.post("/rebook/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newCheckIn, newCheckOut } = req.body;

    const rebookToken = await RebookingToken.findOne({ token, status: "active" });

    if (!rebookToken) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    if (new Date() > rebookToken.expiresAt) {
      rebookToken.status = "expired";
      await rebookToken.save();
      return res.status(400).json({ message: "Token has expired" });
    }

    // Update booking
    const booking = await Booking.findById(rebookToken.bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.checkIn = newCheckIn;
    booking.checkOut = newCheckOut;
    await booking.save();

    // Mark token as used
    rebookToken.status = "used";
    rebookToken.usedAt = new Date();
    rebookToken.newCheckIn = newCheckIn;
    rebookToken.newCheckOut = newCheckOut;
    await rebookToken.save();

    // Update alert
    await WeatherAlert.findOneAndUpdate(
      { bookingId: booking._id, resolved: false },
      { rebookLinkUsed: true, resolved: true, resolvedAt: new Date() }
    );

    res.json({ message: "Booking rescheduled successfully", booking });
  } catch (error) {
    console.error("Error processing rebook:", error);
    res.status(500).json({ message: "Failed to process rebook" });
  }
});

/**
 * GET /api/weather-triggers/alerts/:hotelId
 * Get all weather alerts for a hotel
 */
router.get("/alerts/:hotelId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { resolved } = req.query;

    const query: any = { hotelId };
    if (resolved !== undefined) query.resolved = resolved === "true";

    const alerts = await WeatherAlert.find(query).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
});

// Helper functions
async function fetchWeatherData(lat: number, lon: number, apiKey: string) {
  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    return await response.json();
  } catch (error) {
    console.error("Weather API error:", error);
    return {};
  }
}

function shouldTriggerAlert(weatherData: any, conditions: any) {
  if (!weatherData.weather) return false;

  const windSpeed = weatherData.wind?.speed || 0;
  const weatherCode = weatherData.weather[0]?.id;

  // Check wind speed
  if (windSpeed >= (conditions.minWindSpeed || 10)) return true;

  // Check weather codes for severe weather
  const severeCodes = [200, 201, 202, 210, 211, 212, 221, 230, 231, 232, 500, 501, 502, 503, 504];
  if (severeCodes.includes(weatherCode)) return true;

  return false;
}

function getAlertType(weatherData: any): "severe_weather" | "typhoon" | "heavy_rain" | "high_winds" | "flood" {
  const weatherCode = weatherData.weather?.[0]?.id || 0;
  const windSpeed = weatherData.wind?.speed || 0;

  if (windSpeed > 15) return "high_winds";
  if (weatherCode >= 200 && weatherCode < 300) return "severe_weather";
  if (weatherCode >= 500 && weatherCode < 600) return "heavy_rain";
  return "severe_weather";
}

function getSeverity(weatherData: any): "watch" | "warning" | "emergency" {
  const windSpeed = weatherData.wind?.speed || 0;
  if (windSpeed > 20) return "emergency";
  if (windSpeed > 15) return "warning";
  return "watch";
}

export default router;

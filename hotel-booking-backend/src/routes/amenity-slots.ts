import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AmenitySlot, AmenityWeatherLock, WATER_ACTIVITY_TYPES } from "../models/amenity-slot";
import Amenity from "../models/amenity";

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

// OpenWeather API for weather-lock
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

/**
 * POST /api/amenity-slots/generate
 * Generate time slots for an amenity
 */
router.post("/generate", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId, amenityId, startDate, endDate } = req.body;

    if (!hotelId || !amenityId || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const amenity = await Amenity.findOne({ _id: amenityId, hotelId });
    if (!amenity) {
      return res.status(404).json({ message: "Amenity not found" });
    }

    // Determine slot duration based on amenity type
    let slotDuration = 60;
    if (amenity.type === "pool" || amenity.type === "beach") slotDuration = 120;
    else if (WATER_ACTIVITY_TYPES.includes(amenity.type)) slotDuration = 30;

    // Generate slots inline
    const slots: any[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const basePrice = amenity.pricing?.hourlyRate || 500;
    const equipmentCount = amenity.equipmentAvailable?.[0]?.quantity || 1;
    const openHour = 8, closeHour = 18;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const slotDate = new Date(d).setHours(0, 0, 0, 0);
      const totalMinutes = (closeHour - openHour) * 60;
      const numSlots = Math.floor(totalMinutes / slotDuration);

      for (let i = 0; i < numSlots; i++) {
        const startMinutes = openHour * 60 + i * slotDuration;
        const startH = Math.floor(startMinutes / 60);
        const startM = startMinutes % 60;
        const endMinutes = startMinutes + slotDuration;
        const endH = Math.floor(endMinutes / 60);
        const endM = endMinutes % 60;

        const hour = startH;
        let multiplier = 1.0;
        if ((hour >= 10 && hour < 14) || (hour >= 16 && hour < 18)) multiplier = 1.25;
        else if (hour >= 8 && hour < 10) multiplier = 1.1;

        slots.push({
          hotelId,
          amenityId,
          amenityName: amenity.name,
          slotDate,
          startTime: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
          endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
          duration: slotDuration,
          totalSlots: equipmentCount,
          availableSlots: equipmentCount,
          bookedSlots: 0,
          basePrice,
          currentPrice: Math.round(basePrice * multiplier * 100) / 100,
          priceMultiplier: multiplier,
          isWeatherLocked: false,
          status: "available",
          bookings: [],
        });
      }
    }

    // Insert all slots
    await AmenitySlot.insertMany(slots);

    res.json({ message: `Generated ${slots.length} slots`, slots });
  } catch (error) {
    console.error("Error generating slots:", error);
    res.status(500).json({ message: "Failed to generate slots" });
  }
});

/**
 * GET /api/amenity-slots/:amenityId
 * Get slots for an amenity
 */
router.get("/:amenityId", async (req: Request, res: Response) => {
  try {
    const { amenityId } = req.params;
    const { date, startDate, endDate } = req.query;

    const query: any = { amenityId };

    if (date) {
      const queryDate = new Date(date as string);
      queryDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(queryDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.slotDate = { $gte: queryDate, $lt: nextDate };
    } else if (startDate && endDate) {
      query.slotDate = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const slots = await AmenitySlot.find(query).sort({ slotDate: 1, startTime: 1 });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch slots" });
  }
});

/**
 * POST /api/amenity-slots/:slotId/book
 * Book a specific slot
 */
router.post("/:slotId/book", verifyToken, async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;
    const { bookingId } = req.body;

    const slot = await AmenitySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (slot.isWeatherLocked) {
      return res.status(400).json({ message: "Slot is locked due to weather conditions" });
    }

    if (slot.availableSlots < 1) {
      return res.status(400).json({ message: "Slot is fully booked" });
    }

    // Update slot
    slot.availableSlots -= 1;
    slot.bookedSlots += 1;
    if (bookingId) slot.bookings.push(bookingId);

    if (slot.availableSlots === 0) {
      slot.status = "full";
    }

    await slot.save();

    res.json({ message: "Slot booked successfully", slot });
  } catch (error) {
    console.error("Error booking slot:", error);
    res.status(500).json({ message: "Failed to book slot" });
  }
});

/**
 * POST /api/amenity-slots/:slotId/release
 * Release a booking
 */
router.post("/:slotId/release", verifyToken, async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;
    const { bookingId } = req.body;

    const slot = await AmenitySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    slot.availableSlots += 1;
    slot.bookedSlots = Math.max(0, slot.bookedSlots - 1);
    slot.status = "available";

    if (bookingId) {
      slot.bookings = slot.bookings.filter((b: any) => b !== bookingId);
    }

    await slot.save();

    res.json({ message: "Slot released", slot });
  } catch (error) {
    res.status(500).json({ message: "Failed to release slot" });
  }
});

/**
 * POST /api/amenity-slots/weather-lock
 * Lock water activities based on weather
 */
router.post("/weather-lock", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId, latitude, longitude, date } = req.body;

    // Fetch weather data
    const weatherResponse = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const weatherData = await weatherResponse.json();

    const lockedAmenities: any[] = [];

    // Check each water activity
    const waterAmenities = await Amenity.find({
      hotelId,
      type: { $in: WATER_ACTIVITY_TYPES },
      isActive: true,
    });

    for (const amenity of waterAmenities) {
      // Check if weather conditions are dangerous
      const dangerousConditions = checkDangerousConditions(weatherData, date);

      if (dangerousConditions.shouldLock) {
        // Check if lock already exists
        const existingLock = await AmenityWeatherLock.findOne({
          hotelId,
          amenityId: amenity._id.toString(),
          lockDate: new Date(date),
          isActive: true,
        });

        if (!existingLock) {
          const lock = new AmenityWeatherLock({
            hotelId,
            amenityId: amenity._id.toString(),
            amenityName: amenity.name,
            lockDate: new Date(date),
            lockType: "automatic",
            reason: dangerousConditions.reason,
            weatherData: {
              windSpeed: dangerousConditions.windSpeed,
              rainProbability: dangerousConditions.rainProbability,
              weatherCode: dangerousConditions.weatherCode,
              description: dangerousConditions.description,
            },
            isActive: true,
          });

          await lock.save();

          // Lock all slots for this amenity on this date
          await AmenitySlot.updateMany(
            { amenityId: amenity._id.toString(), slotDate: new Date(date) },
            { isWeatherLocked: true, weatherLockReason: dangerousConditions.reason, lockedAt: new Date() }
          );

          lockedAmenities.push(amenity.name);
        }
      }
    }

    res.json({
      message: `Locked ${lockedAmenities.length} water activities`,
      lockedAmenities,
    });
  } catch (error) {
    console.error("Error checking weather lock:", error);
    res.status(500).json({ message: "Failed to check weather" });
  }
});

/**
 * POST /api/amenity-slots/:amenityId/manual-lock
 * Manually lock an amenity
 */
router.post("/:amenityId/manual-lock", verifyToken, async (req: Request, res: Response) => {
  try {
    const { amenityId } = req.params;
    const { hotelId, date, reason } = req.body;
    const lockedBy = (req as any).userId;

    const amenity = await Amenity.findOne({ _id: amenityId, hotelId });
    if (!amenity) {
      return res.status(404).json({ message: "Amenity not found" });
    }

    const lock = new AmenityWeatherLock({
      hotelId,
      amenityId,
      amenityName: amenity.name,
      lockDate: new Date(date),
      lockType: "manual",
      reason: reason || "Manual lock",
      lockedBy,
      isActive: true,
    });

    await lock.save();

    // Lock all slots
    await AmenitySlot.updateMany(
      { amenityId, slotDate: new Date(date) },
      { isWeatherLocked: true, weatherLockReason: reason, lockedAt: new Date() }
    );

    res.json({ message: "Amenity manually locked", lock });
  } catch (error) {
    res.status(500).json({ message: "Failed to lock amenity" });
  }
});

/**
 * GET /api/amenity-slocks/:hotelId
 * Get all weather locks for a hotel
 */
router.get("/weather-locks/:hotelId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { active } = req.query;

    const query: any = { hotelId };
    if (active === "true") query.isActive = true;

    const locks = await AmenityWeatherLock.find(query).sort({ lockDate: -1 });
    res.json(locks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch locks" });
  }
});

// Helper function
function checkDangerousConditions(weatherData: any, targetDate: string) {
  const target = new Date(targetDate);
  const forecasts = weatherData.list || [];

  // Find forecast closest to target date
  let closestForecast: any = null;
  let minDiff = Infinity;

  for (const forecast of forecasts) {
    const forecastDate = new Date(forecast.dt * 1000);
    const diff = Math.abs(forecastDate.getTime() - target.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closestForecast = forecast;
    }
  }

  if (!closestForecast) {
    return { shouldLock: false };
  }

  const windSpeed = closestForecast.wind?.speed || 0;
  const weatherCode = closestForecast.weather?.[0]?.id || 0;
  const description = closestForecast.weather?.[0]?.description || "";

  // Dangerous conditions
  const shouldLock = windSpeed > 10 || // > 10 m/s
    weatherCode >= 200 && weatherCode < 300 || // thunderstorm
    weatherCode >= 500 && weatherCode < 600; // rain

  let reason = "";
  if (windSpeed > 10) reason = `High winds: ${windSpeed.toFixed(1)} m/s`;
  else if (weatherCode >= 200) reason = `Thunderstorm: ${description}`;
  else if (weatherCode >= 500) reason = `Heavy rain: ${description}`;

  return {
    shouldLock,
    reason,
    windSpeed,
    rainProbability: closestForecast.pop ? closestForecast.pop * 100 : 0,
    weatherCode,
    description,
  };
}

export default router;

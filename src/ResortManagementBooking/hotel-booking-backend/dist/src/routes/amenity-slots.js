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
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const amenity_slot_1 = require("../models/amenity-slot");
const amenity_1 = __importDefault(require("../models/amenity"));
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    if (!token) {
        return res.status(401).json({ message: "unauthorized" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        req.userId = decoded.userId;
        next();
    }
    catch (_a) {
        return res.status(401).json({ message: "unauthorized" });
    }
};
const router = express_1.default.Router();
// OpenWeather API for weather-lock
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
/**
 * POST /api/amenity-slots/generate
 * Generate time slots for an amenity
 */
router.post("/generate", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { hotelId, amenityId, startDate, endDate } = req.body;
        if (!hotelId || !amenityId || !startDate || !endDate) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const amenity = yield amenity_1.default.findOne({ _id: amenityId, hotelId });
        if (!amenity) {
            return res.status(404).json({ message: "Amenity not found" });
        }
        // Determine slot duration based on amenity type
        let slotDuration = 60;
        if (amenity.type === "pool" || amenity.type === "beach")
            slotDuration = 120;
        else if (amenity_slot_1.WATER_ACTIVITY_TYPES.includes(amenity.type))
            slotDuration = 30;
        // Generate slots inline
        const slots = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const basePrice = ((_a = amenity.pricing) === null || _a === void 0 ? void 0 : _a.hourlyRate) || 500;
        const equipmentCount = ((_c = (_b = amenity.equipmentAvailable) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.quantity) || 1;
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
                if ((hour >= 10 && hour < 14) || (hour >= 16 && hour < 18))
                    multiplier = 1.25;
                else if (hour >= 8 && hour < 10)
                    multiplier = 1.1;
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
        yield amenity_slot_1.AmenitySlot.insertMany(slots);
        res.json({ message: `Generated ${slots.length} slots`, slots });
    }
    catch (error) {
        console.error("Error generating slots:", error);
        res.status(500).json({ message: "Failed to generate slots" });
    }
}));
/**
 * GET /api/amenity-slots/:amenityId
 * Get slots for an amenity
 */
router.get("/:amenityId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amenityId } = req.params;
        const { date, startDate, endDate } = req.query;
        const query = { amenityId };
        if (date) {
            const queryDate = new Date(date);
            queryDate.setHours(0, 0, 0, 0);
            const nextDate = new Date(queryDate);
            nextDate.setDate(nextDate.getDate() + 1);
            query.slotDate = { $gte: queryDate, $lt: nextDate };
        }
        else if (startDate && endDate) {
            query.slotDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        const slots = yield amenity_slot_1.AmenitySlot.find(query).sort({ slotDate: 1, startTime: 1 });
        res.json(slots);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch slots" });
    }
}));
/**
 * POST /api/amenity-slots/:slotId/book
 * Book a specific slot
 */
router.post("/:slotId/book", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { slotId } = req.params;
        const { bookingId } = req.body;
        const slot = yield amenity_slot_1.AmenitySlot.findById(slotId);
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
        if (bookingId)
            slot.bookings.push(bookingId);
        if (slot.availableSlots === 0) {
            slot.status = "full";
        }
        yield slot.save();
        res.json({ message: "Slot booked successfully", slot });
    }
    catch (error) {
        console.error("Error booking slot:", error);
        res.status(500).json({ message: "Failed to book slot" });
    }
}));
/**
 * POST /api/amenity-slots/:slotId/release
 * Release a booking
 */
router.post("/:slotId/release", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { slotId } = req.params;
        const { bookingId } = req.body;
        const slot = yield amenity_slot_1.AmenitySlot.findById(slotId);
        if (!slot) {
            return res.status(404).json({ message: "Slot not found" });
        }
        slot.availableSlots += 1;
        slot.bookedSlots = Math.max(0, slot.bookedSlots - 1);
        slot.status = "available";
        if (bookingId) {
            slot.bookings = slot.bookings.filter((b) => b !== bookingId);
        }
        yield slot.save();
        res.json({ message: "Slot released", slot });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to release slot" });
    }
}));
/**
 * POST /api/amenity-slots/weather-lock
 * Lock water activities based on weather
 */
router.post("/weather-lock", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, latitude, longitude, date } = req.body;
        // Fetch weather data
        const weatherResponse = yield fetch(`${OPENWEATHER_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`);
        const weatherData = yield weatherResponse.json();
        const lockedAmenities = [];
        // Check each water activity
        const waterAmenities = yield amenity_1.default.find({
            hotelId,
            type: { $in: amenity_slot_1.WATER_ACTIVITY_TYPES },
            isActive: true,
        });
        for (const amenity of waterAmenities) {
            // Check if weather conditions are dangerous
            const dangerousConditions = checkDangerousConditions(weatherData, date);
            if (dangerousConditions.shouldLock) {
                // Check if lock already exists
                const existingLock = yield amenity_slot_1.AmenityWeatherLock.findOne({
                    hotelId,
                    amenityId: amenity._id.toString(),
                    lockDate: new Date(date),
                    isActive: true,
                });
                if (!existingLock) {
                    const lock = new amenity_slot_1.AmenityWeatherLock({
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
                    yield lock.save();
                    // Lock all slots for this amenity on this date
                    yield amenity_slot_1.AmenitySlot.updateMany({ amenityId: amenity._id.toString(), slotDate: new Date(date) }, { isWeatherLocked: true, weatherLockReason: dangerousConditions.reason, lockedAt: new Date() });
                    lockedAmenities.push(amenity.name);
                }
            }
        }
        res.json({
            message: `Locked ${lockedAmenities.length} water activities`,
            lockedAmenities,
        });
    }
    catch (error) {
        console.error("Error checking weather lock:", error);
        res.status(500).json({ message: "Failed to check weather" });
    }
}));
/**
 * POST /api/amenity-slots/:amenityId/manual-lock
 * Manually lock an amenity
 */
router.post("/:amenityId/manual-lock", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amenityId } = req.params;
        const { hotelId, date, reason } = req.body;
        const lockedBy = req.userId;
        const amenity = yield amenity_1.default.findOne({ _id: amenityId, hotelId });
        if (!amenity) {
            return res.status(404).json({ message: "Amenity not found" });
        }
        const lock = new amenity_slot_1.AmenityWeatherLock({
            hotelId,
            amenityId,
            amenityName: amenity.name,
            lockDate: new Date(date),
            lockType: "manual",
            reason: reason || "Manual lock",
            lockedBy,
            isActive: true,
        });
        yield lock.save();
        // Lock all slots
        yield amenity_slot_1.AmenitySlot.updateMany({ amenityId, slotDate: new Date(date) }, { isWeatherLocked: true, weatherLockReason: reason, lockedAt: new Date() });
        res.json({ message: "Amenity manually locked", lock });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to lock amenity" });
    }
}));
/**
 * GET /api/amenity-slocks/:hotelId
 * Get all weather locks for a hotel
 */
router.get("/weather-locks/:hotelId", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.params;
        const { active } = req.query;
        const query = { hotelId };
        if (active === "true")
            query.isActive = true;
        const locks = yield amenity_slot_1.AmenityWeatherLock.find(query).sort({ lockDate: -1 });
        res.json(locks);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch locks" });
    }
}));
// Helper function
function checkDangerousConditions(weatherData, targetDate) {
    var _a, _b, _c, _d, _e;
    const target = new Date(targetDate);
    const forecasts = weatherData.list || [];
    // Find forecast closest to target date
    let closestForecast = null;
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
    const windSpeed = ((_a = closestForecast.wind) === null || _a === void 0 ? void 0 : _a.speed) || 0;
    const weatherCode = ((_c = (_b = closestForecast.weather) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id) || 0;
    const description = ((_e = (_d = closestForecast.weather) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.description) || "";
    // Dangerous conditions
    const shouldLock = windSpeed > 10 || // > 10 m/s
        weatherCode >= 200 && weatherCode < 300 || // thunderstorm
        weatherCode >= 500 && weatherCode < 600; // rain
    let reason = "";
    if (windSpeed > 10)
        reason = `High winds: ${windSpeed.toFixed(1)} m/s`;
    else if (weatherCode >= 200)
        reason = `Thunderstorm: ${description}`;
    else if (weatherCode >= 500)
        reason = `Heavy rain: ${description}`;
    return {
        shouldLock,
        reason,
        windSpeed,
        rainProbability: closestForecast.pop ? closestForecast.pop * 100 : 0,
        weatherCode,
        description,
    };
}
exports.default = router;

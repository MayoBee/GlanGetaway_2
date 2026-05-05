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
const weather_trigger_1 = require("../models/weather-trigger");
const booking_1 = __importDefault(require("../models/booking"));
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
// OpenWeather API
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
/**
 * POST /api/weather-triggers/configure
 * Configure weather trigger settings for a hotel
 */
router.post("/configure", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId, latitude, longitude, city, apiKey, triggerConditions, rebookingSettings } = req.body;
        if (!hotelId || !latitude || !longitude || !city) {
            return res.status(400).json({ message: "Hotel location data is required" });
        }
        let trigger = yield weather_trigger_1.WeatherTrigger.findOne({ hotelId });
        if (trigger) {
            trigger.location = { latitude, longitude, city, country: "Philippines" };
            trigger.apiKey = apiKey || trigger.apiKey;
            if (triggerConditions)
                trigger.triggerConditions = triggerConditions;
            if (rebookingSettings)
                trigger.rebookingSettings = Object.assign(Object.assign({}, trigger.rebookingSettings), rebookingSettings);
            trigger.isActive = true;
        }
        else {
            trigger = new weather_trigger_1.WeatherTrigger({
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
        yield trigger.save();
        res.json({ message: "Weather trigger configured", trigger });
    }
    catch (error) {
        console.error("Error configuring weather trigger:", error);
        res.status(500).json({ message: "Failed to configure weather trigger" });
    }
}));
/**
 * GET /api/weather-triggers/:hotelId
 * Get weather trigger settings
 */
router.get("/:hotelId", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.params;
        const trigger = yield weather_trigger_1.WeatherTrigger.findOne({ hotelId });
        res.json(trigger || { isActive: false });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch weather trigger" });
    }
}));
/**
 * GET /api/weather-triggers/:hotelId/check-weather
 * Check weather for upcoming bookings
 */
router.get("/:hotelId/check-weather", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const { hotelId } = req.params;
        const trigger = yield weather_trigger_1.WeatherTrigger.findOne({ hotelId });
        if (!trigger || !trigger.isActive) {
            return res.json({ message: "Weather monitoring not active", alerts: [] });
        }
        // Get bookings for the next 7 days
        const upcomingDate = new Date();
        upcomingDate.setDate(upcomingDate.getDate() + 7);
        const bookings = yield booking_1.default.find({
            hotelId,
            checkIn: { $lte: upcomingDate },
            checkOut: { $gte: new Date() },
            status: { $in: ["confirmed", "pending"] },
        });
        const alerts = [];
        for (const booking of bookings) {
            const checkInDate = new Date(booking.checkIn);
            const weatherData = yield fetchWeatherData(trigger.location.latitude, trigger.location.longitude, trigger.apiKey);
            if (shouldTriggerAlert(weatherData, trigger.triggerConditions)) {
                const alert = yield weather_trigger_1.WeatherAlert.findOne({
                    bookingId: booking._id,
                    resolved: false,
                });
                if (!alert) {
                    const newAlert = new weather_trigger_1.WeatherAlert({
                        hotelId,
                        bookingId: booking._id.toString(),
                        alertType: getAlertType(weatherData),
                        severity: getSeverity(weatherData),
                        title: `Weather Alert: ${booking.firstName} ${booking.lastName}`,
                        description: `Severe weather expected during your stay`,
                        weatherData: {
                            temperature: (_a = weatherData.main) === null || _a === void 0 ? void 0 : _a.temp,
                            humidity: (_b = weatherData.main) === null || _b === void 0 ? void 0 : _b.humidity,
                            windSpeed: (_c = weatherData.wind) === null || _c === void 0 ? void 0 : _c.speed,
                            rainProbability: ((_d = weatherData.rain) === null || _d === void 0 ? void 0 : _d["1h"]) ? 80 : 0,
                            weatherCode: (_f = (_e = weatherData.weather) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id,
                            weatherDescription: (_h = (_g = weatherData.weather) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.description,
                        },
                        affectedCheckIn: booking.checkIn,
                        affectedCheckOut: booking.checkOut,
                        actionTaken: "no_action",
                    });
                    yield newAlert.save();
                    alerts.push(newAlert);
                }
            }
        }
        res.json({ message: "Weather check complete", alerts });
    }
    catch (error) {
        console.error("Error checking weather:", error);
        res.status(500).json({ message: "Failed to check weather" });
    }
}));
/**
 * POST /api/weather-triggers/:alertId/send-rebook-link
 * Send rebooking link to guest
 */
router.post("/:alertId/send-rebook-link", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { alertId } = req.params;
        const alert = yield weather_trigger_1.WeatherAlert.findById(alertId);
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }
        // Generate unique token
        const token = require("crypto").randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const rebookToken = new weather_trigger_1.RebookingToken({
            bookingId: alert.bookingId,
            hotelId: alert.hotelId,
            guestId: "",
            token,
            expiresAt,
            status: "active",
        });
        yield rebookToken.save();
        // Update alert
        alert.actionTaken = "auto_rebook_link_sent";
        alert.rebookLinkSentAt = new Date();
        alert.rebookLinkExpiry = expiresAt;
        yield alert.save();
        // In production, send email with link
        const rebookLink = `${process.env.FRONTEND_URL}/rebook/${token}`;
        res.json({
            message: "Rebooking link sent",
            link: rebookLink,
            expiresAt,
        });
    }
    catch (error) {
        console.error("Error sending rebook link:", error);
        res.status(500).json({ message: "Failed to send rebook link" });
    }
}));
/**
 * POST /api/weather-triggers/rebook/:token
 * Use rebooking token to reschedule
 */
router.post("/rebook/:token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        const { newCheckIn, newCheckOut } = req.body;
        const rebookToken = yield weather_trigger_1.RebookingToken.findOne({ token, status: "active" });
        if (!rebookToken) {
            return res.status(404).json({ message: "Invalid or expired token" });
        }
        if (new Date() > rebookToken.expiresAt) {
            rebookToken.status = "expired";
            yield rebookToken.save();
            return res.status(400).json({ message: "Token has expired" });
        }
        // Update booking
        const booking = yield booking_1.default.findById(rebookToken.bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        booking.checkIn = newCheckIn;
        booking.checkOut = newCheckOut;
        yield booking.save();
        // Mark token as used
        rebookToken.status = "used";
        rebookToken.usedAt = new Date();
        rebookToken.newCheckIn = newCheckIn;
        rebookToken.newCheckOut = newCheckOut;
        yield rebookToken.save();
        // Update alert
        yield weather_trigger_1.WeatherAlert.findOneAndUpdate({ bookingId: booking._id, resolved: false }, { rebookLinkUsed: true, resolved: true, resolvedAt: new Date() });
        res.json({ message: "Booking rescheduled successfully", booking });
    }
    catch (error) {
        console.error("Error processing rebook:", error);
        res.status(500).json({ message: "Failed to process rebook" });
    }
}));
/**
 * GET /api/weather-triggers/alerts/:hotelId
 * Get all weather alerts for a hotel
 */
router.get("/alerts/:hotelId", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.params;
        const { resolved } = req.query;
        const query = { hotelId };
        if (resolved !== undefined)
            query.resolved = resolved === "true";
        const alerts = yield weather_trigger_1.WeatherAlert.find(query).sort({ createdAt: -1 });
        res.json(alerts);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch alerts" });
    }
}));
// Helper functions
function fetchWeatherData(lat, lon, apiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
            return yield response.json();
        }
        catch (error) {
            console.error("Weather API error:", error);
            return {};
        }
    });
}
function shouldTriggerAlert(weatherData, conditions) {
    var _a, _b;
    if (!weatherData.weather)
        return false;
    const windSpeed = ((_a = weatherData.wind) === null || _a === void 0 ? void 0 : _a.speed) || 0;
    const weatherCode = (_b = weatherData.weather[0]) === null || _b === void 0 ? void 0 : _b.id;
    // Check wind speed
    if (windSpeed >= (conditions.minWindSpeed || 10))
        return true;
    // Check weather codes for severe weather
    const severeCodes = [200, 201, 202, 210, 211, 212, 221, 230, 231, 232, 500, 501, 502, 503, 504];
    if (severeCodes.includes(weatherCode))
        return true;
    return false;
}
function getAlertType(weatherData) {
    var _a, _b, _c;
    const weatherCode = ((_b = (_a = weatherData.weather) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id) || 0;
    const windSpeed = ((_c = weatherData.wind) === null || _c === void 0 ? void 0 : _c.speed) || 0;
    if (windSpeed > 15)
        return "high_winds";
    if (weatherCode >= 200 && weatherCode < 300)
        return "severe_weather";
    if (weatherCode >= 500 && weatherCode < 600)
        return "heavy_rain";
    return "severe_weather";
}
function getSeverity(weatherData) {
    var _a;
    const windSpeed = ((_a = weatherData.wind) === null || _a === void 0 ? void 0 : _a.speed) || 0;
    if (windSpeed > 20)
        return "emergency";
    if (windSpeed > 15)
        return "warning";
    return "watch";
}
exports.default = router;

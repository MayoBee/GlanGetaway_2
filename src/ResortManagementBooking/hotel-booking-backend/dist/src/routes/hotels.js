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
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const hotel_1 = __importDefault(require("../models/hotel"));
const booking_1 = __importDefault(require("../models/booking"));
const user_1 = __importDefault(require("../models/user"));
const express_validator_1 = require("express-validator");
const stripe_1 = __importDefault(require("stripe"));
const auth_1 = __importDefault(require("../middleware/auth"));
const availabilityService_1 = require("../services/availabilityService");
const stripe = new stripe_1.default(process.env.STRIPE_API_KEY);
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'gcash-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
const router = express_1.default.Router();
// Helper function to determine if payment should remain pending based on business rules
function shouldPaymentRemainPending(paymentMethod, isPwdBooking, isSeniorCitizenBooking) {
    // Rule 1: GCash payments remain pending
    if (paymentMethod.toLowerCase() === "gcash") {
        return true;
    }
    // Rule 2: PWD bookings remain pending
    if (isPwdBooking) {
        return true;
    }
    // Rule 3: Senior Citizen bookings remain pending
    if (isSeniorCitizenBooking) {
        return true;
    }
    // Otherwise, payment can be processed immediately
    return false;
}
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = constructSearchQuery(req.query);
        console.log("🔍 Search query:", JSON.stringify(query, null, 2));
        let sortOptions = {};
        switch (req.query.sortOption) {
            case "starRating":
                sortOptions = { starRating: -1 };
                break;
            case "pricePerNightAsc":
                sortOptions = { nightRate: 1 };
                break;
            case "pricePerNightDesc":
                sortOptions = { nightRate: -1 };
                break;
        }
        const pageSize = 5;
        const pageNumber = parseInt(req.query.page ? req.query.page.toString() : "1");
        const skip = (pageNumber - 1) * pageSize;
        const hotels = yield hotel_1.default.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(pageSize);
        const total = yield hotel_1.default.countDocuments(query);
        const response = {
            data: hotels,
            pagination: {
                total,
                page: pageNumber,
                pages: Math.ceil(total / pageSize),
            },
        };
        res.json(response);
    }
    catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find({ isApproved: { $ne: false } }).sort("-lastUpdated");
        res.json(hotels);
    }
    catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "Error fetching hotels" });
    }
}));
router.get("/:id", [(0, express_validator_1.param)("id").notEmpty().withMessage("Hotel ID is required")], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const id = req.params.id.toString();
    try {
        console.log("=== FETCH HOTEL BY ID DEBUG ===");
        console.log("Hotel ID requested:", id);
        // First, fetch without field selection to see all available fields
        const fullHotel = yield hotel_1.default.findById(id);
        console.log("Full hotel data (all fields):", fullHotel);
        console.log("Full hotel gcashNumber:", fullHotel === null || fullHotel === void 0 ? void 0 : fullHotel.gcashNumber);
        const hotel = yield hotel_1.default.findById(id).select('nightRate dayRate hasNightRate hasDayRate name rooms cottages packages adultEntranceFee childEntranceFee starRating adultCount childCount facilities contact policies imageUrls type city country description amenities gcashNumber downPaymentPercentage');
        console.log("Hotel data found (with selection):", hotel);
        console.log("Hotel gcashNumber specifically:", hotel === null || hotel === void 0 ? void 0 : hotel.gcashNumber);
        console.log("Hotel has gcashNumber field:", 'gcashNumber' in hotel);
        console.log("Cottages data:", hotel === null || hotel === void 0 ? void 0 : hotel.cottages);
        if (hotel === null || hotel === void 0 ? void 0 : hotel.cottages) {
            hotel.cottages.forEach((cottage, index) => {
                console.log(`Cottage ${index} from DB:`, {
                    id: cottage.id,
                    name: cottage.name,
                    hasDayRate: cottage.hasDayRate,
                    hasNightRate: cottage.hasNightRate,
                    dayRate: cottage.dayRate,
                    nightRate: cottage.nightRate
                });
            });
        }
        res.json(hotel);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching hotel" });
    }
}));
router.get("/:hotelId/availability", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.params;
        const { checkIn, checkOut, roomIds, cottageIds } = req.query;
        if (!checkIn || !checkOut) {
            return res.status(400).json({ message: "checkIn and checkOut are required" });
        }
        const roomIdsArray = roomIds ? (typeof roomIds === 'string' ? roomIds.split(',') : roomIds) : [];
        const cottageIdsArray = cottageIds ? (typeof cottageIds === 'string' ? cottageIds.split(',') : cottageIds) : [];
        const availability = yield (0, availabilityService_1.checkAvailability)(hotelId, new Date(checkIn), new Date(checkOut), roomIdsArray, cottageIdsArray);
        res.json({
            available: availability.available,
            conflicts: availability.conflicts
        });
    }
    catch (error) {
        console.error("Availability check error:", error);
        res.status(500).json({ message: "Error checking availability" });
    }
}));
router.post("/:hotelId/bookings/payment-intent", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { numberOfNights, downPaymentAmount } = req.body;
    const hotelId = req.params.hotelId;
    try {
        // Check if Stripe is configured
        if (!process.env.STRIPE_API_KEY) {
            console.error("Stripe API key not configured");
            return res.status(500).json({ message: "Payment system not properly configured" });
        }
        // Use lean() for faster query - only fetch needed fields including rooms
        const hotel = yield hotel_1.default.findById(hotelId).select('nightRate dayRate hasNightRate name rooms cottages adultEntranceFee childEntranceFee starRating adultCount childCount facilities contact policies imageUrls type city country description amenities').lean();
        if (!hotel) {
            return res.status(400).json({ message: "Hotel not found" });
        }
        // Use downPaymentAmount from frontend instead of calculating totalCost
        const paymentAmount = downPaymentAmount || (hotel.hasNightRate ? hotel.nightRate : hotel.dayRate);
        const paymentIntent = yield stripe.paymentIntents.create({
            amount: Math.round(paymentAmount * 100),
            currency: "php",
            metadata: {
                hotelId,
                userId: req.userId,
                numberOfNights: (numberOfNights === null || numberOfNights === void 0 ? void 0 : numberOfNights.toString()) || "1",
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });
        if (!paymentIntent.client_secret) {
            return res.status(500).json({ message: "Error creating payment intent" });
        }
        const response = {
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret.toString(),
            totalCost: paymentAmount,
        };
        res.send(response);
    }
    catch (error) {
        console.error("Payment intent creation error:", error);
        res.status(500).json({
            message: error.message || "Failed to create payment intent"
        });
    }
}));
router.post("/:hotelId/bookings", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.params;
        const userId = req.userId;
        console.log("Booking request received:", req.body);
        console.log("User ID:", userId);
        console.log("Hotel ID:", hotelId);
        // Validate required fields
        const { firstName, lastName, email, phone, adultCount, childCount, checkIn, checkOut, checkInTime, checkOutTime, totalCost, basePrice, selectedRooms, selectedCottages, selectedAmenities, paymentMethod, specialRequests, isPwdBooking, isSeniorCitizenBooking, discountInfo } = req.body;
        // Verify hotel exists
        const hotel = yield hotel_1.default.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        // Extract IDs
        const roomIds = selectedRooms.map((room) => room.id);
        const cottageIds = selectedCottages.map((cottage) => cottage.id);
        // Check availability
        const availability = yield (0, availabilityService_1.checkAvailability)(hotelId, new Date(checkIn), new Date(checkOut), roomIds, cottageIds);
        if (!availability.available) {
            return res.status(409).json({ message: "Some rooms or cottages are not available for the selected dates", conflicts: availability.conflicts });
        }
        // Create the booking
        const booking = new booking_1.default({
            userId,
            hotelId,
            firstName,
            lastName,
            email,
            phone: phone || "",
            adultCount: adultCount || 1,
            childCount: childCount || 0,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            checkInTime: checkInTime || "12:00",
            checkOutTime: checkOutTime || "11:00",
            totalCost: totalCost || basePrice || 0,
            basePrice: basePrice || totalCost || 0,
            selectedRooms: selectedRooms || [],
            selectedCottages: selectedCottages || [],
            selectedAmenities: selectedAmenities || [],
            paymentMethod: paymentMethod || "card",
            specialRequests: specialRequests || "",
            status: "pending",
            // PWD/Senior Citizen tracking from frontend
            isPwdBooking: isPwdBooking || false,
            isSeniorCitizenBooking: isSeniorCitizenBooking || false,
            discountApplied: discountInfo,
            // Apply business rules for payment status
            paymentStatus: shouldPaymentRemainPending(paymentMethod, isPwdBooking || false, isSeniorCitizenBooking || false) ? "pending" : "paid",
            // Set 8-hour change window
            changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
            canModify: true
        });
        yield booking.save();
        // Update hotel booking count
        yield hotel_1.default.findByIdAndUpdate(hotelId, {
            $inc: { totalBookings: 1 }
        });
        // Update user booking count
        yield user_1.default.findByIdAndUpdate(userId, {
            $inc: { totalBookings: 1 }
        });
        console.log("Booking created successfully:", booking._id);
        res.status(201).json({
            message: "Booking created successfully",
            bookingId: booking._id,
            booking
        });
    }
    catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({
            message: "Booking failed",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}));
// GCash Booking Endpoint
router.post("/:hotelId/bookings/gcash", auth_1.default, upload.single('gcashPayment.screenshotFile'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.params;
        const userId = req.userId;
        console.log("GCash Booking request received:", req.body);
        console.log("User ID:", userId);
        console.log("Hotel ID:", hotelId);
        console.log("File uploaded:", req.file ? req.file.filename : "No file");
        // Validate required fields
        const { firstName, lastName, email, phone, adultCount, childCount, checkIn, checkOut, checkInTime, checkOutTime, totalCost, basePrice, selectedRooms, selectedCottages, selectedAmenities, specialRequests } = req.body;
        // Get GCash payment fields (multer flattens nested form data)
        const gcashNumber = req.body['gcashPayment.gcashNumber'];
        const referenceNumber = req.body['gcashPayment.referenceNumber'];
        const amountPaid = req.body['gcashPayment.amountPaid'];
        const gcashStatus = req.body['gcashPayment.status'];
        const paymentTime = req.body['gcashPayment.paymentTime'];
        // Verify hotel exists
        const hotel = yield hotel_1.default.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        // Extract IDs from parsed arrays
        const parsedRooms = selectedRooms ? JSON.parse(selectedRooms) : [];
        const parsedCottages = selectedCottages ? JSON.parse(selectedCottages) : [];
        const roomIds = parsedRooms.map((room) => room.id);
        const cottageIds = parsedCottages.map((cottage) => cottage.id);
        // Check availability
        const availability = yield (0, availabilityService_1.checkAvailability)(hotelId, new Date(checkIn), new Date(checkOut), roomIds, cottageIds);
        if (!availability.available) {
            return res.status(409).json({ message: "Some rooms or cottages are not available for the selected dates", conflicts: availability.conflicts });
        }
        // Create GCash payment details
        const gcashPaymentDetails = {
            gcashNumber: gcashNumber || '',
            referenceNumber: referenceNumber || '',
            amountPaid: parseFloat(amountPaid) || 0,
            paymentTime: new Date(),
            status: gcashStatus || 'pending',
            screenshotFile: req.file ? `/uploads/${req.file.filename}` : undefined
        };
        // Create the booking with GCash payment
        const booking = new booking_1.default({
            userId,
            hotelId,
            firstName,
            lastName,
            email,
            phone: phone || "",
            adultCount: parseInt(adultCount) || 1,
            childCount: parseInt(childCount) || 0,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            checkInTime: checkInTime || "12:00",
            checkOutTime: checkOutTime || "11:00",
            totalCost: parseFloat(totalCost) || parseFloat(basePrice) || 0,
            basePrice: parseFloat(basePrice) || parseFloat(totalCost) || 0,
            selectedRooms: selectedRooms ? JSON.parse(selectedRooms) : [],
            selectedCottages: selectedCottages ? JSON.parse(selectedCottages) : [],
            selectedAmenities: selectedAmenities ? JSON.parse(selectedAmenities) : [],
            paymentMethod: "gcash",
            specialRequests: specialRequests || "",
            status: "pending",
            // Handle discount information from form
            isPwdBooking: req.body.pwdGuests > 0,
            isSeniorCitizenBooking: req.body.seniorCitizens > 0,
            discountApplied: (req.body.seniorCitizens > 0 || req.body.pwdGuests > 0) ? {
                type: req.body.seniorCitizens > 0 ? "senior_citizen" : "pwd",
                percentage: 20,
                amount: (parseFloat(totalCost) || parseFloat(basePrice) || 0) * 0.2
            } : undefined,
            // GCash payments always remain pending per business rules
            paymentStatus: "pending",
            // Set 8-hour change window
            changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
            canModify: true,
            // Store GCash payment details
            gcashPayment: gcashPaymentDetails
        });
        yield booking.save();
        // Update hotel booking count
        yield hotel_1.default.findByIdAndUpdate(hotelId, {
            $inc: { totalBookings: 1 }
        });
        // Update user booking count
        yield user_1.default.findByIdAndUpdate(userId, {
            $inc: { totalBookings: 1 }
        });
        console.log("GCash Booking created successfully:", booking._id);
        res.status(201).json({
            message: "GCash booking created successfully. Payment is pending verification.",
            bookingId: booking._id,
            booking
        });
    }
    catch (error) {
        console.error("GCash Booking error:", error);
        res.status(500).json({
            message: "GCash booking failed",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}));
const constructSearchQuery = (queryParams) => {
    let constructedQuery = {};
    // Show all resorts that are not explicitly rejected (isApproved !== false)
    // This includes resorts with isApproved: true, undefined, or null
    constructedQuery.isApproved = { $ne: false };
    // If no destination is provided, don't add destination filter
    // This will return all approved resorts
    if (queryParams.destination && queryParams.destination.trim() !== "") {
        const destination = queryParams.destination.trim();
        constructedQuery.$or = [
            { name: { $regex: destination, $options: "i" } },
            { city: { $regex: destination, $options: "i" } },
            { country: { $regex: destination, $options: "i" } },
            { type: { $regex: destination, $options: "i" } },
        ];
    }
    if (queryParams.facilities) {
        constructedQuery.facilities = {
            $all: Array.isArray(queryParams.facilities)
                ? queryParams.facilities
                : [queryParams.facilities],
        };
    }
    if (queryParams.types) {
        constructedQuery.type = {
            $in: Array.isArray(queryParams.types)
                ? queryParams.types
                : [queryParams.types],
        };
    }
    if (queryParams.stars) {
        const starRatings = Array.isArray(queryParams.stars)
            ? queryParams.stars.map((star) => parseInt(star))
            : parseInt(queryParams.stars);
        constructedQuery.starRating = { $in: starRatings };
    }
    if (queryParams.maxPrice) {
        constructedQuery.nightRate = {
            $lte: parseInt(queryParams.maxPrice).toString(),
        };
    }
    return constructedQuery;
};
exports.default = router;

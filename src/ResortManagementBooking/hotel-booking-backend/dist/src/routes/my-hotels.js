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
const imageService_1 = __importDefault(require("../services/imageService"));
const hotel_1 = __importDefault(require("../models/hotel"));
const booking_1 = __importDefault(require("../models/booking"));
const auth_1 = __importDefault(require("../middleware/auth"));
const express_validator_1 = require("express-validator");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
    return !!(process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== "your-cloudinary-cloud-name" &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_KEY !== "your-cloudinary-api-key" &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_API_SECRET !== "your-cloudinary-api-secret");
};
// Local storage configuration for fallback
const localUploadDir = path_1.default.join(__dirname, "..", "..", "uploads");
// Ensure upload directory exists
if (!fs_1.default.existsSync(localUploadDir)) {
    fs_1.default.mkdirSync(localUploadDir, { recursive: true });
}
const localStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, localUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${crypto_1.default.randomUUID()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const localUpload = (0, multer_1.default)({
    storage: localStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});
router.post("/", auth_1.default, [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("city").notEmpty().withMessage("City is required"),
    (0, express_validator_1.body)("country").notEmpty().withMessage("Country is required"),
    (0, express_validator_1.body)("description").notEmpty().withMessage("Description is required"),
    (0, express_validator_1.body)("type")
        .notEmpty()
        .isArray({ min: 1 })
        .withMessage("Select at least one hotel type"),
    (0, express_validator_1.body)("dayRate")
        .optional()
        .isNumeric()
        .withMessage("Day rate must be a number"),
    (0, express_validator_1.body)("nightRate")
        .optional()
        .isNumeric()
        .withMessage("Night rate must be a number"),
    (0, express_validator_1.body)("hasDayRate")
        .optional()
        .isBoolean()
        .withMessage("Has day rate must be a boolean"),
    (0, express_validator_1.body)("hasNightRate")
        .optional()
        .isBoolean()
        .withMessage("Has night rate must be a boolean"),
    (0, express_validator_1.body)("starRating")
        .notEmpty()
        .isNumeric()
        .withMessage("Star rating is required and must be a number"),
    (0, express_validator_1.body)("facilities")
        .notEmpty()
        .isArray()
        .withMessage("Facilities are required"),
    (0, express_validator_1.body)("gcashNumber")
        .optional()
        .matches(/^09\d{9}$/)
        .withMessage("GCash number must be 11 digits starting with 09 (e.g., 09XXXXXXXXX)"),
    (0, express_validator_1.body)("downPaymentPercentage")
        .optional()
        .isInt({ min: 10, max: 100 })
        .withMessage("Down payment percentage must be between 10 and 100"),
], upload.array("imageFiles", 6), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("=== POST /api/my-hotels called ===");
    console.log("Request body:", req.body);
    console.log("Files:", req.files);
    console.log("gcashNumber received:", req.body.gcashNumber);
    console.log("downPaymentPercentage received:", req.body.downPaymentPercentage);
    try {
        const imageFiles = req.files;
        console.log("Image files count:", imageFiles === null || imageFiles === void 0 ? void 0 : imageFiles.length);
        const newHotel = req.body;
        console.log("newHotel before parse:", newHotel);
        // Ensure type is always an array
        if (typeof newHotel.type === "string") {
            newHotel.type = [newHotel.type];
        }
        // Parse JSON string fields that might come from frontend
        const jsonFields = ['adultEntranceFee', 'childEntranceFee', 'rooms', 'cottages', 'amenities', 'packages'];
        for (const field of jsonFields) {
            if (newHotel[field] && typeof newHotel[field] === 'string') {
                try {
                    newHotel[field] = JSON.parse(newHotel[field]);
                }
                catch (parseError) {
                    console.log(`Failed to parse ${field} as JSON, keeping as is:`, newHotel[field]);
                }
            }
        }
        // Fix empty string values in parsed arrays (required fields)
        if (Array.isArray(newHotel.cottages)) {
            newHotel.cottages = newHotel.cottages.map((c) => (Object.assign(Object.assign({}, c), { type: c.type || 'Standard' })));
        }
        if (Array.isArray(newHotel.rooms)) {
            newHotel.rooms = newHotel.rooms.map((r) => (Object.assign(Object.assign({}, r), { type: r.type || 'Standard' })));
        }
        // Clear problematic array fields that might be serialized as strings
        // These will be properly parsed below (or use already parsed JSON)
        if (!newHotel.rooms || !Array.isArray(newHotel.rooms))
            delete newHotel.rooms;
        if (!newHotel.cottages || !Array.isArray(newHotel.cottages))
            delete newHotel.cottages;
        if (!newHotel.amenities || !Array.isArray(newHotel.amenities))
            delete newHotel.amenities;
        if (!newHotel.packages || !Array.isArray(newHotel.packages))
            delete newHotel.packages;
        // Handle nested objects from FormData
        newHotel.contact = {
            phone: req.body["contact.phone"] || "",
            email: req.body["contact.email"] || "",
            website: req.body["contact.website"] || "",
            facebook: req.body["contact.facebook"] || "",
            instagram: req.body["contact.instagram"] || "",
            tiktok: req.body["contact.tiktok"] || "",
        };
        newHotel.policies = {
            checkInTime: req.body["policies.checkInTime"] || "",
            checkOutTime: req.body["policies.checkOutTime"] || "",
            dayCheckInTime: req.body["policies.dayCheckInTime"] || "",
            dayCheckOutTime: req.body["policies.dayCheckOutTime"] || "",
            nightCheckInTime: req.body["policies.nightCheckInTime"] || "",
            nightCheckOutTime: req.body["policies.nightCheckOutTime"] || "",
            resortPolicies: [],
        };
        // Parse resort policies from FormData
        const resortPolicies = [];
        let policyIndex = 0;
        // Try multiple key formats
        while (req.body[`policies.resortPolicies[${policyIndex}][id]`] ||
            req.body[`policies.resortPolicies.${policyIndex}.id`] ||
            req.body[`resortPolicies[${policyIndex}][id]`]) {
            const policyId = req.body[`policies.resortPolicies[${policyIndex}][id]`] ||
                req.body[`policies.resortPolicies.${policyIndex}.id`] ||
                req.body[`resortPolicies[${policyIndex}][id]`];
            if (!policyId)
                break;
            resortPolicies.push({
                id: policyId,
                title: req.body[`policies.resortPolicies[${policyIndex}][title]`] ||
                    req.body[`policies.resortPolicies.${policyIndex}.title`] ||
                    req.body[`resortPolicies[${policyIndex}][title]`] || "",
                description: req.body[`policies.resortPolicies[${policyIndex}][description]`] ||
                    req.body[`policies.resortPolicies.${policyIndex}.description`] ||
                    req.body[`resortPolicies[${policyIndex}][description]`] || "",
                isConfirmed: req.body[`policies.resortPolicies[${policyIndex}][isConfirmed]`] === "true" ||
                    req.body[`policies.resortPolicies[${policyIndex}][isConfirmed]`] === true ||
                    req.body[`policies.resortPolicies.${policyIndex}.isConfirmed`] === "true" ||
                    req.body[`policies.resortPolicies.${policyIndex}.isConfirmed`] === true,
            });
            policyIndex++;
        }
        // Try JSON parsing as fallback
        if (resortPolicies.length === 0) {
            const policiesJson = req.body["policies.resortPolicies"];
            if (policiesJson) {
                try {
                    const parsed = JSON.parse(policiesJson);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log("Found resortPolicies as JSON string in POST:", parsed);
                        newHotel.policies.resortPolicies = parsed;
                    }
                }
                catch (e) {
                    console.log("Failed to parse policies.resortPolicies JSON in POST:", e);
                }
            }
        }
        else if (resortPolicies.length > 0) {
            newHotel.policies.resortPolicies = resortPolicies;
        }
        // Parse amenities from FormData
        const amenities = [];
        let amenityIndex = 0;
        while (req.body[`amenities[${amenityIndex}][id]`]) {
            amenities.push({
                id: req.body[`amenities[${amenityIndex}][id]`],
                name: req.body[`amenities[${amenityIndex}][name]`],
                price: parseFloat(req.body[`amenities[${amenityIndex}][price]`]) || 0,
                description: req.body[`amenities[${amenityIndex}][description]`] || "",
            });
            amenityIndex++;
        }
        if (amenities.length > 0) {
            newHotel.amenities = amenities;
        }
        // Handle discounts from FormData
        newHotel.discounts = {
            seniorCitizenEnabled: req.body["discounts.seniorCitizenEnabled"] === "true" || req.body["discounts.seniorCitizenEnabled"] === true,
            seniorCitizenPercentage: parseFloat(req.body["discounts.seniorCitizenPercentage"]) || 20,
            pwdEnabled: req.body["discounts.pwdEnabled"] === "true" || req.body["discounts.pwdEnabled"] === true,
            pwdPercentage: parseFloat(req.body["discounts.pwdPercentage"]) || 20,
            customDiscounts: []
        };
        // Parse custom discounts from FormData
        const customDiscounts = [];
        let discountIndex = 0;
        while (req.body[`discounts.customDiscounts[${discountIndex}][id]`]) {
            const maxUsesVal = req.body[`discounts.customDiscounts[${discountIndex}][maxUses]`];
            const validUntilVal = req.body[`discounts.customDiscounts[${discountIndex}][validUntil]`];
            customDiscounts.push({
                id: req.body[`discounts.customDiscounts[${discountIndex}][id]`],
                name: req.body[`discounts.customDiscounts[${discountIndex}][name]`],
                percentage: parseFloat(req.body[`discounts.customDiscounts[${discountIndex}][percentage]`]) || 0,
                promoCode: req.body[`discounts.customDiscounts[${discountIndex}][promoCode]`],
                isEnabled: req.body[`discounts.customDiscounts[${discountIndex}][isEnabled]`] === "true" || req.body[`discounts.customDiscounts[${discountIndex}][isEnabled]`] === true,
                maxUses: maxUsesVal ? parseInt(maxUsesVal) : undefined,
                validUntil: validUntilVal || undefined,
            });
            discountIndex++;
        }
        if (customDiscounts.length > 0) {
            newHotel.discounts.customDiscounts = customDiscounts;
        }
        // Parse packages from FormData
        const packages = [];
        let createPackageIndex = 0;
        while (req.body[`packages[${createPackageIndex}][id]`]) {
            const includedCottages = [];
            const includedRooms = [];
            const includedAmenities = [];
            // Parse included cottages
            let packageCottageIndex = 0;
            while (req.body[`packages[${createPackageIndex}][includedCottages][${packageCottageIndex}]`]) {
                includedCottages.push(req.body[`packages[${createPackageIndex}][includedCottages][${packageCottageIndex}]`]);
                packageCottageIndex++;
            }
            // Parse included rooms
            let packageRoomIndex = 0;
            while (req.body[`packages[${createPackageIndex}][includedRooms][${packageRoomIndex}]`]) {
                includedRooms.push(req.body[`packages[${createPackageIndex}][includedRooms][${packageRoomIndex}]`]);
                packageRoomIndex++;
            }
            // Parse included amenities
            let amenityIndex = 0;
            while (req.body[`packages[${createPackageIndex}][includedAmenities][${amenityIndex}]`]) {
                includedAmenities.push(req.body[`packages[${createPackageIndex}][includedAmenities][${amenityIndex}]`]);
                amenityIndex++;
            }
            packages.push({
                id: req.body[`packages[${createPackageIndex}][id]`],
                name: req.body[`packages[${createPackageIndex}][name]`],
                description: req.body[`packages[${createPackageIndex}][description]`],
                price: parseFloat(req.body[`packages[${createPackageIndex}][price]`]) || 0,
                includedCottages,
                includedRooms,
                includedAmenities,
            });
            createPackageIndex++;
        }
        if (packages.length > 0) {
            newHotel.packages = packages;
        }
        // Parse rooms from FormData
        const rooms = [];
        let createRoomIndex = 0;
        while (req.body[`rooms[${createRoomIndex}][id]`]) {
            const roomAmenities = [];
            let roomAmenityIndex = 0;
            while (req.body[`rooms[${createRoomIndex}][amenities][${roomAmenityIndex}]`]) {
                roomAmenities.push(req.body[`rooms[${createRoomIndex}][amenities][${roomAmenityIndex}]`]);
                roomAmenityIndex++;
            }
            rooms.push({
                id: req.body[`rooms[${createRoomIndex}][id]`],
                name: req.body[`rooms[${createRoomIndex}][name]`],
                type: req.body[`rooms[${createRoomIndex}][type]`],
                pricePerNight: parseFloat(req.body[`rooms[${createRoomIndex}][pricePerNight]`]) || 0,
                minOccupancy: parseInt(req.body[`rooms[${createRoomIndex}][minOccupancy]`]) || 1,
                maxOccupancy: parseInt(req.body[`rooms[${createRoomIndex}][maxOccupancy]`]) || 1,
                description: req.body[`rooms[${createRoomIndex}][description]`] || "",
                amenities: roomAmenities,
            });
            createRoomIndex++;
        }
        if (rooms.length > 0) {
            newHotel.rooms = rooms;
        }
        // Parse cottages from FormData
        const cottages = [];
        let createCottageIndex = 0;
        while (req.body[`cottages[${createCottageIndex}][id]`]) {
            const cottageAmenities = [];
            let cottageAmenityIndex = 0;
            while (req.body[`cottages[${createCottageIndex}][amenities][${cottageAmenityIndex}]`]) {
                cottageAmenities.push(req.body[`cottages[${createCottageIndex}][amenities][${cottageAmenityIndex}]`]);
                cottageAmenityIndex++;
            }
            cottages.push({
                id: req.body[`cottages[${createCottageIndex}][id]`],
                name: req.body[`cottages[${createCottageIndex}][name]`],
                type: req.body[`cottages[${createCottageIndex}][type]`],
                pricePerNight: parseFloat(req.body[`cottages[${createCottageIndex}][pricePerNight]`]) || 0,
                dayRate: parseFloat(req.body[`cottages[${createCottageIndex}][dayRate]`]) || 0,
                nightRate: parseFloat(req.body[`cottages[${createCottageIndex}][nightRate]`]) || 0,
                hasDayRate: req.body[`cottages[${createCottageIndex}][hasDayRate]`] === "true" || req.body[`cottages[${createCottageIndex}][hasDayRate]`] === true,
                hasNightRate: req.body[`cottages[${createCottageIndex}][hasNightRate]`] === "true" || req.body[`cottages[${createCottageIndex}][hasNightRate]`] === true,
                minOccupancy: parseInt(req.body[`cottages[${createCottageIndex}][minOccupancy]`]) || 1,
                maxOccupancy: parseInt(req.body[`cottages[${createCottageIndex}][maxOccupancy]`]) || 1,
                description: req.body[`cottages[${createCottageIndex}][description]`] || "",
                amenities: cottageAmenities,
            });
            createCottageIndex++;
        }
        if (cottages.length > 0) {
            newHotel.cottages = cottages;
        }
        // Handle image uploads only if files are provided
        let imageUrls = [];
        if (imageFiles && imageFiles.length > 0) {
            try {
                imageUrls = yield imageService_1.default.saveImages(imageFiles);
            }
            catch (uploadError) {
                console.error("Image upload failed:", uploadError);
                // Continue without images if upload fails
                imageUrls = [];
            }
        }
        newHotel.imageUrls = imageUrls;
        newHotel.lastUpdated = new Date();
        newHotel.userId = req.userId;
        // Set the new pricing fields
        newHotel.dayRate = Number(req.body.dayRate) || 0;
        newHotel.nightRate = Number(req.body.nightRate) || 0;
        newHotel.hasDayRate = req.body.hasDayRate === "true" || req.body.hasDayRate === true;
        newHotel.hasNightRate = req.body.hasNightRate === "true" || req.body.hasNightRate === true;
        // Parse entrance fees - use already parsed JSON or fallback to FormData
        if (!newHotel.adultEntranceFee || typeof newHotel.adultEntranceFee !== 'object') {
            newHotel.adultEntranceFee = {
                dayRate: Number(req.body["adultEntranceFee.dayRate"]) || 0,
                nightRate: Number(req.body["adultEntranceFee.nightRate"]) || 0,
                pricingModel: req.body["adultEntranceFee.pricingModel"] || "per_head",
                groupQuantity: Number(req.body["adultEntranceFee.groupQuantity"]) || 1,
            };
        }
        // Parse child entrance fees - use already parsed JSON or fallback to FormData
        if (!newHotel.childEntranceFee || !Array.isArray(newHotel.childEntranceFee)) {
            const childEntranceFees = [];
            let childFeeIndex = 0;
            while (req.body[`childEntranceFee[${childFeeIndex}][id]`]) {
                childEntranceFees.push({
                    id: req.body[`childEntranceFee[${childFeeIndex}][id]`],
                    minAge: Number(req.body[`childEntranceFee[${childFeeIndex}][minAge]`]) || 0,
                    maxAge: Number(req.body[`childEntranceFee[${childFeeIndex}][maxAge]`]) || 0,
                    dayRate: Number(req.body[`childEntranceFee[${childFeeIndex}][dayRate]`]) || 0,
                    nightRate: Number(req.body[`childEntranceFee[${childFeeIndex}][nightRate]`]) || 0,
                    pricingModel: req.body[`childEntranceFee[${childFeeIndex}][pricingModel]`] || "per_head",
                    groupQuantity: req.body[`childEntranceFee[${childFeeIndex}][groupQuantity]`] ? Number(req.body[`childEntranceFee[${childFeeIndex}][groupQuantity]`]) : undefined,
                    isConfirmed: req.body[`childEntranceFee[${childFeeIndex}][isConfirmed]`] === "true" || req.body[`childEntranceFee[${childFeeIndex}][isConfirmed]`] === true,
                });
                childFeeIndex++;
            }
            if (childEntranceFees.length > 0) {
                newHotel.childEntranceFee = childEntranceFees;
            }
        }
        // Set approval status - resorts need admin approval
        newHotel.isApproved = false;
        // Handle payment fields
        newHotel.gcashNumber = req.body.gcashNumber || "";
        newHotel.downPaymentPercentage = Number(req.body.downPaymentPercentage) || 50;
        console.log("gcashNumber set to:", newHotel.gcashNumber);
        console.log("downPaymentPercentage set to:", newHotel.downPaymentPercentage);
        const hotel = new hotel_1.default(newHotel);
        yield hotel.save();
        console.log("Saved hotel gcashNumber:", hotel.gcashNumber);
        console.log("Saved hotel downPaymentPercentage:", hotel.downPaymentPercentage);
        res.status(201).json(Object.assign(Object.assign({}, hotel.toObject()), { message: "Resort submitted for approval. It will be visible to users once approved by an administrator." }));
    }
    catch (error) {
        console.error("Error creating hotel:", error);
        // Handle validation errors
        if (error.errors && Array.isArray(error.errors)) {
            const validationErrors = error.errors.map((err) => ({
                field: err.path,
                message: err.msg,
            }));
            return res.status(400).json({
                message: "Validation failed",
                errors: validationErrors
            });
        }
        // Handle other errors
        res.status(500).json({
            message: "Something went wrong",
            error: error.message || "Unknown error"
        });
    }
}));
router.get("/", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find({ userId: req.userId });
        res.json(hotels);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching hotels" });
    }
}));
router.get("/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id.toString();
    try {
        const hotel = yield hotel_1.default.findOne({
            _id: id,
            userId: req.userId,
        });
        res.json(hotel);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching hotels" });
    }
}));
// New JSON-based update endpoint for better data handling
router.put("/:hotelId/json", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        console.log("=== PUT /api/my-hotels/:hotelId/json called ===");
        console.log("Request body:", req.body);
        console.log("Hotel ID:", req.params.hotelId);
        console.log("User ID:", req.userId);
        // Debug cottages specifically
        if (req.body.cottages) {
            console.log("Cottages being saved:", req.body.cottages);
            req.body.cottages.forEach((cottage, index) => {
                console.log(`Cottage ${index} being saved:`, {
                    id: cottage.id,
                    name: cottage.name,
                    hasDayRate: cottage.hasDayRate,
                    hasNightRate: cottage.hasNightRate,
                    dayRate: cottage.dayRate,
                    nightRate: cottage.nightRate
                });
            });
        }
        // First, find the existing hotel
        const existingHotel = yield hotel_1.default.findOne({
            _id: req.params.hotelId,
            userId: req.userId,
        });
        if (!existingHotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        // Prepare update data with all fields including rooms, cottages, and packages
        const updateData = Object.assign(Object.assign({}, req.body), { lastUpdated: new Date() });
        // Remove fields that don't exist in HotelType
        delete updateData.adultCount;
        delete updateData.childCount;
        // Ensure imageUrls is always present and valid
        if (!updateData.imageUrls || !Array.isArray(updateData.imageUrls) || updateData.imageUrls.length === 0) {
            // Keep existing image URLs if none provided
            updateData.imageUrls = existingHotel.imageUrls || [];
        }
        // Explicitly handle array fields to ensure they remain as arrays
        // These fields are sent as proper object arrays from frontend and should not be stringified
        const arrayFields = ['rooms', 'cottages', 'packages', 'amenities', 'childEntranceFee'];
        console.log("Processing arrayFields:", arrayFields);
        for (const field of arrayFields) {
            if (updateData[field]) {
                // If it's a string, try to parse it as JSON
                if (typeof updateData[field] === 'string') {
                    try {
                        updateData[field] = JSON.parse(updateData[field]);
                        console.log(`Parsed ${field} from string to array:`, updateData[field]);
                    }
                    catch (parseError) {
                        console.log(`Failed to parse ${field} as JSON, keeping as is:`, updateData[field]);
                    }
                }
                // Now ensure all nested objects have proper types
                if (Array.isArray(updateData[field])) {
                    updateData[field] = updateData[field].map((item) => {
                        const processedItem = Object.assign({}, item);
                        // For rooms: convert pricePerNight, minOccupancy, maxOccupancy to numbers
                        if (field === 'rooms') {
                            if (processedItem.pricePerNight !== undefined) {
                                processedItem.pricePerNight = Number(processedItem.pricePerNight) || 0;
                            }
                            if (processedItem.minOccupancy !== undefined) {
                                processedItem.minOccupancy = Number(processedItem.minOccupancy) || 1;
                            }
                            if (processedItem.maxOccupancy !== undefined) {
                                processedItem.maxOccupancy = Number(processedItem.maxOccupancy) || 1;
                            }
                        }
                        // For cottages: convert pricePerNight, dayRate, nightRate, minOccupancy, maxOccupancy to numbers
                        if (field === 'cottages') {
                            if (processedItem.pricePerNight !== undefined) {
                                processedItem.pricePerNight = Number(processedItem.pricePerNight) || 0;
                            }
                            if (processedItem.dayRate !== undefined) {
                                processedItem.dayRate = Number(processedItem.dayRate) || 0;
                            }
                            if (processedItem.nightRate !== undefined) {
                                processedItem.nightRate = Number(processedItem.nightRate) || 0;
                            }
                            if (processedItem.minOccupancy !== undefined) {
                                processedItem.minOccupancy = Number(processedItem.minOccupancy) || 1;
                            }
                            if (processedItem.maxOccupancy !== undefined) {
                                processedItem.maxOccupancy = Number(processedItem.maxOccupancy) || 1;
                            }
                            if (processedItem.hasDayRate !== undefined) {
                                processedItem.hasDayRate = processedItem.hasDayRate === true || processedItem.hasDayRate === 'true';
                            }
                            if (processedItem.hasNightRate !== undefined) {
                                processedItem.hasNightRate = processedItem.hasNightRate === true || processedItem.hasNightRate === 'true';
                            }
                        }
                        // For packages: convert price to number and handle boolean fields
                        if (field === 'packages') {
                            if (processedItem.price !== undefined) {
                                processedItem.price = Number(processedItem.price) || 0;
                            }
                            if (processedItem.includedAdultEntranceFee !== undefined) {
                                processedItem.includedAdultEntranceFee = processedItem.includedAdultEntranceFee === true || processedItem.includedAdultEntranceFee === 'true';
                            }
                            if (processedItem.includedChildEntranceFee !== undefined) {
                                processedItem.includedChildEntranceFee = processedItem.includedChildEntranceFee === true || processedItem.includedChildEntranceFee === 'true';
                            }
                        }
                        // For amenities: convert price to number
                        if (field === 'amenities') {
                            if (processedItem.price !== undefined) {
                                processedItem.price = Number(processedItem.price) || 0;
                            }
                        }
                        // For childEntranceFee: convert numbers and handle boolean fields
                        if (field === 'childEntranceFee') {
                            if (processedItem.minAge !== undefined) {
                                processedItem.minAge = Number(processedItem.minAge) || 0;
                            }
                            if (processedItem.maxAge !== undefined) {
                                processedItem.maxAge = Number(processedItem.maxAge) || 0;
                            }
                            if (processedItem.dayRate !== undefined) {
                                processedItem.dayRate = Number(processedItem.dayRate) || 0;
                            }
                            if (processedItem.nightRate !== undefined) {
                                processedItem.nightRate = Number(processedItem.nightRate) || 0;
                            }
                            if (processedItem.groupQuantity !== undefined) {
                                processedItem.groupQuantity = Number(processedItem.groupQuantity) || 1;
                            }
                            if (processedItem.isConfirmed !== undefined) {
                                processedItem.isConfirmed = processedItem.isConfirmed === true || processedItem.isConfirmed === 'true';
                            }
                        }
                        return processedItem;
                    });
                }
            }
        }
        // Handle policies specially - it might come as a stringified JSON object
        if (updateData.policies) {
            console.log("Processing policies field:", typeof updateData.policies);
            if (typeof updateData.policies === 'string') {
                try {
                    updateData.policies = JSON.parse(updateData.policies);
                    console.log("Parsed policies from string:", updateData.policies);
                }
                catch (e) {
                    console.log("Failed to parse policies:", e);
                    updateData.policies = {};
                }
            }
            // Now process resortPolicies if it exists
            if (updateData.policies && updateData.policies.resortPolicies) {
                if (typeof updateData.policies.resortPolicies === 'string') {
                    try {
                        updateData.policies.resortPolicies = JSON.parse(updateData.policies.resortPolicies);
                        console.log("Parsed resortPolicies from string:", updateData.policies.resortPolicies);
                    }
                    catch (e) {
                        console.log("Failed to parse resortPolicies:", e);
                        updateData.policies.resortPolicies = [];
                    }
                }
                if (!Array.isArray(updateData.policies.resortPolicies)) {
                    updateData.policies.resortPolicies = [];
                }
                console.log("Final resortPolicies:", updateData.policies.resortPolicies);
            }
        }
        // Parse stringified JSON fields that might come from frontend
        const stringifiedFields = ['facilities', 'type', 'imageUrls', 'childEntranceFee'];
        for (const field of stringifiedFields) {
            if (updateData[field] && typeof updateData[field] === 'string') {
                try {
                    updateData[field] = JSON.parse(updateData[field]);
                }
                catch (parseError) {
                    console.log(`Failed to parse ${field} as JSON, keeping as is:`, updateData[field]);
                }
            }
        }
        // Log policies after processing
        console.log("=== POLICIES AFTER ARRAY PROCESSING ===");
        console.log("updateData.policies:", updateData.policies);
        console.log("updateData.policies.resortPolicies:", (_a = updateData.policies) === null || _a === void 0 ? void 0 : _a.resortPolicies);
        // Convert string numbers to actual numbers
        if (updateData.dayRate !== undefined)
            updateData.dayRate = Number(updateData.dayRate);
        if (updateData.nightRate !== undefined)
            updateData.nightRate = Number(updateData.nightRate);
        if (updateData.starRating !== undefined)
            updateData.starRating = Number(updateData.starRating);
        // Convert boolean strings to actual booleans
        if (updateData.hasDayRate !== undefined)
            updateData.hasDayRate = updateData.hasDayRate === "true" || updateData.hasDayRate === true;
        if (updateData.hasNightRate !== undefined)
            updateData.hasNightRate = updateData.hasNightRate === "true" || updateData.hasNightRate === true;
        // Validate required fields
        const requiredFields = ['name', 'city', 'country', 'description', 'type', 'starRating', 'facilities'];
        for (const field of requiredFields) {
            if (!updateData[field]) {
                return res.status(400).json({ message: `${field} is required` });
            }
        }
        // Ensure type is always an array
        if (typeof updateData.type === "string") {
            updateData.type = [updateData.type];
        }
        console.log("Final update data:", updateData);
        // Use findById + save instead of findByIdAndUpdate to properly handle embedded arrays
        const hotel = yield hotel_1.default.findById(req.params.hotelId);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        // Deep clone and sanitize the update data to ensure nested arrays are proper objects
        const sanitizedData = JSON.parse(JSON.stringify(updateData));
        console.log("=== FINAL UPDATE DATA DEBUG ===");
        console.log("sanitizedData.policies:", JSON.stringify(sanitizedData.policies, null, 2));
        console.log("sanitizedData.policies.resortPolicies:", (_b = sanitizedData.policies) === null || _b === void 0 ? void 0 : _b.resortPolicies);
        // Update the hotel using set to properly handle nested arrays
        hotel.set(Object.assign(Object.assign({}, sanitizedData), { 
            // Ensure these are actual arrays of objects - explicitly re-assign
            rooms: Array.isArray(sanitizedData.rooms) ? [...sanitizedData.rooms] : [], cottages: Array.isArray(sanitizedData.cottages) ? [...sanitizedData.cottages] : [], amenities: Array.isArray(sanitizedData.amenities) ? [...sanitizedData.amenities] : [], packages: Array.isArray(sanitizedData.packages) ? [...sanitizedData.packages] : [], 
            // Also explicitly handle policies to ensure resortPolicies are saved
            policies: Object.assign(Object.assign({}, sanitizedData.policies), { resortPolicies: Array.isArray((_c = sanitizedData.policies) === null || _c === void 0 ? void 0 : _c.resortPolicies)
                    ? [...sanitizedData.policies.resortPolicies]
                    : [] }), 
            // Explicitly include gcashNumber and downPaymentPercentage
            gcashNumber: sanitizedData.gcashNumber, downPaymentPercentage: sanitizedData.downPaymentPercentage }));
        const updatedHotel = yield hotel.save();
        console.log("=== HOTEL SAVE DEBUG ===");
        console.log("Saved policies.resortPolicies:", (_d = updatedHotel.policies) === null || _d === void 0 ? void 0 : _d.resortPolicies);
        console.log("Hotel updated successfully with rooms:", ((_e = updatedHotel.rooms) === null || _e === void 0 ? void 0 : _e.length) || 0);
        console.log("Hotel updated successfully with cottages:", ((_f = updatedHotel.cottages) === null || _f === void 0 ? void 0 : _f.length) || 0);
        console.log("Hotel updated successfully with packages:", ((_g = updatedHotel.packages) === null || _g === void 0 ? void 0 : _g.length) || 0);
        console.log("Saved gcashNumber:", updatedHotel.gcashNumber);
        console.log("Saved downPaymentPercentage:", updatedHotel.downPaymentPercentage);
        res.status(200).json(updatedHotel);
    }
    catch (error) {
        console.error("Error updating hotel:", error);
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => ({
                field: err.path,
                message: err.message,
            }));
            return res.status(400).json({
                message: "Validation failed",
                errors: validationErrors
            });
        }
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
}));
// Fixed TypeScript types for rooms and cottages parsing
router.put("/:hotelId", auth_1.default, upload.array("imageFiles"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        console.log("=== PUT /api/my-hotels/:hotelId called ===");
        console.log("Request body keys:", Object.keys(req.body));
        console.log("Request body sample:", req.body);
        console.log("=== BACKEND UPDATE DEBUG ===");
        console.log("Request body:", req.body);
        console.log("Hotel ID:", req.params.hotelId);
        console.log("User ID:", req.userId);
        console.log("Files:", req.files);
        console.log("Files length:", (_h = req.files) === null || _h === void 0 ? void 0 : _h.length);
        console.log("gcashNumber received in FormData PUT:", req.body.gcashNumber);
        console.log("downPaymentPercentage received in FormData PUT:", req.body.downPaymentPercentage);
        // Debug rooms data
        console.log("=== ROOMS DEBUG ===");
        let debugRoomIndex = 0;
        while (req.body[`rooms[${debugRoomIndex}][id]`]) {
            console.log(`Room ${debugRoomIndex}:`, {
                id: req.body[`rooms[${debugRoomIndex}][id]`],
                name: req.body[`rooms[${debugRoomIndex}][name]`],
                pricePerNight: req.body[`rooms[${debugRoomIndex}][pricePerNight]`]
            });
            debugRoomIndex++;
        }
        console.log(`Total rooms found: ${debugRoomIndex}`);
        // Debug cottages data
        console.log("=== COTTAGES DEBUG ===");
        let debugCottageIndex = 0;
        while (req.body[`cottages[${debugCottageIndex}][id]`]) {
            console.log(`Cottage ${debugCottageIndex}:`, {
                id: req.body[`cottages[${debugCottageIndex}][id]`],
                name: req.body[`cottages[${debugCottageIndex}][name]`],
                dayRate: req.body[`cottages[${debugCottageIndex}][dayRate]`],
                nightRate: req.body[`cottages[${debugCottageIndex}][nightRate]`]
            });
            debugCottageIndex++;
        }
        console.log(`Total cottages found: ${debugCottageIndex}`);
        // Debug packages data
        console.log("=== PACKAGES DEBUG ===");
        let debugPackageIndex = 0;
        while (req.body[`packages[${debugPackageIndex}][id]`]) {
            console.log(`Package ${debugPackageIndex}:`, {
                id: req.body[`packages[${debugPackageIndex}][id]`],
                name: req.body[`packages[${debugPackageIndex}][name]`],
                price: req.body[`packages[${debugPackageIndex}][price]`]
            });
            debugPackageIndex++;
        }
        console.log(`Total packages found: ${debugPackageIndex}`);
        // First, find the existing hotel
        const existingHotel = yield hotel_1.default.findOne({
            _id: req.params.hotelId,
            userId: req.userId,
        });
        if (!existingHotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        // Prepare update data
        const updateData = {
            name: req.body.name,
            city: req.body.city,
            country: req.body.country,
            description: req.body.description,
            type: Array.isArray(req.body.type) ? req.body.type : [req.body.type],
            dayRate: Number(req.body.dayRate) || 0,
            nightRate: Number(req.body.nightRate) || 0,
            hasDayRate: req.body.hasDayRate === "true" || req.body.hasDayRate === true,
            hasNightRate: req.body.hasNightRate === "true" || req.body.hasNightRate === true,
            starRating: Number(req.body.starRating),
            facilities: Array.isArray(req.body.facilities)
                ? req.body.facilities
                : [req.body.facilities],
            lastUpdated: new Date(),
        };
        // Handle contact information
        updateData.contact = {
            phone: req.body["contact.phone"] || "",
            email: req.body["contact.email"] || "",
            website: req.body["contact.website"] || "",
            facebook: req.body["contact.facebook"] || "",
            instagram: req.body["contact.instagram"] || "",
            tiktok: req.body["contact.tiktok"] || "",
        };
        // Handle policies - log what we receive
        console.log("=== POLICIES PARSING START ===");
        console.log("req.body policies.checkInTime:", req.body["policies.checkInTime"]);
        console.log("req.body policies.dayCheckInTime:", req.body["policies.dayCheckInTime"]);
        console.log("req.body policies.resortPolicies (raw):", req.body["policies.resortPolicies"]);
        updateData.policies = {
            checkInTime: req.body["policies.checkInTime"] || "",
            checkOutTime: req.body["policies.checkOutTime"] || "",
            dayCheckInTime: req.body["policies.dayCheckInTime"] || "",
            dayCheckOutTime: req.body["policies.dayCheckOutTime"] || "",
            nightCheckInTime: req.body["policies.nightCheckInTime"] || "",
            nightCheckOutTime: req.body["policies.nightCheckOutTime"] || "",
            resortPolicies: [],
        };
        // Parse resort policies from FormData
        const resortPolicies = [];
        let policyIndex = 0;
        console.log("=== RESORT POLICIES DEBUG ===");
        console.log("All req.body keys containing 'policies':", Object.keys(req.body).filter(k => k.includes('policies')));
        console.log("Checking for resort policies in FormData...");
        // First, let's try to find any keys that might contain resort policy data
        const allKeys = Object.keys(req.body);
        const policyKeys = allKeys.filter(k => k.includes('resortPolicies'));
        console.log("Keys containing 'resortPolicies':", policyKeys);
        // Also try to find keys that start with just '[' - for array format
        const arrayFormatKeys = allKeys.filter(k => k.startsWith('[') || k.match(/^\d+\./));
        console.log("Keys in array format:", arrayFormatKeys);
        // Try multiple key formats that might be used
        while (req.body[`policies.resortPolicies[${policyIndex}][id]`] ||
            req.body[`policies.resortPolicies.${policyIndex}.id`] ||
            req.body[`resortPolicies[${policyIndex}][id]`] ||
            req.body[`resortPolicies.${policyIndex}.id`]) {
            const policyId = req.body[`policies.resortPolicies[${policyIndex}][id]`] ||
                req.body[`policies.resortPolicies.${policyIndex}.id`] ||
                req.body[`resortPolicies[${policyIndex}][id]`];
            if (!policyId)
                break;
            const policy = {
                id: policyId,
                title: req.body[`policies.resortPolicies[${policyIndex}][title]`] ||
                    req.body[`policies.resortPolicies.${policyIndex}.title`] ||
                    req.body[`resortPolicies[${policyIndex}][title]`] || "",
                description: req.body[`policies.resortPolicies[${policyIndex}][description]`] ||
                    req.body[`policies.resortPolicies.${policyIndex}.description`] ||
                    req.body[`resortPolicies[${policyIndex}][description]`] || "",
                isConfirmed: req.body[`policies.resortPolicies[${policyIndex}][isConfirmed]`] === "true" ||
                    req.body[`policies.resortPolicies[${policyIndex}][isConfirmed]`] === true ||
                    req.body[`policies.resortPolicies.${policyIndex}.isConfirmed`] === "true" ||
                    req.body[`policies.resortPolicies.${policyIndex}.isConfirmed`] === true,
            };
            console.log(`Found policy ${policyIndex}:`, policy);
            resortPolicies.push(policy);
            policyIndex++;
        }
        console.log(`Total resort policies found: ${resortPolicies.length}`);
        if (resortPolicies.length > 0) {
            updateData.policies.resortPolicies = resortPolicies;
            console.log("Resort policies added to updateData:", updateData.policies.resortPolicies);
        }
        else {
            console.log("No resort policies found in FormData - will try JSON parsing");
            // Try parsing resortPolicies from a JSON string field as fallback
            const policiesJson = req.body["policies.resortPolicies"];
            console.log("Found policies.resortPolicies in body:", policiesJson);
            if (policiesJson) {
                try {
                    const parsed = typeof policiesJson === 'string' ? JSON.parse(policiesJson) : policiesJson;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log("Found resortPolicies as JSON string:", parsed);
                        updateData.policies.resortPolicies = parsed;
                        console.log("Resort policies added to updateData from JSON string:", updateData.policies.resortPolicies);
                    }
                    else {
                        console.log("Parsed policies is not an array or is empty:", parsed);
                    }
                }
                catch (e) {
                    console.log("Failed to parse policies.resortPolicies JSON:", e);
                }
            }
            else {
                console.log("No policies.resortPolicies field found in req.body");
                // Log all keys to help debug
                console.log("All req.body keys:", Object.keys(req.body));
            }
        }
        // Parse amenities from FormData
        const amenities = [];
        let amenityIndex = 0;
        while (req.body[`amenities[${amenityIndex}][id]`]) {
            amenities.push({
                id: req.body[`amenities[${amenityIndex}][id]`],
                name: req.body[`amenities[${amenityIndex}][name]`],
                price: parseFloat(req.body[`amenities[${amenityIndex}][price]`]) || 0,
                description: req.body[`amenities[${amenityIndex}][description]`] || "",
            });
            amenityIndex++;
        }
        if (amenities.length > 0) {
            updateData.amenities = amenities;
        }
        // Handle discounts from FormData
        updateData.discounts = {
            seniorCitizenEnabled: req.body["discounts.seniorCitizenEnabled"] === "true" || req.body["discounts.seniorCitizenEnabled"] === true,
            seniorCitizenPercentage: parseFloat(req.body["discounts.seniorCitizenPercentage"]) || 20,
            pwdEnabled: req.body["discounts.pwdEnabled"] === "true" || req.body["discounts.pwdEnabled"] === true,
            pwdPercentage: parseFloat(req.body["discounts.pwdPercentage"]) || 20,
            customDiscounts: []
        };
        // Parse custom discounts from FormData
        const customDiscounts = [];
        let discountIndex = 0;
        while (req.body[`discounts.customDiscounts[${discountIndex}][id]`]) {
            const maxUsesVal = req.body[`discounts.customDiscounts[${discountIndex}][maxUses]`];
            const validUntilVal = req.body[`discounts.customDiscounts[${discountIndex}][validUntil]`];
            customDiscounts.push({
                id: req.body[`discounts.customDiscounts[${discountIndex}][id]`],
                name: req.body[`discounts.customDiscounts[${discountIndex}][name]`],
                percentage: parseFloat(req.body[`discounts.customDiscounts[${discountIndex}][percentage]`]) || 0,
                promoCode: req.body[`discounts.customDiscounts[${discountIndex}][promoCode]`],
                isEnabled: req.body[`discounts.customDiscounts[${discountIndex}][isEnabled]`] === "true" || req.body[`discounts.customDiscounts[${discountIndex}][isEnabled]`] === true,
                maxUses: maxUsesVal ? parseInt(maxUsesVal) : undefined,
                validUntil: validUntilVal || undefined,
            });
            discountIndex++;
        }
        if (customDiscounts.length > 0) {
            updateData.discounts.customDiscounts = customDiscounts;
        }
        // Parse packages from FormData
        const packages = [];
        let createPackageIndex = 0;
        while (req.body[`packages[${createPackageIndex}][id]`]) {
            const includedCottages = [];
            const includedRooms = [];
            const includedAmenities = [];
            // Parse included cottages
            let packageCottageIndex = 0;
            while (req.body[`packages[${createPackageIndex}][includedCottages][${packageCottageIndex}]`]) {
                includedCottages.push(req.body[`packages[${createPackageIndex}][includedCottages][${packageCottageIndex}]`]);
                packageCottageIndex++;
            }
            // Parse included rooms
            let packageRoomIndex = 0;
            while (req.body[`packages[${createPackageIndex}][includedRooms][${packageRoomIndex}]`]) {
                includedRooms.push(req.body[`packages[${createPackageIndex}][includedRooms][${packageRoomIndex}]`]);
                packageRoomIndex++;
            }
            // Parse included amenities
            let amenityIndex = 0;
            while (req.body[`packages[${createPackageIndex}][includedAmenities][${amenityIndex}]`]) {
                includedAmenities.push(req.body[`packages[${createPackageIndex}][includedAmenities][${amenityIndex}]`]);
                amenityIndex++;
            }
            packages.push({
                id: req.body[`packages[${createPackageIndex}][id]`],
                name: req.body[`packages[${createPackageIndex}][name]`],
                description: req.body[`packages[${createPackageIndex}][description]`],
                price: parseFloat(req.body[`packages[${createPackageIndex}][price]`]) || 0,
                includedCottages,
                includedRooms,
                includedAmenities,
            });
            createPackageIndex++;
        }
        if (packages.length > 0) {
            updateData.packages = packages;
        }
        // Parse rooms from FormData
        const rooms = [];
        let createRoomIndex = 0;
        while (req.body[`rooms[${createRoomIndex}][id]`]) {
            const roomAmenities = [];
            let roomAmenityIndex = 0;
            while (req.body[`rooms[${createRoomIndex}][amenities][${roomAmenityIndex}]`]) {
                roomAmenities.push(req.body[`rooms[${createRoomIndex}][amenities][${roomAmenityIndex}]`]);
                roomAmenityIndex++;
            }
            rooms.push({
                id: req.body[`rooms[${createRoomIndex}][id]`],
                name: req.body[`rooms[${createRoomIndex}][name]`],
                type: req.body[`rooms[${createRoomIndex}][type]`],
                pricePerNight: parseFloat(req.body[`rooms[${createRoomIndex}][pricePerNight]`]) || 0,
                minOccupancy: parseInt(req.body[`rooms[${createRoomIndex}][minOccupancy]`]) || 1,
                maxOccupancy: parseInt(req.body[`rooms[${createRoomIndex}][maxOccupancy]`]) || 1,
                description: req.body[`rooms[${createRoomIndex}][description]`] || "",
                amenities: roomAmenities,
            });
            createRoomIndex++;
        }
        if (rooms.length > 0) {
            updateData.rooms = rooms;
        }
        // Parse cottages from FormData
        const cottages = [];
        let updateCottageIndex = 0;
        while (req.body[`cottages[${updateCottageIndex}][id]`]) {
            const cottageAmenities = [];
            let cottageAmenityIndex = 0;
            while (req.body[`cottages[${updateCottageIndex}][amenities][${cottageAmenityIndex}]`]) {
                cottageAmenities.push(req.body[`cottages[${updateCottageIndex}][amenities][${cottageAmenityIndex}]`]);
                cottageAmenityIndex++;
            }
            cottages.push({
                id: req.body[`cottages[${updateCottageIndex}][id]`],
                name: req.body[`cottages[${updateCottageIndex}][name]`],
                type: req.body[`cottages[${updateCottageIndex}][type]`],
                pricePerNight: parseFloat(req.body[`cottages[${updateCottageIndex}][pricePerNight]`]) || 0,
                dayRate: parseFloat(req.body[`cottages[${updateCottageIndex}][dayRate]`]) || 0,
                nightRate: parseFloat(req.body[`cottages[${updateCottageIndex}][nightRate]`]) || 0,
                hasDayRate: req.body[`cottages[${updateCottageIndex}][hasDayRate]`] === "true" || req.body[`cottages[${updateCottageIndex}][hasDayRate]`] === true,
                hasNightRate: req.body[`cottages[${updateCottageIndex}][hasNightRate]`] === "true" || req.body[`cottages[${updateCottageIndex}][hasNightRate]`] === true,
                minOccupancy: parseInt(req.body[`cottages[${updateCottageIndex}][minOccupancy]`]) || 1,
                maxOccupancy: parseInt(req.body[`cottages[${updateCottageIndex}][maxOccupancy]`]) || 1,
                description: req.body[`cottages[${updateCottageIndex}][description]`] || "",
                amenities: cottageAmenities,
            });
            updateCottageIndex++;
        }
        if (cottages.length > 0) {
            updateData.cottages = cottages;
        }
        // Update the hotel
        // Handle image uploads if any
        const files = req.files;
        let finalImageUrls = [];
        if (files && files.length > 0) {
            // Upload new images using the new image service
            const newImageUrls = yield imageService_1.default.saveImages(files);
            // Get existing image URLs from request body
            const existingImageUrls = req.body.imageUrls
                ? Array.isArray(req.body.imageUrls)
                    ? req.body.imageUrls
                    : [req.body.imageUrls]
                : [];
            // Combine existing and new images
            finalImageUrls = [...existingImageUrls, ...newImageUrls];
        }
        else {
            // No new files, keep existing images
            finalImageUrls = req.body.imageUrls
                ? Array.isArray(req.body.imageUrls)
                    ? req.body.imageUrls
                    : [req.body.imageUrls]
                : [];
        }
        // Update the hotel with all image URLs
        updateData.imageUrls = finalImageUrls;
        // Debug: Log the full updateData before updating
        console.log("=== FINAL UPDATE DATA ===");
        console.log("updateData.policies:", JSON.stringify(updateData.policies, null, 2));
        // Add payment fields to updateData
        updateData.gcashNumber = req.body.gcashNumber || "";
        updateData.downPaymentPercentage = Number(req.body.downPaymentPercentage) || 50;
        console.log("gcashNumber in FormData PUT:", updateData.gcashNumber);
        console.log("downPaymentPercentage in FormData PUT:", updateData.downPaymentPercentage);
        const updatedHotel = yield hotel_1.default.findByIdAndUpdate(req.params.hotelId, updateData, { new: true });
        if (!updatedHotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        res.status(200).json(updatedHotel);
    }
    catch (error) {
        console.error("Error updating hotel:", error);
        console.error("Request body:", req.body);
        console.error("Hotel ID:", req.params.hotelId);
        console.error("User ID:", req.userId);
        res.status(500).json({
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
router.delete("/:hotelId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotelId = req.params.hotelId;
        // First check if the hotel exists and belongs to the user
        const hotel = yield hotel_1.default.findOne({
            _id: hotelId,
            userId: req.userId,
        });
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        // Check if there are any active bookings for this hotel
        const activeBookings = yield booking_1.default.countDocuments({
            hotelId: hotelId,
            status: { $in: ["pending", "confirmed"] },
        });
        if (activeBookings > 0) {
            return res.status(400).json({
                message: "Cannot delete resort with active bookings. Please cancel all bookings first."
            });
        }
        // Delete the hotel
        yield hotel_1.default.findByIdAndDelete(hotelId);
        res.status(200).json({
            message: "Resort deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting hotel:", error);
        res.status(500).json({
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
exports.default = router;

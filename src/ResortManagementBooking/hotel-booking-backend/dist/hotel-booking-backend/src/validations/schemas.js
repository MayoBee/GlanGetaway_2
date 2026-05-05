"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idBody = exports.updateUserSchema = exports.createRoomSchema = exports.createHotelSchema = exports.createBookingSchema = exports.registerSchema = exports.loginSchema = exports.paginationQuery = exports.idParam = void 0;
const express_validator_1 = require("express-validator");
/**
 * Common reusable validation schemas
 */
// ID parameter validation
exports.idParam = (0, express_validator_1.param)('id')
    .isMongoId()
    .withMessage('Invalid ID format');
// Pagination query parameters
exports.paginationQuery = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('sort')
        .optional()
        .isString()
        .withMessage('Sort must be a string'),
    (0, express_validator_1.query)('search')
        .optional()
        .isString()
        .trim()
        .withMessage('Search must be a string'),
];
// User authentication schemas
exports.loginSchema = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];
exports.registerSchema = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter and one number'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
];
// Booking schemas
exports.createBookingSchema = [
    (0, express_validator_1.body)('hotelId')
        .isMongoId()
        .withMessage('Invalid hotel ID'),
    (0, express_validator_1.body)('roomId')
        .isMongoId()
        .withMessage('Invalid room ID'),
    (0, express_validator_1.body)('checkIn')
        .isISO8601()
        .withMessage('Check-in date must be a valid ISO date')
        .custom((value) => {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    })
        .withMessage('Check-in date cannot be in the past'),
    (0, express_validator_1.body)('checkOut')
        .isISO8601()
        .withMessage('Check-out date must be a valid ISO date')
        .custom((value, { req }) => {
        return new Date(value) > new Date(req.body.checkIn);
    })
        .withMessage('Check-out date must be after check-in date'),
    (0, express_validator_1.body)('guests')
        .isInt({ min: 1, max: 20 })
        .withMessage('Number of guests must be between 1 and 20'),
    (0, express_validator_1.body)('specialRequests')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Special requests cannot exceed 1000 characters'),
];
// Hotel schemas
exports.createHotelSchema = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Hotel name must be between 2 and 200 characters'),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Description must be between 10 and 5000 characters'),
    (0, express_validator_1.body)('address.street')
        .notEmpty()
        .trim()
        .withMessage('Street address is required'),
    (0, express_validator_1.body)('address.city')
        .notEmpty()
        .trim()
        .withMessage('City is required'),
    (0, express_validator_1.body)('address.country')
        .notEmpty()
        .trim()
        .withMessage('Country is required'),
    (0, express_validator_1.body)('address.postalCode')
        .notEmpty()
        .trim()
        .withMessage('Postal code is required'),
    (0, express_validator_1.body)('location.coordinates')
        .isArray({ min: 2, max: 2 })
        .withMessage('Coordinates must be an array of [longitude, latitude]'),
    (0, express_validator_1.body)('location.coordinates.*')
        .isFloat()
        .withMessage('Coordinates must be valid numbers'),
    (0, express_validator_1.body)('contact.email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid contact email is required'),
    (0, express_validator_1.body)('contact.phone')
        .notEmpty()
        .trim()
        .withMessage('Contact phone number is required'),
];
// Room schemas
exports.createRoomSchema = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Room name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('type')
        .isIn(['single', 'double', 'twin', 'suite', 'deluxe', 'family'])
        .withMessage('Invalid room type'),
    (0, express_validator_1.body)('pricePerNight')
        .isFloat({ min: 0 })
        .withMessage('Price per night must be a positive number'),
    (0, express_validator_1.body)('maxGuests')
        .isInt({ min: 1, max: 20 })
        .withMessage('Max guests must be between 1 and 20'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters'),
    (0, express_validator_1.body)('amenities')
        .optional()
        .isArray()
        .withMessage('Amenities must be an array'),
    (0, express_validator_1.body)('amenities.*')
        .isString()
        .trim()
        .withMessage('Each amenity must be a string'),
];
// User update schema
exports.updateUserSchema = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
];
// ID in body
const idBody = (field = 'id') => (0, express_validator_1.body)(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`);
exports.idBody = idBody;

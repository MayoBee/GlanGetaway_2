import { body, param, query } from 'express-validator';

/**
 * Common reusable validation schemas
 */

// ID parameter validation
export const idParam = param('id')
  .isMongoId()
  .withMessage('Invalid ID format');

// Pagination query parameters
export const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort must be a string'),
  query('search')
    .optional()
    .isString()
    .trim()
    .withMessage('Search must be a string'),
];

// User authentication schemas
export const loginSchema = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const registerSchema = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter and one number'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
];

// Booking schemas
export const createBookingSchema = [
  body('hotelId')
    .isMongoId()
    .withMessage('Invalid hotel ID'),
  body('roomId')
    .isMongoId()
    .withMessage('Invalid room ID'),
  body('checkIn')
    .isISO8601()
    .withMessage('Check-in date must be a valid ISO date')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    })
    .withMessage('Check-in date cannot be in the past'),
  body('checkOut')
    .isISO8601()
    .withMessage('Check-out date must be a valid ISO date')
    .custom((value, { req }) => {
      return new Date(value) > new Date(req.body.checkIn);
    })
    .withMessage('Check-out date must be after check-in date'),
  body('guests')
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of guests must be between 1 and 20'),
  body('specialRequests')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Special requests cannot exceed 1000 characters'),
];

// Hotel schemas
export const createHotelSchema = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Hotel name must be between 2 and 200 characters'),
  body('description')
    .notEmpty()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('address.street')
    .notEmpty()
    .trim()
    .withMessage('Street address is required'),
  body('address.city')
    .notEmpty()
    .trim()
    .withMessage('City is required'),
  body('address.country')
    .notEmpty()
    .trim()
    .withMessage('Country is required'),
  body('address.postalCode')
    .notEmpty()
    .trim()
    .withMessage('Postal code is required'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]'),
  body('location.coordinates.*')
    .isFloat()
    .withMessage('Coordinates must be valid numbers'),
  body('contact.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid contact email is required'),
  body('contact.phone')
    .notEmpty()
    .trim()
    .withMessage('Contact phone number is required'),
];

// Room schemas
export const createRoomSchema = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Room name must be between 2 and 100 characters'),
  body('type')
    .isIn(['single', 'double', 'twin', 'suite', 'deluxe', 'family'])
    .withMessage('Invalid room type'),
  body('pricePerNight')
    .isFloat({ min: 0 })
    .withMessage('Price per night must be a positive number'),
  body('maxGuests')
    .isInt({ min: 1, max: 20 })
    .withMessage('Max guests must be between 1 and 20'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  body('amenities.*')
    .isString()
    .trim()
    .withMessage('Each amenity must be a string'),
];

// User update schema
export const updateUserSchema = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
];

// ID in body
export const idBody = (field: string = 'id') => 
  body(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`);

import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import Hotel from "../models/hotel";
import Booking from "../domains/booking-reservation/models/booking";
import User from "../models/user";
import { BookingType, HotelSearchResponse } from "../types";
import { param, body, validationResult } from "express-validator";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/auth";

const stripe = new Stripe(process.env.STRIPE_API_KEY as string);

// Simplified auth middleware for payment routes
const simplifiedPaymentAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required for payment' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gcash-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const router = express.Router();

// Helper function to determine if payment should remain pending based on business rules
function shouldPaymentRemainPending(paymentMethod: string, isPwdBooking: boolean, isSeniorCitizenBooking: boolean): boolean {
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

router.get("/search", async (req: Request, res: Response) => {
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
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );
    const skip = (pageNumber - 1) * pageSize;

    const hotels = await Hotel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await Hotel.countDocuments(query);

    const response: HotelSearchResponse = {
      data: hotels,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    res.json(response);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ isApproved: { $ne: false } }).sort("-lastUpdated");
    res.json(hotels);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Hotel ID is required")],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.id.toString();

    try {
      console.log("=== FETCH HOTEL BY ID DEBUG ===");
      console.log("Hotel ID requested:", id);
      
      // First, fetch without field selection to see all available fields
      const fullHotel = await Hotel.findById(id);
      console.log("Full hotel data (all fields):", fullHotel);
      console.log("Full hotel gcashNumber:", fullHotel?.gcashNumber);
      
      const hotel = await Hotel.findById(id).select('nightRate dayRate hasNightRate hasDayRate name rooms cottages packages adultEntranceFee childEntranceFee starRating adultCount childCount facilities contact policies imageUrls type city country description amenities gcashNumber downPaymentPercentage');
      
      console.log("Hotel data found (with selection):", hotel);
      console.log("Hotel gcashNumber specifically:", hotel?.gcashNumber);
      console.log("Hotel has gcashNumber field:", 'gcashNumber' in hotel);
      console.log("Cottages data:", hotel?.cottages);
      
      if (hotel?.cottages) {
        hotel.cottages.forEach((cottage: any, index: number) => {
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
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching hotel" });
    }
  }
);



// Explicit OPTIONS handler for payment routes
router.options("/:hotelId/bookings/payment-intent", (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5174");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Max-Age", "86400");
  res.sendStatus(204);
});

router.post(
  "/:hotelId/bookings/payment-intent",
  // simplifiedPaymentAuth, // Temporarily disabled for debugging
  async (req: Request, res: Response) => {
    // Add explicit CORS headers
    res.header("Access-Control-Allow-Origin", "http://localhost:5174");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

    const { numberOfNights, downPaymentAmount } = req.body;
    const hotelId = req.params.hotelId;

    console.log("🔥 PAYMENT INTENT REQUEST DEBUG:");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Hotel ID:", hotelId);
    console.log("User ID:", req.userId);

    try {
      // Check if Stripe is configured
      if (!process.env.STRIPE_API_KEY) {
        console.error("Stripe API key not configured");
        return res.status(500).json({ message: "Payment system not properly configured" });
      }

      // Use lean() for faster query - only fetch needed fields including rooms
      const hotel = await Hotel.findById(hotelId).select('nightRate dayRate hasNightRate name rooms cottages adultEntranceFee childEntranceFee starRating adultCount childCount facilities contact policies imageUrls type city country description amenities').lean();
      if (!hotel) {
        return res.status(400).json({ message: "Hotel not found" });
      }

      // Use downPaymentAmount from frontend instead of calculating totalCost
      const paymentAmount = downPaymentAmount || (hotel.hasNightRate ? hotel.nightRate : hotel.dayRate);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentAmount * 100), // Convert to cents
        currency: "php", // Use PHP instead of USD
        metadata: {
          hotelId,
          userId: req.userId,
          numberOfNights: numberOfNights?.toString() || "1",
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
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to create payment intent" 
      });
    }
  }
);

router.post(
  "/:hotelId/bookings",
  verifyToken,
  async (req: Request, res: Response) => {
    const MAX_RETRIES = 3;
    let attempt = 0;
    
    while (attempt < MAX_RETRIES) {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        const { hotelId } = req.params;
        const userId = req.userId;
        
        console.log(`Booking request attempt ${attempt + 1}/${MAX_RETRIES}:`, req.body);
        console.log("User ID:", userId);
        console.log("Hotel ID:", hotelId);
        
        // Validate required fields
        const { 
          firstName, 
          lastName, 
          email, 
          phone, 
          adultCount, 
          childCount, 
          checkIn, 
          checkOut, 
          checkInTime, 
          checkOutTime,
          totalCost,
          basePrice,
          selectedRooms,
          selectedCottages,
          selectedAmenities,
          paymentMethod,
          specialRequests,
          isPwdBooking,
          isSeniorCitizenBooking,
          discountInfo
        } = req.body;
        
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        // 1. ATOMIC AVAILABILITY CHECK AT DATABASE LEVEL
        // Check for existing overlapping bookings for selected rooms/cottages
        // This query runs inside transaction with snapshot isolation
        const overlappingBookings = await Booking.find({
          hotelId,
          status: { $in: ["pending", "confirmed"] },
          $or: [
            ...(selectedRooms?.length > 0 ? [{
              "selectedRooms.id": { $in: selectedRooms.map((r: any) => r.id) },
            }] : []),
            ...(selectedCottages?.length > 0 ? [{
              "selectedCottages.id": { $in: selectedCottages.map((c: any) => c.id) },
            }] : [])
          ],
          $and: [
            { checkIn: { $lt: checkOutDate } },
            { checkOut: { $gt: checkInDate } }
          ]
        }).session(session);
        
        if (overlappingBookings.length > 0) {
          await session.abortTransaction();
          session.endSession();
          return res.status(409).json({ 
            message: "One or more selected rooms/cottages are already booked for these dates",
            conflictingBookings: overlappingBookings.length
          });
        }
        
        // 2. Verify hotel exists with pessimistic locking
        const hotel = await Hotel.findById(hotelId).session(session);
        if (!hotel) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: "Hotel not found" });
        }
        
        // 3. Create the booking
        const booking = new Booking({
          userId,
          hotelId,
          firstName,
          lastName,
          email,
          phone: phone || "",
          adultCount: adultCount || 1,
          childCount: childCount || 0,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          checkInTime: checkInTime || "12:00",
          checkOutTime: checkOutTime || "11:00",
          totalCost: totalCost || basePrice || 0,
          basePrice: basePrice || totalCost || 0,
          selectedRooms: selectedRooms || [],
          selectedCottages: selectedCottages || [],
          selectedAmenities: selectedAmenities || [],
          roomIds: selectedRooms ? selectedRooms.map((room: any) => room.id) : [],
          cottageIds: selectedCottages ? selectedCottages.map((cottage: any) => cottage.id) : [],
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
          changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          canModify: true
        });
        
        // Save booking inside transaction
        await booking.save({ session });
        
        // 4. Update hotel booking count atomically
        await Hotel.findByIdAndUpdate(
          hotelId, 
          { $inc: { totalBookings: 1 } },
          { session, new: true }
        );
        
        // 5. Update user booking count atomically
        await User.findByIdAndUpdate(
          userId, 
          { $inc: { totalBookings: 1 } },
          { session, new: true }
        );
        
        // Commit transaction atomically
        await session.commitTransaction();
        session.endSession();
        
        console.log("Booking created successfully:", booking._id);
        
        res.status(201).json({
          message: "Booking created successfully",
          bookingId: booking._id,
          booking
        });
        return;
        
      } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        
        // Handle write conflicts and transient errors with retries
        const isTransientError = 
          error.code === 112 || // WriteConflict
          error.code === 11000 || // Duplicate key (unique index violation)
          error.message?.includes("WriteConflict") ||
          error.name === "MongoServerError" && error.codeName === "WriteConflict";
          
        if (isTransientError && attempt < MAX_RETRIES - 1) {
          attempt++;
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Handle duplicate key error (uniqueness constraint hit)
        if (error.code === 11000) {
          return res.status(409).json({ 
            message: "Room has already been booked. Please select different dates or rooms."
          });
        }
        
        console.error("Booking error:", error);
        res.status(500).json({ 
          message: "Booking failed",
          error: error instanceof Error ? error.message : "Unknown error",
          attempts: attempt + 1
        });
        return;
      }
    }
    
    // All retries exhausted
    res.status(409).json({ 
      message: "Booking failed after multiple attempts. Please try again later."
    });
  }
);

// GCash Booking Endpoint
router.post(
  "/:hotelId/bookings/gcash",
  verifyToken,
  upload.single('gcashPayment.screenshotFile'),
  async (req: Request, res: Response) => {
    const MAX_RETRIES = 3;
    let attempt = 0;
    
    while (attempt < MAX_RETRIES) {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        const { hotelId } = req.params;
        const userId = req.userId;
        
        console.log(`GCash Booking request attempt ${attempt + 1}/${MAX_RETRIES}:`, req.body);
        console.log("User ID:", userId);
        console.log("Hotel ID:", hotelId);
        console.log("File uploaded:", req.file ? req.file.filename : "No file");
        
        // Validate required fields
        const { 
          firstName, 
          lastName, 
          email, 
          phone, 
          adultCount, 
          childCount, 
          checkIn, 
          checkOut, 
          checkInTime, 
          checkOutTime,
          totalCost,
          basePrice,
          selectedRooms,
          selectedCottages,
          selectedAmenities,
          specialRequests
        } = req.body;
        
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        // Get GCash payment fields (multer flattens nested form data)
        const gcashNumber = req.body['gcashPayment.gcashNumber'];
        const referenceNumber = req.body['gcashPayment.referenceNumber'];
        const amountPaid = req.body['gcashPayment.amountPaid'];
        const gcashStatus = req.body['gcashPayment.status'];
        
        // 1. ATOMIC AVAILABILITY CHECK
        const overlappingBookings = await Booking.find({
          hotelId,
          status: { $in: ["pending", "confirmed"] },
          $or: [
            ...(selectedRooms?.length > 0 ? [{
              "selectedRooms.id": { $in: JSON.parse(selectedRooms || "[]").map((r: any) => r.id) },
            }] : []),
            ...(selectedCottages?.length > 0 ? [{
              "selectedCottages.id": { $in: JSON.parse(selectedCottages || "[]").map((c: any) => c.id) },
            }] : [])
          ],
          $and: [
            { checkIn: { $lt: checkOutDate } },
            { checkOut: { $gt: checkInDate } }
          ]
        }).session(session);
        
        if (overlappingBookings.length > 0) {
          await session.abortTransaction();
          session.endSession();
          return res.status(409).json({ 
            message: "One or more selected rooms/cottages are already booked for these dates",
            conflictingBookings: overlappingBookings.length
          });
        }
        
        // 2. Verify hotel exists
        const hotel = await Hotel.findById(hotelId).session(session);
        if (!hotel) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: "Hotel not found" });
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
        const parsedSelectedRooms = selectedRooms ? JSON.parse(selectedRooms) : [];
        const parsedSelectedCottages = selectedCottages ? JSON.parse(selectedCottages) : [];
        const booking = new Booking({
          userId,
          hotelId,
          firstName,
          lastName,
          email,
          phone: phone || "",
          adultCount: parseInt(adultCount) || 1,
          childCount: parseInt(childCount) || 0,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          checkInTime: checkInTime || "12:00",
          checkOutTime: checkOutTime || "11:00",
          totalCost: parseFloat(totalCost) || parseFloat(basePrice) || 0,
          basePrice: parseFloat(basePrice) || parseFloat(totalCost) || 0,
          selectedRooms: parsedSelectedRooms,
          selectedCottages: parsedSelectedCottages,
          selectedAmenities: selectedAmenities ? JSON.parse(selectedAmenities) : [],
          roomIds: parsedSelectedRooms.map((room: any) => room.id),
          cottageIds: parsedSelectedCottages.map((cottage: any) => cottage.id),
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
          changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          canModify: true,
          // Store GCash payment details
          gcashPayment: gcashPaymentDetails
        });
        
        // Save booking inside transaction
        await booking.save({ session });
        
        // Update hotel booking count atomically
        await Hotel.findByIdAndUpdate(
          hotelId, 
          { $inc: { totalBookings: 1 } },
          { session, new: true }
        );
        
        // Update user booking count atomically
        await User.findByIdAndUpdate(
          userId, 
          { $inc: { totalBookings: 1 } },
          { session, new: true }
        );
        
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        
        console.log("GCash Booking created successfully:", booking._id);
        
        res.status(201).json({
          message: "GCash booking created successfully. Payment is pending verification.",
          bookingId: booking._id,
          booking
        });
        return;
        
      } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        
        const isTransientError = 
          error.code === 112 || 
          error.code === 11000 ||
          error.message?.includes("WriteConflict");
          
        if (isTransientError && attempt < MAX_RETRIES - 1) {
          attempt++;
          const delay = Math.pow(2, attempt) * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (error.code === 11000) {
          return res.status(409).json({ 
            message: "Room has already been booked. Please select different dates or rooms."
          });
        }
        
        console.error("GCash Booking error:", error);
        res.status(500).json({ 
          message: "GCash booking failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
        return;
      }
    }
    
    res.status(409).json({ 
      message: "Booking failed after multiple attempts. Please try again later."
    });
  }
);

const constructSearchQuery = (queryParams: any) => {
  let constructedQuery: any = {};

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
      ? queryParams.stars.map((star: string) => parseInt(star))
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

export default router;

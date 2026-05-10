import express, { Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import rateLimit from "express-rate-limit";
import Hotel from "../models/hotel";
import Booking from "../models/booking";
import User from "../models/user";
import { BookingType, HotelSearchResponse } from "../types";
import { param, body, validationResult } from "express-validator";
import Stripe from "stripe";
import verifyToken from "../middleware/auth";
import { checkAvailability, createAtomicBooking } from "../services/availabilityService";
import { TimezoneManager } from "../utils/timezoneUtils";

const stripe = new Stripe(process.env.STRIPE_API_KEY as string);

// Stricter rate limiting for search endpoints to prevent scraping
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many search requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

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
    // Block dangerous extensions regardless of MIME type
    const blockedExtensions = ['.exe', '.pdf', '.svg', '.js', '.html', '.php', '.zip', '.tar', '.gz'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (blockedExtensions.includes(ext)) {
      return cb(new Error(`File type ${ext} is not allowed for security reasons`));
    }
    
    // Only allow standard image MIME types
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP image files are allowed'));
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

router.get("/search", searchLimiter, async (req: Request, res: Response) => {
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

    // DATA PROJECTION: Exclude sensitive fields from search results
    const hotels = await Hotel.find(query)
      .select('name city country starRating type facilities imageUrls nightRate dayRate hasNightRate hasDayRate childEntranceFee isApproved')
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await Hotel.countDocuments(query);

    // Transform database fields to match frontend expectations for backward compatibility
    const transformedHotels = hotels.map(hotel => {
      const hotelObj = hotel.toObject();
      return {
        ...hotelObj,
        // Handle both old and new field names
        imageUrls: hotelObj.imageUrls || (hotelObj.image ? [hotelObj.image] : []),
        starRating: hotelObj.starRating || hotelObj.rating || 0,
        // Ensure type is always an array
        type: Array.isArray(hotelObj.type) ? hotelObj.type : (typeof hotelObj.type === 'string' ? [hotelObj.type] : [])
      };
    });

    const response: HotelSearchResponse = {
      data: transformedHotels,
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
    // DATA PROJECTION: Exclude sensitive fields from hotel list
    const hotels = await Hotel.find({ isApproved: { $ne: false } })
      .select('name city country starRating type facilities imageUrls nightRate dayRate hasNightRate hasDayRate childEntranceFee isApproved')
      .sort("-lastUpdated");
    
    // Transform database fields to match frontend expectations for backward compatibility
    const transformedHotels = hotels.map(hotel => {
      const hotelObj = hotel.toObject();
      return {
        ...hotelObj,
        // Handle both old and new field names
        imageUrls: hotelObj.imageUrls || (hotelObj.image ? [hotelObj.image] : []),
        starRating: hotelObj.starRating || hotelObj.rating || 0,
        // Ensure type is always an array
        type: Array.isArray(hotelObj.type) ? hotelObj.type : (typeof hotelObj.type === 'string' ? [hotelObj.type] : [])
      };
    });
    
    res.json(transformedHotels);
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
      
      const hotel = await Hotel.findById(id).select('nightRate dayRate hasNightRate hasDayRate name rooms cottages packages childEntranceFee starRating adultCount childCount facilities contact policies imageUrls type city country description amenities gcashNumber downPaymentPercentage');
      
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

router.get(
  "/:hotelId/availability",
  async (req: Request, res: Response) => {
    try {
      const { hotelId } = req.params;
      const { checkIn, checkOut, roomIds, cottageIds } = req.query;

      if (!checkIn || !checkOut) {
        return res.status(400).json({ message: "checkIn and checkOut are required" });
      }

      const roomIdsArray = roomIds ? (typeof roomIds === 'string' ? roomIds.split(',') : roomIds) : [];
      const cottageIdsArray = cottageIds ? (typeof cottageIds === 'string' ? cottageIds.split(',') : cottageIds) : [];

      const availability = await checkAvailability(hotelId, new Date(checkIn as string), new Date(checkOut as string), roomIdsArray as string[], cottageIdsArray as string[]);

      res.json({
        available: availability.available,
        conflicts: availability.conflicts
      });
    } catch (error) {
      console.error("Availability check error:", error);
      res.status(500).json({ message: "Error checking availability" });
    }
  }
);

router.post(
  "/:hotelId/bookings/payment-intent",
  verifyToken,
  async (req: Request, res: Response) => {
    const { numberOfNights, downPaymentAmount } = req.body;
    const hotelId = req.params.hotelId;

    try {
      console.log("Payment intent request:", { hotelId, numberOfNights, downPaymentAmount });

      // Check if Stripe is configured
      if (!process.env.STRIPE_API_KEY) {
        console.error("Stripe API key not configured");
        return res.status(500).json({ message: "Payment system not properly configured" });
      }

      // Use lean() for faster query - only fetch needed fields including rooms
      const hotel = await Hotel.findById(hotelId).select('nightRate dayRate hasNightRate name rooms cottages childEntranceFee starRating adultCount childCount facilities contact policies imageUrls type city country description amenities rooms.includedEntranceFee cottages.includedEntranceFee').lean();
      if (!hotel) {
        console.error("Hotel not found:", hotelId);
        return res.status(400).json({ message: "Hotel not found" });
      }

      console.log("Hotel data found:", { 
        hotelId: hotel._id, 
        name: hotel.name, 
        nightRate: hotel.nightRate, 
        dayRate: hotel.dayRate,
        hasNightRate: hotel.hasNightRate,
        hasDayRate: hotel.hasDayRate
      });

      // Use downPaymentAmount from frontend instead of calculating totalCost
      const paymentAmount = downPaymentAmount || (hotel.hasNightRate ? hotel.nightRate : hotel.dayRate);
      
      console.log("Payment amount calculated:", { downPaymentAmount, paymentAmount });

      // Handle zero payment amount case
      if (paymentAmount <= 0) {
        // Return a mock payment intent with proper Stripe format
        const timestamp = Date.now();
        const mockId = `pi_mock_${timestamp}`;
        const response = {
          paymentIntentId: mockId,
          clientSecret: `${mockId}_secret_${timestamp}`,
          totalCost: 0,
          message: "No payment required - zero amount booking"
        };
        return res.send(response);
      }

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
    try {
      const { hotelId } = req.params;
      const userId = req.userId;
      
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

      console.log("Booking request received:", req.body);
      console.log("User ID:", userId);
      console.log("Hotel ID:", hotelId);
      console.log("CheckIn type:", typeof checkIn, "CheckIn value:", checkIn);
      console.log("CheckOut type:", typeof checkOut, "CheckOut value:", checkOut);

      // Verify hotel exists
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // TIMEZONE-SAFE DATE VALIDATION
      
      // Get client timezone from headers or use default
      const clientTimezone = req.headers['x-timezone'] as string;
      const validation = TimezoneManager.validateBookingDates(checkIn, checkOut, clientTimezone);
      
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: validation.error,
          timezone: TimezoneManager.getCurrentTimezone(),
          clientTimezone: clientTimezone || 'not provided'
        });
      }
      
      // Use normalized dates from validation
      const { checkIn: normalizedCheckIn, checkOut: normalizedCheckOut } = validation.normalizedDates!;

      // Extract room and cottage IDs for booking data
      const roomIds = selectedRooms?.map((room: any) => room.id) || [];
      const cottageIds = selectedCottages?.map((cottage: any) => cottage.id) || [];

      // Prepare booking data
      const bookingData = {
        userId,
        hotelId,
        firstName,
        lastName,
        email,
        phone: phone || "",
        adultCount: adultCount || 1,
        childCount: childCount || 0,
        checkIn: normalizedCheckIn,
        checkOut: normalizedCheckOut,
        checkInTime: checkInTime || "12:00",
        checkOutTime: checkOutTime || "11:00",
        totalCost: totalCost || basePrice || 0,
        basePrice: basePrice || totalCost || 0,
        selectedRooms: selectedRooms || [],
        selectedCottages: selectedCottages || [],
        selectedAmenities: selectedAmenities || [],
        roomIds: roomIds, // Add roomIds array
        cottageIds: cottageIds, // Add cottageIds array
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
      };

      // Check if this is an entrance fee-only booking
      const isEntranceFeeOnly = (!selectedRooms || selectedRooms.length === 0) && 
                               (!selectedCottages || selectedCottages.length === 0);
      
      console.log("Booking type detected:", isEntranceFeeOnly ? "Entrance fee-only" : "With accommodations");
      
      try {
        let booking;
        
        if (isEntranceFeeOnly) {
          // For entrance fee-only bookings, create directly without conflict detection or transactions
          console.log("Creating entrance fee-only booking...");
          booking = new Booking(bookingData);
          await booking.save();
          
          // Update hotel and user booking counts without transaction
          await Hotel.findByIdAndUpdate(hotelId, {
            $inc: { totalBookings: 1 }
          });
          
          await User.findByIdAndUpdate(userId, {
            $inc: { totalBookings: 1 }
          });
        } else {
          // For accommodation bookings, use ATOMIC booking to prevent race conditions
          console.log("Creating accommodation booking with conflict detection...");
          // Start transaction only for accommodation bookings
          const session = await mongoose.startSession();
          session.startTransaction();
          
          try {
            const result = await createAtomicBooking(bookingData, { session });
            
            if (!result.success) {
              await session.abortTransaction();
              session.endSession();
              return res.status(409).json({ 
                message: result.error || "Booking failed due to availability conflict" 
              });
            }
            
            booking = result.booking;
            
            // Update hotel booking count
            await Hotel.findByIdAndUpdate(hotelId, {
              $inc: { totalBookings: 1 }
            }, { session });
            
            // Update user booking count
            await User.findByIdAndUpdate(userId, {
              $inc: { totalBookings: 1 }
            }, { session });
            
            await session.commitTransaction();
            session.endSession();
          } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
          }
        }
        
        console.log("Booking created successfully:", booking._id);
        
        res.status(201).json({
          message: "Booking created successfully",
          bookingId: booking._id,
          booking
        });
      } catch (error: any) {
        console.error("Booking error:", error);
        res.status(500).json({ 
          message: "Booking failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } catch (error) {
      console.error("Outer booking error:", error);
      res.status(500).json({ 
        message: "Booking failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// GCash Booking Endpoint
router.post(
  "/:hotelId/bookings/gcash",
  verifyToken,
  upload.single('gcashPayment.screenshotFile'),
  async (req: Request, res: Response) => {
    try {
      const { hotelId } = req.params;
      const userId = req.userId;
      
      console.log("GCash Booking request received:", req.body);
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
      
      // Get GCash payment fields (multer flattens nested form data)
      const gcashNumber = req.body['gcashPayment.gcashNumber'];
      const referenceNumber = req.body['gcashPayment.referenceNumber'];
      const amountPaid = req.body['gcashPayment.amountPaid'];
      const gcashStatus = req.body['gcashPayment.status'];
      const paymentTime = req.body['gcashPayment.paymentTime'];

      // Verify hotel exists
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Extract IDs from parsed arrays
      const parsedRooms = selectedRooms ? JSON.parse(selectedRooms) : [];
      const parsedCottages = selectedCottages ? JSON.parse(selectedCottages) : [];
      const roomIds = parsedRooms.map((room: any) => room.id);
      const cottageIds = parsedCottages.map((cottage: any) => cottage.id);

      // Check availability
      const availability = await checkAvailability(hotelId, new Date(checkIn), new Date(checkOut), roomIds, cottageIds);
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
      
      // Start transaction for complete GCash booking flow
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Create the booking with GCash payment
        const booking = new Booking({
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
          changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          canModify: true,
          // Store GCash payment details
          gcashPayment: gcashPaymentDetails
        });
        
        await booking.save({ session });
        
        // Update hotel booking count
        await Hotel.findByIdAndUpdate(hotelId, {
          $inc: { totalBookings: 1 }
        }, { session });
        
        // Update user booking count
        await User.findByIdAndUpdate(userId, {
          $inc: { totalBookings: 1 }
        }, { session });
        
        await session.commitTransaction();
        session.endSession();
        
        console.log("GCash Booking created successfully:", booking._id);
        
        res.status(201).json({
          message: "GCash booking created successfully. Payment is pending verification.",
          bookingId: booking._id,
          booking
        });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error("GCash Booking error:", error);
      res.status(500).json({ 
        message: "GCash booking failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
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

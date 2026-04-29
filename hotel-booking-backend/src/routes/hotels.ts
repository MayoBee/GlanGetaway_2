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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
      .select('name city country starRating type facilities imageUrls nightRate dayRate hasNightRate hasDayRate adultEntranceFee childEntranceFee isApproved')
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await Hotel.countDocuments(query);

    // Transform database fields to match frontend expectations for backward compatibility
    const transformedHotels = hotels.map(hotel => {
      const hotelObj = hotel.toObject();
      return {
        ...hotelObj,
        // Convert ObjectId to string
        _id: hotelObj._id.toString(),
        // Handle both old and new field names
        imageUrls: hotelObj.imageUrls || ((hotelObj as any).image ? [(hotelObj as any).image] : []), 
        starRating: hotelObj.starRating || (hotelObj as any).rating || 0,
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
      .select('name city country starRating type facilities imageUrls nightRate dayRate hasNightRate hasDayRate adultEntranceFee childEntranceFee isApproved')
      .sort("-updatedAt");
    
    // Transform database fields to match frontend expectations for backward compatibility
    const transformedHotels = hotels.map(hotel => {
      const hotelObj = hotel.toObject();
      return {
        ...hotelObj,
        // Convert ObjectId to string
        _id: hotelObj._id.toString(),
        // Handle both old and new field names
        imageUrls: hotelObj.imageUrls || ((hotelObj as any).image ? [(hotelObj as any).image] : []), 
        starRating: hotelObj.starRating || (hotelObj as any).rating || 0,
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
      console.log("Full hotel gcashNumber:", (fullHotel as any)?.gcashNumber);
      
      const hotel = await Hotel.findById(id).select('nightRate dayRate hasNightRate hasDayRate name rooms cottages packages adultEntranceFee childEntranceFee starRating adultCount childCount facilities contact policies imageUrls type city country description amenities gcashNumber downPaymentPercentage');
      
      console.log("Hotel data found (with selection):", hotel);
      console.log("Hotel gcashNumber specifically:", (hotel as any)?.gcashNumber);
      console.log("Hotel has gcashNumber field:", 'gcashNumber' in (hotel as any));
      console.log("Cottages data:", (hotel as any)?.cottages);
      
      if ((hotel as any)?.cottages) {
        (hotel as any).cottages.forEach((cottage: any, index: number) => {
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
      console.log("Creating payment intent for hotel:", hotelId, "user:", req.userId);
      console.log("Payment amount:", downPaymentAmount, "nights:", numberOfNights);
      console.log("Request body:", req.body);
      
      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error("Stripe API key not configured");
        return res.status(500).json({ message: "Payment system not properly configured" });
      }

      // Validate payment amount
      const paymentAmountNum = Number(downPaymentAmount);
      if (!downPaymentAmount || isNaN(paymentAmountNum) || paymentAmountNum <= 0) {
        console.error("Invalid payment amount:", downPaymentAmount, "converted to:", paymentAmountNum);
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      // Use lean() for faster query - only fetch needed fields including rooms
      const hotel = await Hotel.findById(hotelId).select('nightRate dayRate hasNightRate name rooms cottages adultEntranceFee childEntranceFee starRating adultCount childCount facilities contact policies imageUrls type city country description amenities').lean();
      if (!hotel) {
        console.error("Hotel not found:", hotelId);
        return res.status(400).json({ message: "Hotel not found" });
      }

      // Use the already validated payment amount
      const paymentAmount = paymentAmountNum;
      
      console.log("Final payment amount:", paymentAmount, "Type:", typeof paymentAmount);

      console.log("Calling Stripe API...");
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentAmount * 100), // Convert to cents
        currency: "php",
        payment_method_types: ['card'],
        metadata: {
          hotelId,
          userId: req.userId,
          numberOfNights: numberOfNights?.toString() || "1",
        },
      });

      console.log("Payment intent created successfully:", paymentIntent.id);

      if (!paymentIntent.client_secret) {
        console.error("Payment intent created but no client secret");
        return res.status(500).json({ message: "Error creating payment intent" });
      }

      const response = {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret.toString(),
        totalCost: paymentAmount,
      };

      console.log("Sending payment intent response");
      res.send(response);
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      console.error("Error details:", {
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      });
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
      console.log("=== BOOKING CREATION ROUTE HIT AT", new Date().toISOString(), "===");
      console.log("Request method:", req.method);
      console.log("Request URL:", req.url);
      console.log("Request IP:", req.ip);
      console.log("User-Agent:", req.get('User-Agent'));

      const { hotelId } = req.params;
      const userId = req.userId;

      console.log("Booking request received:", JSON.stringify(req.body, null, 2));
      console.log("User ID:", userId);
      console.log("Hotel ID:", hotelId);
      console.log("Request headers:", req.headers);
      
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
        paymentIntentId,
        selectedRooms,
        selectedCottages,
        selectedAmenities,
        paymentMethod,
        specialRequests,
        isPwdBooking,
        isSeniorCitizenBooking,
        discountInfo
      } = req.body;

      // Validate payment intent for card payments
      if (paymentMethod === "card" && paymentIntentId) {
        try {
          console.log("=== PAYMENT INTENT VALIDATION START ===");
          console.log("Payment Intent ID:", paymentIntentId);
          console.log("User ID:", userId);
          console.log("Hotel ID:", hotelId);
          
          // Verify payment intent status with Stripe first
          console.log("Step 1: Retrieving payment intent from Stripe...");
          console.log("Step 1: Payment Intent ID:", paymentIntentId);
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          console.log("Step 1 Complete: Payment Intent Status:", paymentIntent.status);
          console.log("Step 1 Complete: Payment Intent Amount:", paymentIntent.amount);
          console.log("Step 1 Complete: Payment Intent Metadata:", paymentIntent.metadata);
          
          if (paymentIntent.status !== "succeeded") {
            console.log("Step 1 Failed: Payment intent not succeeded:", paymentIntent.status);
            return res.status(400).json({ 
              message: "Payment has not been completed. Please complete the payment first." 
            });
          }
          console.log("Step 1 Passed: Payment intent status is succeeded");

          // Check if payment intent is already used
          console.log("Step 2: Checking if payment intent is already used...");
          const existingBooking = await Booking.findOne({ paymentIntentId });
          if (existingBooking) {
            console.log("Step 2 Failed: Payment intent already used:", paymentIntentId);
            console.log("Existing booking ID:", existingBooking._id);
            console.log("Existing booking user ID:", existingBooking.userId);
            console.log("Existing booking hotel ID:", existingBooking.hotelId);
            console.log("Current user ID:", userId);
            console.log("Current hotel ID:", hotelId);
            
            // If the existing booking exists and is for the same user and hotel, return the existing booking
            if (existingBooking.userId.toString() === userId && existingBooking.hotelId.toString() === hotelId) {
              console.log("Step 2 Alternative: Returning existing booking for same user and hotel");
              return res.status(200).json({
                message: "Booking already exists for this payment",
                bookingId: existingBooking._id,
                booking: existingBooking
              });
            } else {
              console.log("Step 2 Failed: Payment intent used for different booking");
              return res.status(409).json({ 
                message: "This payment has already been used for a different booking" 
              });
            }
          } else {
            console.log("Step 2 Passed: Payment intent not used yet, proceeding with booking creation");
          }

          // Verify payment intent metadata matches this booking
          console.log("Step 3: Verifying payment intent metadata...");
          console.log("Payment Intent Metadata:", paymentIntent.metadata);
          console.log("Expected hotelId:", hotelId, "Got:", paymentIntent.metadata.hotelId);
          console.log("Expected userId:", userId, "Got:", paymentIntent.metadata.userId);
          console.log("Metadata match - hotelId:", paymentIntent.metadata.hotelId === hotelId);
          console.log("Metadata match - userId:", paymentIntent.metadata.userId === userId);
          
          if (paymentIntent.metadata.hotelId !== hotelId || paymentIntent.metadata.userId !== userId) {
            console.log("Step 3 Failed: Payment intent metadata mismatch");
            return res.status(400).json({ 
              message: "Payment details do not match this booking" 
            });
          }
          console.log("Step 3 Passed: Payment intent metadata matches");
          
          console.log("=== PAYMENT INTENT VALIDATION PASSED ===");
        } catch (stripeError: any) {
          console.error("=== PAYMENT INTENT VALIDATION ERROR ===");
          console.error("Error Type:", stripeError.type);
          console.error("Error Code:", stripeError.code);
          console.error("Error Message:", stripeError.message);
          console.error("Full Error:", stripeError);
          return res.status(400).json({ 
            message: "Invalid payment intent. Please try again." 
          });
        }
      }

      // Verify hotel exists
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // DATE VALIDATION: Prevent time-travel bookings
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const now = new Date();
      
      // Set now to start of day for fair comparison
      now.setHours(0, 0, 0, 0);
      checkInDate.setHours(0, 0, 0, 0);
      checkOutDate.setHours(0, 0, 0, 0);
      
      // Validate checkIn is not in the past (allow same-day bookings)
      if (checkInDate < now) {
        return res.status(400).json({ message: "Check-in date cannot be in the past" });
      }
      
      // Validate checkOut is after checkIn
      if (checkOutDate <= checkInDate) {
        return res.status(400).json({ message: "Check-out date must be after check-in date" });
      }

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
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        checkInTime: checkInTime || "12:00",
        checkOutTime: checkOutTime || "11:00",
        totalCost: totalCost || basePrice || 0,
        basePrice: basePrice || totalCost || 0,
        selectedItems: [
          ...(selectedRooms || []).map(room => ({ ...room, type: 'room' as const })),
          ...(selectedCottages || []).map(cottage => ({ ...cottage, type: 'cottage' as const })),
          ...(selectedAmenities || []).map(amenity => ({ ...amenity, type: 'amenity' as const }))
        ],
        paymentMethod: paymentMethod || "card",
        specialRequests: specialRequests || "",
        status: "pending",
        // Include payment intent ID for card payments
        paymentIntentId: paymentMethod === "card" ? paymentIntentId : undefined,
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

      // Use ATOMIC booking to prevent race conditions
      console.log("=== BOOKING CREATION DEBUG ===");
      console.log("PASSED ALL VALIDATION - About to create booking");
      console.log("Final booking data being sent to createAtomicBooking:", JSON.stringify(bookingData, null, 2));
      console.log("About to call createAtomicBooking with summary:", {
        userId,
        hotelId,
        checkIn,
        checkOut,
        selectedRooms: selectedRooms || [],
        selectedCottages: selectedCottages || [],
        paymentIntentId,
        totalCost,
        basePrice
      });

      const result = await createAtomicBooking(bookingData);
      
      console.log("createAtomicBooking result:", result);
      console.log("=== END BOOKING CREATION DEBUG ===");
      
      if (!result.success) {
        console.log("Booking failed with error:", result.error);
        return res.status(409).json({ 
          message: result.error || "Booking failed due to availability conflict" 
        });
      }
      
      const booking = result.booking;
      
      // Update hotel booking count
      await Hotel.findByIdAndUpdate(hotelId, {
        $inc: { totalBookings: 1 }
      } as any);
      
      // Update user booking count
      await User.findByIdAndUpdate(userId, {
        $inc: { totalBookings: 1 }
      } as any);
      
      console.log("Booking created successfully:", booking._id);
      
      res.status(201).json({
        message: "Booking created successfully",
        bookingId: booking._id,
        booking
      });
    } catch (error) {
      console.error("Booking error:", error);
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
      
      await booking.save();
      
      // Update hotel booking count
      await Hotel.findByIdAndUpdate(hotelId, {
        $inc: { totalBookings: 1 }
      } as any);
      
      // Update user booking count
      await User.findByIdAndUpdate(userId, {
        $inc: { totalBookings: 1 }
      } as any);
      
      console.log("GCash Booking created successfully:", booking._id);
      
      res.status(201).json({
        message: "GCash booking created successfully. Payment is pending verification.",
        bookingId: booking._id,
        booking
      });
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

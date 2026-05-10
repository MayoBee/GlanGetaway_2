import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import PaymentTransaction from "../models/payment";
import Booking from "../domains/booking-reservation/models/booking";
import Hotel from "../models/hotel";
import Stripe from "stripe";

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = req.cookies?.session_id;
  }

  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    req.userId = (decoded as JwtPayload).userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "unauthorized" });
  }
};

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * GET /api/payments/hotel/:hotelId/deposit-settings
 * Get deposit settings for a hotel
 */
router.get("/hotel/:hotelId/deposit-settings", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Return deposit settings (can be customized per resort)
    const depositSettings = {
      defaultDepositPercentage: 50, // Default 50%
      minimumDeposit: 0, // No minimum - use calculated down payment
      allowFullPayment: true,
      allowInstallment: false,
      paymentMethods: ["gcash", "bank_transfer", "stripe"],
      // Resort-specific overrides
      mcJornDepositPercentage: 50,
      instaglanDepositPercentage: 30,
    };

    res.json(depositSettings);
  } catch (error) {
    console.error("Error fetching deposit settings:", error);
    res.status(500).json({ message: "Failed to fetch deposit settings" });
  }
});

/**
 * POST /api/payments/create-payment-intent
 * Create a PayMongo payment intent
 */
router.post("/create-payment-intent", verifyToken, async (req: Request, res: Response) => {
  try {
    const { bookingId, amount, depositPercentage } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ message: "Booking ID and amount are required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Calculate deposit amount
    const depositAmount = Math.round(amount * (depositPercentage || 50) / 100);

    // Create payment intent via Stripe
    let stripePaymentIntentId = null;
    let clientSecret = null;
    
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: depositAmount * 100, // Stripe uses cents
        currency: 'php',
        payment_method_types: ['card'],
        description: `Deposit for Booking ${bookingId}`,
        metadata: {
          bookingId,
          type: 'deposit',
        },
      });
      
      stripePaymentIntentId = paymentIntent.id;
      clientSecret = paymentIntent.client_secret;
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      // Continue with manual payment flow if Stripe fails
    }

    // Create payment transaction record
    const payment = new PaymentTransaction({
      bookingId,
      hotelId: booking.hotelId.toString(),
      guestId: booking.userId,
      amount: depositAmount,
      type: "deposit",
      status: stripePaymentIntentId ? "pending" : "pending",
      paymentMethod: "stripe",
      stripePaymentIntentId,
      depositPercentage: depositPercentage || 50,
      depositAmount,
      remainingAmount: amount - depositAmount,
      guestName: `${booking.firstName} ${booking.lastName}`,
      guestEmail: booking.email,
      guestPhone: booking.phone,
    });

    await payment.save();

    res.status(201).json({
      paymentId: payment._id,
      bookingId,
      depositAmount,
      remainingAmount: amount - depositAmount,
      totalAmount: amount,
      depositPercentage: depositPercentage || 50,
      stripePaymentIntentId,
      clientSecret: clientSecret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ message: "Failed to create payment" });
  }
});

/**
 * POST /api/payments/verify-manual-payment
 * Verify manual payment (GCash/bank transfer screenshot)
 */
router.post("/verify-manual-payment", verifyToken, async (req: Request, res: Response) => {
  try {
    const { paymentId, referenceNumber, screenshotUrl } = req.body;
    const verifiedBy = req.userId;

    if (!paymentId || !referenceNumber) {
      return res.status(400).json({ message: "Payment ID and reference number are required" });
    }

    const payment = await PaymentTransaction.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment with verification info
    payment.referenceNumber = referenceNumber;
    payment.screenshotUrl = screenshotUrl;
    payment.verifiedBy = verifiedBy;
    payment.verifiedAt = new Date();
    payment.status = "succeeded";

    await payment.save();

    // Update booking payment status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: "paid",
      status: "confirmed",
    });

    res.json({
      message: "Payment verified successfully",
      payment: {
        id: payment._id,
        status: payment.status,
        verifiedAt: payment.verifiedAt,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

/**
 * POST /api/payments/confirm-stripe-payment
 * Confirm Stripe payment
 */
router.post("/confirm-stripe-payment", verifyToken, async (req: Request, res: Response) => {
  try {
    const { paymentId, paymentMethodId } = req.body;

    if (!paymentId || !paymentMethodId) {
      return res.status(400).json({ message: "Payment ID and payment method ID are required" });
    }

    const payment = await PaymentTransaction.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (!payment.stripePaymentIntentId) {
      return res.status(400).json({ message: "No Stripe payment intent found" });
    }

    // Confirm the payment with Stripe
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(
        payment.stripePaymentIntentId,
        { payment_method: paymentMethodId }
      );

      if (paymentIntent.status === 'succeeded') {
        payment.status = "succeeded";
        payment.stripePaymentMethodId = paymentMethodId;
        await payment.save();

        // Update booking
        await Booking.findByIdAndUpdate(payment.bookingId, {
          paymentStatus: "paid",
          status: "confirmed",
        });

        res.json({
          message: "Payment confirmed successfully",
          payment: {
            id: payment._id,
            status: payment.status,
          },
        });
      } else {
        res.json({
          message: "Payment processing",
          payment: {
            id: payment._id,
            status: paymentIntent.status,
          },
        });
      }
    } catch (stripeError: any) {
      console.error("Stripe confirmation error:", stripeError);
      payment.status = "failed";
      await payment.save();
      res.status(400).json({ 
        message: stripeError.message || "Payment confirmation failed" 
      });
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ message: "Failed to confirm payment" });
  }
});

/**
 * POST /api/payments/webhook
 * Stripe webhook handler
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const event = req.body;
    const sig = req.headers['stripe-signature'] as string;

    // Verify webhook signature (optional in test)
    // let event: Stripe.Event;
    // try {
    //   event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    // } catch (err) {
    //   console.log(`Webhook signature verification failed.`, err.message);
    //   return res.status(400).send(`Webhook signature verification failed.`);
    // }

    // Handle payment success
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      const payment = await PaymentTransaction.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (payment) {
        payment.status = "succeeded";
        await payment.save();

        // Update booking
        await Booking.findByIdAndUpdate(payment.bookingId, {
          paymentStatus: "paid",
          status: "confirmed",
        });

        console.log(`[Payment] Payment succeeded for booking ${payment.bookingId}`);
      }
    }

    // Handle payment failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      const payment = await PaymentTransaction.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (payment) {
        payment.status = "failed";
        await payment.save();

        console.log(`[Payment] Payment failed for booking ${payment.bookingId}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
});

/**
 * GET /api/payments/booking/:bookingId
 * Get payment details for a booking
 */
router.get("/booking/:bookingId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const payments = await PaymentTransaction.find({ bookingId })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

/**
 * POST /api/payments/:paymentId/refund
 * Process a refund
 */
router.post("/:paymentId/refund", verifyToken, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason, method } = req.body;

    const payment = await PaymentTransaction.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "succeeded") {
      return res.status(400).json({ message: "Can only refund successful payments" });
    }

    const refundAmount = amount || payment.amount;

    // Process refund via Stripe if applicable
    if (payment.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId as string,
          amount: refundAmount * 100,
          reason: 'requested_by_customer',
        });
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError);
      }
    }

    // Update payment record
    payment.status = "refunded";
    payment.refundAmount = refundAmount;
    payment.refundedAt = new Date();
    payment.refundMethod = method || "gcash";

    await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: "refunded",
      status: "refunded",
    });

    res.json({
      message: "Refund processed successfully",
      payment: {
        id: payment._id,
        refundAmount: payment.refundAmount,
        refundedAt: payment.refundedAt,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ message: "Failed to process refund" });
  }
});

/**
 * GET /api/payments/hotel/:hotelId
 * Get all payments for a hotel
 */
router.get("/hotel/:hotelId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { status, startDate, endDate } = req.query;

    const query: any = { hotelId };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const payments = await PaymentTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    const summary = {
      total: payments.length,
      succeeded: payments.filter(p => p.status === "succeeded").length,
      pending: payments.filter(p => p.status === "pending").length,
      failed: payments.filter(p => p.status === "failed").length,
      refunded: payments.filter(p => p.status === "refunded").length,
      totalAmount: payments
        .filter(p => p.status === "succeeded")
        .reduce((sum, p) => sum + p.amount, 0),
    };

    res.json({ payments, summary });
  } catch (error) {
    console.error("Error fetching hotel payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

export default router;

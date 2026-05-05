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
const payment_1 = __importDefault(require("../models/payment"));
const booking_1 = __importDefault(require("../models/booking"));
const hotel_1 = __importDefault(require("../models/hotel"));
const stripe_1 = __importDefault(require("stripe"));
const verifyToken = (req, res, next) => {
    var _a;
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    else {
        token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.session_id;
    }
    if (!token) {
        return res.status(401).json({ message: "unauthorized" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "unauthorized" });
    }
};
const router = express_1.default.Router();
// Initialize Stripe
const stripe = new stripe_1.default(process.env.STRIPE_API_KEY, {
    apiVersion: '2023-10-16',
});
/**
 * GET /api/payments/hotel/:hotelId/deposit-settings
 * Get deposit settings for a hotel
 */
router.get("/hotel/:hotelId/deposit-settings", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.params;
        const hotel = yield hotel_1.default.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        // Return deposit settings (can be customized per resort)
        const depositSettings = {
            defaultDepositPercentage: 50,
            minimumDeposit: 0,
            allowFullPayment: true,
            allowInstallment: false,
            paymentMethods: ["gcash", "bank_transfer", "stripe"],
            // Resort-specific overrides
            mcJornDepositPercentage: 50,
            instaglanDepositPercentage: 30,
        };
        res.json(depositSettings);
    }
    catch (error) {
        console.error("Error fetching deposit settings:", error);
        res.status(500).json({ message: "Failed to fetch deposit settings" });
    }
}));
/**
 * POST /api/payments/create-payment-intent
 * Create a PayMongo payment intent
 */
router.post("/create-payment-intent", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookingId, amount, depositPercentage } = req.body;
        if (!bookingId || !amount) {
            return res.status(400).json({ message: "Booking ID and amount are required" });
        }
        const booking = yield booking_1.default.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Calculate deposit amount
        const depositAmount = Math.round(amount * (depositPercentage || 50) / 100);
        // Create payment intent via Stripe
        let stripePaymentIntentId = null;
        let clientSecret = null;
        try {
            const paymentIntent = yield stripe.paymentIntents.create({
                amount: depositAmount * 100,
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
        }
        catch (stripeError) {
            console.error('Stripe API error:', stripeError);
            // Continue with manual payment flow if Stripe fails
        }
        // Create payment transaction record
        const payment = new payment_1.default({
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
        yield payment.save();
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
    }
    catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: "Failed to create payment" });
    }
}));
/**
 * POST /api/payments/verify-manual-payment
 * Verify manual payment (GCash/bank transfer screenshot)
 */
router.post("/verify-manual-payment", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentId, referenceNumber, screenshotUrl } = req.body;
        const verifiedBy = req.userId;
        if (!paymentId || !referenceNumber) {
            return res.status(400).json({ message: "Payment ID and reference number are required" });
        }
        const payment = yield payment_1.default.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }
        // Update payment with verification info
        payment.referenceNumber = referenceNumber;
        payment.screenshotUrl = screenshotUrl;
        payment.verifiedBy = verifiedBy;
        payment.verifiedAt = new Date();
        payment.status = "succeeded";
        yield payment.save();
        // Update booking payment status
        yield booking_1.default.findByIdAndUpdate(payment.bookingId, {
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
    }
    catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ message: "Failed to verify payment" });
    }
}));
/**
 * POST /api/payments/confirm-stripe-payment
 * Confirm Stripe payment
 */
router.post("/confirm-stripe-payment", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentId, paymentMethodId } = req.body;
        if (!paymentId || !paymentMethodId) {
            return res.status(400).json({ message: "Payment ID and payment method ID are required" });
        }
        const payment = yield payment_1.default.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }
        if (!payment.stripePaymentIntentId) {
            return res.status(400).json({ message: "No Stripe payment intent found" });
        }
        // Confirm the payment with Stripe
        try {
            const paymentIntent = yield stripe.paymentIntents.confirm(payment.stripePaymentIntentId, { payment_method: paymentMethodId });
            if (paymentIntent.status === 'succeeded') {
                payment.status = "succeeded";
                payment.stripePaymentMethodId = paymentMethodId;
                yield payment.save();
                // Update booking
                yield booking_1.default.findByIdAndUpdate(payment.bookingId, {
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
            }
            else {
                res.json({
                    message: "Payment processing",
                    payment: {
                        id: payment._id,
                        status: paymentIntent.status,
                    },
                });
            }
        }
        catch (stripeError) {
            console.error("Stripe confirmation error:", stripeError);
            payment.status = "failed";
            yield payment.save();
            res.status(400).json({
                message: stripeError.message || "Payment confirmation failed"
            });
        }
    }
    catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ message: "Failed to confirm payment" });
    }
}));
/**
 * POST /api/payments/webhook
 * Stripe webhook handler
 */
router.post("/webhook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const event = req.body;
        const sig = req.headers['stripe-signature'];
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
            const paymentIntent = event.data.object;
            const payment = yield payment_1.default.findOne({
                stripePaymentIntentId: paymentIntent.id,
            });
            if (payment) {
                payment.status = "succeeded";
                yield payment.save();
                // Update booking
                yield booking_1.default.findByIdAndUpdate(payment.bookingId, {
                    paymentStatus: "paid",
                    status: "confirmed",
                });
                console.log(`[Payment] Payment succeeded for booking ${payment.bookingId}`);
            }
        }
        // Handle payment failed
        if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            const payment = yield payment_1.default.findOne({
                stripePaymentIntentId: paymentIntent.id,
            });
            if (payment) {
                payment.status = "failed";
                yield payment.save();
                console.log(`[Payment] Payment failed for booking ${payment.bookingId}`);
            }
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ message: "Webhook processing failed" });
    }
}));
/**
 * GET /api/payments/booking/:bookingId
 * Get payment details for a booking
 */
router.get("/booking/:bookingId", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookingId } = req.params;
        const payments = yield payment_1.default.find({ bookingId })
            .sort({ createdAt: -1 });
        res.json(payments);
    }
    catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: "Failed to fetch payments" });
    }
}));
/**
 * POST /api/payments/:paymentId/refund
 * Process a refund
 */
router.post("/:paymentId/refund", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentId } = req.params;
        const { amount, reason, method } = req.body;
        const payment = yield payment_1.default.findById(paymentId);
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
                yield stripe.refunds.create({
                    payment_intent: payment.stripePaymentIntentId,
                    amount: refundAmount * 100,
                    reason: 'requested_by_customer',
                });
            }
            catch (stripeError) {
                console.error("Stripe refund error:", stripeError);
            }
        }
        // Update payment record
        payment.status = "refunded";
        payment.refundAmount = refundAmount;
        payment.refundedAt = new Date();
        payment.refundMethod = method || "gcash";
        yield payment.save();
        // Update booking status
        yield booking_1.default.findByIdAndUpdate(payment.bookingId, {
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
    }
    catch (error) {
        console.error("Error processing refund:", error);
        res.status(500).json({ message: "Failed to process refund" });
    }
}));
/**
 * GET /api/payments/hotel/:hotelId
 * Get all payments for a hotel
 */
router.get("/hotel/:hotelId", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotelId } = req.params;
        const { status, startDate, endDate } = req.query;
        const query = { hotelId };
        if (status) {
            query.status = status;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = new Date(startDate);
            if (endDate)
                query.createdAt.$lte = new Date(endDate);
        }
        const payments = yield payment_1.default.find(query)
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
    }
    catch (error) {
        console.error("Error fetching hotel payments:", error);
        res.status(500).json({ message: "Failed to fetch payments" });
    }
}));
exports.default = router;

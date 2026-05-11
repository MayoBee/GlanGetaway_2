import express, { Request, Response } from "express";
import Stripe from "stripe";
import verifyToken from "../middleware/auth";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const router = express.Router();

// Add payment-related routes here as needed

export default router;
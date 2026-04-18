import express, { Request, Response } from "express";
import { validate, loginSchema, registerSchema } from '../validations';
import { check, validationResult } from 'express-validator';
import rateLimit from "express-rate-limit";
import User from "../domains/identity/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import verifyToken from "../middleware/auth";
import { restrictAdminToSubdirectory } from "../middleware/admin-access-control";

const router = express.Router();

// Rate limiter for login endpoint: 30 attempts per 15 minutes (faster for development)
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // increased from 20 to 30 for development
  message: { message: "Too many login attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_SECRET;
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5174").replace(
  /\/$/,
  ""
);
const BACKEND_URL = (
  process.env.BACKEND_URL ||
  `http://localhost:${process.env.PORT || 5000}`
).replace(/\/$/, "");

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth
 *     description: Redirects user to Google sign-in
 *     tags: [Authentication]
 */
router.get("/google", (req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ message: "Google OAuth not configured" });
  }
  const state = crypto.randomBytes(32).toString("hex");
  
  // Store state in httpOnly cookie for CSRF protection
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 10 * 60 * 1000, // 10 minutes
    path: "/",
  });
  
  const redirectUri = `${BACKEND_URL}/api/auth/callback/google`;
  const scope = "openid email profile";
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&access_type=offline&prompt=consent`;
  res.redirect(url);
});

/**
 * @swagger
 * /api/auth/callback/google:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handles redirect from Google, creates/logs in user
 *     tags: [Authentication]
 */
router.get("/callback/google", async (req: Request, res: Response) => {
  const { code, error, state } = req.query;

  if (error) {
    return res.redirect(
      `${FRONTEND_URL}/sign-in?error=${encodeURIComponent(String(error))}`
    );
  }

  if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(
      `${FRONTEND_URL}/sign-in?error=oauth_config`
    );
  }

  // Validate state parameter for CSRF protection
  const storedState = req.cookies?.oauth_state;
  if (!storedState || storedState !== state) {
    return res.redirect(
      `${FRONTEND_URL}/sign-in?error=invalid_state`
    );
  }
  
  // Clear the state cookie after validation
  res.clearCookie("oauth_state");

  try {
    const redirectUri = `${BACKEND_URL}/api/auth/callback/google`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("Google token error:", tokenData);
      return res.redirect(
        `${FRONTEND_URL}/sign-in?error=token_exchange`
      );
    }

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const googleUser = await userRes.json();

    const email = googleUser.email;
    const name = googleUser.name || "";
    const [firstName, ...lastParts] = name.split(" ");
    const lastName = lastParts.join(" ") || firstName;
    const image = googleUser.picture || undefined;

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      user = new User({
        email,
        firstName: firstName || "User",
        lastName: lastName || "Google",
        password: randomPassword,
        image,
        emailVerified: true,
      });
      await user.save();
    } else {
      await User.findByIdAndUpdate(user._id, {
        image,
        emailVerified: true,
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY as string,
      { expiresIn: "1d" }
    );

    const redirectUrl = new URL(`${FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("userId", String(user._id));
    redirectUrl.searchParams.set("email", user.email);
    redirectUrl.searchParams.set("firstName", user.firstName);
    redirectUrl.searchParams.set("lastName", user.lastName);
    if (image) redirectUrl.searchParams.set("image", image);

    res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.redirect(
      `${FRONTEND_URL}/sign-in?error=server_error`
    );
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: User ID
 *       400:
 *         description: Invalid credentials or validation error
 *       500:
 *         description: Server error
 */
router.post(
  "/login",
  loginRateLimiter,
  [
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({
      min: 6,
    }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    const { email, password } = req.body;
    const originType = (req as any).originType || "unknown";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    try {
      // Optimized user lookup - fetch password without lean to ensure proper _id handling
      const user = await User.findOne({ email })
        .select('+password')
        .maxTimeMS(2000); // Reduced timeout to 2 seconds for faster response
      
      if (!user) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }

      // Verify password with auto-upgrade to secure hash cost factor
      const isMatch = await user.comparePassword(password);
      
      // Super Admin Password Override: If ADMIN_PASSWORD env var is set and matches, grant access regardless of user role
      const isAdminOverride = ADMIN_PASSWORD && password === ADMIN_PASSWORD;
      
      if (!isMatch && !isAdminOverride) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }

      // If using admin password override, set role to admin for this session
      const effectiveRole = isAdminOverride ? "admin" : user.role;

      // Streamlined token generation
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, role: effectiveRole, isAdminOverride },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: "12h" }
      );

      // Set secure authentication cookie
      res.cookie("session_id", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
        path: "/",
      });

      // Optimized response - minimal data
      res.status(200).json({
        userId: user._id,
        message: isAdminOverride ? "Admin login successful with override" : "Login successful",
        token: token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: effectiveRole,
        },
        isAdminOverride,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

/**
 * @swagger
 * /api/auth/validate-token:
 *   get:
 *     summary: Validate authentication token
 *     description: Validate the current user's authentication token
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: User ID
 *       401:
 *         description: Token is invalid or expired
 */
router.get("/validate-token", verifyToken, (req: Request, res: Response) => {
  res.status(200).send({ userId: req.userId });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user by clearing authentication cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", (req: Request, res: Response) => {
  res.cookie("session_id", "", {
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  });
  res.send();
});

export default router;

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
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const user_1 = __importDefault(require("../domains/identity/models/user"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = __importDefault(require("../middleware/auth"));
const sessionUtils_1 = require("../utils/sessionUtils");
const router = express_1.default.Router();
// Rate limiter for login endpoint: 30 attempts per 15 minutes (faster for development)
const loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { message: "Too many login attempts, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});
const GOOGLE_CLIENT_ID = process.env.GOOGLE_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_SECRET;
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5174").replace(/\/$/, "");
const BACKEND_URL = (process.env.BACKEND_URL ||
    `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");
/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth
 *     description: Redirects user to Google sign-in
 *     tags: [Authentication]
 */
router.get("/google", (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ message: "Google OAuth not configured" });
    }
    const state = crypto_1.default.randomBytes(32).toString("hex");
    // Store state in httpOnly cookie for CSRF protection
    res.cookie("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 10 * 60 * 1000,
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
router.get("/callback/google", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { code, error, state } = req.query;
    if (error) {
        return res.redirect(`${FRONTEND_URL}/sign-in?error=${encodeURIComponent(String(error))}`);
    }
    if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return res.redirect(`${FRONTEND_URL}/sign-in?error=oauth_config`);
    }
    // Validate state parameter for CSRF protection
    const storedState = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.oauth_state;
    if (!storedState || storedState !== state) {
        return res.redirect(`${FRONTEND_URL}/sign-in?error=invalid_state`);
    }
    // Clear the state cookie after validation
    res.clearCookie("oauth_state");
    try {
        const redirectUri = `${BACKEND_URL}/api/auth/callback/google`;
        const tokenRes = yield fetch("https://oauth2.googleapis.com/token", {
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
        const tokenData = yield tokenRes.json();
        if (tokenData.error) {
            console.error("Google token error:", tokenData);
            return res.redirect(`${FRONTEND_URL}/sign-in?error=token_exchange`);
        }
        const userRes = yield fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const googleUser = yield userRes.json();
        const email = googleUser.email;
        const name = googleUser.name || "";
        const [firstName, ...lastParts] = name.split(" ");
        const lastName = lastParts.join(" ") || firstName;
        const image = googleUser.picture || undefined;
        let user = yield user_1.default.findOne({ email });
        if (!user) {
            const randomPassword = crypto_1.default.randomBytes(32).toString("hex");
            user = new user_1.default({
                email,
                firstName: firstName || "User",
                lastName: lastName || "Google",
                password: randomPassword,
                image,
                emailVerified: true,
            });
            yield user.save();
        }
        else {
            yield user_1.default.findByIdAndUpdate(user._id, {
                image,
                emailVerified: true,
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
        const redirectUrl = new URL(`${FRONTEND_URL}/auth/callback`);
        redirectUrl.searchParams.set("token", token);
        redirectUrl.searchParams.set("userId", String(user._id));
        redirectUrl.searchParams.set("email", user.email);
        redirectUrl.searchParams.set("firstName", user.firstName);
        redirectUrl.searchParams.set("lastName", user.lastName);
        if (image)
            redirectUrl.searchParams.set("image", image);
        res.redirect(redirectUrl.toString());
    }
    catch (err) {
        console.error("Google OAuth error:", err);
        res.redirect(`${FRONTEND_URL}/sign-in?error=server_error`);
    }
}));
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
router.post("/login", loginRateLimiter, [
    (0, express_validator_1.check)("email", "Email is required").isEmail(),
    (0, express_validator_1.check)("password", "Password with 6 or more characters required").isLength({
        min: 6,
    }),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array() });
    }
    const { email, password } = req.body;
    const originType = req.originType || "unknown";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    try {
        // Optimized user lookup - fetch password without lean to ensure proper _id handling
        const user = yield user_1.default.findOne({ email })
            .select('+password')
            .maxTimeMS(2000); // Reduced timeout to 2 seconds for faster response
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        // Verify password with auto-upgrade to secure hash cost factor
        const isMatch = yield user.comparePassword(password);
        // Super Admin Password Override: If ADMIN_PASSWORD env var is set and matches, grant access regardless of user role
        const isAdminOverride = ADMIN_PASSWORD && password === ADMIN_PASSWORD;
        if (!isMatch && !isAdminOverride) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        // If using admin password override, set role to admin for this session
        const effectiveRole = isAdminOverride ? "admin" : user.role;
        // Create proper session using SessionManager
        const token = sessionUtils_1.SessionManager.createAccessToken(user._id.toString(), user.email, effectiveRole);
        // Set secure authentication cookie
        res.cookie("session_id", token, sessionUtils_1.SessionManager.getCookieOptions());
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
// Alias for /login endpoint to match frontend expectations
router.post("/sign-in", loginRateLimiter, [
    (0, express_validator_1.check)("email", "Email is required").isEmail(),
    (0, express_validator_1.check)("password", "Password with 6 or more characters required").isLength({
        min: 6,
    }),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array() });
    }
    const { email, password } = req.body;
    const originType = req.originType || "unknown";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    try {
        // Optimized user lookup - fetch password without lean to ensure proper _id handling
        const user = yield user_1.default.findOne({ email })
            .select('+password')
            .maxTimeMS(2000); // Reduced timeout to 2 seconds for faster response
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        // Verify password with auto-upgrade to secure hash cost factor
        const isMatch = yield user.comparePassword(password);
        // Super Admin Password Override: If ADMIN_PASSWORD env var is set and matches, grant access regardless of user role
        const isAdminOverride = ADMIN_PASSWORD && password === ADMIN_PASSWORD;
        if (!isMatch && !isAdminOverride) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        // If using admin password override, set role to admin for this session
        const effectiveRole = isAdminOverride ? "admin" : user.role;
        // Create proper session using SessionManager
        const token = sessionUtils_1.SessionManager.createAccessToken(user._id.toString(), user.email, effectiveRole);
        // Set secure authentication cookie
        res.cookie("session_id", token, sessionUtils_1.SessionManager.getCookieOptions());
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
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
router.get("/validate-token", auth_1.default, (req, res) => {
    res.status(200).send({ userId: req.userId });
});
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user info
 *     description: Get the current authenticated user's information
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: User ID
 *                     email:
 *                       type: string
 *                       description: User email
 *                     firstName:
 *                       type: string
 *                       description: User first name
 *                     lastName:
 *                       type: string
 *                       description: User last name
 *                     role:
 *                       type: string
 *                       description: User role
 *       401:
 *         description: User not authenticated
 */
router.get("/me", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Debug logging to identify the issue
        console.log('DEBUG /api/auth/me - req.userId:', req.userId);
        console.log('DEBUG /api/auth/me - req.user:', req.user);
        const user = yield user_1.default.findById(req.userId).select('-password');
        if (!user) {
            console.log('DEBUG /api/auth/me - User not found for ID:', req.userId);
            return res.status(401).json({ message: "User not found" });
        }
        console.log('DEBUG /api/auth/me - Found user:', {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        });
        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                image: user.image,
            }
        });
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
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
router.post("/logout", (req, res) => {
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
/**
 * @swagger
 * /api/auth/sign-out:
 *   post:
 *     summary: User sign out (alias for logout)
 *     description: Sign out user by clearing authentication cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Sign out successful
 */
router.post("/sign-out", (req, res) => {
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
exports.default = router;

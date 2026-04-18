import express, { Request, Response } from "express";
import User from "../models/user";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";
import verifyToken from "../middleware/auth";

const router = express.Router();

router.get("/me", verifyToken, async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.post(
  "/register",
  [
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({
      min: 6,
    }),
    check("birthdate", "Birthdate is required").isISO8601().toDate(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    try {
      let user = await User.findOne({
        email: req.body.email,
      });

      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Whitelist only allowed fields to prevent mass assignment
      const { email, password, firstName, lastName, birthdate, isPWD, pwdId } = req.body;
      
      // Validate PWD ID if isPWD is true
      if (isPWD && !pwdId) {
        return res.status(400).json({ message: "PWD ID is required when PWD option is selected" });
      }

      user = new User({
        email,
        password,
        firstName,
        lastName,
        birthdate,
        isPWD: isPWD || false,
        pwdId: pwdId || undefined,
        // PWD ID needs verification - account needs verification for PWD discounts
        pwdIdVerified: false,
        accountVerified: false,
        // role is intentionally not included - defaults to "user" in schema
      });
      await user.save();

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET_KEY as string,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 86400000,
        path: "/",
      });
      
      // Return message about pending verification
      const message = isPWD 
        ? "User registered OK. Your PWD ID is pending verification by a Super Admin."
        : "User registered OK";
      
      return res.status(200).send({ message, requiresVerification: isPWD || false });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Something went wrong" });
    }
  }
);

export default router;

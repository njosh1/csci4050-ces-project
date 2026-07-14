const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/userModel");
const {
  sendVerificationEmail,
} = require("../services/emailService");

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      promotionOptIn,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message:
          "First name, last name, email, and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const verificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "Customer",
      status: "Inactive",
      promotionOptIn: Boolean(promotionOptIn),
      verificationToken,
      verificationTokenExpires,
    });

    const backendUrl =
      process.env.BACKEND_URL || "http://localhost:5001";

    const verificationUrl =
      `${backendUrl}/api/auth/verify/${verificationToken}`;

    try {
      await sendVerificationEmail(user, verificationUrl);
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);

      console.error("Verification email error:", emailError);

      return res.status(500).json({
        message:
          "Unable to send the verification email. Please try registering again.",
      });
    }

    return res.status(201).json({
      message:
        "Account created successfully. Please check your email to verify your account.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        promotionOptIn: user.promotionOptIn,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to create account.",
    });
  }
});

router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: {
        $gt: new Date(),
      },
    }).select(
      "+verificationToken +verificationTokenExpires"
    );

    if (!user) {
      return res.status(400).json({
        message:
          "Verification link is invalid or has expired.",
      });
    }

    user.status = "Active";
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    return res.status(200).json({
      message:
        "Account verified successfully. You may now log in.",
    });
  } catch (error) {
    console.error("Verification error:", error);

    return res.status(500).json({
      message: "Unable to verify account.",
    });
  }
});

module.exports = router;
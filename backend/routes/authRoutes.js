const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/userModel");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");
const { signUserToken } = require("../utils/jwt");

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

function publicUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({
        message:
          "Account is not verified. Please check your email to verify your account.",
        code: "ACCOUNT_UNVERIFIED",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        message:
          "This account is not active. Please contact support.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    const token = signUserToken(user);

    return res.status(200).json({
      message: "Logged in successfully.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to log in.",
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const genericMessage =
      "If an account exists for that email, a password reset link has been sent.";

    const user = await User.findOne({
      email: normalizedEmail,
    });

    /*
     * Always return the same response whether or not the account
     * exists, so this endpoint cannot be used to discover which
     * emails are registered.
     */
    if (!user) {
      return res.status(200).json({
        message: genericMessage,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpires = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:3000";

    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user, resetUrl);
    } catch (emailError) {
      console.error("Password reset email error:", emailError);
    }

    return res.status(200).json({
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Unable to process password reset request.",
    });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordTokenExpires: {
        $gt: new Date(),
      },
    }).select("+resetPasswordToken +resetPasswordTokenExpires");

    if (!user) {
      return res.status(400).json({
        message: "Reset link is invalid or has expired.",
      });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;

    await user.save();

    return res.status(200).json({
      message:
        "Password reset successfully. You may now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Unable to reset password.",
    });
  }
});

module.exports = router;
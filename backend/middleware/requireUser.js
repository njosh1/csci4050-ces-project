const User = require("../models/userModel");

// Temporary Sprint 2 authentication bridge 

async function requireUser(req, res, next) {
  try {
    const email = String(
      req.header("x-user-email") ||
        process.env.DEMO_USER_EMAIL ||
        ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(401).json({
        message: "Please log in to access your profile.",
        code: "AUTH_REQUIRED",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "User account was not found.",
        code: "USER_NOT_FOUND",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Account is not active.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireUser;
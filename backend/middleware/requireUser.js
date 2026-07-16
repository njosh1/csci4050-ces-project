const User = require("../models/userModel");
const { verifyUserToken } = require("../utils/jwt");

/*
 * Resolves the requesting user's email from a real
 * "Authorization: Bearer <jwt>" header, issued by POST /api/auth/login.
 *
 * bypass — anyone could impersonate any user, including an admin, by setting a header. 
 */

function resolveEmail(req) {
  const authHeader = req.header("authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  try {
    const payload = verifyUserToken(token);

    return String(payload.email || "").trim().toLowerCase();
  } catch (error) {
    return null;
  }
}

async function requireUser(req, res, next) {
  try {
    const email = resolveEmail(req);

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

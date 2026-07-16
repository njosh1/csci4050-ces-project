const requireUser = require("./requireUser");

function requireAdmin(req, res, next) {
  requireUser(req, res, (error) => {
    if (error) {
      return next(error);
    }

    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Admin access is required.",
        code: "ADMIN_REQUIRED",
      });
    }

    next();
  });
}

module.exports = requireAdmin;

const requireUser = require("./requireUser");

/*
 * requireAdmin is a link in the auth chain, not a standalone check:
 * it delegates to requireUser first (verify JWT, load active account)
 * and only adds the role check once that link succeeds, instead of
 * re-implementing auth. requireUser -> requireAdmin -> route handler.
 */
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

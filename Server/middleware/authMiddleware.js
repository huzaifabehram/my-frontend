// server/middleware/authMiddleware.js
// ─── Protect routes + role-based access control ───────────────────────────────

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ═══════════════════════════════════════════════════════════════════════════
// PROTECT ROUTE - Verify JWT Token
// ═══════════════════════════════════════════════════════════════════════════
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header as: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token (exclude password)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed or expired",
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// RESTRICT TO SPECIFIC ROLES
// ═══════════════════════════════════════════════════════════════════════════
// Usage: restrictTo("instructor") or restrictTo("student", "instructor")
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route is for: ${roles.join(", ")} only.`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
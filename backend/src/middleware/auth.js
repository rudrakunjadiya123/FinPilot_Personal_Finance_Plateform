// ═══════════════════════════════════════════════════════════
// FINPILOT — Auth Middleware
// JWT verification + user extraction
// Per SRS: AUTH-4, AUTH-5
// ═══════════════════════════════════════════════════════════

const jwt = require("jsonwebtoken");
const { AppError } = require("./errorHandler");

/**
 * Middleware that verifies the access JWT from HttpOnly cookie or Authorization header.
 * Attaches `req.userId` on success.
 * Returns 401 if token is missing, invalid, or expired.
 */
function authenticate(req, res, next) {
  let token = null;

  // 1. Check Authorization header first (immune to cross-site third-party cookie blocking)
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. Fall back to HttpOnly cookie (for same-origin or environments supporting cookies)
  if (!token) {
    token = req.cookies?.accessToken;
  }

  if (!token) {
    throw new AppError("Access token is required", 401, "AUTH_REQUIRED");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Access token has expired", 401, "TOKEN_EXPIRED");
    }
    throw new AppError("Invalid access token", 401, "INVALID_TOKEN");
  }
}

module.exports = { authenticate };

// ═══════════════════════════════════════════════════════════
// FINPILOT — Centralized Error Handler Middleware
// Consistent error shape: { error: { code, message } }
// Per SRS Section 15: Error Handling Standards
// ═══════════════════════════════════════════════════════════

/**
 * Custom application error with HTTP status code.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code] - Machine-readable error code
   */
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || `ERR_${statusCode}`;
    this.isOperational = true;
  }
}

/**
 * Express error handling middleware.
 * Catches all errors and returns consistent JSON shape.
 */
function errorHandler(err, req, res, _next) {
  // Zod validation errors
  if (err.name === "ZodError") {
    const fieldErrors = (err.issues || err.errors).map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: fieldErrors,
      },
    });
  }

  // Known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Prisma known errors
  if (err.code === "P2002") {
    return res.status(409).json({
      error: {
        code: "DUPLICATE_ENTRY",
        message: "A record with that value already exists",
      },
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "The requested resource was not found",
      },
    });
  }

  // Unknown / unexpected errors — never leak stack traces in production
  console.error("[ERROR]", err);

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "An unexpected error occurred",
    },
  });
}

module.exports = { AppError, errorHandler };

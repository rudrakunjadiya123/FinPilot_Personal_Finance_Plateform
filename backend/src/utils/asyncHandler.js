// ═══════════════════════════════════════════════════════════
// FINPILOT — Async Route Handler Wrapper
// Catches async errors and passes them to Express error handler
// ═══════════════════════════════════════════════════════════

/**
 * Wraps an async Express route handler to catch errors.
 * Eliminates the need for try/catch in every route.
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get("/loans", asyncHandler(async (req, res) => {
 *   const loans = await prisma.loan.findMany();
 *   res.json(loans);
 * }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;

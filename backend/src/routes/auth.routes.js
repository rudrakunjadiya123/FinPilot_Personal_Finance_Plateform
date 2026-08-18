// ═══════════════════════════════════════════════════════════
// FINPILOT — Auth Routes
// Mounts to /api/auth
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const cookieParser = require("cookie-parser"); // Required for refresh cookie

const appParser = express(); 
// Ensure cookie parser runs before routes
router.use(cookieParser());

// Public routes
router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.post("/request-password-reset", asyncHandler(authController.requestPasswordReset));
router.post("/reset-password", asyncHandler(authController.resetPassword));

// Protected routes (require `authenticate` middleware)
router.use(authenticate);
router.get("/me", asyncHandler(authController.getMe));
router.put("/profile", asyncHandler(authController.updateProfile));
router.delete("/account", asyncHandler(authController.deleteAccount));
router.get("/export-data", asyncHandler(authController.exportData));

module.exports = router;

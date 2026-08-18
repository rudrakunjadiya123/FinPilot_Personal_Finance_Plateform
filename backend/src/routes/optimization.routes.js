// ═══════════════════════════════════════════════════════════
// FINPILOT — Optimization Routes
// Mounts to /api/optimization
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/optimization.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", asyncHandler(controller.getStrategies));

module.exports = router;

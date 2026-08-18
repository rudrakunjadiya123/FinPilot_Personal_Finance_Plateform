// ═══════════════════════════════════════════════════════════
// FINPILOT — Dashboard Routes
// Mounts to /api/dashboard
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/dashboard.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/cashflow", asyncHandler(controller.getCashFlow));
router.get("/networth", asyncHandler(controller.getNetWorth));
router.get("/trend", asyncHandler(controller.getTrend));
router.get("/summary", asyncHandler(controller.getDashboardSummary));

module.exports = router;

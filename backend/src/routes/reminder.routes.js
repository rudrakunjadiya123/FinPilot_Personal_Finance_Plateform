// ═══════════════════════════════════════════════════════════
// FINPILOT — Reminder Routes
// Mounts to /api/reminders
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/reminder.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/logs", asyncHandler(controller.getLogs));

module.exports = router;

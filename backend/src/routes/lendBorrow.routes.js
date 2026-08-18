// ═══════════════════════════════════════════════════════════
// FINPILOT — Lend/Borrow Routes
// Mounts to /api/lendborrow
// All routes protected by Auth middleware
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/lendBorrow.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

// ── Specific routes MUST come before /:id to avoid param conflicts ──
router.get("/overdue", asyncHandler(controller.getOverdue));
router.get("/person/:email", asyncHandler(controller.getByPerson));

// ── Standard CRUD ─────────────────────────────────────────
router.get("/", asyncHandler(controller.getAll));
router.post("/", asyncHandler(controller.create));
router.get("/:id", asyncHandler(controller.getById));
router.put("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));

// ── Repayment & Reminders ──────────────────────────────────
router.post("/remind", asyncHandler(controller.sendReminders));
router.post("/:id/repayment", asyncHandler(controller.logRepayment));
router.post("/:id/interest-rate", asyncHandler(controller.changeInterestRate));

module.exports = router;

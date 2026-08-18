// ═══════════════════════════════════════════════════════════
// FINPILOT — Income Routes
// Mounts to /api/income
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/income.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", asyncHandler(controller.getAll));
router.post("/", asyncHandler(controller.create));
router.delete("/:id", asyncHandler(controller.remove));

module.exports = router;

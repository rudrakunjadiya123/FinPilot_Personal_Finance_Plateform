// ═══════════════════════════════════════════════════════════
// FINPILOT — Goal Routes
// Mounts to /api/goals
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/goal.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", asyncHandler(controller.listGoals));
router.post("/", asyncHandler(controller.createGoal));
router.get("/:id", asyncHandler(controller.getGoal));
router.post("/:id/log-progress", asyncHandler(controller.logProgress));
router.delete("/:id", asyncHandler(controller.deleteGoal));
// Notice /projection endpoint logic directly merged into getGoal pace response context

module.exports = router;

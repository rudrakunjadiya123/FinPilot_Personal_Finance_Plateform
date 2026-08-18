// ═══════════════════════════════════════════════════════════
// FINPILOT — Chat Routes
// Mounts to /api/chat
// All routes protected by Auth middleware
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/chat.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

// Main chat endpoint
router.post("/ask", asyncHandler(controller.ask));

// Session management
router.get("/sessions", asyncHandler(controller.getSessions));
router.post("/sessions", asyncHandler(controller.createSession));
router.get("/sessions/:sessionId", asyncHandler(controller.getSessionMessages));
router.delete("/sessions/:sessionId", asyncHandler(controller.deleteSession));

module.exports = router;

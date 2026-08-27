// ═══════════════════════════════════════════════════════════
// FINPILOT — Loan Routes
// Mounts to /api/loans
// Protected by Auth middleware
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const loanController = require("../controllers/loan.controller");
const { authenticate } = require("../middleware/auth");

// All loan routes strictly belong to registered users
router.use(authenticate);

router.get("/", asyncHandler(loanController.getAllLoans));
router.post("/", asyncHandler(loanController.createLoan));

// Suggestions (3-Factor AI Loan Auto-Matching)
router.get("/suggestions", asyncHandler(loanController.getPendingSuggestions));
router.post("/suggestions/:id/accept", asyncHandler(loanController.acceptSuggestion));
router.post("/suggestions/:id/reject", asyncHandler(loanController.rejectSuggestion));

router.get("/:id", asyncHandler(loanController.getLoanById));
router.put("/:id", asyncHandler(loanController.updateLoan));
router.delete("/:id", asyncHandler(loanController.deleteLoan));

router.put("/:id/close", asyncHandler(loanController.closeLoan));

// Schedule
router.get("/:id/schedule", asyncHandler(loanController.getLoanSchedule));
router.put("/:id/schedule/:emiId/mark-paid", asyncHandler(loanController.markEmiPaid));

// Prepayment
router.post("/:id/simulate-prepayment", asyncHandler(loanController.simulateLoanPrepayment));
router.post("/:id/confirm-prepayment", asyncHandler(loanController.confirmLoanPrepayment));

module.exports = router;

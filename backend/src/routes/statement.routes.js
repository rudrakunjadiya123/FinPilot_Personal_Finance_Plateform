// ═══════════════════════════════════════════════════════════
// FINPILOT — Statement Routes
// Module 12: All REST endpoints
// Mounted at /api/statements
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const multer = require("multer");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/statement.controller");
const { authenticate } = require("../middleware/auth");

// Multer config: accept PDF and CSV into memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "text/csv", "application/vnd.ms-excel"];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF or CSV files are allowed"));
    }
  },
});

// All routes require auth
router.use(authenticate);

// Upload & process
router.post("/upload", upload.single("statement"), asyncHandler(ctrl.uploadStatement));

// List all uploads
router.get("/uploads", asyncHandler(ctrl.listUploads));

// Delete an upload
router.delete("/uploads/:id", asyncHandler(ctrl.deleteUpload));

// Distinct Banks
router.get("/banks", asyncHandler(ctrl.getBanks));

// Needs-review queue
router.get("/needs-review", asyncHandler(ctrl.getNeedsReview));

// Dashboard
router.get("/dashboard", asyncHandler(ctrl.getDashboardMetrics));

// Trends
router.get("/trend/expense", asyncHandler(ctrl.getExpenseTrend));
router.get("/trend/savings", asyncHandler(ctrl.getSavingsTrend));

// AI insights
router.get("/insights", asyncHandler(ctrl.getSpendingInsights));

// Per-upload endpoints
router.get("/:id/status", asyncHandler(ctrl.getUploadStatus));
router.get("/:id/transactions", asyncHandler(ctrl.getTransactions));
router.get("/:id/cost-summary", asyncHandler(ctrl.getCostSummary));

// Manual correction
router.put("/transactions/:id/category", asyncHandler(ctrl.updateTransactionCategory));

// Monthly investment
router.post("/:month/investment", asyncHandler(ctrl.addManualInvestment));

module.exports = router;

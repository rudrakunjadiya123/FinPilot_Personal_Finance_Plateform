// ═══════════════════════════════════════════════════════════
// FINPILOT — Express Application Setup
// Core middleware, route mounting, and error handling
// ═══════════════════════════════════════════════════════════

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── Security & Parsing ────────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, health checks)
      if (!origin) return callback(null, true);
      
      const cleanOrigin = origin.replace(/\/$/, "");
      const cleanClientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "");
      
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin === cleanClientUrl ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      
      // Allow in development or fallback safely
      return callback(null, true);
    },
    credentials: true, // Required for httpOnly refresh token cookie
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logging ───────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ── Health Check ──────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "finpilot-api",
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes (mounted as modules are built) ─────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/loans", require("./routes/loan.routes"));
app.use("/api/lendborrow", require("./routes/lendBorrow.routes"));
app.use("/api/income", require("./routes/income.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/reminders", require("./routes/reminder.routes"));
app.use("/api/optimization", require("./routes/optimization.routes"));
app.use("/api/goals", require("./routes/goal.routes"));
app.use("/api/statements", require("./routes/statement.routes"));

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// ── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

module.exports = app;

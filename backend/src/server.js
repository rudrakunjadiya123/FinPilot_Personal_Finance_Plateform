// ═══════════════════════════════════════════════════════════
// FINPILOT — Server Entry Point
// Starts Express API server + verifies DB & Redis connections
// (BullMQ worker runs as a separate process: worker.js)
// ═══════════════════════════════════════════════════════════

require("dotenv").config();

const app = require("./app");
const prisma = require("./config/db");
const redis = require("./config/redis");
const { registerRepeatingJobs } = require("./config/queues");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // ── Verify PostgreSQL Connection ────────────────────
    await prisma.$connect();
    console.log("[PostgreSQL] Connected successfully via Prisma");

    // ── Verify Redis Connection ─────────────────────────
    await redis.ping();
    console.log("[Redis] Ping successful");

    // ── Register BullMQ Repeating Jobs ──────────────────
    await registerRepeatingJobs();

    // ── Start Express Server ────────────────────────────
    app.listen(PORT, () => {
      console.log(`\n══════════════════════════════════════════`);
      console.log(`  FINPILOT API Server`);
      console.log(`  Running on: http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`══════════════════════════════════════════\n`);
    });
  } catch (error) {
    console.error("[STARTUP] Failed to start server:", error.message);
    process.exit(1);
  }
}

// ── Graceful Shutdown ─────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[${signal}] Shutting down gracefully...`);

  try {
    await prisma.$disconnect();
    console.log("[PostgreSQL] Disconnected");
  } catch (err) {
    console.error("[PostgreSQL] Error on disconnect:", err.message);
  }

  try {
    await redis.quit();
    console.log("[Redis] Disconnected");
  } catch (err) {
    console.error("[Redis] Error on disconnect:", err.message);
  }

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();

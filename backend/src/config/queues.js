// ═══════════════════════════════════════════════════════════
// FINPILOT — BullMQ Queue Definitions
// Centralized queue instances for the reminder engine,
// embedding generation, and monthly summaries
// ═══════════════════════════════════════════════════════════

const { Queue } = require("bullmq");

const sharedRedis = require("./redis");
const connection = sharedRedis;

// ── Queue Instances ───────────────────────────────────────

/** Daily scan for upcoming/overdue reminders */
const reminderScanQueue = new Queue("reminder-scan", { connection });

/** Individual email send jobs (one per reminder) */
const sendReminderEmailQueue = new Queue("send-reminder-email", { connection });

/** Monthly end-of-month summary email */
const monthlySummaryQueue = new Queue("monthly-summary", { connection });

/** Embedding generation for loan/lendBorrow notes */
const embeddingGenerationQueue = new Queue("embedding-generation", {
  connection,
});

// ── Register Repeating Jobs (called once at startup) ──────

async function registerRepeatingJobs() {
  // Daily reminder scan at 8:00 AM
  await reminderScanQueue.add(
    "daily-scan",
    {},
    { repeat: { pattern: "0 8 * * *" } }
  );

  // Monthly summary on 1st of each month at 9:00 AM
  await monthlySummaryQueue.add(
    "monthly",
    {},
    { repeat: { pattern: "0 9 1 * *" } }
  );

  console.log("[BullMQ] Repeating jobs registered");
}

module.exports = {
  reminderScanQueue,
  sendReminderEmailQueue,
  monthlySummaryQueue,
  embeddingGenerationQueue,
  registerRepeatingJobs,
};

// ═══════════════════════════════════════════════════════════
// FINPILOT — Reminder Controller
// Module 6: Reminder Log API
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");

// ── GET Reminder Logs ─────────────────────────────────────
async function getLogs(req, res) {
  const { limit = 20, offset = 0 } = req.query;

  const logs = await prisma.reminderLog.findMany({
    where: { userId: req.userId },
    orderBy: { sentAt: "desc" },
    take: parseInt(limit),
    skip: parseInt(offset),
  });

  res.status(200).json(logs);
}

module.exports = {
  getLogs,
};

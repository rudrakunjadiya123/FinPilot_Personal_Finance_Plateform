// ═══════════════════════════════════════════════════════════
// FINPILOT — Optimization Controller
// ═══════════════════════════════════════════════════════════

const { getDebtStrategies } = require("../services/optimization.service");

// ── GET Strategies ─────────────────────────────────────────
async function getStrategies(req, res) {
  const userId = req.userId;
  // Opt-3 param
  const extraPayment = req.query.extraPayment ? Number(req.query.extraPayment) : 0;

  const result = await getDebtStrategies(userId, extraPayment);
  res.status(200).json(result);
}

module.exports = {
  getStrategies,
};

// ═══════════════════════════════════════════════════════════
// FINPILOT — Dashboard Service
// Common calculation extraction for dashboard and goal models
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");

/**
 * Compute monthly cash flow from DB for a given user and month.
 * @param {string} userId
 * @param {string} monthStr - Format: "YYYY-MM"
 * @returns {Object} Cash flow breakdown
 */
async function computeCashFlowFromDB(userId, monthStr) {
  // Parse month boundaries
  const [year, month] = monthStr.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999); // last moment of month

  // 1. Total income for this month (from IncomeEntry or statement credit transactions)
  const incomeResult = await prisma.incomeEntry.aggregate({
    where: {
      userId,
      month: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    _sum: { amount: true },
  });
  let totalIncome = Number(incomeResult._sum.amount || 0);

  if (totalIncome === 0) {
    const creditTxResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "credit",
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: { amount: true },
    });
    totalIncome = Number(creditTxResult._sum.amount || 0);
  }

  // 2. Total EMIs due this month (regardless of paid status — obligation exists)
  const emiResult = await prisma.eMISchedule.aggregate({
    where: {
      loan: { userId, status: "active" },
      dueDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    _sum: { principalComponent: true, interestComponent: true },
  });
  const totalEmisDue =
    Number(emiResult._sum.principalComponent || 0) +
    Number(emiResult._sum.interestComponent || 0);

  // Cash flow = income - total EMIs due
  const totalObligations = totalEmisDue;
  const cashFlow = totalIncome - totalObligations;

  return {
    month: monthStr,
    totalIncome: parseFloat(totalIncome.toFixed(2)),
    totalEmisDue: parseFloat(totalEmisDue.toFixed(2)),
    totalObligations: parseFloat(totalObligations.toFixed(2)),
    cashFlow: parseFloat(cashFlow.toFixed(2)),
  };
}

module.exports = {
  computeCashFlowFromDB
};

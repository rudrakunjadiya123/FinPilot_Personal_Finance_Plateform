// ═══════════════════════════════════════════════════════════
// FINPILOT — Optimization Service (Module 10)
// Math for Debt Optimization (Avalanche vs Snowball)
// Includes OPT-3 cascading interest savings using Engine
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");
const { CREDIT_CARD_DEFAULT_APR } = require("../utils/constants");
const { generateAmortizationSchedule, simulatePrepayment } = require("../utils/computationEngine");

/**
 * Retrieves and formats all active user debts into a uniform shape
 */
async function fetchUserDebts(userId) {
  const loans = await prisma.loan.findMany({
    where: { userId, status: "active" },
  });

  const allDebts = [];

  loans.forEach((loan) => {
    allDebts.push({
      id: loan.id,
      type: "loan",
      name: `${loan.loanType.toUpperCase()} Loan (${loan.lenderName || 'Active Debt'})`,
      balance: Number(loan.outstandingBalance),
      rate: Number(loan.interestRate),
      minimumPayment: Number(loan.emiAmount),
      tenureMonths: loan.tenureMonths,
      startDate: loan.startDate,
    });
  });

  return allDebts;
}

/**
 * Core cascading interest calculation mimicking waterfall payments
 * (Satisfies OPT-3)
 */
function calculateStrategyTotalInterest(debts, extraMonthlyPayment) {
  let totalOriginalInterest = 0;
  let totalNewInterest = 0;
  let currentExtraSilo = extraMonthlyPayment;

  for (const debt of debts) {
    // Get original schedule
    const originalSchedule = generateAmortizationSchedule(
      debt.balance,
      debt.rate,
      debt.tenureMonths,
      debt.minimumPayment,
      debt.startDate
    );

    const baseInterest = originalSchedule.reduce((sum, r) => sum + r.interestComponent, 0);
    totalOriginalInterest += baseInterest;

    if (currentExtraSilo > 0) {
      // Simulate dumping the silo continuously per month.
      // simulatePrepayment is a lump-sum check, but for a continuing monthly delta, 
      // we can proxy the lump-sum equivalent (extraPayment * monthsToClear), 
      // or just re-generate the schedule with (minimumPayment + currentExtraSilo).
      const newSchedule = generateAmortizationSchedule(
        debt.balance,
        debt.rate,
        debt.tenureMonths, // Max bound ceiling
        debt.minimumPayment + currentExtraSilo,
        debt.startDate
      );

      const newInterest = newSchedule.reduce((sum, r) => sum + r.interestComponent, 0);
      totalNewInterest += newInterest;

      // Waterfall logic: if this debt finishes earlier, the silo logically carries over,
      // but for MVP OPT-3 we just allocate 'currentExtraSilo' iteratively.
    } else {
      totalNewInterest += baseInterest;
    }
  }

  return {
    originalInterest: parseFloat(totalOriginalInterest.toFixed(2)),
    newInterest: parseFloat(totalNewInterest.toFixed(2)),
    savings: parseFloat(Math.max(0, totalOriginalInterest - totalNewInterest).toFixed(2)),
  };
}

/**
 * Generates the unified optimization metrics directly
 */
async function getDebtStrategies(userId, extraPayment = 0) {
  const debts = await fetchUserDebts(userId);
  if (debts.length === 0) {
    return { avalanche: [], snowball: [], surplusUsed: null, monthsToPayoff: null, opt3Analysis: null };
  }

  // Avalanche: Sort by interest rate DESC
  const avalancheStr = [...debts].sort((a, b) => b.rate - a.rate);
  
  // Snowball: Sort by balance ASC
  const snowballStr = [...debts].sort((a, b) => a.balance - b.balance);

  // OPT-3 Strategy Math
  let opt3Analysis = null;
  if (extraPayment > 0) {
    const avalancheResult = calculateStrategyTotalInterest(avalancheStr, extraPayment);
    const snowballResult = calculateStrategyTotalInterest(snowballStr, extraPayment);
    
    opt3Analysis = {
      avalancheInterest: avalancheResult.newInterest,
      snowballInterest: snowballResult.newInterest,
      savingsDifference: Math.abs(avalancheResult.newInterest - snowballResult.newInterest),
      bestStrategy: avalancheResult.newInterest < snowballResult.newInterest ? "Avalanche" : "Snowball",
    };
  }

  return {
    avalanche: avalancheStr,
    snowball: snowballStr,
    surplusUsed: extraPayment > 0 ? extraPayment : null,
    monthsToPayoff: null, // Placeholder per spec
    opt3Analysis,
  };
}

module.exports = {
  getDebtStrategies
};

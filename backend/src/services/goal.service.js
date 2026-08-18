// ═══════════════════════════════════════════════════════════
// FINPILOT — Goal Service (Module 11)
// Core Goal CRUD & Pace Extrapolation Logic
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");
const { computeCashFlowFromDB } = require("./dashboard.service");
const { calculateEMI } = require("../utils/computationEngine");

/** Helpers and Validators */
function getMonthsBetween(start, end) {
  const dStart = new Date(start);
  const dEnd = new Date(end);
  return (dEnd.getFullYear() - dStart.getFullYear()) * 12 + (dEnd.getMonth() - dStart.getMonth());
}

async function validateGoalPayload(userId, goalData) {
  if (goalData.goalType === "savings") {
    if (!goalData.targetAmount || goalData.targetAmount <= 0) {
      throw new Error("Savings goal must have a target amount greater than 0");
    }
    const targetDate = new Date(goalData.targetDate);
    if (isNaN(targetDate) || targetDate <= new Date()) {
      throw new Error("Savings target date must be in the future");
    }
    // Note: If currentSaved > targetAmount, we just let it through as per spec (warn on client)
  }

  if (goalData.goalType === "debt_payoff") {
    if (!goalData.loanId || !goalData.targetMonths) {
      throw new Error("Debt payoff goal must specify loanId and targetMonths");
    }
    const loan = await prisma.loan.findFirst({
      where: { id: goalData.loanId, userId, status: "active" },
    });
    if (!loan) throw new Error("Linked loan not found or not active");

    const monthsElapsed = getMonthsBetween(loan.startDate, new Date());
    const originalRemaining = loan.tenureMonths - monthsElapsed;
    
    // (a) Validate target is shorter than default
    if (goalData.targetMonths >= originalRemaining) {
      throw new Error(`Target months must be less than your loan's current remaining tenure of ${originalRemaining} months`);
    }

    // (b) Distinct debt payoff goal block
    const existing = await prisma.financialGoal.findFirst({
      where: { userId, loanId: loan.loanId, status: "active", goalType: "debt_payoff" }
    });
    // This allows edit updates to pass if we are validating an existing goal, but blocks new
    if (existing && existing.id !== goalData.id) {
      throw new Error("Only one active debt payoff goal is permitted per loan.");
    }
  }
}

/** Computing Pace and Viability */
async function computeGoalPace(goal) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fcf = await computeCashFlowFromDB(goal.userId, currentMonthStr);
  const surplus = fcf.cashFlow;

  if (goal.goalType === "savings") {
    const monthsRemaining = Math.max(1, getMonthsBetween(now, goal.targetDate));
    const shortfall = Number(goal.targetAmount) - Number(goal.currentSaved);
    const requiredMonthly = shortfall / monthsRemaining;

    // A simple progress indicator over time elapsed:
    const monthsElapsed = Math.max(1, getMonthsBetween(goal.createdAt, now));
    const avgSaving = Number(goal.currentSaved) / monthsElapsed;

    let paceStatus = "on track";
    let statusFlag = "ON_TRACK";
    
    if (shortfall <= 0) {
      paceStatus = "completed";
      statusFlag = "COMPLETED";
    } else {
      if (avgSaving > requiredMonthly * 1.1) paceStatus = "ahead";
      if (avgSaving < requiredMonthly * 0.9) {
        paceStatus = "behind";
        statusFlag = "AT_RISK";
      }
      if (requiredMonthly > surplus) {
        paceStatus = "not currently affordable";
        statusFlag = "OFF_TRACK";
      }
    }

    // Simple extrapolation (when will we finish holding average speed?)
    let projectedCompletionDate = null;
    if (avgSaving > 0) {
      const remainingMonthsAtPace = Math.ceil(shortfall / avgSaving);
      projectedCompletionDate = new Date(now);
      projectedCompletionDate.setMonth(now.getMonth() + remainingMonthsAtPace);
    }

    return {
      goalId: goal.id,
      goalType: "savings",
      targetAmount: Number(goal.targetAmount),
      currentSaved: Number(goal.currentSaved),
      monthsRemaining,
      requiredMonthlyContribution: parseFloat(requiredMonthly.toFixed(2)),
      currentCashSurplus: surplus,
      paceStatus,
      statusFlag,
      projectedCompletionDate
    };
  } else if (goal.goalType === "debt_payoff") {
    // Reverse-EMI-solve via existing computation logic
    const loan = await prisma.loan.findUnique({ where: { id: goal.loanId } });
    if (!loan) throw new Error("Loan detached");

    const outBal = Number(loan.outstandingBalance);
    const rate = Number(loan.interestRate);
    const currentEMI = Number(loan.emiAmount);
    const targetMonths = goal.targetMonths;

    // Reuse the exact EMI solver loop mathematically to inverse the calculation!
    // We treat the current outstanding balance as the fresh principal, mapped onto the new shorter target map.
    const requiredEMI = calculateEMI(outBal, rate, targetMonths);
    const extraMonthlyNeeded = Math.max(0, requiredEMI - currentEMI);

    let paceStatus = "affordable, on pace if you commit this amount";
    let statusFlag = "ON_TRACK";
    
    if (outBal <= 0) {
      paceStatus = "completed";
      statusFlag = "COMPLETED";
    } else if (extraMonthlyNeeded > surplus) {
      paceStatus = `not currently affordable — would need ₹${(extraMonthlyNeeded - surplus).toFixed(2)} more in monthly surplus`;
      statusFlag = "OFF_TRACK";
    }

    return {
      goalId: goal.id,
      goalType: "debt_payoff",
      outstandingBalance: outBal,
      targetMonths,
      requiredTotalEMI: parseFloat(requiredEMI.toFixed(2)),
      extraMonthlyNeeded: parseFloat(extraMonthlyNeeded.toFixed(2)),
      currentCashSurplus: surplus,
      paceStatus,
      statusFlag
    };
  }
}

async function getActiveGoalsSummary(userId) {
  const goals = await prisma.financialGoal.findMany({
    where: { userId, status: "active" },
    include: { loan: true, progressLogs: { orderBy: { date: 'desc' } } }
  });

  const summary = [];
  let totalRequiredAcrossActiveGoals = 0;

  for (const g of goals) {
    const paceDetails = await computeGoalPace(g);
    summary.push({ ...g, computedPace: paceDetails });

    if (g.goalType === "savings") {
      totalRequiredAcrossActiveGoals += paceDetails.requiredMonthlyContribution;
    } else {
      totalRequiredAcrossActiveGoals += paceDetails.extraMonthlyNeeded;
    }
  }

  // Cross-Goal check against free surplus
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fcf = await computeCashFlowFromDB(userId, currentMonthStr);
  const surplus = fcf.cashFlow;

  let globalPaceState = "healthy";
  if (totalRequiredAcrossActiveGoals > surplus) {
    globalPaceState = `Your active goals together need ₹${totalRequiredAcrossActiveGoals.toFixed(2)}/month, but your current surplus is ₹${surplus.toFixed(2)} — consider adjusting timelines or prioritizing one goal.`;
  }

  return { summary, totalRequiredAcrossActiveGoals: parseFloat(totalRequiredAcrossActiveGoals.toFixed(2)), currentCashFlowSurplus: surplus, globalPaceState };
}

module.exports = {
  validateGoalPayload,
  computeGoalPace,
  getActiveGoalsSummary
};
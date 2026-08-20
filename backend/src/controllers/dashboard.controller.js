// ═══════════════════════════════════════════════════════════
// FINPILOT — Dashboard Controller
// SRS Module 5: INC-2 through INC-6
// Cash flow, net worth, and 12-month trend with Redis caching
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");
const redis = require("../config/redis");

const CACHE_TTL = 3600; // 1 hour in seconds

// ═══════════════════════════════════════════════════════════
// CASH FLOW COMPUTATION (INC-2)
// cash flow = income − (EMIs due + credit card dues)
// ═══════════════════════════════════════════════════════════

const { computeCashFlowFromDB } = require("../services/dashboard.service");

// ── GET Cash Flow (with Redis caching) ────────────────────
async function getCashFlow(req, res) {
  const userId = req.userId;
  let monthStr = req.query.month;

  // Default to current month if not provided
  if (!monthStr) {
    const now = new Date();
    monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  // Validate format
  if (!/^\d{4}-\d{2}$/.test(monthStr)) {
    return res.status(400).json({
      error: { code: "INVALID_MONTH", message: "Month must be in YYYY-MM format" },
    });
  }

  // Check Redis cache first (INC-4)
  const cacheKey = `cashflow:${userId}:${monthStr}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json({ ...JSON.parse(cached), cached: true });
  }

  // Compute from DB
  const result = await computeCashFlowFromDB(userId, monthStr);

  // Store in Redis with TTL
  await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);

  res.status(200).json({ ...result, cached: false });
}

// ═══════════════════════════════════════════════════════════
// NET WORTH COMPUTATION (INC-3)
// net worth = −(outstanding loan balances + unpaid CC balances)
// ═══════════════════════════════════════════════════════════

async function computeNetWorthFromDB(userId) {
  // 1. Total outstanding loan balances
  const loanResult = await prisma.loan.aggregate({
    where: { userId, status: "active" },
    _sum: { outstandingBalance: true },
  });
  const totalLoanBalance = Number(loanResult._sum.outstandingBalance || 0);

  // 2. Total lent out (money owed TO user — positive asset)
  const lentResult = await prisma.lendBorrowRecord.aggregate({
    where: { userId, type: "lent", status: { not: "repaid" } },
    _sum: { amount: true },
  });
  const totalLentOut = Number(lentResult._sum.amount || 0);

  // 3. Total borrowed (money user OWES — liability)
  const borrowedResult = await prisma.lendBorrowRecord.aggregate({
    where: { userId, type: "borrowed", status: { not: "repaid" } },
    _sum: { amount: true },
  });
  const totalBorrowed = Number(borrowedResult._sum.amount || 0);

  // Net worth = -(total liabilities) + lent receivables
  const totalLiabilities = totalLoanBalance + totalBorrowed;
  const totalAssets = totalLentOut; // money owed to user
  const netWorth = totalAssets - totalLiabilities;

  return {
    totalLoanBalance: parseFloat(totalLoanBalance.toFixed(2)),
    totalLentOut: parseFloat(totalLentOut.toFixed(2)),
    totalBorrowed: parseFloat(totalBorrowed.toFixed(2)),
    totalLiabilities: parseFloat(totalLiabilities.toFixed(2)),
    totalAssets: parseFloat(totalAssets.toFixed(2)),
    netWorth: parseFloat(netWorth.toFixed(2)),
  };
}

// ── GET Net Worth (with Redis caching) ────────────────────
async function getNetWorth(req, res) {
  const userId = req.userId;

  const cacheKey = `networth:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json({ ...JSON.parse(cached), cached: true });
  }

  const result = await computeNetWorthFromDB(userId);

  await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);

  res.status(200).json({ ...result, cached: false });
}

// ═══════════════════════════════════════════════════════════
// 12-MONTH TREND (INC-6)
// Returns cash flow for the last 12 months for charting
// ═══════════════════════════════════════════════════════════

async function getTrend(req, res) {
  const userId = req.userId;
  const now = new Date();

  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push(monthStr);
  }

  // Compute each month (check cache first for each)
  const trend = [];
  for (const monthStr of months) {
    const cacheKey = `cashflow:${userId}:${monthStr}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      trend.push({ ...JSON.parse(cached), cached: true });
    } else {
      const result = await computeCashFlowFromDB(userId, monthStr);
      await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
      trend.push({ ...result, cached: false });
    }
  }

  res.status(200).json(trend);
}

// ── GET Comprehensive Dashboard Summary ───────────────────
async function getDashboardSummary(req, res) {
  const userId = req.userId;
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 1. Fetch Net Worth & Cash flow
  const netWorthInfo = await computeNetWorthFromDB(userId);
  const cashFlowInfo = await computeCashFlowFromDB(userId, currentMonthStr);

  // 2. Aggregate Active Loans EMI Total
  const activeLoans = await prisma.loan.findMany({
    where: { userId, status: "active" },
  });
  const totalEmi = activeLoans.reduce((sum, l) => sum + Number(l.emiAmount || 0), 0);

  // 3. Category Spending Breakdown from Latest Statement or Current Month Txs
  const latestUpload = await prisma.statementUpload.findFirst({
    where: { userId, status: "completed" },
    orderBy: { uploadedAt: "desc" },
    include: { transactions: true },
  });

  const txs = latestUpload?.transactions || await prisma.transaction.findMany({
    where: { userId, type: "debit" },
    take: 100,
    orderBy: { date: "desc" },
  });

  const categoryTotals = {
    Food: 0,
    Shopping: 0,
    Rent: 0,
    Transport: 0,
    Utilities: 0,
    Entertainment: 0,
    Other: 0,
  };

  for (const tx of txs) {
    if (tx.type === "debit") {
      const amt = Number(tx.amount || 0);
      const cat = tx.category || "Other";
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += amt;
      } else {
        categoryTotals.Other += amt;
      }
    }
  }

  // 4. Lend / Borrow totals
  const lentRecords = await prisma.lendBorrowRecord.findMany({
    where: { userId, type: "lent" },
    include: { repayments: true },
  });
  let totalLent = 0;
  let toReceive = 0;
  for (const r of lentRecords) {
    const amt = Number(r.amount);
    const repaid = r.repayments.reduce((s, rep) => s + Number(rep.amount), 0);
    totalLent += amt;
    toReceive += Math.max(0, amt - repaid);
  }

  const borrowedRecords = await prisma.lendBorrowRecord.findMany({
    where: { userId, type: "borrowed" },
    include: { repayments: true },
  });
  let totalBorrowed = 0;
  let toPay = 0;
  for (const r of borrowedRecords) {
    const amt = Number(r.amount);
    const repaid = r.repayments.reduce((s, rep) => s + Number(rep.amount), 0);
    totalBorrowed += amt;
    toPay += Math.max(0, amt - repaid);
  }

  // 5. User Financial Goals
  const userGoals = await prisma.financialGoal.findMany({
    where: { userId, status: "active" },
  });

  const formattedGoals = userGoals.map((g) => {
    const target = Number(g.targetAmount || 1);
    const saved = Number(g.currentSaved || 0);
    const pct = Math.min(100, Math.round((saved / target) * 100));
    return {
      id: g.id,
      name: g.name,
      icon: g.name.toLowerCase().includes("car") ? "🎯" : "🛡",
      targetAmount: target,
      currentSaved: saved,
      percentage: pct,
      status: pct >= 45 ? "On Track" : "At Risk",
      statusColor: pct >= 45 ? "emerald" : "amber",
    };
  });

  const monthlyIncome = cashFlowInfo.totalIncome || 0;
  const monthlyExpense = cashFlowInfo.totalObligations || 0;
  const availableCash = monthlyIncome - monthlyExpense;
  const netWorthVal = netWorthInfo.netWorth || 0;
  const totalDebtVal = netWorthInfo.totalLiabilities || 0;

  // 6. Generate Dynamic Data-Driven AI Financial Insights
  const dynamicAIInsights = await generateDynamicAIInsights(userId, {
    categoryTotals,
    activeLoans,
    userGoals,
    monthlyIncome,
    monthlyExpense,
    availableCash,
    toReceive,
    toPay,
  });

  res.status(200).json({
    kpis: {
      netWorth: netWorthVal,
      netWorthTrend: 4.2,
      monthlyIncome,
      monthlyExpense,
      monthlyExpenseTrend: -6.5,
      totalDebt: totalDebtVal,
      availableCash: availableCash,
      totalEmi: totalEmi || 0,
    },
    cashFlowBreakdown: {
      income: monthlyIncome,
      expenses: monthlyExpense,
      savings: availableCash,
      history: [
        { month: "May", amount: 0 },
        { month: "Jun", amount: 0 },
        { month: "Jul", amount: 0 },
        { month: "Aug", amount: availableCash },
      ],
    },
    spendingAnalysis: {
      food: categoryTotals.Food || 0,
      shopping: categoryTotals.Shopping || 0,
      rent: categoryTotals.Rent || 0,
      transport: categoryTotals.Transport || 0,
      utilities: categoryTotals.Utilities || 0,
      entertainment: categoryTotals.Entertainment || 0,
      other: categoryTotals.Other || 0,
      moneyLent: totalLent || 0,
      toReceive: toReceive || 0,
      moneyBorrowed: totalBorrowed || 0,
      toPay: toPay || 0,
    },
    goals: formattedGoals,
    aiInsights: dynamicAIInsights
  });
}

/**
 * Computes dynamic, personalized AI insights based on the user's live database context.
 */
async function generateDynamicAIInsights(userId, data) {
  const insights = [];

  // 1. Category Outflows & Anomaly Insight
  const catEntries = Object.entries(data.categoryTotals).filter(([_, val]) => val > 0);
  if (catEntries.length > 0) {
    catEntries.sort((a, b) => b[1] - a[1]);
    const [topCat, topAmt] = catEntries[0];
    const totalSpend = catEntries.reduce((s, [_, v]) => s + v, 0);
    const topPct = totalSpend > 0 ? Math.round((topAmt / totalSpend) * 100) : 0;
    
    insights.push(
      `Your ${topCat} spending is your highest category at ₹${topAmt.toLocaleString("en-IN")} (${topPct}% of total outflows). Reducing this by 10% would save ₹${Math.round(topAmt * 0.1).toLocaleString("en-IN")}/month.`
    );
  } else {
    insights.push(
      "Connect your bank statements to start receiving AI-powered insights on your spending patterns."
    );
  }

  // 2. Debt Interest Optimization Insight
  if (data.activeLoans && data.activeLoans.length > 0) {
    const sortedLoans = [...data.activeLoans].sort((a, b) => Number(b.interestRate) - Number(a.interestRate));
    const highestLoan = sortedLoans[0];
    insights.push(
      `Your ${highestLoan.loanType.toUpperCase()} Loan (${highestLoan.lenderName || 'Active Debt'}) has the highest interest rate (${Number(highestLoan.interestRate)}% p.a.). Prioritize prepaying it first to save maximum interest.`
    );
  } else {
    insights.push(
      "You currently have no active debt. Keep it up!"
    );
  }

  // 3. Goal Pace Insight
  if (data.userGoals && data.userGoals.length > 0) {
    const slowestGoal = [...data.userGoals].sort((a, b) => {
      const pctA = (Number(a.currentSaved || 0) / Number(a.targetAmount || 1));
      const pctB = (Number(b.currentSaved || 0) / Number(b.targetAmount || 1));
      return pctA - pctB;
    })[0];

    const target = Number(slowestGoal.targetAmount || 1);
    const saved = Number(slowestGoal.currentSaved || 0);
    const pct = Math.min(100, Math.round((saved / target) * 100));

    insights.push(
      `Your ${slowestGoal.name} goal is currently at ${pct}% (₹${saved.toLocaleString("en-IN")} / ₹${target.toLocaleString("en-IN")}). ${pct < 50 ? 'Saving an additional ₹3,500/month would bring you back on track.' : 'Maintain your savings buffer to reach target early.'}`
    );
  } else {
    insights.push(
      "Set your first financial goal to start receiving personalized tracking insights."
    );
  }

  // 4. Cash Flow Surplus & Receivables Insight
  const netSurplus = data.monthlyIncome - data.monthlyExpense;
  if (netSurplus > 0) {
    insights.push(
      `You may have ₹${netSurplus.toLocaleString("en-IN")} available after your expected expenses this month.`
    );
  } else {
    insights.push(
      `You currently have no recorded surplus for this month.`
    );
  }

  if (data.toReceive > 0) {
    insights.push(
      `You have ₹${data.toReceive.toLocaleString("en-IN")} in outstanding lent receivables to collect across your contacts.`
    );
  }

  return insights;
}

module.exports = {
  getCashFlow,
  getNetWorth,
  getTrend,
  getDashboardSummary,
};

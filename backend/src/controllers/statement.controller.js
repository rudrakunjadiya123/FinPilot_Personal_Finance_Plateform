// ═══════════════════════════════════════════════════════════
// FINPILOT — Statement Controller
// Module 12: All endpoint handlers
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");
const { AppError } = require("../middleware/errorHandler");
const { parsePDF, parseCSV } = require("../services/statementParsing.service");
const {
  normalizeMerchant,
  categorizeTransaction,
  bulkLLMCategorize,
  applyUserCorrection,
  computeMonthlyDeltas,
  VALID_CATEGORIES,
} = require("../services/categorization.service");
const { getChatCompletion } = require("../services/llm.service");

// ── 1. Upload & Process Statement ────────────────────────
// POST /api/statements/upload

async function uploadStatement(req, res) {
  const userId = req.userId;
  const { month, statementType = "bank_account", bankName } = req.body; // "YYYY-MM"
  if (!req.file) throw new AppError("No file provided", 400, "NO_FILE_UPLOADED");
  if (!month) throw new AppError("Month is required (YYYY-MM)", 400, "MISSING_MONTH");

  const statementMonth = new Date(`${month}-01T00:00:00Z`);
  const originalName = req.file.originalname.toLowerCase();
  const fileType = originalName.endsWith(".csv") || req.file.mimetype === "text/csv" ? "csv" : "pdf";

  const existingUpload = await prisma.statementUpload.findFirst({
    where: { userId, fileName: req.file.originalname, month: statementMonth }
  });

  if (existingUpload) {
    throw new AppError("This statement file has already been uploaded for this month.", 400, "DUPLICATE_UPLOAD");
  }

  // Create upload record
  const upload = await prisma.statementUpload.create({
    data: {
      userId,
      fileName: req.file.originalname,
      fileType,
      statementType,
      bankName: bankName || null,
      month: statementMonth,
      status: "processing",
    },
  });

  try {
    // ── Phase 1: Parse ──
    let rawTransactions = [];
    if (fileType === "csv") {
      rawTransactions = parseCSV(req.file.buffer);
    } else {
      rawTransactions = await parsePDF(req.file.buffer);
    }

    if (rawTransactions.length === 0) {
      await prisma.statementUpload.update({ where: { id: upload.id }, data: { status: "completed", totalTransactions: 0 } });
      return res.status(200).json({ uploadId: upload.id, message: "No transactions found in file", transactionsParsed: 0 });
    }

    // Store raw transactions with category=null
    const txData = rawTransactions.map((t) => ({
      statementUploadId: upload.id,
      userId,
      date: t.date,
      descriptionRaw: t.descriptionRaw,
      descriptionNormalized: normalizeMerchant(t.descriptionRaw),
      amount: t.amount,
      type: t.type,
      refNo: t.refNo,
      balance: t.balance,
    }));

    await prisma.transaction.createMany({ data: txData });
    await prisma.statementUpload.update({ where: { id: upload.id }, data: { status: "categorizing", totalTransactions: rawTransactions.length } });

    // ── Phase 2: Categorize ──
    const savedTxs = await prisma.transaction.findMany({ where: { statementUploadId: upload.id } });
    const counters = { rule: 0, fuzzy: 0, embedding: 0, llm: 0, manual: 0 };

    const llmPending = [];
    const resultsMap = new Map();

    // Fast-pass Tiers 1-4
    for (const tx of savedTxs) {
      // Pass skipLLM=true so it returns instantly if rules/vectors fail
      const result = await categorizeTransaction(tx.descriptionRaw, userId, true);
      
      if (result.needsLLM) {
        llmPending.push(tx);
      } else {
        resultsMap.set(tx.id, result);
        if (result.source === "rule") counters.rule++;
        else if (result.source === "fuzzy") counters.fuzzy++;
        else if (result.source === "embedding") counters.embedding++;
        else counters.manual++; // Catch all
      }
    }

    // Bulk execute Tier 5 mapping logic instantly
    if (llmPending.length > 0) {
      const llmResults = await bulkLLMCategorize(llmPending, userId);
      for (const res of llmResults) {
        resultsMap.set(res.id, res.result);
        counters.llm++;
      }
    }

    // Execute bulk update array in Transaction Pipeline securely overriding LLM token drop omissions
    const updates = savedTxs.map(tx => {
      const result = resultsMap.get(tx.id);
      const cat = result?.category || null;
      
      return prisma.transaction.update({
        where: { id: tx.id },
        data: {
          category: cat,
          categorySource: result?.source || null,
          confidenceScore: result?.confidence || 0,
          needsReview: result?.needsReview ?? true,
        },
      });
    });

    // Run parallel DB updates
    await Promise.all(updates);

    await prisma.statementUpload.update({
      where: { id: upload.id },
      data: {
        status: "completed",
        ruleMatchedCount: counters.rule,
        fuzzyMatchedCount: counters.fuzzy,
        embeddingMatchedCount: counters.embedding,
        llmFallbackCount: counters.llm,
        manualReviewCount: counters.manual,
      },
    });

    // ── Phase 3: Lend/Borrow Payment Mode Auto-Verification Tripwire ──
    try {
      const { verifyPendingLendBorrowRecords } = require("./lendBorrow.controller");
      await verifyPendingLendBorrowRecords(userId);
    } catch (verErr) {
      console.warn("Auto-verification tripwire failed, non-fatal: ", verErr.message);
    }

    // ── Phase 4: 3-Factor Loan Transaction Matching Engine Tripwire ──
    try {
      const { processLoanMatchingEngine } = require("../services/loanMatching.service");
      await processLoanMatchingEngine(userId, upload.id);
    } catch (loanErr) {
      console.warn("Loan matching engine tripwire failed, non-fatal: ", loanErr.message);
    }

    // ── Phase 5: Auto-Sync Credit / Income Transactions to Income Module ──
    try {
      await syncStatementIncomeEntries(userId, upload.id);
    } catch (incErr) {
      console.warn("Income auto-sync tripwire failed, non-fatal: ", incErr.message);
    }

    res.status(200).json({
      uploadId: upload.id,
      message: "Statement processed",
      transactionsParsed: rawTransactions.length,
      categorization: counters,
    });
  } catch (err) {
    await prisma.statementUpload.update({ where: { id: upload.id }, data: { status: "failed" } });
    throw new AppError("Failed to process statement: " + err.message, 500, "PARSE_FAILED");
  }
}

/**
 * Automatically extracts credit/income transactions from an uploaded statement
 * and creates corresponding IncomeEntry records in the Income Module.
 */
async function syncStatementIncomeEntries(userId, uploadId) {
  const creditTxs = await prisma.transaction.findMany({
    where: {
      statementUploadId: uploadId,
      userId,
      OR: [
        { type: "credit" },
        { category: { in: ["Salary", "Income"] } },
      ],
    },
  });

  for (const tx of creditTxs) {
    const txDate = new Date(tx.date);
    const firstOfMonth = new Date(txDate.getFullYear(), txDate.getMonth(), 1);
    const sourceName = tx.descriptionRaw ? tx.descriptionRaw.substring(0, 50) : "Statement Credit";

    // Avoid duplicate sync if an income entry for this month & source already exists
    const existing = await prisma.incomeEntry.findFirst({
      where: {
        userId,
        source: sourceName,
        month: firstOfMonth,
        amount: Number(tx.amount),
      },
    });

    if (!existing) {
      await prisma.incomeEntry.create({
        data: {
          userId,
          source: sourceName,
          amount: Number(tx.amount),
          month: firstOfMonth,
        },
      });
    }
  }
}

// ── 2. Get Upload Status ─────────────────────────────────
async function getUploadStatus(req, res) {
  const upload = await prisma.statementUpload.findUnique({ where: { id: req.params.id } });
  if (!upload || upload.userId !== req.userId) throw new AppError("Upload not found", 404, "NOT_FOUND");
  res.status(200).json(upload);
}

// ── 3. Get Transactions for Upload ───────────────────────
async function getTransactions(req, res) {
  const upload = await prisma.statementUpload.findUnique({ where: { id: req.params.id } });
  if (!upload || upload.userId !== req.userId) throw new AppError("Upload not found", 404, "NOT_FOUND");

  const transactions = await prisma.transaction.findMany({
    where: { statementUploadId: req.params.id },
    orderBy: { date: "asc" },
  });
  res.status(200).json(transactions);
}

// ── 4. Update Transaction Category ───────────────────────
async function updateTransactionCategory(req, res) {
  const { category } = req.body;
  if (!category || !VALID_CATEGORIES.includes(category)) {
    throw new AppError(`Invalid category. Valid: ${VALID_CATEGORIES.join(", ")}`, 400, "INVALID_CATEGORY");
  }

  const result = await applyUserCorrection(req.userId, req.params.id, category);
  res.status(200).json(result);
}

// ── 5. Manual Investment Exclusion ───────────────────────
async function addManualInvestment(req, res) {
  const { amount, note } = req.body;
  const monthStr = req.params.month;
  const statementMonth = new Date(`${monthStr}-01T00:00:00Z`);

  const record = await prisma.monthlyInvestment.upsert({
    where: { userId_month: { userId: req.userId, month: statementMonth } },
    update: { amount, note: note || null },
    create: { userId: req.userId, month: statementMonth, amount, note: note || null },
  });

  res.status(200).json(record);
}

// ── Filter Builder Helper ────────────────────────────────
function buildTransactionFilters(req) {
  const { startDate, endDate, statementType, bankName, categories } = req.query;
  const where = { userId: req.userId };
  
  // Date range handling (fallback to last 30 days if not provided)
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  
  where.date = { gte: start, lte: end };

  if (categories) {
    const cats = categories.split(',').filter(Boolean);
    if (cats.length > 0) where.category = { in: cats };
  }

  // Related statementUpload filters (type, bank)
  if (statementType && statementType !== 'both' || bankName) {
    where.statementUpload = {};
    if (statementType && statementType !== 'both') {
      const types = statementType.split(',').filter(Boolean);
      where.statementUpload.statementType = { in: types };
    }
    if (bankName) {
      const banks = bankName.split(',').filter(Boolean);
      where.statementUpload.bankName = { in: banks };
    }
  }
  
  return { where, start, end };
}

// ── 6. Filtered Spend Dashboard ──────────────────────────
async function getDashboardMetrics(req, res) {
  const { where, start, end } = buildTransactionFilters(req);

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "asc" },
    include: { statementUpload: { select: { bankName: true, statementType: true } } }
  });

  // ── Inject Cash-based Lend/Borrow Activity natively into Dashboard ──
  const cashLendBorrows = await prisma.lendBorrowRecord.findMany({
    where: { 
      userId: req.userId, 
      dateGiven: { gte: start, lte: end },
      paymentMode: "cash"
    }
  });

  const cashRepayments = await prisma.repaymentHistory.findMany({
    where: {
      lendBorrowRecord: { userId: req.userId },
      date: { gte: start, lte: end },
      paymentMode: "cash"
    },
    include: { lendBorrowRecord: true }
  });

  for (const record of cashLendBorrows) {
    transactions.push({
      id: record.id,
      date: record.dateGiven,
      descriptionRaw: `[CASH OFF-LEDGER] ${record.type === 'lent' ? 'Lent to' : 'Borrowed from'} ${record.personName}`,
      descriptionNormalized: `[CASH OFF-LEDGER] ${record.personName}`,
      amount: record.amount,
      type: record.type === 'lent' ? 'debit' : 'credit',
      category: "Lend/Borrow (Offline)",
      categorySource: "manual",
      statementUploadId: null,
      refNo: "CASH-HAND",
      balance: null
    });
  }

  for (const rep of cashRepayments) {
    const isLent = rep.lendBorrowRecord.type === 'lent'; 
    transactions.push({
      id: rep.id,
      date: rep.date,
      descriptionRaw: `[CASH OFF-LEDGER] ${isLent ? 'Repayment received from' : 'Repayment paid to'} ${rep.lendBorrowRecord.personName}`,
      descriptionNormalized: `[CASH OFF-LEDGER] ${rep.lendBorrowRecord.personName}`,
      amount: rep.amount,
      type: isLent ? 'credit' : 'debit',
      category: "Lend/Borrow (Offline)",
      categorySource: "manual",
      statementUploadId: null,
      refNo: "CASH-HAND",
      balance: null
    });
  }

  // ── Inject Manual Income Entries natively into Dashboard ──
  const incomeEntries = await prisma.incomeEntry.findMany({
    where: {
      userId: req.userId,
      month: { gte: start, lte: end }
    }
  });

  for (const inc of incomeEntries) {
    transactions.push({
      id: inc.id,
      date: inc.month,
      descriptionRaw: `[MANUAL INCOME] ${inc.source}`,
      descriptionNormalized: `[MANUAL INCOME] ${inc.source}`,
      amount: inc.amount,
      type: 'credit',
      category: inc.source.toLowerCase() === 'salary' ? 'Salary' : 'Other',
      categorySource: "manual",
      statementUploadId: null,
      refNo: "INCOME-MANUAL",
      balance: null
    });
  }

  // Resort array chronologically after synthetic injections
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


  // Calculate generic investments over this range (approximate grouped by month boundaries)
  const investments = await prisma.monthlyInvestment.findMany({
    where: { userId: req.userId, month: { gte: new Date(start.getFullYear(), start.getMonth(), 1), lte: end } }
  });
  const manualInvestment = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = {};

  for (const t of transactions) {
    const amt = Number(t.amount);
    if (t.type === "credit") {
      totalIncome += amt;
    } else {
      if (t.category !== "Investment") totalExpense += amt;
      const cat = t.category || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    }
  }

  const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentOfTotal: totalExpense > 0 ? parseFloat(((amount / totalExpense) * 100).toFixed(2)) : 0,
  }));

  // Deltas against previous month strictly based on the end limit of the filter box
  const monthOverMonthDelta = await computeMonthlyDeltas(req.userId, new Date(end.getFullYear(), end.getMonth(), 1));

  res.status(200).json({
    totalIncome,
    totalExpense,
    totalSavings: totalIncome - totalExpense - manualInvestment,
    manualInvestment,
    categoryBreakdown,
    monthOverMonthDelta,
    needsReviewCount: transactions.filter((t) => t.needsReview).length,
    transactionCount: transactions.length,
    transactions,
  });
}

// ── 7. Expense Trend ─────────────────────────────────────
async function getExpenseTrend(req, res) {
  const { where } = buildTransactionFilters(req);
  const now = new Date(where.date.lte || new Date());
  const months = [];

  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
    
    // Merge baseline filters with this specific month block
    const monthWhere = { ...where, date: { gte: start, lte: end }, type: "debit" };

    const txs = await prisma.transaction.findMany({ where: monthWhere });
    const total = txs.reduce((sum, t) => sum + Number(t.amount), 0);
    
    months.push({ month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, expense: total });
  }

  res.status(200).json(months);
}

// ── 8. Savings Trend ─────────────────────────────────────
async function getSavingsTrend(req, res) {
  const { where } = buildTransactionFilters(req);
  const now = new Date(where.date.lte || new Date());
  const months = [];

  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
    
    const monthWhere = { ...where, date: { gte: start, lte: end } };
    const txs = await prisma.transaction.findMany({ where: monthWhere });

    let income = 0, expense = 0;
    for (const t of txs) {
      if (t.type === "credit") income += Number(t.amount);
      else if (t.category !== "Investment") expense += Number(t.amount);
    }

    const inv = await prisma.monthlyInvestment.findUnique({
      where: { userId_month: { userId: req.userId, month: start } },
    });
    const manualInv = inv ? Number(inv.amount) : 0;

    months.push({ month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, savings: income - expense - manualInv });
  }

  res.status(200).json(months);
}

// ── 9. Cost Summary ──────────────────────────────────────
async function getCostSummary(req, res) {
  const upload = await prisma.statementUpload.findUnique({ where: { id: req.params.id } });
  if (!upload || upload.userId !== req.userId) throw new AppError("Upload not found", 404, "NOT_FOUND");

  const llmPct = upload.totalTransactions > 0
    ? parseFloat(((upload.llmFallbackCount / upload.totalTransactions) * 100).toFixed(2))
    : 0;

  res.status(200).json({ ...upload, llmFallbackPercentage: llmPct, alertThresholdExceeded: llmPct > 15 });
}

// ── 10. AI Spending Insights ─────────────────────────────
// ── 10. AI Spending Insights ─────────────────────────────
async function getSpendingInsights(req, res) {
  const { where } = buildTransactionFilters(req);
  
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "asc" }
  });

  if (transactions.length === 0) {
    return res.status(200).json({ insights: "No transactions found in this period to analyze." });
  }

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = {};
  const merchantMap = {};

  for (const t of transactions) {
    const amt = Number(t.amount);
    if (t.type === "credit") {
      totalIncome += amt;
    } else {
      if (t.category !== "Investment") totalExpense += amt;
      const cat = t.category || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      
      const merch = t.descriptionNormalized || "Unknown";
      merchantMap[merch] = (merchantMap[merch] || 0) + amt;
    }
  }

  const categoryBreakdown = Object.entries(categoryMap)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(2)}`);
    
  const topMerchants = Object.entries(merchantMap)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .map(([merch, amt]) => `${merch}: ₹${amt.toFixed(2)}`);

  const prompt = `You are a financial analyst. Based on this filtered transaction dataset, write EXACTLY 3-4 sentences of sharp, insightful financial observations. Provide actionable advice for savings and point out any recurring top merchants. Keep it professional. Use bullet points or short paragraphs. Data summary:
  Total Income: ₹${totalIncome.toFixed(2)}
  Total Expense: ₹${totalExpense.toFixed(2)}
  Top 5 Categories: ${categoryBreakdown.join(', ')}
  Top 5 Merchants: ${topMerchants.join(', ')}`;
  
  try {
    const response = await getChatCompletion(prompt, "", [], []);
    res.status(200).json({ insights: response.text });
  } catch (e) {
    throw new AppError("Failed to generate AI insights", 500, "AI_FAILURE");
  }
}

// ── 11. List Uploads ─────────────────────────────────────
async function listUploads(req, res) {
  const uploads = await prisma.statementUpload.findMany({
    where: { userId: req.userId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true, fileName: true, fileType: true, statementType: true, bankName: true, month: true,
      status: true, uploadedAt: true, totalTransactions: true, llmFallbackCount: true,
      ruleMatchedCount: true, fuzzyMatchedCount: true, embeddingMatchedCount: true, manualReviewCount: true,
    },
  });
  res.status(200).json(uploads);
}

// ── 11.b Get Distinct Banks ──────────────────────────────
async function getBanks(req, res) {
  const uploads = await prisma.statementUpload.findMany({
    where: { userId: req.userId },
    select: { bankName: true },
    distinct: ['bankName']
  });
  const banks = uploads.map(u => u.bankName).filter(Boolean);
  res.status(200).json(banks);
}

// ── 12. Needs Review Queue ───────────────────────────────
async function getNeedsReview(req, res) {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId, needsReview: true },
    orderBy: { date: "desc" },
    take: 50,
  });
  res.status(200).json(transactions);
}

module.exports = {
  uploadStatement, getUploadStatus, getTransactions, updateTransactionCategory,
  addManualInvestment, getDashboardMetrics, getExpenseTrend, getSavingsTrend,
  getCostSummary, getSpendingInsights, listUploads, getBanks, getNeedsReview,
};

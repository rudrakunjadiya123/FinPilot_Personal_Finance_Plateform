// ═══════════════════════════════════════════════════════════
// FINPILOT — Loan Controller
// Implements CRUD operations, EMI Amortization, and Prepayment Simulations
// SRS References: Module 2 (LOAN-1 through LOAN-10), Module 5 (INC-5 cache invalidation)
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");
const redis = require("../config/redis");
const { AppError } = require("../middleware/errorHandler");
const validators = require("../validators/loan.validator");
const {
  calculateEMI,
  generateAmortizationSchedule,
  simulatePrepayment,
} = require("../utils/computationEngine");
const { embeddingGenerationQueue } = require("../config/queues");
const { LOAN_STATUS, PAID_STATUS } = require("../utils/constants");

async function invalidateDashboardCaches(userId, monthIsoDate) {
  try {
    await redis.del(`networth:${userId}`);
    if (monthIsoDate) {
      const monthKey = monthIsoDate.substring(0, 7); // Format: "YYYY-MM"
      await redis.del(`cashflow:${userId}:${monthKey}`);
    }
  } catch (err) {
    console.warn("[Redis] Cache invalidation skipped (Redis offline):", err.message);
  }
}

// ── GET All Loans ─────────────────────────────────────────
async function getAllLoans(req, res) {
  const loans = await prisma.loan.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json(loans);
}

// ── GET Loan By ID ────────────────────────────────────────
async function getLoanById(req, res) {
  const { id } = req.params;
  const loan = await prisma.loan.findUnique({
    where: { id },
  });

  if (!loan || loan.userId !== req.userId) {
    throw new AppError("Loan not found", 404, "NOT_FOUND");
  }
  res.status(200).json(loan);
}

// ── CREATE Loan ───────────────────────────────────────────
async function createLoan(req, res) {
  const data = validators.createLoanSchema.parse(req.body);
  const {
    loanType,
    lenderName,
    principalAmount,
    interestRate,
    tenureMonths,
    startDate,
    notes,
  } = data;

  // Let computation engine figure it out if none provided
  const rawEmi =
    data.emiAmount ??
    calculateEMI(principalAmount, interestRate, tenureMonths);
  
  const emiAmount = parseFloat(rawEmi.toFixed(2));

  const parsedStartDate = new Date(startDate);
  
  // SRS LOAN-2: Auto-generate amortization array
  const scheduleArray = generateAmortizationSchedule(
    principalAmount,
    interestRate,
    tenureMonths,
    emiAmount,
    parsedStartDate
  );

  // We save the loan and its schedule atomically
  const loan = await prisma.$transaction(async (tx) => {
    const createdLoan = await tx.loan.create({
      data: {
        userId: req.userId,
        loanType,
        lenderName: lenderName || null,
        principalAmount,
        interestRate,
        tenureMonths,
        emiAmount,
        startDate: parsedStartDate,
        status: LOAN_STATUS[0], // "active"
        outstandingBalance: principalAmount,
        notes: notes || null,
      },
    });

    const parsedScheduleEntries = scheduleArray.map((row) => ({
      loanId: createdLoan.id,
      month: row.month,
      dueDate: row.dueDate,
      principalComponent: row.principalComponent,
      interestComponent: row.interestComponent,
      balanceAfter: row.balanceAfter,
      paidStatus: PAID_STATUS[1], // "unpaid"
    }));

    await tx.eMISchedule.createMany({
      data: parsedScheduleEntries,
    });

    return createdLoan;
  }, { maxWait: 5000, timeout: 15000 });

  // SRS LOAN-9 / RAG-2: If notes exist, enqueue embedding generation
  if (notes && notes.trim() !== "") {
    await embeddingGenerationQueue.add("generate", {
      recordId: loan.id,
      recordType: "loan",
      textChunk: notes,
      userId: req.userId,
    });
  }
  
  await invalidateDashboardCaches(req.userId);

  res.status(201).json({ message: "Loan successfully created", loan });
}

// ── UPDATE Loan ───────────────────────────────────────────
async function updateLoan(req, res) {
  const { id } = req.params;
  const data = validators.updateLoanSchema.parse(req.body);

  const existingLoan = await prisma.loan.findUnique({ where: { id } });
  if (!existingLoan || existingLoan.userId !== req.userId) {
    throw new AppError("Loan not found", 404, "NOT_FOUND");
  }

  const updatedLoan = await prisma.loan.update({
    where: { id },
    data,
  });

  // Re-run embeddings if notes specifically changed (SRS LOAN-9)
  if (data.notes !== undefined && data.notes !== existingLoan.notes) {
    await embeddingGenerationQueue.add("generate", {
      recordId: updatedLoan.id,
      recordType: "loan",
      textChunk: data.notes || "",
      userId: req.userId,
    });
  }

  await invalidateDashboardCaches(req.userId);
  res.status(200).json(updatedLoan);
}

// ── DELETE Loan ───────────────────────────────────────────
async function deleteLoan(req, res) {
  const { id } = req.params;
  const existingLoan = await prisma.loan.findUnique({ where: { id } });

  if (!existingLoan || existingLoan.userId !== req.userId) {
    throw new AppError("Loan not found", 404, "NOT_FOUND");
  }

  // Deletion automatically cascades to EMISchedule and NoteEmbedding objects based on our configured Prisma schema
  await prisma.loan.delete({ where: { id } });
  
  await invalidateDashboardCaches(req.userId);
  res.status(200).json({ message: "Loan deleted correctly" });
}

// ── GET Loan Schedule ─────────────────────────────────────
async function getLoanSchedule(req, res) {
  const { id } = req.params;

  const schedule = await prisma.eMISchedule.findMany({
    where: {
      loanId: id,
      loan: { userId: req.userId }, // Access control check without extra bounce query
    },
    orderBy: { month: "asc" },
  });

  if (!schedule.length) {
    // Determine whether access is denied or schedule empty
    const loan = await prisma.loan.findUnique({ where: { id, userId: req.userId } });
    if (!loan) throw new AppError("Loan not found", 404, "NOT_FOUND");
  }

  res.status(200).json(schedule);
}

// ── MARK EMI Paid ─────────────────────────────────────────
async function markEmiPaid(req, res) {
  const { id, emiId } = req.params;

  const emiRecord = await prisma.eMISchedule.findUnique({
    where: { id: emiId },
    include: { loan: true },
  });

  if (!emiRecord || emiRecord.loan.userId !== req.userId || emiRecord.loanId !== id) {
    throw new AppError("EMI schedule not found or access denied", 404, "NOT_FOUND");
  }

  if (emiRecord.paidStatus === PAID_STATUS[0]) {
    res.status(200).json({ message: "EMI is already paid", emiRecord });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark schedule row as paid
    const updatedEmi = await tx.eMISchedule.update({
      where: { id: emiId },
      data: {
        paidStatus: PAID_STATUS[0], // "paid"
        paidDate: new Date(),
      },
    });

    // 2. Reduce the master Loan balance (SRS LOAN-5)
    // Note: To remain absolutely precise and resilient to out-of-order partial payment clicks, 
    // it's best to decrease loan outstandingBalance dynamically by this month's principal component.
    const loan = await tx.loan.findUnique({ where: { id } });
    const newBalance = Math.max(0, loan.outstandingBalance - updatedEmi.principalComponent);

    await tx.loan.update({
      where: { id },
      data: { outstandingBalance: newBalance },
    });

    return updatedEmi;
  }, { maxWait: 5000, timeout: 15000 });

  const monthIso = new Date(emiRecord.dueDate).toISOString();
  await invalidateDashboardCaches(req.userId, monthIso);

  res.status(200).json({ message: "EMI marked successfully", emi: result });
}

// ── SIMULATE Prepayment ───────────────────────────────────
async function simulateLoanPrepayment(req, res) {
  const { id } = req.params;
  const { prepaymentAmount } = validators.simulatePrepaymentSchema.parse(req.body);

  const loan = await prisma.loan.findUnique({
    where: { id, userId: req.userId },
  });

  if (!loan || loan.status === LOAN_STATUS[1]) {
    throw new AppError("Active Loan not found", 404, "NOT_FOUND");
  }

  // Prepayment cannot physically exceed current boundaries 
  if (prepaymentAmount > Number(loan.outstandingBalance)) {
    throw new AppError(
      `Prepayment amount exceeds total balance of ${loan.outstandingBalance}`,
      400,
      "PREPAYMENT_EXCEEDS_BALANCE"
    );
  }

  // Fetch only the remaining unpaid schedule
  const unPaidSchedule = await prisma.eMISchedule.findMany({
    where: { loanId: id, paidStatus: PAID_STATUS[1] },
    orderBy: { month: "asc" },
  });

  if (unPaidSchedule.length === 0) {
    throw new AppError("No remaining schedule to prepay against", 400, "NO_UNPAID_EMI");
  }

  const simulationParams = {
    prepaymentAmount,
    currentBalance: Number(loan.outstandingBalance),
    emiAmount: Number(loan.emiAmount),
    annualInterestRate: Number(loan.interestRate),
    originalRemainingSchedule: unPaidSchedule.map((row) => ({
      interestComponent: Number(row.interestComponent),
      principalComponent: Number(row.principalComponent),
    })),
  };

  const simulationResults = simulatePrepayment(
    simulationParams.prepaymentAmount,
    simulationParams.currentBalance,
    simulationParams.emiAmount,
    simulationParams.annualInterestRate,
    simulationParams.originalRemainingSchedule
  );

  res.status(200).json(simulationResults);
}

// ── CONFIRM Prepayment ────────────────────────────────────
async function confirmLoanPrepayment(req, res) {
  const { id } = req.params;
  const { prepaymentAmount } = validators.confirmPrepaymentSchema.parse(req.body);

  const loan = await prisma.loan.findUnique({
    where: { id, userId: req.userId },
  });

  if (!loan || loan.status === LOAN_STATUS[1]) {
    throw new AppError("Active Loan not found", 404, "NOT_FOUND");
  }

  if (prepaymentAmount > Number(loan.outstandingBalance)) {
    throw new AppError(
      `Prepayment amount exceeds total balance of ${loan.outstandingBalance}`,
      400,
      "PREPAYMENT_EXCEEDS_BALANCE"
    );
  }

  const unPaidSchedule = await prisma.eMISchedule.findMany({
    where: { loanId: id, paidStatus: PAID_STATUS[1] },
    orderBy: { month: "asc" },
  });

  if (unPaidSchedule.length === 0) {
    throw new AppError("No remaining unpaid EMI schedule", 400, "NO_UNPAID_EMI");
  }

  // Calculate new conditions
  const currentOutstanding = Number(loan.outstandingBalance) - prepaymentAmount;
  const firstUnpaidDate = new Date(unPaidSchedule[0].dueDate);
  // Revert back one month so start baseline functions evenly via generateAmortizationSchedule math
  firstUnpaidDate.setMonth(firstUnpaidDate.getMonth() - 1); 
  
  let newlyGeneratedScheduleRows = [];
  if (currentOutstanding > 0) {
    const newMaxTenureAllowed = 1200; // Uncapped ceiling used only for schedule generator upper iteration bounds
    newlyGeneratedScheduleRows = generateAmortizationSchedule(
      currentOutstanding,
      Number(loan.interestRate),
      newMaxTenureAllowed, 
      Number(loan.emiAmount),
      firstUnpaidDate
    );
  }

  // Atomically wipe future stale projections, bind new rows, update balance
  await prisma.$transaction(async (tx) => {
    await tx.eMISchedule.deleteMany({
      where: {
        loanId: id,
        paidStatus: PAID_STATUS[1],
      },
    });

    if (currentOutstanding > 0 && newlyGeneratedScheduleRows.length > 0) {
      // Find the highest known chronological index that was already paid
      const highestPaidRow = await tx.eMISchedule.findFirst({
        where: { loanId: id, paidStatus: PAID_STATUS[0] },
        orderBy: { month: "desc" },
      });
      const monthOffsetIndexBase = highestPaidRow ? highestPaidRow.month : 0;
      
      const parsedScheduleEntries = newlyGeneratedScheduleRows.map((row) => ({
        loanId: id,
        month: monthOffsetIndexBase + row.month,
        dueDate: row.dueDate,
        principalComponent: row.principalComponent,
        interestComponent: row.interestComponent,
        balanceAfter: row.balanceAfter,
        paidStatus: PAID_STATUS[1], // "unpaid"
      }));

      await tx.eMISchedule.createMany({
        data: parsedScheduleEntries,
      });
    }

    const nextStatus = currentOutstanding <= 0 ? LOAN_STATUS[1] : LOAN_STATUS[0];
    
    await tx.loan.update({
      where: { id },
      data: {
        outstandingBalance: currentOutstanding,
        status: nextStatus
      },
    });
  }, { maxWait: 5000, timeout: 20000 });

  await invalidateDashboardCaches(req.userId);
  res.status(200).json({ message: "Prepayment confirmed, schedule rebuilt" });
}

// ── CLOSE Loan ────────────────────────────────────────────
async function closeLoan(req, res) {
  const { id } = req.params;

  const existingLoan = await prisma.loan.findUnique({
    where: { id },
  });

  if (!existingLoan || existingLoan.userId !== req.userId) {
    throw new AppError("Loan not found", 404, "NOT_FOUND");
  }

  const updatedLoan = await prisma.loan.update({
    where: { id },
    data: { status: LOAN_STATUS[1] },
  });

  await invalidateDashboardCaches(req.userId);
  res.status(200).json(updatedLoan);
}

// ── GET Pending Loan Suggestions ──────────────────────────
async function getPendingSuggestions(req, res) {
  const suggestions = await prisma.loanMatchSuggestion.findMany({
    where: {
      userId: req.userId,
      status: "pending",
    },
    include: {
      loan: true,
      transaction: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json(suggestions);
}

// ── ACCEPT Loan Suggestion ────────────────────────────────
async function acceptSuggestion(req, res) {
  const { id } = req.params;
  const suggestion = await prisma.loanMatchSuggestion.findUnique({
    where: { id },
    include: { loan: true, transaction: true },
  });

  if (!suggestion || suggestion.userId !== req.userId) {
    throw new AppError("Suggestion not found", 404, "NOT_FOUND");
  }

  const { applyLoanPayment } = require("../services/loanMatching.service");
  await applyLoanPayment(req.userId, suggestion.loanId, suggestion.transaction);

  await prisma.loanMatchSuggestion.update({
    where: { id },
    data: { status: "accepted" },
  });

  await invalidateDashboardCaches(req.userId);
  res.status(200).json({ message: "Suggestion accepted and loan EMI recorded." });
}

// ── REJECT Loan Suggestion ────────────────────────────────
async function rejectSuggestion(req, res) {
  const { id } = req.params;
  const suggestion = await prisma.loanMatchSuggestion.findUnique({
    where: { id },
  });

  if (!suggestion || suggestion.userId !== req.userId) {
    throw new AppError("Suggestion not found", 404, "NOT_FOUND");
  }

  await prisma.loanMatchSuggestion.update({
    where: { id },
    data: { status: "rejected" },
  });

  res.status(200).json({ message: "Suggestion rejected." });
}

module.exports = {
  getAllLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  getLoanSchedule,
  markEmiPaid,
  simulateLoanPrepayment,
  confirmLoanPrepayment,
  closeLoan,
  getPendingSuggestions,
  acceptSuggestion,
  rejectSuggestion,
};

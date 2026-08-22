// ═══════════════════════════════════════════════════════════
// FINPILOT — Lend/Borrow Controller
// SRS Module 3: LB-1 through LB-9
// Handles CRUD, partial repayments, overdue detection,
// per-person history, and embedding queue triggers
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");
const redis = require("../config/redis");
const { AppError } = require("../middleware/errorHandler");
const validators = require("../validators/lendBorrow.validator");
const { embeddingGenerationQueue } = require("../config/queues");
const { LEND_BORROW_STATUS } = require("../utils/constants");
const { sendEmail } = require("../services/email.service");

// ── Helpers ───────────────────────────────────────────────

/**
 * Compute total principal repaid for a record from its RepaymentHistory rows.
 * Defaults to reading `amount` for legacy rows if `principalAmount` is 0.
 * @param {string} recordId
 * @returns {number}
 */
async function getTotalRepaid(recordId) {
  const repayments = await prisma.repaymentHistory.findMany({
    where: { lendBorrowId: recordId },
  });
  return calculatePrincipalRepaid(repayments);
}

function calculatePrincipalRepaid(repayments) {
  return repayments.reduce((sum, r) => {
    if (r.paymentType === 'interest_only') return sum;
    if (r.paymentType === 'principal_only' && Number(r.principalAmount) === 0) {
      return sum + Number(r.amount);
    }
    return sum + Number(r.principalAmount);
  }, 0);
}

/**
 * Derive the correct status based on repayments vs amount.
 * @param {number} totalRepaid
 * @param {number} totalAmount
 * @returns {string} "pending" | "partial" | "repaid"
 */
function deriveStatus(totalRepaid, totalAmount) {
  if (totalRepaid <= 0) return LEND_BORROW_STATUS[0]; // "pending"
  if (totalRepaid >= totalAmount) return LEND_BORROW_STATUS[2]; // "repaid"
  return LEND_BORROW_STATUS[1]; // "partial"
}

/**
 * Mathematically derives variable JSON interest traces piecewise bridging compound boundaries
 */
function computeAdvancedInterest(record, amount) {
  if (!record.interestRate || Number(record.interestRate) === 0) return 0;
  
  const history = Array.isArray(record.interestRateHistory) && record.interestRateHistory.length > 0 
      ? [...record.interestRateHistory] : [];
  
  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  const baseStartDate = record.interestStartDate ? new Date(record.interestStartDate) : new Date(record.dateGiven);
  const now = new Date();
  
  if (baseStartDate > now) return 0;

  const intervals = [];
  let currentStart = baseStartDate;
  let currentRate = Number(record.interestRate);
  let currentType = record.interestType || 'simple';
  let currentFreq = record.compoundingFrequency;

  for (const item of history) {
    const changeDate = new Date(item.date);
    if (changeDate > currentStart && changeDate <= now) {
      intervals.push({ 
        start: currentStart, 
        end: changeDate, 
        rate: currentRate,
        type: currentType,
        freq: currentFreq
      });
      currentStart = changeDate;
      currentRate = Number(item.rate);
      currentType = item.interestType || 'simple';
      currentFreq = item.compoundingFrequency;
    } else if (changeDate <= currentStart) {
      currentRate = Number(item.rate);
      currentType = item.interestType || 'simple';
      currentFreq = item.compoundingFrequency;
    }
  }
  intervals.push({ 
    start: currentStart, 
    end: now, 
    rate: currentRate,
    type: currentType,
    freq: currentFreq
  });
  
  let totalInterest = 0;
  let principal = amount;
  let simpleInterest = 0;

  for (const interval of intervals) {
    if (interval.type === 'compound' && interval.freq) {
      if (simpleInterest > 0) {
        principal += simpleInterest;
        totalInterest += simpleInterest;
        simpleInterest = 0;
      }
      
      const n = 12 / interval.freq;
      const yearsElapsed = (interval.end - interval.start) / (1000 * 60 * 60 * 24 * 365);
      const r = interval.rate / 100;
      const accruedForBracket = principal * Math.pow(1 + r/n, n * yearsElapsed);
      
      totalInterest += (accruedForBracket - principal);
      principal = accruedForBracket;
    } else {
      const daysElapsed = (interval.end - interval.start) / (1000 * 60 * 60 * 24);
      const accruedForBracket = principal * (interval.rate / 100) * (daysElapsed / 365);
      simpleInterest += accruedForBracket;
    }
  }
  
  totalInterest += simpleInterest;
  return parseFloat(totalInterest.toFixed(2));
}

/**
 * Enrich a record with computed fields: isOverdue, interestAccrued, totalRepaid, remainingBalance
 */
function enrichRecord(record, totalRepaid) {
  const amount = Number(record.amount);
  const remaining = Math.max(0, amount - totalRepaid);

  // SRS: isOverdue computed on read, not stored
  const isOverdue =
    new Date(record.expectedReturnDate) < new Date() &&
    record.status !== LEND_BORROW_STATUS[2];

  // Comprehensive Advanced Engine
  let interestAccrued = computeAdvancedInterest(record, amount);

  return {
    ...record,
    isOverdue,
    interestAccrued,
    totalRepaid: parseFloat(totalRepaid.toFixed(2)),
    remainingBalance: parseFloat(remaining.toFixed(2)),
  };
}

async function invalidateDashboardCaches(userId) {
  try {
    await redis.del(`networth:${userId}`);
  } catch (err) {
    console.warn("[Redis] Cache invalidation skipped (Redis offline):", err.message);
  }
}

// ── GET All Records ───────────────────────────────────────
async function getAll(req, res) {
  const records = await prisma.lendBorrowRecord.findMany({
    where: { userId: req.userId },
    include: { repayments: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const enriched = records.map((record) => {
    const totalRepaid = calculatePrincipalRepaid(record.repayments);
    return enrichRecord(record, totalRepaid);
  });

  res.status(200).json(enriched);
}

// ── GET Record By ID ──────────────────────────────────────
async function getById(req, res) {
  const { id } = req.params;

  const record = await prisma.lendBorrowRecord.findUnique({
    where: { id },
    include: { repayments: { orderBy: { date: "desc" } } },
  });

  if (!record || record.userId !== req.userId) {
    throw new AppError("Record not found", 404, "NOT_FOUND");
  }

  const totalRepaid = calculatePrincipalRepaid(record.repayments);

  res.status(200).json(enrichRecord(record, totalRepaid));
}

// ── Internal Service for Programmatic / Chat Creation ───────
async function createLendBorrowRecordService(userId, data) {
  if (data.paymentMode === 'online' && !data.transactionId) {
    throw new AppError("Transaction ID required for online payments", 400);
  }

  let verificationStatus = "not_required";
  let linkedTransactionId = null;

  if (data.paymentMode === 'online') {
    verificationStatus = "pending_verification";
    
    // Instantly verify against already-uploaded bank statements
    const targetDateStr = new Date(data.dateGiven).toISOString().split('T')[0];
    const startDate = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const match = await prisma.transaction.findFirst({
      where: {
        userId,
        refNo: data.transactionId,
        amount: data.amount,
        date: { gte: startDate, lte: endDate } // exact day match leeway
      }
    });

    if (match) {
      verificationStatus = "verified";
      linkedTransactionId = match.id;
    }
  }

  const record = await prisma.lendBorrowRecord.create({
    data: {
      userId,
      personName: data.personName,
      personEmail: data.personEmail,
      amount: data.amount,
      type: data.type,
      dateGiven: new Date(data.dateGiven),
      expectedReturnDate: new Date(data.expectedReturnDate),
      interestRate: data.interestRate ?? null,
      interestType: data.interestType || "simple",
      compoundingFrequency: data.compoundingFrequency ?? null,
      interestStartDate: data.interestStartDate ? new Date(data.interestStartDate) : null,
      paymentMode: data.paymentMode || "cash",
      transactionId: data.transactionId || null,
      verificationStatus,
      linkedTransactionId,
      status: LEND_BORROW_STATUS[0], // "pending"
      notes: data.notes || null,
    },
  });

  // SRS LB-7: enqueue embedding generation if notes exist
  if (data.notes && data.notes.trim() !== "") {
    try {
      await embeddingGenerationQueue.add("generate", {
        recordId: record.id,
        recordType: "lendBorrow",
        textChunk: data.notes,
        userId,
      });
    } catch (err) {
      console.warn("[Queue] Background embedding skipped (Redis/Queue offline):", err.message);
    }
  }

  await invalidateDashboardCaches(userId);
  return record;
}

// ── CREATE Record ─────────────────────────────────────────
async function create(req, res) {
  const data = validators.createLendBorrowSchema.parse(req.body);
  const record = await createLendBorrowRecordService(req.userId, data);
  res.status(201).json({ message: "Record created", record });
}

// ── UPDATE Record ─────────────────────────────────────────
async function update(req, res) {
  const { id } = req.params;
  const data = validators.updateLendBorrowSchema.parse(req.body);

  const existing = await prisma.lendBorrowRecord.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.userId) {
    throw new AppError("Record not found", 404, "NOT_FOUND");
  }

  // Build update payload, converting date strings to Date objects
  const updateData = { ...data };
  if (data.expectedReturnDate) {
    updateData.expectedReturnDate = new Date(data.expectedReturnDate);
  }

  const updated = await prisma.lendBorrowRecord.update({
    where: { id },
    data: updateData,
  });

  // SRS LB-7: re-run embeddings if notes changed
  if (data.notes !== undefined && data.notes !== existing.notes) {
    try {
      await embeddingGenerationQueue.add("generate", {
        recordId: updated.id,
        recordType: "lendBorrow",
        textChunk: data.notes || "",
        userId: req.userId,
      });
    } catch (err) {
      console.warn("[Queue] Background embedding skipped (Redis/Queue offline):", err.message);
    }
  }

  await invalidateDashboardCaches(req.userId);

  res.status(200).json(updated);
}

// ── DELETE Record ─────────────────────────────────────────
async function remove(req, res) {
  const { id } = req.params;

  const existing = await prisma.lendBorrowRecord.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.userId) {
    throw new AppError("Record not found", 404, "NOT_FOUND");
  }

  // Cascade deletes RepaymentHistory + NoteEmbedding via Prisma schema
  await prisma.lendBorrowRecord.delete({ where: { id } });

  await invalidateDashboardCaches(req.userId);

  res.status(200).json({ message: "Record deleted" });
}

// ── LOG Partial Repayment ─────────────────────────────────
async function logRepayment(req, res) {
  const { id } = req.params;
  const data = validators.repaymentSchema.parse(req.body);

  const record = await prisma.lendBorrowRecord.findUnique({ where: { id } });
  if (!record || record.userId !== req.userId) {
    throw new AppError("Record not found", 404, "NOT_FOUND");
  }

  if (record.status === LEND_BORROW_STATUS[2]) {
    throw new AppError("This record is already fully repaid", 400, "ALREADY_REPAID");
  }

  // Ensure repayment principal doesn't exceed remaining balance
  const totalRepaidSoFar = await getTotalRepaid(id);
  const remaining = Number(record.amount) - totalRepaidSoFar;

  const incomingPrincipal = data.paymentType === 'interest_only' 
    ? 0 
    : (data.paymentType === 'principal_interest' ? (data.principalAmount || 0) : data.amount);
    
  const incomingInterest = data.paymentType === 'principal_only' 
    ? 0 
    : (data.paymentType === 'principal_interest' ? (data.interestAmount || 0) : data.amount);

  if (incomingPrincipal > remaining + 0.01) {
    throw new AppError(
      `Repayment principal exceeds the outstanding balance. Enter a principal up to ₹${remaining.toFixed(2)}.`,
      400,
      "REPAYMENT_EXCEEDS_BALANCE"
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    let verificationStatus = "not_required";
    let linkedTransactionId = null;

    if (data.paymentMode === 'online') {
      verificationStatus = "pending_verification";
      const targetDateStr = new Date(data.date).toISOString().split('T')[0];
      const startDate = new Date(`${targetDateStr}T00:00:00.000Z`);
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      const match = await tx.transaction.findFirst({
        where: {
          userId: req.userId,
          refNo: data.transactionId,
          amount: data.amount,
          date: { gte: startDate, lte: endDate }
        }
      });

      if (match) {
        verificationStatus = "verified";
        linkedTransactionId = match.id;
      }
    }

    const repayment = await tx.repaymentHistory.create({
      data: {
        lendBorrowId: id,
        amount: data.amount,
        date: new Date(data.date),
        paymentType: data.paymentType || 'principal_only',
        principalAmount: incomingPrincipal,
        interestAmount: incomingInterest,
        paymentMode: data.paymentMode || "cash",
        transactionId: data.transactionId || null,
        verificationStatus,
        linkedTransactionId
      },
    });

    const newTotalRepaid = totalRepaidSoFar + incomingPrincipal;
    const newStatus = deriveStatus(newTotalRepaid, Number(record.amount));

    await tx.lendBorrowRecord.update({
      where: { id },
      data: { status: newStatus },
    });

    return { repayment, newStatus, totalRepaid: newTotalRepaid };
  }, { maxWait: 15000, timeout: 30000 });

  await invalidateDashboardCaches(req.userId);

  res.status(201).json({
    message: "Repayment logged",
    repayment: result.repayment,
    newStatus: result.newStatus,
    totalRepaid: parseFloat(result.totalRepaid.toFixed(2)),
    remainingBalance: parseFloat(
      Math.max(0, Number(record.amount) - result.totalRepaid).toFixed(2)
    ),
  });
}

// ── GET Per-Person History ────────────────────────────────
async function getByPerson(req, res) {
  const { email } = req.params;

  const records = await prisma.lendBorrowRecord.findMany({
    where: { userId: req.userId, personEmail: email },
    include: { repayments: { orderBy: { date: "desc" } } },
    orderBy: { dateGiven: "desc" },
  });

  if (records.length === 0) {
    res.status(200).json({ records: [], totalOutstanding: 0 });
    return;
  }

  let totalOutstanding = 0;
  const enriched = records.map((record) => {
    const totalRepaid = calculatePrincipalRepaid(record.repayments);
    const remaining = Math.max(0, Number(record.amount) - totalRepaid);

    // Only count non-repaid records toward outstanding
    if (record.status !== LEND_BORROW_STATUS[2]) {
      // Positive if user lent (they're owed), negative if user borrowed (they owe)
      if (record.type === "lent") {
        totalOutstanding += remaining;
      } else {
        totalOutstanding -= remaining;
      }
    }

    return enrichRecord(record, totalRepaid);
  });

  res.status(200).json({
    personEmail: email,
    personName: records[0].personName,
    totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
    records: enriched,
  });
}

// ── GET All Overdue Records ───────────────────────────────
async function getOverdue(req, res) {
  // Fetch non-repaid records with expectedReturnDate in the past
  const records = await prisma.lendBorrowRecord.findMany({
    where: {
      userId: req.userId,
      status: { not: LEND_BORROW_STATUS[2] }, // not "repaid"
      expectedReturnDate: { lt: new Date() },
    },
    include: { repayments: true },
    orderBy: { expectedReturnDate: "asc" },
  });

  const enriched = records.map((record) => {
    const totalRepaid = calculatePrincipalRepaid(record.repayments);
    const result = enrichRecord(record, totalRepaid);
    delete result.repayments;
    return result;
  });

  res.status(200).json(enriched);
}

// ── Verify Pending Records (Statement Hook) ─────────────────
async function verifyPendingLendBorrowRecords(userId) {
  // 1. Base Lend/Borrow Records
  const pendingRecords = await prisma.lendBorrowRecord.findMany({
    where: { userId, verificationStatus: "pending_verification", paymentMode: "online" }
  });

  for (const record of pendingRecords) {
    if (!record.transactionId) continue;
    const targetDateStr = record.dateGiven.toISOString().split('T')[0];
    const startDate = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const match = await prisma.transaction.findFirst({
      where: {
        userId,
        refNo: record.transactionId,
        amount: record.amount,
        date: { gte: startDate, lte: endDate }
      }
    });

    if (match) {
      await prisma.lendBorrowRecord.update({
        where: { id: record.id },
        data: { verificationStatus: "verified", linkedTransactionId: match.id }
      });
    }
  }

  // 2. Repayment History Records
  const pendingRepayments = await prisma.repaymentHistory.findMany({
    where: { 
      lendBorrowRecord: { userId }, 
      verificationStatus: "pending_verification", 
      paymentMode: "online" 
    }
  });

  for (const rep of pendingRepayments) {
    if (!rep.transactionId) continue;
    const targetDateStr = rep.date.toISOString().split('T')[0];
    const startDate = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const match = await prisma.transaction.findFirst({
      where: {
        userId,
        refNo: rep.transactionId,
        amount: rep.amount,
        date: { gte: startDate, lte: endDate }
      }
    });

    if (match) {
      await prisma.repaymentHistory.update({
        where: { id: rep.id },
        data: { verificationStatus: "verified", linkedTransactionId: match.id }
      });
    }
  }
}

// ── 8. Manual Reminder Emails ─────────────────────────────
async function sendReminders(req, res) {
  const { personEmail } = req.body;
  if (!personEmail) throw new AppError("personEmail is required", 400);

  // Get active user
  const user = await prisma.user.findUnique({ where: { id: req.userId } });

  // Get active "lent" records
  const whereClause = {
    userId: req.userId,
    type: "lent",
    status: { not: LEND_BORROW_STATUS[2] } // not 'repaid'
  };

  if (personEmail !== "ALL") {
    whereClause.personEmail = personEmail;
  }

  const records = await prisma.lendBorrowRecord.findMany({
    where: whereClause,
    include: { repayments: true }
  });

  if (records.length === 0) {
    return res.status(200).json({ message: "No active debts found to remind." });
  }

  // Group by email if "ALL" was requested
  const groups = {};
  for (const record of records) {
    if (!groups[record.personEmail]) groups[record.personEmail] = [];
    const repaid = record.repayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    groups[record.personEmail].push({ ...record, repaid });
  }

  // Send an email to each group
  let count = 0;
  for (const [email, userRecords] of Object.entries(groups)) {
    const personName = userRecords[0].personName;
    let tableRows = userRecords.map(r => {
      const remaining = Number(r.amount) - r.repaid;
      const expected = new Date(r.expectedReturnDate).toLocaleDateString();
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${r.notes || "Personal Loan"}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Rs. ${Number(r.amount).toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #d97706;">Rs. ${remaining.toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${expected}</td>
        </tr>
      `;
    }).join("");

    const totalRemaining = userRecords.reduce((acc, r) => acc + (Number(r.amount) - r.repaid), 0);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0f766e;">Hello ${personName},</h2>
        <p>This is a polite reminder from <strong>${user.name}</strong> regarding some outstanding payments.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6; text-align: left;">
              <th style="padding: 8px; border: 1px solid #ddd;">Description</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Original Amount</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Remaining Balance</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Promised Date</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <h3 style="color: #be123c;">Total Outstanding: Rs. ${totalRemaining.toLocaleString()}</h3>
        <p>Please reach out to ${user.name} (${user.email}) to clear these dues at your earliest convenience.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <small style="color: #999;">Sent automatically via FinPilot Lending Agent on behalf of ${user.name}.</small>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `Reminder: Outstanding Dues for ${user.name}`,
      html
    });
    count++;
  }

  res.status(200).json({ message: `Successfully dispatched ${count} reminder email(s).` });
}

// ── 9. Variable Interest Rate Overrides ─────────────────────
async function changeInterestRate(req, res) {
  const { id } = req.params;
  const { newRate, startDate, interestType, compoundingFrequency } = req.body;

  if (newRate === undefined || !startDate) {
    throw new AppError("newRate and startDate are required", 400);
  }

  const record = await prisma.lendBorrowRecord.findUnique({ where: { id } });
  if (!record || record.userId !== req.userId) {
    throw new AppError("Record not found", 404, "NOT_FOUND");
  }

  const type = interestType || "simple";
  if (!["simple", "compound"].includes(type)) {
    throw new AppError("interestType must be either simple or compound", 400);
  }

  const history = Array.isArray(record.interestRateHistory) ? [...record.interestRateHistory] : [];
  history.push({ 
    date: new Date(startDate).toISOString(), 
    rate: Number(newRate),
    interestType: type,
    compoundingFrequency: type === "compound" ? Number(compoundingFrequency || 1) : null
  });

  const updated = await prisma.lendBorrowRecord.update({
    where: { id },
    data: { 
      interestRateHistory: history
    }
  });

  await invalidateDashboardCaches(req.userId);
  res.status(200).json(updated);
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  logRepayment,
  getByPerson,
  getOverdue,
  createLendBorrowRecordService,
  verifyPendingLendBorrowRecords,
  sendReminders,
  changeInterestRate,
};

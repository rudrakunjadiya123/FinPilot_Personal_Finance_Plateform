// ═══════════════════════════════════════════════════════════
// FINPILOT — 3-Factor Loan Transaction Matching Service
// ═══════════════════════════════════════════════════════════
// Evaluates statement debit transactions against user's active loans using 3 factors:
// Factor 1 — Lender/Bank Match (e.g., HDFC vs HDFC Bank)
// Factor 2 — EMI Amount Match (Exact or within 1%)
// Factor 3 — Description / Loan Type Match (e.g., "HOME LOAN EMI" vs Home Loan)
//
// Rules:
// - All 3 Factors Matched => AUTO-LINK transaction to Loan EMI schedule & reduce outstanding balance.
// - 2 Factors / Partial Matched => Create a pending LoanMatchSuggestion for Dashboard Accept/Reject.

const prisma = require("../config/db");

/**
 * Matches raw transactions of a statement upload against active user loans.
 * @param {string} userId 
 * @param {string} uploadId 
 */
async function processLoanMatchingEngine(userId, uploadId) {
  // 1. Fetch user's active loans with EMI schedules
  const activeLoans = await prisma.loan.findMany({
    where: { userId, status: "active" },
    include: { emiSchedule: { orderBy: { month: "asc" } } },
  });

  if (!activeLoans || activeLoans.length === 0) return;

  // 2. Fetch debit transactions for this statement upload
  const upload = await prisma.statementUpload.findUnique({
    where: { id: uploadId },
    include: { transactions: true },
  });

  if (!upload || !upload.transactions) return;

  const debitTxs = upload.transactions.filter(
    (tx) => tx.type === "debit" && Number(tx.amount) > 0
  );

  if (debitTxs.length === 0) return;

  const statementBank = (upload.bankName || "").toUpperCase();

  for (const tx of debitTxs) {
    const txDesc = (tx.descriptionRaw || "").toUpperCase();
    const txAmount = Number(tx.amount);

    for (const loan of activeLoans) {
      const emiAmount = Number(loan.emiAmount);
      const loanType = (loan.loanType || "").toLowerCase();
      const lenderName = (loan.lenderName || loan.notes || "").toUpperCase();

      // ── Factor 1: Bank/Lender Match ──
      let factor1 = false;
      if (lenderName && lenderName.length >= 2) {
        const lenderTokens = lenderName.split(/[\s,._/-]+/).filter((t) => t.length >= 2);
        factor1 = lenderTokens.some(
          (token) => txDesc.includes(token) || statementBank.includes(token)
        );
      }
      if (!factor1 && statementBank && statementBank.length >= 2) {
        const bankTokens = statementBank.split(/[\s,._/-]+/).filter((t) => t.length >= 2);
        factor1 = bankTokens.some((token) => txDesc.includes(token));
      }
      if (!factor1 && (txDesc.includes("LOAN") || txDesc.includes("EMI"))) {
        factor1 = true;
      }

      // ── Factor 2: Amount Match ──
      const amtDiff = Math.abs(txAmount - emiAmount);
      const factor2 = amtDiff <= 1.00 || (amtDiff / emiAmount) < 0.01;

      // ── Factor 3: Description / Loan Type Match ──
      let factor3 = "none";
      const loanTypeKeywords = {
        home: ["HOME LOAN", "HOUSING LOAN", "HOME EMI", "MORTGAGE"],
        personal: ["PERSONAL LOAN", "PERS LOAN", "PERSONAL EMI", "CONSUMER LOAN", "GOLD LOAN", "BUSINESS LOAN"],
        auto: ["AUTO LOAN", "CAR LOAN", "VEHICLE LOAN", "AUTO EMI", "CAR EMI", "TWO WHEELER LOAN", "BIKE LOAN"],
        education: ["EDUCATION LOAN", "EDU LOAN", "STUDENT LOAN"],
        other: ["LOAN", "EMI", "LOAN REPAYMENT", "LOAN PAYMENT", "LOAN INSTALLMENT", "INSTALLMENT", "INSTALMENT", "ACH LOAN", "NACH LOAN", "NACH EMI", "ACH EMI", "ECS LOAN", "ECS EMI", "AUTO DEBIT LOAN", "LOAN DEBIT"],
      };

      const genericKeywords = [
        "EMI", "LOAN EMI", "LOAN REPAYMENT", "LOAN PAYMENT", "LOAN INSTALLMENT",
        "INSTALLMENT", "INSTALMENT", "ACH LOAN", "NACH LOAN", "NACH EMI",
        "ACH EMI", "ECS LOAN", "ECS EMI", "AUTO DEBIT LOAN", "LOAN DEBIT", "LOAN"
      ];

      const specificKeywords = loanTypeKeywords[loanType] || genericKeywords;
      const hasSpecificType = specificKeywords.some((kw) => txDesc.includes(kw));
      const hasGenericKeyword = genericKeywords.some((kw) => txDesc.includes(kw));

      if (hasSpecificType) {
        factor3 = "strong";
      } else if (hasGenericKeyword || txDesc.includes("ACH") || txDesc.includes("NACH") || txDesc.includes("AUTO DEBIT")) {
        factor3 = "partial";
      }

      // ── Decision Logic ──
      const isFullMatch = factor1 && factor2 && factor3 === "strong";

      const isPartialMatch =
        !isFullMatch &&
        ((factor1 && factor2) || (factor1 && factor3 === "strong") || (factor2 && factor3 !== "none"));

      if (isFullMatch) {
        await applyLoanPayment(userId, loan.id, tx);
        break;
      } else if (isPartialMatch) {
        const existingSuggestion = await prisma.loanMatchSuggestion.findFirst({
          where: {
            userId,
            loanId: loan.id,
            transactionId: tx.id,
          },
        });

        if (!existingSuggestion) {
          const reasonParts = [];
          if (factor1) reasonParts.push(`Lender Match (${lenderName || statementBank || 'Bank'})`);
          if (factor2) reasonParts.push(`EMI Amount Match (₹${txAmount.toLocaleString("en-IN")})`);
          if (factor3 === "strong") reasonParts.push(`Loan Type Match (${loanType})`);
          else if (factor3 === "partial") reasonParts.push(`Generic Loan Keyword`);

          await prisma.loanMatchSuggestion.create({
            data: {
              userId,
              loanId: loan.id,
              transactionId: tx.id,
              matchReason: reasonParts.join(" • "),
              factors: { factor1, factor2, factor3 },
              status: "pending",
            },
          });
        }
      }
    }
  }
}

/**
 * Links a transaction directly to a Loan, updates EMI schedule, reduces outstanding balance, and categorizes transaction.
 */
async function applyLoanPayment(userId, loanId, transaction) {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { emiSchedule: { orderBy: { month: "asc" } } },
  });

  if (!loan) return;

  const txAmount = Number(transaction.amount);

  const unpaidEmi = loan.emiSchedule.find((e) => e.paidStatus === "unpaid");

  if (unpaidEmi) {
    await prisma.eMISchedule.update({
      where: { id: unpaidEmi.id },
      data: {
        paidStatus: "paid",
        paidDate: transaction.date,
      },
    });

    const principalDeduction = Number(unpaidEmi.principalComponent) > 0 
      ? Number(unpaidEmi.principalComponent) 
      : txAmount;

    const newOutstanding = Math.max(0, Number(loan.outstandingBalance) - principalDeduction);

    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        outstandingBalance: newOutstanding,
        status: newOutstanding <= 0 ? "closed" : loan.status,
      },
    });
  } else {
    const newOutstanding = Math.max(0, Number(loan.outstandingBalance) - txAmount);
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        outstandingBalance: newOutstanding,
        status: newOutstanding <= 0 ? "closed" : loan.status,
      },
    });
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      category: "Loan EMI",
      categorySource: "rule",
      confidenceScore: 0.99,
      needsReview: false,
    },
  });
}

module.exports = {
  processLoanMatchingEngine,
  applyLoanPayment,
};

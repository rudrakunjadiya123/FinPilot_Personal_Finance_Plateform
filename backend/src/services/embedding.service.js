// ═══════════════════════════════════════════════════════════
// FINPILOT — Embedding Service
// Interfaces with Google's Gemini SDK to generate vectors
// using the text-embedding-004 model.
// ═══════════════════════════════════════════════════════════

const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;

function getGenAI() {
  if (!genAI) {
    if (!process.env.LLM_API_KEY) {
      throw new Error("Missing LLM_API_KEY in environment variables");
    }
    genAI = new GoogleGenerativeAI(process.env.LLM_API_KEY);
  }
  return genAI;
}

/**
 * Returns a 768-dimensional float array representation of the input text chunk.
 * @param {string} text 
 * @returns {Promise<number[]>} Float array of size 768
 */
async function generateEmbedding(text) {
  try {
    const ai = getGenAI();
    const modelStr = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
    const model = ai.getGenerativeModel({ model: modelStr });

    // Explicitly enforce 768 dimensions for pgvector vector(768) compatibility
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    });
    return result.embedding.values;
  } catch (error) {
    console.error("[Embedding Service] Failed to generate embedding:", error.message);
    throw error;
  }
}

/**
 * Helper to build a searchable natural-language summary for a Loan
 */
function formatLoanText(loan) {
  const parts = [
    `Loan with ${loan.lenderName || "Lender"}: ${loan.loanType || "personal"} loan`,
    `Principal amount ₹${loan.principalAmount}`,
    `Interest rate ${loan.interestRate}%`,
    loan.tenureMonths ? `tenure ${loan.tenureMonths} months` : null,
    loan.emiAmount ? `monthly EMI ₹${loan.emiAmount}` : null,
    loan.outstandingBalance !== undefined ? `outstanding balance ₹${loan.outstandingBalance}` : null,
    loan.startDate ? `started on ${new Date(loan.startDate).toISOString().split("T")[0]}` : null,
    loan.notes ? `Notes: ${loan.notes}` : null,
  ].filter(Boolean);

  return parts.join(". ") + ".";
}

/**
 * Helper to build a searchable natural-language summary for a Lend/Borrow record
 */
function formatLendBorrowText(record) {
  const action = record.type === "lent" ? "Lent to" : "Borrowed from";
  const parts = [
    `${action} ${record.personName || "Person"}`,
    record.personEmail ? `Email: ${record.personEmail}` : null,
    `Amount ₹${record.amount}`,
    record.dateGiven ? `Date given: ${new Date(record.dateGiven).toISOString().split("T")[0]}` : null,
    record.expectedReturnDate ? `Expected return date: ${new Date(record.expectedReturnDate).toISOString().split("T")[0]}` : null,
    record.status ? `Status: ${record.status}` : null,
    record.paymentMode ? `Payment mode: ${record.paymentMode}` : null,
    record.interestRate ? `Interest rate: ${record.interestRate}%` : null,
    record.notes ? `Notes: ${record.notes}` : null,
  ].filter(Boolean);

  return parts.join(". ") + ".";
}

/**
 * Helper to build a searchable natural-language summary for a Financial Goal
 */
function formatGoalText(goal) {
  const parts = [
    `Financial Goal: ${goal.name}`,
    `Type: ${goal.goalType}`,
    goal.targetAmount ? `Target amount ₹${goal.targetAmount}` : null,
    `Current saved ₹${goal.currentSaved || 0}`,
    goal.targetDate ? `Target date: ${new Date(goal.targetDate).toISOString().split("T")[0]}` : null,
    goal.targetMonths ? `Target timeline: ${goal.targetMonths} months` : null,
  ].filter(Boolean);

  return parts.join(". ") + ".";
}

/**
 * Helper to build a searchable natural-language summary for a Bank Transaction
 */
function formatTransactionText(tx) {
  const dateStr = tx.date ? new Date(tx.date).toISOString().split("T")[0] : "recent";
  const parts = [
    `Transaction on ${dateStr}`,
    `${tx.type === "credit" ? "Income/Credit" : "Expense/Debit"} of ₹${tx.amount}`,
    `Description: ${tx.descriptionRaw || tx.description || "N/A"}`,
    tx.category ? `Category: ${tx.category}` : null,
    tx.paymentMode ? `Payment mode: ${tx.paymentMode}` : null,
  ].filter(Boolean);

  return parts.join(". ") + ".";
}

module.exports = {
  generateEmbedding,
  formatLoanText,
  formatLendBorrowText,
  formatGoalText,
  formatTransactionText,
};

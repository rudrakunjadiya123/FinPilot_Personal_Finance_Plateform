// ═══════════════════════════════════════════════════════════
// FINPILOT — RAG Service
// Retrieves relevant financial context for the chatbot
// Combines semantic vector search + direct DB queries
// Per Master Spec: RAG Architecture
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");
const { generateEmbedding } = require("./embedding.service");

/**
 * Performs semantic search over NoteEmbedding table using pgvector cosine distance.
 * Returns the top-K most relevant note chunks for the user's query.
 *
 * @param {string} queryText - The user's natural language query
 * @param {string} userId - Current user ID
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array>} Array of { recordId, recordType, content, distance }
 */
async function semanticSearch(queryText, userId, topK = 5) {
  try {
    const queryVector = await generateEmbedding(queryText);
    const vectorStr = `[${queryVector.join(",")}]`;

    // Use pgvector's <=> (cosine distance) operator
    const results = await prisma.$queryRaw`
      SELECT 
        "recordId", 
        "recordType", 
        content,
        embedding <=> ${vectorStr}::vector AS distance
      FROM "NoteEmbedding"
      WHERE "userId" = ${userId}
      ORDER BY distance ASC
      LIMIT ${topK};
    `;

    return results;
  } catch (error) {
    console.error("[RAG] Semantic search failed:", error.message);
    // Gracefully degrade — return empty rather than crash the chat
    return [];
  }
}

/**
 * Gathers direct structured financial data for the user.
 * This provides the "deterministic context" that doesn't rely on embeddings.
 *
 * @param {string} userId
 * @returns {Promise<Object>} Structured financial summary
 */
async function getStructuredContext(userId) {
  // Active loans summary
  const loans = await prisma.loan.findMany({
    where: { userId, status: "active" },
    select: {
      id: true,
      loanType: true,
      principalAmount: true,
      interestRate: true,
      tenureMonths: true,
      emiAmount: true,
      outstandingBalance: true,
      startDate: true,
      notes: true,
    },
  });

  // Lend/borrow records (non-repaid)
  const lendBorrow = await prisma.lendBorrowRecord.findMany({
    where: { userId, status: { not: "repaid" } },
    select: {
      id: true,
      personName: true,
      personEmail: true,
      amount: true,
      type: true,
      dateGiven: true,
      expectedReturnDate: true,
      status: true,
      notes: true,
    },
  });

  // Recent income entries (last 6 months)
  const incomeEntries = await prisma.incomeEntry.findMany({
    where: { userId },
    orderBy: { month: "desc" },
    take: 6,
    select: { source: true, amount: true, month: true },
  });

  return { loans, lendBorrow, incomeEntries };
}

/**
 * Formats structured data into a readable text block for the LLM.
 * Also extracts PII entries for redaction.
 *
 * @param {Object} structuredData - Output from getStructuredContext()
 * @param {Array} semanticResults - Output from semanticSearch()
 * @returns {{ contextText: string, piiEntries: Array }}
 */
function formatContextForLLM(structuredData, semanticResults) {
  const { loans = [], lendBorrow = [], ccBills = [], incomeEntries = [] } = structuredData;
  const lines = [];
  const piiEntries = [];

  // ── Loans ──
  if (loans.length > 0) {
    lines.push("## Active Loans");
    for (const loan of loans) {
      lines.push(
        `- ${loan.loanType} loan: Principal ₹${Number(loan.principalAmount).toLocaleString("en-IN")}, ` +
        `Rate ${loan.interestRate}%, EMI ₹${Number(loan.emiAmount).toLocaleString("en-IN")}, ` +
        `Outstanding ₹${Number(loan.outstandingBalance).toLocaleString("en-IN")}` +
        (loan.notes ? ` (Notes: ${loan.notes})` : "")
      );
    }
  }

  // ── Lend/Borrow ──
  if (lendBorrow.length > 0) {
    lines.push("\n## Lend/Borrow Records");
    for (const lb of lendBorrow) {
      // Collect PII for redaction
      piiEntries.push({ name: lb.personName, email: lb.personEmail });

      const isOverdue = new Date(lb.expectedReturnDate) < new Date();
      lines.push(
        `- ${lb.type === "lent" ? "Lent to" : "Borrowed from"} ${lb.personName}: ` +
        `₹${Number(lb.amount).toLocaleString("en-IN")}, Status: ${lb.status}` +
        (isOverdue ? " [OVERDUE]" : "") +
        `, Due: ${new Date(lb.expectedReturnDate).toISOString().split("T")[0]}` +
        (lb.notes ? ` (Notes: ${lb.notes})` : "")
      );
    }
  }

  // ── Credit Cards ──
  if (ccBills.length > 0) {
    lines.push("\n## Recent Credit Card Bills");
    for (const cc of ccBills) {
      const paid = cc.paidAmount ? Number(cc.paidAmount) : 0;
      lines.push(
        `- ${cc.cardName} (****${cc.last4Digits}): ` +
        `₹${Number(cc.totalAmount).toLocaleString("en-IN")} due ${new Date(cc.dueDate).toISOString().split("T")[0]}, ` +
        `Status: ${cc.paidStatus}` +
        (paid > 0 ? `, Paid: ₹${paid.toLocaleString("en-IN")}` : "")
      );
    }
  }

  // ── Income ──
  if (incomeEntries.length > 0) {
    lines.push("\n## Recent Income");
    for (const inc of incomeEntries) {
      lines.push(
        `- ${inc.source}: ₹${Number(inc.amount).toLocaleString("en-IN")} ` +
        `(${new Date(inc.month).toISOString().substring(0, 7)})`
      );
    }
  }

  // ── Semantic search results (from notes/embeddings) ──
  if (semanticResults.length > 0) {
    lines.push("\n## Relevant Notes (from your records)");
    for (const result of semanticResults) {
      lines.push(`- [${result.recordType}] ${result.content}`);
    }
  }

  return { contextText: lines.join("\n"), piiEntries };
}

module.exports = {
  semanticSearch,
  getStructuredContext,
  formatContextForLLM,
};

// ═══════════════════════════════════════════════════════════
// FINPILOT — Statement Analysis Service
// Module 12: Deterministic Extraction & Hybrid Categorization
// ═══════════════════════════════════════════════════════════

const pdf = require("pdf-parse");
const { parse } = require("csv-parse");
const prisma = require("../config/db");
const { getChatCompletion } = require("./llm.service");
const { generateEmbedding } = require("./embedding.service");
const { redactPII, reinjectPII } = require("../utils/redaction");

/**
 * Deterministically parses a standard PDF buffer into raw transactions.
 * Assumes common tabular statement formats line-by-line.
 */
async function parsePDFAccounting(buffer) {
  const data = await pdf(buffer);
  const text = data.text;
  const lines = text.split("\n");
  const transactions = [];

  // Very rigid standard date matcher (DD/MM/YYYY or DD-MM-YYYY) 
  // typical in Indian banking layouts
  const transactionRegex = /^(\d{2}[-/]\d{2}[-/]\d{4})\s+(.+?)\s+([+-]?(\d{1,3}(,\d{3})*|\d+)(\.\d{2})?)\s*(Cr|Dr|Cr\.|Dr\.|)?$/i;
  
  // Fallback for statements where Credits and Debits are separate columns
  // E.g. Date | Particulars | Chq No | Debit | Credit | Balance
  const inlineRegex = /^(\d{2}[-/]\d{2}[-/]\d{4})\s+(.+?)\s+(\d{1,3}(,\d{3})*|\d+)?\.\d{2}\s+(\d{1,3}(,\d{3})*|\d+)?\.\d{2}\s+/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // A completely rudimentary parser assuming "Date | Description | Amount" for demonstration
    // Since real banks fracture radically, we use a simplistic capture for standard rows.
    const match = line.match(/^(\d{2}[-/]\d{2}[-/]\d{4})\s+(.+)/);
    
    if (match) {
        const dateStr = match[1];
        let rest = match[2];
        
        // Find trailing balances and debit/credit amounts
        // We will assume the LAST number block in the string is the balance, and the SECOND TO LAST is the amount.
        const numBlocks = rest.match(/([+-]?(\d{1,3}(,\d{3})*|\d+)\.\d{2})/g);
        
        if (numBlocks && numBlocks.length >= 1) {
            // Found a transaction row
            const amountStr = numBlocks[0].replace(/,/g, '');
            const parsedAmount = Math.abs(parseFloat(amountStr));
            let type = "debit"; // default assume
            
            if (rest.endsWith("Cr") || rest.endsWith("CR") || parseFloat(amountStr) > 0 && !line.includes("-")) {
                if (rest.includes("Cr") || line.includes("CREDIT")) type = "credit";
            }
            if (line.includes("-") || line.includes("Dr")) type = "debit";

            // Scrub numbers out of the description
            const desc = rest.replace(/([+-]?(\d{1,3}(,\d{3})*|\d+)\.\d{2})/g, '').replace(/(Cr|Dr|CR|DR)$/i, '').trim();

            const parsedDate = parseDateString(dateStr);
            if (parsedDate && !isNaN(parsedDate) && parsedAmount > 0) {
               transactions.push({
                   date: parsedDate,
                   description: desc.substring(0, 200), // Cap length
                   amount: parsedAmount,
                   type: type,
               });
            }
        }
    }
  }

  return transactions;
}

/**
 * Deterministically extracts transactions from a raw CSV buffer.
 * Relies on spotting numeric columns securely mapped natively implicitly.
 */
async function parseCSVAccounting(buffer) {
    const transactions = [];
    return new Promise((resolve, reject) => {
        parse(buffer, {
            columns: false,
            skip_empty_lines: true
        }, (err, records) => {
            if (err) return reject(err);

            for (const row of records) {
                // Heuristic: We look for a date-like string and a number explicitly anywhere in the row globally.
                let parsedDate = null;
                let parsedAmount = 0;
                let description = "";
                let type = "debit";

                for (const col of row) {
                    const c = col.trim();
                    if (!parsedDate && parseDateString(c)) {
                        parsedDate = parseDateString(c);
                        continue;
                    }
                    
                    const amtMatch = c.match(/^[+-]?(\d{1,3}(,\d{3})*|\d+)\.\d{2}$/);
                    if (amtMatch && parsedAmount === 0) {
                        parsedAmount = Math.abs(parseFloat(c.replace(/,/g, '')));
                        if (!c.includes("-")) {
                            // In CC statements usually debits are positive. But we'll fallback to context or specific bank format limits later.
                            type = "debit"; 
                        } else {
                            type = "credit"; // Refunds
                        }
                        continue;
                    }

                    if (c.length > 3 && isNaN(c)) {
                       description += " " + c;
                    }
                }

                if (parsedDate && parsedAmount > 0) {
                    transactions.push({
                        date: parsedDate,
                        description: description.substring(0, 200).trim(),
                        amount: parsedAmount,
                        type: type
                    });
                }
            }
            resolve(transactions);
        });
    });
}

function parseDateString(dateStr) {
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
  }
  return null;
}

/**
 * 3-Tier Execution Pipeline for Categorization
 * Fixed ENUM: Food, Rent, Fuel, Shopping, Entertainment, Medical, Travel, Education, Utilities, Investment, Salary, Transfer, Other
 */
async function categorizeTransaction(merchantString, userId) {
  // Tier 1: User-Defined Strict Rules
  const existingRules = await prisma.merchantCategoryRule.findMany({ where: { userId } });
  for (const rule of existingRules) {
     if (merchantString.toLowerCase().includes(rule.keyword.toLowerCase())) {
         return { category: rule.category, source: "rule" };
     }
  }

  // Generic internal fallback dict
  const internalRules = {
      "swiggy": "Food", "zomato": "Food", "uber": "Travel", "ola": "Travel", 
      "amazon": "Shopping", "flipkart": "Shopping", "salary": "Salary",
      "hospital": "Medical", "pharmacy": "Medical", "petrol": "Fuel", "shell": "Fuel"
  };

  for (const [key, val] of Object.entries(internalRules)) {
      if (merchantString.toLowerCase().includes(key)) {
         return { category: val, source: "rule" }; // technically internal standard
      }
  }

  // Tier 2: PgVector Embedded RAG Matrix
  try {
      const queryVector = await generateEmbedding(merchantString);
      const vectorStr = `[${queryVector.join(",")}]`;
      const results = await prisma.$queryRaw`
        SELECT content, "recordType", embedding <=> ${vectorStr}::vector AS distance
        FROM "NoteEmbedding"
        WHERE "userId" = ${userId} AND "recordType" = 'merchantRule'
        ORDER BY distance ASC
        LIMIT 1;
      `;
      if (results && results.length > 0 && results[0].distance < 0.20) {
          // Found high-confidence vector mapping
          return { category: results[0].content, source: "rag" };
      }
  } catch(e) { console.error("[Cat] RAG failure", e.message); }

  // Tier 3: LLM Secure Classification (Final Fallback)
  try {
      // Redact completely any possible numbers or names before bouncing
      // Although merchant strings are usually non-PII, we still proxy out raw numbers
      const scrubbedMerchant = merchantString.replace(/\d+/g, "[DIGIT]");
      
      const prompt = `Classify this merchant string into EXACTLY ONE of these categories: Food, Rent, Fuel, Shopping, Entertainment, Medical, Travel, Education, Utilities, Investment, Salary, Transfer, Other. 
Merchant: "${scrubbedMerchant}"
Reply with ONLY the raw category name. Nothing else.`;
      
      const llmResult = await getChatCompletion(prompt, "", [], []);
      const answer = llmResult.text ? llmResult.text.trim() : "Other";
      
      // Filter answer rigidly
      const validCategories = ["Food", "Rent", "Fuel", "Shopping", "Entertainment", "Medical", "Travel", "Education", "Utilities", "Investment", "Salary", "Transfer", "Other"];
      
      if (validCategories.includes(answer)) {
          return { category: answer, source: "llm" };
      }
      return { category: "Other", source: "llm" };
  } catch (e) {
      console.error("[Cat] LLM classification failed", e.message);
      return { category: "Other", source: "error" };
  }
}

/**
 * Compute the month-over-month deltas deterministically for the Insights Array
 */
async function computeMonthlyDeltas(userId, targetMonthDate) {
    const startOfCurrent = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 1);
    const endOfCurrent = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0, 23, 59, 59);
    
    const startOfPrev = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() - 1, 1);
    const endOfPrev = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 0, 23, 59, 59);

    // Grab current month
    const currentTx = await prisma.transaction.findMany({
        where: { userId, date: { gte: startOfCurrent, lte: endOfCurrent } }
    });

    // Grab previous month
    const prevTx = await prisma.transaction.findMany({
        where: { userId, date: { gte: startOfPrev, lte: endOfPrev } }
    });

    const currentBreakdown = aggregateByCategory(currentTx);
    const prevBreakdown = aggregateByCategory(prevTx);

    const deltas = [];

    for (const [cat, amt] of Object.entries(currentBreakdown)) {
        const prevAmt = prevBreakdown[cat] || 0;
        let pDelta = 0;
        if (prevAmt > 0) {
            pDelta = ((amt - prevAmt) / prevAmt) * 100;
        } else if (amt > 0) {
            pDelta = 100; 
        }

        deltas.push({
            category: cat,
            currentAmount: amt,
            previousAmount: prevAmt,
            percentChange: parseFloat(pDelta.toFixed(2))
        });
    }

    return deltas;
}

function aggregateByCategory(transactions) {
    const map = {};
    for (const t of transactions) {
        if (t.type === "debit") {
            map[t.category] = (map[t.category] || 0) + Number(t.amount);
        }
    }
    return map;
}

module.exports = {
  parsePDFAccounting,
  parseCSVAccounting,
  categorizeTransaction,
  computeMonthlyDeltas
};

// ═══════════════════════════════════════════════════════════
// FINPILOT — Statement Parsing Service
// Module 12 §3: File parsing (separate from categorization)
// Stores raw transactions with category=null
// ═══════════════════════════════════════════════════════════

const pdf = require("pdf-parse");
const { parse } = require("csv-parse/sync");

// ── PDF Parsing ──────────────────────────────────────────

/**
 * Extract transactions from a PDF bank statement buffer.
 * Returns raw transactions — no categorization happens here.
 * @param {Buffer} buffer
 * @returns {Array<{date: Date, descriptionRaw: string, amount: number, type: string, refNo: string|null, balance: number|null}>}
 */
async function parsePDF(buffer) {
  // Custom Page Render: Preserves horizontal table column whitespace spacing natively
  const render_page = (pageData) => {
    return pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
      .then((textContent) => {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY !== item.transform[5] || !lastY) {
            text += '\n' + item.str;
          } else {
            text += '  ' + item.str;
          }
          lastY = item.transform[5];
        }
        return text;
      });
  };

  const data = await pdf(buffer, { pagerender: render_page });
  // Flatten disconnected chunks by compressing newlines that aren't followed by a Date anchor
  const normalizedText = data.text.replace(/\n(?!\d{1,4}[-/\s.]+[a-zA-Z0-9]{2,9}[-/\s.]+\d{2,4})/g, " ");
  const lines = normalizedText.split("\n");
  const transactions = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Match lines starting with any standard banking date variant (DD/MM/YYYY, DD-MMM-YY, YYYY-MM-DD, DD.MM.YYYY, DD Aug 2026, etc)
    // Relaxed spacing mapping prevents zero-extraction on non-rigid PDF grid boundaries
    const datePattern = /^(\d{1,4}[-/\s.]+[a-zA-Z0-9]{2,9}[-/\s.]+\d{2,4})\s+(.+)/;
    const match = line.match(datePattern);
    if (!match) continue;

    const dateStr = match[1];
    const rest = match[2];

    // Find all number blocks like 1,234.56 or 234.00
    const numBlocks = rest.match(/([+-]?(?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2})/g);
    if (!numBlocks || numBlocks.length < 1) continue;

    const amountStr = numBlocks[0].replace(/,/g, "");
    const parsedAmount = Math.abs(parseFloat(amountStr));
    if (parsedAmount <= 0 || isNaN(parsedAmount)) continue;

    // Determine debit/credit from context
    let type = "debit";
    if (/\bCr\b|CREDIT/i.test(rest)) type = "credit";
    if (/\bDr\b/i.test(rest) || amountStr.startsWith("-")) type = "debit";

    // Attempt to parse running balance (if multiple numeric columns exist)
    let balance = null;
    if (numBlocks.length >= 2) {
      const balStr = numBlocks[numBlocks.length - 1].replace(/,/g, "");
      const b = parseFloat(balStr);
      if (!isNaN(b) && b !== parsedAmount) balance = b;
    }

    // Strip numbers from description but keep alphanumeric ref numbers
    const desc = rest
      .replace(/([+-]?(?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2})/g, "")
      .replace(/\b(Cr|Dr|CR|DR)\b\.?/gi, "")
      .trim();

    // Look for UPI/IMPS/NEFT ref numbers
    let refNo = null;
    const refMatch = rest.match(/\b(UPI\/\d+|IMPS\/\d+|NEFT\-[A-Z0-9]+|[A-Z0-9]{10,20})\b/);
    if (refMatch) refNo = refMatch[1];

    const parsedDate = parseDateString(dateStr);
    if (!parsedDate) continue;

    transactions.push({
      date: parsedDate,
      descriptionRaw: desc.substring(0, 200),
      amount: parsedAmount,
      type,
      refNo,
      balance,
    });
  }

  return transactions;
}

// ── CSV Parsing ──────────────────────────────────────────

/**
 * Extract transactions from a CSV bank statement buffer.
 * Uses heuristics to locate date, description, and amount columns.
 * @param {Buffer} buffer
 * @returns {Array<{date: Date, descriptionRaw: string, amount: number, type: string, refNo: string|null, balance: number|null}>}
 */
function parseCSV(buffer) {
  const records = parse(buffer, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const transactions = [];

  for (const row of records) {
    let parsedDate = null;
    let parsedAmount = 0;
    let balance = null;
    let description = "";
    let type = "debit";
    let refNo = null;

    let moneyMatches = [];

    for (const col of row) {
      const c = (col || "").trim();
      if (!c) continue;

      // Try to parse as date
      if (!parsedDate) {
        const d = parseDateString(c);
        if (d) { parsedDate = d; continue; }
      }

      // Try to parse as amount (digits with optional commas and exactly 2 decimal places)
      const amtMatch = c.match(/^[+-]?(?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2}$/);
      if (amtMatch) {
         moneyMatches.push(parseFloat(c.replace(/,/g, "")));
         continue;
      }

      // Look for refNo
      if (!refNo && c.length >= 8 && /^[A-Z0-9]+$/i.test(c.replace(/[-_]/g, ""))) {
         if (isNaN(c)) refNo = c;
      }

      // Accumulate text as description (avoid appending the identical date string or pure numbers)
      const dateCheckRegex = /^\d{1,4}[-/\s.]+[a-zA-Z0-9]{2,9}[-/\s.]+\d{2,4}$/;
      if (isNaN(c.replace(/,/g, "")) && !c.match(dateCheckRegex)) {
        if (c !== refNo) description += " " + c;
      }
    }

    if (moneyMatches.length >= 1) {
      parsedAmount = Math.abs(moneyMatches[0]);
      if (moneyMatches[0] < 0) type = "credit"; // rudimentary inference if standard format applies differently
      if (moneyMatches.length >= 2) {
         // Second valid money column might be credit if first was 0/null, or Balance.
         if (parsedAmount === 0) parsedAmount = Math.abs(moneyMatches[1]);
         balance = Math.abs(moneyMatches[moneyMatches.length - 1]);
      }
    } else {
      // In case they look like integers e.g. "100" without decimal
      for (const col of row) {
         if (!isNaN(col) && Number(col) > 0 && !parsedAmount) {
             parsedAmount = Number(col);
         }
      }
    }

    if (parsedDate && parsedAmount > 0) {
      // Infer type if row text implies it
      const fullRowText = row.join(" ").toLowerCase();
      if (fullRowText.includes("credit") || fullRowText.includes(" cr")) type = "credit";
      else type = "debit";

      transactions.push({
        date: parsedDate,
        descriptionRaw: description.substring(0, 200).trim() || "Untracked Transaction",
        amount: parsedAmount,
        type,
        refNo,
        balance: balance !== parsedAmount ? balance : null,
      });
    }
  }

  return transactions;
}

// ── Helpers ──────────────────────────────────────────────

function parseDateString(str) {
  // Normalize string to handle arbitrary date separations (e.g. DD.MM.YYYY or DD MMM YYYY)
  let s = str.trim().replace(/\./g, '-');
  
  // If the date contains alphabetical month representations (e.g. 01 Aug 2026), native Date handles it flawlessly
  if (/[a-zA-Z]/.test(s)) {
     const d = new Date(s);
     if (!isNaN(d.getTime())) return d;
  }
  
  // Custom parsing for localized numeric variations (DD-MM-YYYY, DD/MM/YY, YYYY-MM-DD)
  const parts = s.split(/[-/\s]/).filter(Boolean);
  if (parts.length === 3) {
    let dd, mm, yyyy;
    
    // YYYY-MM-DD
    if (parts[0].length === 4) {
      [yyyy, mm, dd] = parts;
    } 
    // DD-MM-YYYY or DD-MM-YY
    else {
      [dd, mm, yyyy] = parts;
      if (yyyy.length === 2) {
         // Auto-infer 20XX for 2-digit years natively
         yyyy = "20" + yyyy;
      }
    }
    
    // Cast and validate purely numeric extraction safely mapping against browser Date mutations
    if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
       const standardizedDateStr = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}T00:00:00Z`;
       const d = new Date(standardizedDateStr);
       return isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

module.exports = { parsePDF, parseCSV };

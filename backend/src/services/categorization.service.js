// ═══════════════════════════════════════════════════════════
// FINPILOT — Categorization Service
// Module 12 §1: 6-tier pipeline (exact order from spec)
// §2: Cost tracking & exact-match cache
// ═══════════════════════════════════════════════════════════

const fuzzysort = require("fuzzysort");
const prisma = require("../config/db");
const { getChatCompletion } = require("./llm.service");
const { generateEmbedding } = require("./embedding.service");

// ── Valid categories (application-layer enum) ────────────
const VALID_CATEGORIES = [
  "Food", "Groceries", "Rent", "Fuel", "Shopping",
  "Entertainment", "Medical", "Travel", "Education",
  "Utilities", "Investment", "Salary", "Transfer",
  "Housing", "Income", "Loan EMI", "Other"
];

// ── Built-in merchant keyword dictionary ─────────────────
const BUILTIN_RULES = {
  // FOOD & DINING
  "swiggy": "Food",
  "swiggy instamart": "Food",
  "zomato": "Food",
  "zomato limited": "Food",
  "dominos": "Food",
  "domino's": "Food",
  "mcdonalds": "Food",
  "mcdonald": "Food",
  "kfc": "Food",
  "burger king": "Food",
  "subway": "Food",
  "pizza hut": "Food",
  "pizzahut": "Food",
  "taco bell": "Food",
  "starbucks": "Food",
  "cafe coffee day": "Food",
  "ccd": "Food",
  "barista": "Food",
  "chaayos": "Food",
  "wow momo": "Food",
  "haldiram": "Food",
  "bikanervala": "Food",
  "behrouz": "Food",
  "faasos": "Food",
  "ovenstory": "Food",
  "freshmenu": "Food",
  "eatclub": "Food",
  "box8": "Food",
  "licious": "Food",
  "meatigo": "Food",
  "restaurant": "Food",
  "restro": "Food",
  "food": "Food",
  "cafe": "Food",
  "coffee": "Food",
  "bakery": "Food",
  "dhaba": "Food",
  "hotel": "Food",
  "canteen": "Food",
  "tiffin": "Food",
  "mess": "Food",
  "dining": "Food",
  "meal": "Food",
  "pizza": "Food",
  "burger": "Food",
  "swiggy food": "Food",

  // GROCERIES
  "bigbasket": "Groceries",
  "big basket": "Groceries",
  "blinkit": "Groceries",
  "zepto": "Groceries",
  "grofers": "Groceries",
  "dmart": "Groceries",
  "d mart": "Groceries",
  "reliance smart": "Groceries",
  "reliance fresh": "Groceries",
  "more supermarket": "Groceries",
  "spencers": "Groceries",
  "spencer's": "Groceries",
  "nature's basket": "Groceries",
  "natures basket": "Groceries",
  "easyday": "Groceries",
  "star bazaar": "Groceries",
  "jiomart": "Groceries",
  "jio mart": "Groceries",
  "amazon fresh": "Groceries",
  "flipkart grocery": "Groceries",
  "grocery": "Groceries",
  "groceries": "Groceries",
  "supermarket": "Groceries",
  "kirana": "Groceries",
  "provision store": "Groceries",
  "general store": "Groceries",
  "vegetables": "Groceries",
  "vegetable": "Groceries",
  "fruits": "Groceries",
  "fruit": "Groceries",
  "milk": "Groceries",
  "dairy": "Groceries",

  // FUEL
  "petrol": "Fuel",
  "diesel": "Fuel",
  "fuel": "Fuel",
  "petroleum": "Fuel",
  "iocl": "Fuel",
  "indian oil": "Fuel",
  "indianoil": "Fuel",
  "hpcl": "Fuel",
  "hindustan petroleum": "Fuel",
  "bharat petroleum": "Fuel",
  "bharat petrolyium": "Fuel",
  "bpcl": "Fuel",
  "shell": "Fuel",
  "nayara": "Fuel",
  "essar": "Fuel",
  "reliance petroleum": "Fuel",
  "reliance petrol": "Fuel",
  "jio-bp": "Fuel",
  "jiobp": "Fuel",
  "hp petrol": "Fuel",
  "indian oil corporation": "Fuel",
  "fuel station": "Fuel",
  "petrol pump": "Fuel",
  "gas station": "Fuel",
  "cng": "Fuel",
  "png": "Fuel",
  "charging station": "Fuel",
  "ev charging": "Fuel",

  // SHOPPING / E-COMMERCE
  "amazon": "Shopping",
  "amazon india": "Shopping",
  "amazon.in": "Shopping",
  "flipkart": "Shopping",
  "myntra": "Shopping",
  "ajio": "Shopping",
  "nykaa": "Shopping",
  "meesho": "Shopping",
  "snapdeal": "Shopping",
  "tatacliq": "Shopping",
  "tata cliq": "Shopping",
  "shopsy": "Shopping",
  "bewakoof": "Shopping",
  "lenskart": "Shopping",
  "firstcry": "Shopping",
  "pepperfry": "Shopping",
  "urban ladder": "Shopping",
  "decathlon": "Shopping",
  "reliance trends": "Shopping",
  "westside": "Shopping",
  "pantaloons": "Shopping",
  "lifestyle": "Shopping",
  "max fashion": "Shopping",
  "max": "Shopping",
  "trends": "Shopping",
  "shoppers stop": "Shopping",
  "central": "Shopping",
  "croma": "Shopping",
  "vijay sales": "Shopping",
  "reliance digital": "Shopping",
  "electronics": "Shopping",
  "shopping": "Shopping",
  "retail": "Shopping",
  "online shopping": "Shopping",
  "ecommerce": "Shopping",

  // CLOTHING
  "zara": "Shopping",
  "h&m": "Shopping",
  "hm": "Shopping",
  "uniqlo": "Shopping",
  "levi's": "Shopping",
  "levis": "Shopping",
  "adidas": "Shopping",
  "nike": "Shopping",
  "puma": "Shopping",
  "reebok": "Shopping",
  "skechers": "Shopping",
  "bata": "Shopping",
  "woodland": "Shopping",
  "fabindia": "Shopping",
  "manyavar": "Shopping",
  "raymond": "Shopping",
  "van heusen": "Shopping",
  "peter england": "Shopping",
  "allen solly": "Shopping",
  "louis philippe": "Shopping",
  "aurelia": "Shopping",
  "w for woman": "Shopping",

  // ENTERTAINMENT
  "netflix": "Entertainment",
  "hotstar": "Entertainment",
  "disney+ hotstar": "Entertainment",
  "disney hotstar": "Entertainment",
  "prime video": "Entertainment",
  "amazon prime": "Entertainment",
  "spotify": "Entertainment",
  "youtube premium": "Entertainment",
  "youtube": "Entertainment",
  "apple music": "Entertainment",
  "apple tv": "Entertainment",
  "jio cinema": "Entertainment",
  "jiocinema": "Entertainment",
  "sony liv": "Entertainment",
  "sonyliv": "Entertainment",
  "zee5": "Entertainment",
  "pvr": "Entertainment",
  "pvr inox": "Entertainment",
  "inox": "Entertainment",
  "cinepolis": "Entertainment",
  "bookmyshow": "Entertainment",
  "book my show": "Entertainment",
  "gaming": "Entertainment",
  "steam": "Entertainment",
  "playstation": "Entertainment",
  "xbox": "Entertainment",
  "nintendo": "Entertainment",
  "movie": "Entertainment",
  "cinema": "Entertainment",
  "theatre": "Entertainment",
  "theater": "Entertainment",
  "concert": "Entertainment",

  // TRAVEL / TRANSPORT
  "uber": "Travel",
  "uber india": "Travel",
  "ola": "Travel",
  "ola cabs": "Travel",
  "rapido": "Travel",
  "irctc": "Travel",
  "indian railways": "Travel",
  "railway": "Travel",
  "railways": "Travel",
  "makemytrip": "Travel",
  "make my trip": "Travel",
  "goibibo": "Travel",
  "booking.com": "Travel",
  "booking com": "Travel",
  "agoda": "Travel",
  "airbnb": "Travel",
  "yatra": "Travel",
  "cleartrip": "Travel",
  "easemytrip": "Travel",
  "ease my trip": "Travel",
  "redbus": "Travel",
  "red bus": "Travel",
  "abhibus": "Travel",
  "ixigo": "Travel",
  "air india": "Travel",
  "indigo": "Travel",
  "goair": "Travel",
  "air asia": "Travel",
  "akasa air": "Travel",
  "spicejet": "Travel",
  "vistara": "Travel",
  "airport": "Travel",
  "flight": "Travel",
  "hotel": "Travel",
  "travel": "Travel",
  "cab": "Travel",
  "taxi": "Travel",
  "bus": "Travel",
  "metro": "Travel",
  "transport": "Travel",
  "parking": "Travel",
  "toll": "Travel",
  "fastag": "Travel",

  // MEDICAL / HEALTH
  "apollo": "Medical",
  "apollo pharmacy": "Medical",
  "medplus": "Medical",
  "pharmeasy": "Medical",
  "pharm easy": "Medical",
  "netmeds": "Medical",
  "1mg": "Medical",
  "tata 1mg": "Medical",
  "practo": "Medical",
  "fortis": "Medical",
  "max hospital": "Medical",
  "manipal hospital": "Medical",
  "narayana health": "Medical",
  "aiims": "Medical",
  "hospital": "Medical",
  "clinic": "Medical",
  "medical": "Medical",
  "medicine": "Medical",
  "pharmacy": "Medical",
  "pharma": "Medical",
  "doctor": "Medical",
  "diagnostic": "Medical",
  "pathology": "Medical",
  "laboratory": "Medical",
  "lab": "Medical",
  "healthcare": "Medical",
  "dental": "Medical",
  "dentist": "Medical",
  "optical": "Medical",
  "health": "Medical",

  // EDUCATION
  "coursera": "Education",
  "udemy": "Education",
  "unacademy": "Education",
  "byju": "Education",
  "byjus": "Education",
  "upgrad": "Education",
  "simplilearn": "Education",
  "great learning": "Education",
  "greatlearning": "Education",
  "vedantu": "Education",
  "physics wallah": "Education",
  "pw": "Education",
  "scaler": "Education",
  "coding ninjas": "Education",
  "leetcode": "Education",
  "hackerrank": "Education",
  "school": "Education",
  "college": "Education",
  "university": "Education",
  "tuition": "Education",
  "course": "Education",
  "education": "Education",
  "exam": "Education",
  "coaching": "Education",
  "training": "Education",
  "books": "Education",
  "bookstore": "Education",
  "stationery": "Education",

  // UTILITIES
  "electricity": "Utilities",
  "electricity bill": "Utilities",
  "water bill": "Utilities",
  "water": "Utilities",
  "gas bill": "Utilities",
  "gas": "Utilities",
  "broadband": "Utilities",
  "internet": "Utilities",
  "wifi": "Utilities",
  "jio": "Utilities",
  "jio fiber": "Utilities",
  "jiofiber": "Utilities",
  "airtel": "Utilities",
  "airtel broadband": "Utilities",
  "airtel xstream": "Utilities",
  "vodafone": "Utilities",
  "vi": "Utilities",
  "vi prepaid": "Utilities",
  "vi postpaid": "Utilities",
  "bsnl": "Utilities",
  "tata play": "Utilities",
  "tata sky": "Utilities",
  "dth": "Utilities",
  "dish tv": "Utilities",
  "sun direct": "Utilities",
  "mobile recharge": "Utilities",
  "recharge": "Utilities",
  "telephone": "Utilities",
  "utility": "Utilities",
  "municipal": "Utilities",

  // RENT / HOUSING
  "rent": "Rent",
  "house rent": "Rent",
  "home rent": "Rent",
  "rent payment": "Rent",
  "landlord": "Rent",
  "rental": "Rent",
  "housing rent": "Rent",
  "society maintenance": "Housing",
  "maintenance": "Housing",
  "housing": "Housing",
  "property maintenance": "Housing",

  // INVESTMENT
  "mutual fund": "Investment",
  "mutual funds": "Investment",
  "sip": "Investment",
  "zerodha": "Investment",
  "zerodha broking": "Investment",
  "groww": "Investment",
  "kuvera": "Investment",
  "upstox": "Investment",
  "angel one": "Investment",
  "angel broking": "Investment",
  "5paisa": "Investment",
  "paytm money": "Investment",
  "motilal oswal": "Investment",
  "icici securities": "Investment",
  "hdfc securities": "Investment",
  "kotak securities": "Investment",
  "sharekhan": "Investment",
  "nuvama": "Investment",
  "stock": "Investment",
  "stocks": "Investment",
  "equity": "Investment",
  "demat": "Investment",
  "dividend": "Investment",
  "bond": "Investment",
  "bonds": "Investment",
  "ppf": "Investment",
  "nps": "Investment",
  "fixed deposit": "Investment",
  "fd": "Investment",
  "recurring deposit": "Investment",
  "rd": "Investment",
  "gold investment": "Investment",
  "sovereign gold bond": "Investment",

  // SALARY / INCOME
  "salary": "Salary",
  "salary credit": "Salary",
  "salary income": "Salary",
  "payroll": "Salary",
  "payroll credit": "Salary",
  "wages": "Salary",
  "stipend": "Salary",
  "bonus": "Income",
  "incentive": "Income",
  "commission": "Income",
  "freelance": "Income",
  "freelancing": "Income",
  "consulting": "Income",
  "professional fee": "Income",

  // TRANSFERS
  "neft": "Transfer",
  "imps": "Transfer",
  "upi": "Transfer",
  "rtgs": "Transfer",
  "bank transfer": "Transfer",
  "fund transfer": "Transfer",
  "transfer": "Transfer",
  // LOANS & EMI
  "emi": "Loan EMI",
  "loan emi": "Loan EMI",
  "loan repayment": "Loan EMI",
  "loan payment": "Loan EMI",
  "loan installment": "Loan EMI",
  "installment": "Loan EMI",
  "instalment": "Loan EMI",
  "ach loan": "Loan EMI",
  "nach loan": "Loan EMI",
  "nach emi": "Loan EMI",
  "ach emi": "Loan EMI",
  "ecs loan": "Loan EMI",
  "ecs emi": "Loan EMI",
  "auto debit loan": "Loan EMI",
  "loan debit": "Loan EMI",
  "home loan": "Loan EMI",
  "housing loan": "Loan EMI",
  "mortgage": "Loan EMI",
  "car loan": "Loan EMI",
  "auto loan": "Loan EMI",
  "vehicle loan": "Loan EMI",
  "personal loan": "Loan EMI",
  "education loan": "Loan EMI",
  "business loan": "Loan EMI",
  "consumer loan": "Loan EMI",
  "gold loan": "Loan EMI",
  "two wheeler loan": "Loan EMI",
  "bike loan": "Loan EMI",
};

// ── Pre-indexed Data Structures for O(1) / O(K) Token Map Search ──
const BUILTIN_RULE_MAP = new Map(Object.entries(BUILTIN_RULES));

// Multi-word entries sorted by word count descending for accurate phrase matching
const MULTI_WORD_ENTRIES = Object.entries(BUILTIN_RULES)
  .filter(([key]) => key.includes(" "))
  .map(([key, category]) => ({ key, category, words: key.split(" ") }))
  .sort((a, b) => b.words.length - a.words.length);

// Pre-compiled fuzzy match targets (created ONCE at startup to avoid GC thrashing)
const BUILTIN_FUZZY_TARGETS = Object.entries(BUILTIN_RULES).map(([key, category]) => ({
  key,
  category,
  preparedKey: fuzzysort.prepare(key),
}));

/**
 * Fast O(1) / O(K) Tokenized Word-Map + N-gram matcher.
 * Performs direct map lookup, multi-word phrase matching, and word token lookup.
 */
function matchBuiltinRules(normalizedLower) {
  // 1. Direct O(1) exact map lookup
  if (BUILTIN_RULE_MAP.has(normalizedLower)) {
    return BUILTIN_RULE_MAP.get(normalizedLower);
  }

  // 2. Tokenize normalized string into clean word tokens
  const words = normalizedLower.split(/[\s\-_/.]+/).filter(Boolean);
  if (words.length === 0) return null;

  // 3. Multi-word phrase matching (longer phrases checked first)
  for (const entry of MULTI_WORD_ENTRIES) {
    if (normalizedLower.includes(entry.key)) {
      return entry.category;
    }
  }

  // 4. Tokenized single-word lookup in Map
  for (const word of words) {
    if (word.length > 1 && BUILTIN_RULE_MAP.has(word)) {
      return BUILTIN_RULE_MAP.get(word);
    }
  }

  return null;
}

// ── Tier 1: Normalization ────────────────────────────────
// Spec §1 step 1: strip txn IDs, digit sequences, payment-rail prefixes
function normalizeMerchant(raw) {
  return raw
    .replace(/\*.*/, "")            // strip everything after *
    .replace(/\d{4,}/g, "")         // strip long digit sequences (txn IDs)
    .replace(/UPI\/|NEFT\/|IMPS\/|RTGS\//gi, "")  // strip payment-rail prefixes
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// ── Main Pipeline ────────────────────────────────────────

/**
 * Categorize a single transaction through the 6-tier pipeline.
 * Returns { category, source, confidence, needsReview, needsLLM? }
 *
 * @param {string} descriptionRaw - Raw transaction description
 * @param {string} userId
 * @param {boolean} skipLLM - Skip expensive LLM blocks for bulk processing pipelines
 * @returns {Promise<{category: string|null, source: string|null, confidence: number, needsReview: boolean, needsLLM?: boolean}>}
 */
async function categorizeTransaction(descriptionRaw, userId, skipLLM = false) {
  const normalized = normalizeMerchant(descriptionRaw);

  // ── Tier 2: Exact/rule-based match ──
  // Check user-defined rules first (includes previously-learned corrections)
  const userRules = await prisma.merchantCategoryRule.findMany({ where: { userId } });
  for (const rule of userRules) {
    if (normalized.toLowerCase().includes(rule.pattern.toLowerCase())) {
      return { category: rule.category, source: "rule", confidence: 1.0, needsReview: false };
    }
  }

  // Check built-in dictionary via Tokenized Word-Map lookup
  const normalizedLower = normalized.toLowerCase();
  const builtinMatchCategory = matchBuiltinRules(normalizedLower);
  if (builtinMatchCategory) {
    return { category: builtinMatchCategory, source: "rule", confidence: 1.0, needsReview: false };
  }

  // ── Tier 3: Fuzzy match ──
  // Merge user rules with pre-compiled built-in targets (zero re-allocation)
  const fuzzyTargets = [
    ...userRules.map(r => ({ key: r.pattern, category: r.category })),
    ...BUILTIN_FUZZY_TARGETS,
  ];

  if (fuzzyTargets.length > 0) {
    const results = fuzzysort.go(normalizedLower, fuzzyTargets, { key: "key", limit: 1, threshold: -500 });
    if (results.length > 0) {
      // fuzzysort scores: 0 is perfect, more negative is worse
      const score = results[0].score;
      // Map score to 0-1 confidence: 0 → 1.0, -500 → ~0.5
      const confidence = Math.max(0, Math.min(1, 1 + score / 1000));
      if (confidence >= 0.75) {
        return { category: results[0].obj.category, source: "fuzzy", confidence, needsReview: false };
      }
    }
  }

  // ── Tier 4: Embedding similarity ──
  try {
    const queryVector = await generateEmbedding(normalized);
    const vectorStr = `[${queryVector.join(",")}]`;
    const results = await prisma.$queryRaw`
      SELECT content, "recordType", embedding <=> ${vectorStr}::vector AS distance
      FROM "NoteEmbedding"
      WHERE "userId" = ${userId} AND "recordType" = 'merchantRule'
      ORDER BY distance ASC
      LIMIT 1;
    `;
    if (results && results.length > 0 && results[0].distance < 0.30) {
      const confidence = parseFloat((1 - results[0].distance).toFixed(3));
      if (confidence >= 0.70) {
        return { category: results[0].content, source: "embedding", confidence, needsReview: false };
      }
    }
  } catch (e) {
    console.error("[Categorization] Tier 4 embedding failure:", e.message);
  }

  // ── Tier 5: LLM classification (redacted, rare) ──
  if (skipLLM) return { category: null, source: null, confidence: 0, needsReview: true, needsLLM: true };

  try {
    const redacted = normalized.replace(/\d+/g, "[X]"); // strip any remaining digits
    const prompt = `Classify this merchant/transaction description into EXACTLY ONE of these categories: ${VALID_CATEGORIES.join(", ")}.

Merchant: "${redacted}"

Respond with ONLY a JSON object: {"category": "CategoryName", "confidence": 0.85}
The confidence should be between 0.0 and 1.0. Reply with nothing else.`;

    const llmResult = await getChatCompletion(prompt, "", [], []);
    const text = (llmResult.text || "").trim();

    // Parse JSON response
    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[^}]+\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { parsed = null; }

    if (parsed && parsed.category && VALID_CATEGORIES.includes(parsed.category)) {
      const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.6;
      if (confidence >= 0.60) {
        return {
          category: parsed.category,
          source: "llm",
          confidence,
          needsReview: confidence < 0.80, // flag for review if low confidence
        };
      }
    }

    // LLM gave something but it wasn't parseable or valid
    return { category: null, source: null, confidence: 0, needsReview: true };
  } catch (e) {
    console.error("[Categorization] Tier 5 LLM failure:", e.message);
  }

  // ── Tier 6: Needs manual review ──
  return { category: null, source: null, confidence: 0, needsReview: true };
}

// ── User Correction Feedback ─────────────────────────────
// Spec §5: On user correction, feed back into the rule table

async function applyUserCorrection(userId, transactionId, correctCategory) {
  if (!VALID_CATEGORIES.includes(correctCategory)) {
    throw new Error(`Invalid category: ${correctCategory}`);
  }

  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction || transaction.userId !== userId) {
    throw new Error("Transaction not found");
  }

  // Update the transaction
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      category: correctCategory,
      categorySource: "manual",
      confidenceScore: 1.0,
      needsReview: false,
    },
  });

  // Upsert a rule so this merchant resolves at Tier 2 next time
  const normalized = normalizeMerchant(transaction.descriptionRaw);
  const existing = await prisma.merchantCategoryRule.findFirst({
    where: { userId, pattern: normalized },
  });

  if (existing) {
    await prisma.merchantCategoryRule.update({
      where: { id: existing.id },
      data: { category: correctCategory, createdFromUserCorrection: true },
    });
  } else {
    await prisma.merchantCategoryRule.create({
      data: {
        userId,
        pattern: normalized,
        category: correctCategory,
        createdFromUserCorrection: true,
      },
    });
  }

  // Update cost counters on the upload
  await prisma.statementUpload.update({
    where: { id: transaction.statementUploadId },
    data: { manualReviewCount: { increment: 1 } },
  });

  return { success: true };
}

// ── Bulk LLM Categorization ──────────────────────────────
// Resolves 5-minute UI freeze bottlenecks during PDF statement mapping
async function bulkLLMCategorize(transactions, userId) {
  if (!transactions || transactions.length === 0) return [];
  
  // Chunking limits token payload (e.g., 50 at a time)
  const chunks = [];
  for (let i = 0; i < transactions.length; i += 50) chunks.push(transactions.slice(i, i + 50));
  
  const mappedResults = [];

  for (const chunk of chunks) {
    const payloadMap = chunk.map(tx => ({ id: tx.id, desc: normalizeMerchant(tx.descriptionRaw) }));
    const prompt = `Classify these merchant transactions into EXACTLY ONE of these categories: ${VALID_CATEGORIES.join(", ")}.
You are provided a JSON array of transactions. Return ONLY a JSON object containing a "results" array. Each item in "results" must contain 'id', 'category', and 'confidence' (float 0.0-1.0).

Transactions:
${JSON.stringify(payloadMap, null, 2)}
`;

    try {
      const llmResult = await getChatCompletion(prompt, "", [], []);
      const text = (llmResult.text || "").trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         const parsed = JSON.parse(jsonMatch[0]);
         if (parsed && Array.isArray(parsed.results)) {
            for (const item of parsed.results) {
               if (VALID_CATEGORIES.includes(item.category)) {
                 mappedResults.push({
                   id: item.id,
                   result: {
                     category: item.category,
                     source: "llm",
                     confidence: item.confidence || 0.6,
                     needsReview: (item.confidence || 0.6) < 0.80,
                   }
                 });
               }
            }
         }
      }
    } catch (e) {
      console.error("[Categorization] Bulk Tier 5 LLM failure chunk:", e.message);
    }
  }
  
  return mappedResults;
}

// ── Month-over-Month Deltas ──────────────────────────────
// Used by dashboard and chatbot insights

async function computeMonthlyDeltas(userId, targetMonthDate) {
  const startOfCurrent = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 1);
  const endOfCurrent = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0, 23, 59, 59);
  const startOfPrev = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() - 1, 1);
  const endOfPrev = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 0, 23, 59, 59);

  const [currentTx, prevTx] = await Promise.all([
    prisma.transaction.findMany({ where: { userId, date: { gte: startOfCurrent, lte: endOfCurrent } } }),
    prisma.transaction.findMany({ where: { userId, date: { gte: startOfPrev, lte: endOfPrev } } }),
  ]);

  const currentMap = aggregateByCategory(currentTx);
  const prevMap = aggregateByCategory(prevTx);

  const allCats = new Set([...Object.keys(currentMap), ...Object.keys(prevMap)]);
  const deltas = [];

  for (const cat of allCats) {
    const curr = currentMap[cat] || 0;
    const prev = prevMap[cat] || 0;
    let pctChange = 0;
    if (prev > 0) pctChange = ((curr - prev) / prev) * 100;
    else if (curr > 0) pctChange = 100;
    deltas.push({ category: cat, currentAmount: curr, previousAmount: prev, percentChange: parseFloat(pctChange.toFixed(2)) });
  }

  return deltas;
}

// ── Get Spending by Category ─────────────────────────────
// Used by chatbot tool get_spending_by_category

async function getSpendingByCategory(userId, monthStr) {
  const start = new Date(`${monthStr}-01T00:00:00Z`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end }, type: "debit" },
  });

  const map = {};
  for (const t of transactions) {
    const cat = t.category || "Uncategorized";
    map[cat] = (map[cat] || 0) + Number(t.amount);
  }

  return Object.entries(map).map(([category, amount]) => ({ category, amount }));
}

function aggregateByCategory(transactions) {
  const map = {};
  for (const t of transactions) {
    if (t.type === "debit") {
      const cat = t.category || "Other";
      map[cat] = (map[cat] || 0) + Number(t.amount);
    }
  }
  return map;
}

module.exports = {
  VALID_CATEGORIES,
  normalizeMerchant,
  categorizeTransaction,
  bulkLLMCategorize,
  applyUserCorrection,
  computeMonthlyDeltas,
  getSpendingByCategory,
};

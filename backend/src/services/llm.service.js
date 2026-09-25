// ═══════════════════════════════════════════════════════════
// FINPILOT — LLM Service (Gemini)
// Chat completion via Google Generative AI SDK
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

const SYSTEM_PROMPT = `You are Finpilot, an AI-powered financial assistant. You help users understand and manage their personal finances including loans, EMIs, lending/borrowing, credit card bills, income, and cash flow.

Rules:
1. Answer ONLY financial questions related to the user's data. Politely decline unrelated queries.
2. Use the provided financial context to give personalized, accurate answers.
3. When referring to monetary amounts, use the Indian Rupee (₹) symbol and Indian number formatting.
4. Be concise but thorough. Use bullet points for clarity when listing items.
5. If the context doesn't contain enough information to answer, say so honestly.
6. Never fabricate financial data. Only reference what's in the context.
7. PII placeholders like [PERSON_1] may appear in the context — use them as-is in your response.
8. For calculations, show your working briefly.
9. When a user mentions lending or borrowing money, you MUST use the 'extract_lend_record' tool. Present the extracted information to the user, ask them to supply 'personEmail' if missing, and ask for explicit confirmation. ONLY after explicit confirmation and all required fields are satisfied should you use 'create_lend_record'.`;

const functionDeclarations = [
  {
    name: "get_total_interest_paid",
    description: "Returns the total projected interest paid across all active loans.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_overdue_lend_records",
    description: "Returns a list of all lend or borrow records that have passed their expected return date.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "check_emi_affordability",
    description: "Evaluates if a new EMI is affordable based on user's monthly income target.",
    parameters: { 
      type: "OBJECT", 
      properties: { 
        newEmiAmount: { type: "NUMBER", description: "The EMI of the new loan they want to take" } 
      },
      required: ["newEmiAmount"]
    },
  },
  {
    name: "simulate_prepayment",
    description: "Simulates the interest saved by making a lump-sum prepayment on a specific loan.",
    parameters: { 
      type: "OBJECT", 
      properties: { 
        loanId: { type: "STRING", description: "The unique ID of the active loan" },
        prepaymentAmount: { type: "NUMBER", description: "The lump sump amount to prepay" }
      },
      required: ["loanId", "prepaymentAmount"]
    },
  },
  {
    name: "compare_debt_strategies",
    description: "Analyzes user's loans and credit cards to return the Avalanche and Snowball payoff sequences. It also calculates interest savings if an extra monthly payment is provided.",
    parameters: { 
      type: "OBJECT", 
      properties: { 
        extraPayment: { type: "NUMBER", description: "An optional fixed extra monthly cash amount to apply to debts" } 
      }
    },
  },
  {
    name: "check_goal_pace",
    description: "Check if a specific financial goal (savings or debt payoff) is on pace given current cash flow",
    parameters: { type: "OBJECT", properties: { goalId: { type: "STRING" } }, required: ["goalId"] }
  },
  {
    name: "simulate_goal_adjustment",
    description: "Simulate the effect of increasing/decreasing monthly contribution toward a savings goal, or changing the target payoff timeline for a debt goal",
    parameters: { type: "OBJECT", properties: { goalId: { type: "STRING" }, adjustedMonthlyAmount: { type: "NUMBER" } }, required: ["goalId", "adjustedMonthlyAmount"] }
  },
  {
    name: "list_active_goals_summary",
    description: "Get a summary of all active goals and their current pace status",
    parameters: { type: "OBJECT", properties: {} }
  },
  {
    name: "get_spending_insights",
    description: "Get AI-generated insights about spending changes for a given month, based on pre-computed category deltas",
    parameters: { type: "OBJECT", properties: { month: { type: "STRING", description: "Month in YYYY-MM format" } }, required: ["month"] }
  },
  {
    name: "get_spending_by_category",
    description: "Get total spending broken down by category for a given month",
    parameters: { type: "OBJECT", properties: { month: { type: "STRING", description: "Month in YYYY-MM format" } }, required: ["month"] }
  },
  {
    name: "extract_lend_record",
    description: "Extract structured data from a user's statement about lending or borrowing money. Returns drafted data to be presented for user confirmation.",
    parameters: {
      type: "OBJECT",
      properties: {
        personName: { type: "STRING" },
        personEmail: { type: "STRING" },
        amount: { type: "NUMBER" },
        tenureMonths: { type: "NUMBER", description: "Duration in months" },
        interestRate: { type: "NUMBER", description: "Monthly/Yearly interest rate percentage" },
        type: { type: "STRING", description: "'lent' or 'borrowed'" }
      }
    }
  },
  {
    name: "create_lend_record",
    description: "Create a lend or borrow record in the database. Use ONLY after full user confirmation and once all required fields are present.",
    parameters: {
      type: "OBJECT",
      properties: {
        personName: { type: "STRING" },
        personEmail: { type: "STRING" },
        amount: { type: "NUMBER" },
        tenureMonths: { type: "NUMBER" },
        interestRate: { type: "NUMBER" },
        type: { type: "STRING" }
      },
      required: ["personName", "personEmail", "amount", "tenureMonths", "type"]
    }
  },
];

/**
 * Send a message to Gemini with financial context and chat history.
 *
 * @param {string} userMessage - The user's question
 * @param {string} financialContext - Redacted financial context string
 * @param {Array} chatHistory - Previous messages [{role, content}]
 * @returns {Promise<Object>} Object containing either assistant text or a function call request + active chat
 */
async function getChatCompletion(userMessage, financialContext, chatHistory = []) {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations }],
  });

  // Ensure history alternates properly: user -> model -> user -> model
  // Gemini requires: 1) First turn MUST be "user", 2) strictly alternating roles, 3) non-empty content
  const sanitizedHistory = [];
  let expectedRole = "user";

  for (const msg of chatHistory) {
    if (!msg || !msg.content || typeof msg.content !== "string" || !msg.content.trim()) continue;
    const role = msg.role === "assistant" ? "model" : "user";
    if (role === expectedRole) {
      sanitizedHistory.push({
        role,
        parts: [{ text: msg.content.trim() }],
      });
      expectedRole = expectedRole === "user" ? "model" : "user";
    }
  }

  // If the last message in history is a user message, remove it because sendMessage will send the current user prompt
  if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === "user") {
    sanitizedHistory.pop();
  }

  const chat = model.startChat({ history: sanitizedHistory });

  const contextBlock = financialContext
    ? `\n\n--- USER'S FINANCIAL CONTEXT ---\n${financialContext}\n--- END CONTEXT ---\n\n`
    : "";

  const fullPrompt = `${contextBlock}User question: ${userMessage}`;

  const result = await chat.sendMessage(fullPrompt);
  
  const functionCall = result.response.functionCalls()?.[0];
  if (functionCall) {
    return { type: "function_call", functionCall, chat };
  }

  let text = "";
  try {
    text = result.response.text();
  } catch {
    const candidate = result.response.candidates?.[0];
    text = candidate?.content?.parts?.find(p => p.text)?.text || "I was unable to formulate a response. Please try again.";
  }

  return { type: "text", text, chat };
}

/**
 * Send tool execution results back to the active Gemini chat session.
 *
 * @param {Object} chat - The active chat session returned by getChatCompletion
 * @param {string} functionName - Name of the function that was called
 * @param {string|Object} responseData - The tool output (redacted)
 * @returns {Promise<Object>}
 */
async function sendFunctionResponse(chat, functionName, responseData) {
  const result = await chat.sendMessage([
    {
      functionResponse: {
        name: functionName,
        response: { result: typeof responseData === "string" ? responseData : JSON.stringify(responseData) },
      },
    },
  ]);

  const functionCall = result.response.functionCalls()?.[0];
  if (functionCall) {
    return { type: "function_call", functionCall, chat };
  }

  let text = "";
  try {
    text = result.response.text();
  } catch {
    const candidate = result.response.candidates?.[0];
    text = candidate?.content?.parts?.find(p => p.text)?.text || "Tool executed successfully.";
  }

  return { type: "text", text, chat };
}

module.exports = { getChatCompletion, sendFunctionResponse };


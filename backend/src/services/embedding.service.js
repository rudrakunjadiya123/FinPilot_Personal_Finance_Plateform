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
    // Defaulting to the configured environment variable or standardizing on 004
    const modelStr = process.env.EMBEDDING_MODEL || "text-embedding-004";
    const model = ai.getGenerativeModel({ model: modelStr });

    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("[Embedding Service] Failed to generate embedding:", error.message);
    throw error;
  }
}

module.exports = {
  generateEmbedding,
};

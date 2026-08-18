// ═══════════════════════════════════════════════════════════
// FINPILOT — PII Redaction Utility
// Per Master Spec: Privacy & Redaction Flow
// Redacts personName, personEmail before LLM calls,
// then re-injects originals into the response.
// ═══════════════════════════════════════════════════════════

/**
 * Scans context text for PII and replaces with placeholders.
 * Returns the redacted text and a mapping for re-injection.
 *
 * @param {string} text - The raw context string
 * @param {Array} piiEntries - Array of { name, email } objects
 * @returns {{ redactedText: string, piiMap: Map<string, string> }}
 */
function redactPII(text, piiEntries = []) {
  const piiMap = new Map();
  let redactedText = text;
  let counter = 1;

  for (const entry of piiEntries) {
    if (entry.name) {
      const placeholder = `[PERSON_${counter}]`;
      piiMap.set(placeholder, entry.name);
      // Replace all occurrences (case-insensitive)
      redactedText = redactedText.replace(
        new RegExp(escapeRegex(entry.name), "gi"),
        placeholder
      );
    }

    if (entry.email) {
      const placeholder = `[EMAIL_${counter}]`;
      piiMap.set(placeholder, entry.email);
      redactedText = redactedText.replace(
        new RegExp(escapeRegex(entry.email), "gi"),
        placeholder
      );
    }

    counter++;
  }

  return { redactedText, piiMap };
}

/**
 * Re-injects original PII values into the LLM response.
 *
 * @param {string} text - LLM response with placeholders
 * @param {Map<string, string>} piiMap - Map of placeholder -> original value
 * @returns {string} Text with original PII restored
 */
function reinjectPII(text, piiMap) {
  let result = text;
  for (const [placeholder, original] of piiMap) {
    result = result.replace(new RegExp(escapeRegex(placeholder), "g"), original);
  }
  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { redactPII, reinjectPII };

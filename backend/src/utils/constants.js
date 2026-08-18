// ═══════════════════════════════════════════════════════════
// FINPILOT — Common Constants
// Enums, limits, and configuration values used across modules
// ═══════════════════════════════════════════════════════════

/** Valid loan types (LOAN-1 validation) */
const LOAN_TYPES = ["home", "personal", "auto", "education", "other"];

/** Valid lend/borrow record types */
const LEND_BORROW_TYPES = ["lent", "borrowed"];

/** Valid income sources */
const INCOME_SOURCES = ["salary", "freelance", "other"];

/** Valid payment statuses */
const PAID_STATUS = ["paid", "unpaid", "partial"];

/** Valid lend/borrow statuses */
const LEND_BORROW_STATUS = ["pending", "partial", "repaid"];

/** Valid loan statuses */
const LOAN_STATUS = ["active", "closed"];

/** Chat message roles */
const CHAT_ROLES = ["user", "assistant"];

/** Chat path types */
const CHAT_PATHS = ["function_call", "rag"];

/** Reminder reference types */
const REMINDER_TYPES = ["emi", "lendBorrow", "creditCard", "monthlySummary"];

/** Note embedding source types */
const NOTE_SOURCE_TYPES = ["loan", "lendBorrow"];

/** Safety threshold — 20% income buffer rule for affordability checks */
const AFFORDABILITY_SAFETY_PERCENT = 0.2;

/** Max monetary value sanity bound (₹10 crore) */
const MAX_MONETARY_VALUE = 100000000;

/** Max interest rate sanity bound (50%) */
const MAX_INTEREST_RATE = 50;

/** Max tenure in months (40 years) */
const MAX_TENURE_MONTHS = 480;

/** Default Credit Card APR Proxy */
const CREDIT_CARD_DEFAULT_APR = process.env.CREDIT_CARD_DEFAULT_APR
  ? Number(process.env.CREDIT_CARD_DEFAULT_APR)
  : 36;

module.exports = {
  LOAN_TYPES,
  LEND_BORROW_TYPES,
  INCOME_SOURCES,
  PAID_STATUS,
  LEND_BORROW_STATUS,
  LOAN_STATUS,
  CHAT_ROLES,
  CHAT_PATHS,
  REMINDER_TYPES,
  NOTE_SOURCE_TYPES,
  AFFORDABILITY_SAFETY_PERCENT,
  MAX_MONETARY_VALUE,
  MAX_INTEREST_RATE,
  MAX_TENURE_MONTHS,
  CREDIT_CARD_DEFAULT_APR,
};

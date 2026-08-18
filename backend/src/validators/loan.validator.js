// ═══════════════════════════════════════════════════════════
// FINPILOT — Loan Validation Schemas (Zod)
// Enforces rules from SRS: Module 2 (5.5 Validation Rules)
// ═══════════════════════════════════════════════════════════

const { z } = require("zod");
const { LOAN_TYPES, MAX_MONETARY_VALUE, MAX_INTEREST_RATE, MAX_TENURE_MONTHS } = require("../utils/constants");

const createLoanSchema = z.object({
  loanType: z.enum(LOAN_TYPES, {
    errorMap: () => ({ message: `Loan type must be one of: ${LOAN_TYPES.join(", ")}` }),
  }),
  lenderName: z.string().max(255, "Lender name is too long").optional(),
  principalAmount: z
    .number()
    .positive("Principal amount must be greater than 0")
    .max(MAX_MONETARY_VALUE, `Principal cannot exceed ${MAX_MONETARY_VALUE}`),
  interestRate: z
    .number()
    .min(0, "Interest rate cannot be negative")
    .max(MAX_INTEREST_RATE, `Interest rate cannot exceed ${MAX_INTEREST_RATE}`),
  tenureMonths: z
    .number()
    .int("Tenure must be a whole number of months")
    .min(1, "Tenure must be at least 1 month")
    .max(MAX_TENURE_MONTHS, `Tenure cannot exceed ${MAX_TENURE_MONTHS} months (40 years)`),
  emiAmount: z
    .number()
    .positive("EMI amount must be strictly positive")
    .optional(), // Computed by server if not provided
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid ISO date string"),
  notes: z.string().max(2000, "Notes are too long").optional(),
});

const updateLoanSchema = z.object({
  loanType: z.enum(LOAN_TYPES).optional(),
  notes: z.string().max(2000).optional(),
  // For core financial alterations, we usually forbid simple PUT updates
  // Instead, prepayments alter actual balances. 
  // Standard UI lets user edit purely metadata.
});

const simulatePrepaymentSchema = z.object({
  prepaymentAmount: z
    .number()
    .positive("Prepayment amount must be greater than 0")
    .max(MAX_MONETARY_VALUE, `Cannot exceed ${MAX_MONETARY_VALUE}`),
});

const confirmPrepaymentSchema = z.object({
  prepaymentAmount: z
    .number()
    .positive("Prepayment amount must be greater than 0")
    .max(MAX_MONETARY_VALUE, `Cannot exceed ${MAX_MONETARY_VALUE}`),
});

module.exports = {
  createLoanSchema,
  updateLoanSchema,
  simulatePrepaymentSchema,
  confirmPrepaymentSchema,
};

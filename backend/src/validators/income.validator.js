// ═══════════════════════════════════════════════════════════
// FINPILOT — Income Validation Schemas (Zod)
// Per SRS Section 8: Module 5
// ═══════════════════════════════════════════════════════════

const { z } = require("zod");
const { INCOME_SOURCES, MAX_MONETARY_VALUE } = require("../utils/constants");

const createIncomeSchema = z.object({
  source: z.string().min(1, "Source is required").max(100, "Source is too long"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(MAX_MONETARY_VALUE, `Amount cannot exceed ${MAX_MONETARY_VALUE}`),
  month: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
});

module.exports = {
  createIncomeSchema,
};

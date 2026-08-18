// ═══════════════════════════════════════════════════════════
// FINPILOT — Income Validation Schemas (Zod)
// Per SRS Section 8: Module 5
// ═══════════════════════════════════════════════════════════

const { z } = require("zod");
const { INCOME_SOURCES, MAX_MONETARY_VALUE } = require("../utils/constants");

const createIncomeSchema = z.object({
  source: z.enum(INCOME_SOURCES, {
    errorMap: () => ({
      message: `Source must be one of: ${INCOME_SOURCES.join(", ")}`,
    }),
  }),
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

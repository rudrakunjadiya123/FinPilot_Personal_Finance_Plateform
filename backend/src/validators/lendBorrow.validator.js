// ═══════════════════════════════════════════════════════════
// FINPILOT — Lend/Borrow Validation Schemas (Zod)
// Per SRS Section 6.4: Validation Rules
// ═══════════════════════════════════════════════════════════

const { z } = require("zod");
const { LEND_BORROW_TYPES, MAX_MONETARY_VALUE } = require("../utils/constants");

const createLendBorrowSchema = z
  .object({
    personName: z
      .string()
      .min(1, "Person name is required")
      .max(200, "Person name is too long"),
    personEmail: z
      .string()
      .email("Invalid email format — required for reminder automation"),
    amount: z
      .number()
      .positive("Amount must be greater than 0")
      .max(MAX_MONETARY_VALUE, `Amount cannot exceed ${MAX_MONETARY_VALUE}`),
    type: z.enum(LEND_BORROW_TYPES, {
      errorMap: () => ({
        message: `Type must be one of: ${LEND_BORROW_TYPES.join(", ")}`,
      }),
    }),
    dateGiven: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    expectedReturnDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    interestRate: z
      .number()
      .min(0, "Interest rate cannot be negative")
      .max(100, "Interest rate cannot exceed 100%")
      .optional(),
    interestType: z.enum(["simple", "compound"]).default("simple").optional(),
    compoundingFrequency: z.number().min(1).max(12).optional(),
    interestStartDate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format").optional(),
    paymentMode: z.enum(["cash", "online"]).default("cash").optional(),
    transactionId: z.string().max(100).optional(),
    notes: z.string().max(2000, "Notes are too long").optional(),
  })
  .refine(
    (data) => new Date(data.expectedReturnDate) >= new Date(data.dateGiven),
    (data) => new Date(data.expectedReturnDate) >= new Date(data.dateGiven),
    {
      message: "Expected return date must be on or after the date given",
      path: ["expectedReturnDate"],
    }
  ).refine(
    (data) => data.paymentMode !== "online" || (data.paymentMode === "online" && !!data.transactionId),
    {
      message: "Transaction ID is mandatory for online payments",
      path: ["transactionId"],
    }
  );

const updateLendBorrowSchema = z.object({
  personName: z.string().min(1).max(200).optional(),
  personEmail: z.string().email("Invalid email format").optional(),
  expectedReturnDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
    .optional(),
  interestRate: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

const repaymentSchema = z.object({
  amount: z
    .number()
    .positive("Repayment amount must be greater than 0")
    .max(MAX_MONETARY_VALUE, `Amount cannot exceed ${MAX_MONETARY_VALUE}`),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  paymentType: z.enum(["principal_only", "interest_only", "principal_interest"]).default("principal_only").optional(),
  principalAmount: z.number().min(0).max(MAX_MONETARY_VALUE).optional(),
  interestAmount: z.number().min(0).max(MAX_MONETARY_VALUE).optional(),
  paymentMode: z.enum(["cash", "online"]).default("cash").optional(),
  transactionId: z.string().max(100).optional(),
}).refine(
  (data) => {
    if (data.paymentType === "principal_interest") {
      const p = data.principalAmount || 0;
      const i = data.interestAmount || 0;
      return (p + i) === data.amount;
    }
    return true;
  },
  {
    message: "Total amount must equal Principal + Interest",
    path: ["amount"]
  }
).refine(
  (data) => data.paymentMode !== "online" || (data.paymentMode === "online" && !!data.transactionId),
  {
    message: "Transaction ID is mandatory for online payments",
    path: ["transactionId"],
  }
);

module.exports = {
  createLendBorrowSchema,
  updateLendBorrowSchema,
  repaymentSchema,
};

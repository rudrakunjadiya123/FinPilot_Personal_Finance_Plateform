// ═══════════════════════════════════════════════════════════
// FINPILOT — Auth Validation Schemas (Zod v4)
// Per SRS Section 4.2: Validation Rules
// ═══════════════════════════════════════════════════════════

const { z } = require("zod");

// ── Register ──────────────────────────────────────────────
const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be at most 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*[0-9])/,
      "Password must contain at least 1 letter and 1 number"
    ),
});

// ── Login ─────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ── Profile Update ────────────────────────────────────────
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  currency: z.string().min(1).max(10).optional(),
  monthlyIncomeTarget: z
    .number()
    .positive("Monthly income target must be positive")
    .optional()
    .nullable(),
  reminderDaysBefore: z
    .number()
    .int()
    .min(1, "Must be at least 1 day")
    .max(30, "Must be at most 30 days")
    .optional(),
  reminderEmailOn: z.boolean().optional(),
});

// ── Password Reset Request ────────────────────────────────
const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// ── Password Reset ────────────────────────────────────────
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*[0-9])/,
      "Password must contain at least 1 letter and 1 number"
    ),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
};

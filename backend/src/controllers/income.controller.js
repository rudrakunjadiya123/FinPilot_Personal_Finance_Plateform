// ═══════════════════════════════════════════════════════════
// FINPILOT — Income Controller
// SRS Module 5: INC-1 (income entry CRUD)
// Invalidates dashboard caches on every write
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");
const redis = require("../config/redis");
const { AppError } = require("../middleware/errorHandler");
const { createIncomeSchema } = require("../validators/income.validator");

async function invalidateCaches(userId, month) {
  await redis.del(`networth:${userId}`);
  if (month) {
    const monthKey = new Date(month).toISOString().substring(0, 7);
    await redis.del(`cashflow:${userId}:${monthKey}`);
  }
}

// ── GET All Income Entries ────────────────────────────────
async function getAll(req, res) {
  const entries = await prisma.incomeEntry.findMany({
    where: { userId: req.userId },
    orderBy: { month: "desc" },
  });

  res.status(200).json(entries);
}

// ── CREATE Income Entry ───────────────────────────────────
async function create(req, res) {
  const data = createIncomeSchema.parse(req.body);

  const entry = await prisma.incomeEntry.create({
    data: {
      userId: req.userId,
      source: data.source,
      amount: data.amount,
      month: new Date(data.month),
    },
  });

  await invalidateCaches(req.userId, data.month);

  res.status(201).json({ message: "Income entry added", entry });
}

// ── DELETE Income Entry ───────────────────────────────────
async function remove(req, res) {
  const { id } = req.params;

  const existing = await prisma.incomeEntry.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.userId) {
    throw new AppError("Income entry not found", 404, "NOT_FOUND");
  }

  await prisma.incomeEntry.delete({ where: { id } });

  await invalidateCaches(req.userId, existing.month);

  res.status(200).json({ message: "Income entry deleted" });
}

module.exports = {
  getAll,
  create,
  remove,
};

// ═══════════════════════════════════════════════════════════
// FINPILOT — Goal Controller
// Routes handlers for Module 11 CRUD
// ═══════════════════════════════════════════════════════════

const prisma = require("../config/db");
const { validateGoalPayload, computeGoalPace, getActiveGoalsSummary } = require("../services/goal.service");

// ── 1. Create a Goal ────────
async function createGoal(req, res) {
  const userId = req.userId;
  const payload = { userId, ...req.body };

  try {
    await validateGoalPayload(userId, payload);
  } catch (err) {
    return res.status(400).json({ error: { code: "VALIDATION_FAILED", message: err.message }});
  }

  const goal = await prisma.financialGoal.create({
    data: {
      userId,
      goalType: payload.goalType,
      name: payload.name,
      targetAmount: payload.targetAmount || null,
      currentSaved: payload.currentSaved || 0,
      targetDate: payload.targetDate ? new Date(payload.targetDate) : null,
      loanId: payload.loanId || null,
      targetMonths: payload.targetMonths || null,
    },
  });

  res.status(201).json(goal);
}

// ── 2. List All Goals ────────
async function listGoals(req, res) {
  const userId = req.userId;
  const summary = await getActiveGoalsSummary(userId);
  res.status(200).json({ globalPaceState: summary.globalPaceState, goals: summary.summary });
}

// ── 3. Get Goal by ID (with trace mapping) ────────
async function getGoal(req, res) {
  const { id } = req.params;
  const userId = req.userId;

  const goal = await prisma.financialGoal.findFirst({
    where: { id, userId },
  });

  if (!goal) return res.status(404).json({ error: { message: "Goal not found" }});
  
  const pace = await computeGoalPace(goal);
  res.status(200).json({ goal, pace });
}

// ── 4. Log Progress (Savings Only) ────────
async function logProgress(req, res) {
  const { id } = req.params;
  const userId = req.userId;
  const { amount, note } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ error: { message: "Amount must be greater than 0" }});

  const goal = await prisma.financialGoal.findFirst({
    where: { id, userId, goalType: "savings" },
  });

  if (!goal) return res.status(404).json({ error: { message: "Goal not found or is not a savings goal" }});

  await prisma.$transaction([
    prisma.goalProgressLog.create({
      data: {
        goalId: id,
        amount,
        note
      }
    }),
    prisma.financialGoal.update({
      where: { id },
      data: { currentSaved: { increment: amount } }
    })
  ]);

  res.status(200).json({ message: "Progress logged successfully" });
}

// ── 5. Delete Goal ────────
async function deleteGoal(req, res) {
  const { id } = req.params;
  const userId = req.userId;
  const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
  
  if (!goal) return res.status(404).json({ error: { message: "Goal not found" }});

  await prisma.financialGoal.delete({ where: { id } });
  res.status(200).json({ message: "Deleted successfully" });
}

module.exports = {
  createGoal,
  listGoals,
  getGoal,
  logProgress,
  deleteGoal
};

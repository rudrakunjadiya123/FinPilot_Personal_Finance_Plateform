// ═══════════════════════════════════════════════════════════
// FINPILOT — Background Worker Process
// Evaluates background crons, sends emails, builds embeddings.
// ═══════════════════════════════════════════════════════════

require("dotenv").config();
const { Worker } = require("bullmq");
const prisma = require("./config/db");
const { sendReminderEmailQueue, embeddingGenerationQueue } = require("./config/queues");
const { sendEmail } = require("./services/email.service");
const templates = require("./utils/emailTemplates");
const { getActiveGoalsSummary } = require("./services/goal.service");
const { generateEmbedding } = require("./services/embedding.service");
const sharedRedis = require("./config/redis");
const connection = sharedRedis;

// ── 1. Reminder Scan Worker ───────────────────────────────
const reminderScanWorker = new Worker(
  "reminder-scan",
  async (job) => {
    console.log("[Worker] Starting daily reminder scan...");

    // Find all users opted in to emails
    const users = await prisma.user.findMany({
      where: { reminderEmailOn: true },
    });

    for (const user of users) {
      const msAhead = user.reminderDaysBefore * 24 * 60 * 60 * 1000;
      const scanHorizon = new Date(Date.now() + msAhead);

      // A. EMIs
      const emis = await prisma.eMISchedule.findMany({
        where: {
          loan: { userId: user.id, status: "active" },
          paidStatus: "unpaid",
          dueDate: { lte: scanHorizon },
        },
        include: { loan: true },
      });

      for (const emi of emis) {
        await sendReminderEmailQueue.add(
          "emi-reminder",
          {
            type: "emi",
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            jobRefId: emi.id,
            templateData: {
              userName: user.name,
              loanType: emi.loan.loanType,
              emiAmount: Number(emi.principalComponent) + Number(emi.interestComponent),
              dueDate: emi.dueDate.toISOString().split("T")[0],
              month: emi.month,
            },
          },
          { jobId: `emi-${emi.id}` } // BullMQ ignores duplicates inherently!
        );
      }

      // B. Lend/Borrow
      const lbRecords = await prisma.lendBorrowRecord.findMany({
        where: {
          userId: user.id,
          status: { not: "repaid" },
          expectedReturnDate: { lte: scanHorizon },
        },
      });

      for (const lb of lbRecords) {
        // Does this person have an email we can use for tracking context?
        await sendReminderEmailQueue.add(
          "lb-reminder",
          {
            type: "lend_borrow",
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            jobRefId: lb.id,
            templateData: {
              userName: user.name,
              personName: lb.personName,
              amount: lb.amount,
              type: lb.type,
              expectedReturnDate: lb.expectedReturnDate.toISOString().split("T")[0],
              isOverdue: lb.expectedReturnDate < new Date(),
            },
          },
          { jobId: `lb-${lb.id}-${lb.expectedReturnDate < new Date() ? 'overdue' : 'due'}` }
        );
      }
    }
  },
  { connection }
);

// ── 2. Send Reminder Email Worker ─────────────────────────
const sendReminderWorker = new Worker(
  "send-reminder-email",
  async (job) => {
    const { type, userId, userEmail, jobRefId, templateData } = job.data;

    // Idempotency DB check (SRS 9.2) - don't spam if already logged
    const existingLog = await prisma.reminderLog.findFirst({
      where: {
        userId,
        relatedRecordId: jobRefId,
        type,
      },
    });

    if (existingLog) {
      console.log(`[Worker] Skipping ${type} reminder for ${userEmail} (already sent)`);
      return;
    }

    let emailContent;
    if (type === "emi") {
      emailContent = templates.emiDueTemplate(templateData);
    } else if (type === "credit_card") {
      emailContent = templates.creditCardDueTemplate(templateData);
    } else if (type === "lend_borrow") {
      emailContent = templates.lendBorrowReminderTemplate(templateData);
    }

    try {
      await sendEmail({
        to: userEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      // Log success
      await prisma.reminderLog.create({
        data: {
          userId,
          type,
          relatedRecordId: jobRefId,
          status: "sent",
        },
      });

    } catch (err) {
      // Log failure
      await prisma.reminderLog.create({
        data: {
          userId,
          type,
          relatedRecordId: jobRefId,
          status: "failed",
          errorMessage: err.message,
        },
      });
      throw err; // Put back in queue to retry
    }
  },
  { connection }
);

// ── 3. Monthly Summary Worker ─────────────────────────────
const monthlySummaryWorker = new Worker(
  "monthly-summary",
  async (job) => {
    console.log("[Worker] Generating monthly summaries...");

    const users = await prisma.user.findMany({
      where: { reminderEmailOn: true },
    });

    // Month strings
    const now = new Date();
    // Offset by 1 month to run for *last month's* data effectively since it runs on the 1st
    const lastMonthIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const yearIdx = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const targetMonthStr = `${yearIdx}-${String(lastMonthIdx + 1).padStart(2, "0")}`;
    const friendlyMonthName = new Date(yearIdx, lastMonthIdx, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    for (const user of users) {
      // We borrow heavily from the logic used in Dashboard cash flow controller
      const monthStart = new Date(yearIdx, lastMonthIdx, 1);
      const monthEnd = new Date(yearIdx, lastMonthIdx + 1, 0, 23, 59, 59, 999);

      // Aggregations
      const incomeResult = await prisma.incomeEntry.aggregate({
        where: { userId: user.id, month: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      });
      const totalIncome = Number(incomeResult._sum.amount || 0);

      const emiResult = await prisma.eMISchedule.findMany({
        where: { loan: { userId: user.id }, dueDate: { gte: monthStart, lte: monthEnd } },
      });
      const unpaidEmisCount = emiResult.filter(e => e.paidStatus !== 'paid').length;
      const totalEmisDue = emiResult.reduce((sum, e) => sum + Number(e.principalComponent) + Number(e.interestComponent), 0);

      const overdueLbCount = await prisma.lendBorrowRecord.count({
        where: { userId: user.id, status: { not: "repaid" }, expectedReturnDate: { lt: new Date() } }
      });

      const totalObligations = totalEmisDue;
      const cashFlow = totalIncome - totalObligations;

      // 4. Fetch Active Goals (Module 11)
      const cachedGoals = await getActiveGoalsSummary(user.id);

      const emailContent = templates.monthlySummaryTemplate({
        userName: user.name,
        month: friendlyMonthName,
        totalIncome,
        totalObligations,
        cashFlow,
        unpaidEmis: unpaidEmisCount,
        unpaidCcBills: 0,
        overdueRecords: overdueLbCount,
        goals: cachedGoals
      });

      // Simple fire & forget mechanism natively here, logged to the internal summary systems.
      try {
         await sendEmail({
           to: user.email,
           subject: emailContent.subject,
           html: emailContent.html,
         });
      } catch (err) {
         console.error(`Failed to send monthly summary to ${user.email}`, err);
      }
    }
  },
  { connection }
);


// ── 4. Embedding Generation Worker (Module 7) ──────────────
const embeddingGenerationWorker = new Worker(
  "embedding-generation",
  async (job) => {
    const { recordId, recordType, textChunk, userId } = job.data;
    
    console.log(`[Worker] Generating embedding for ${recordType} ${recordId}`);
    
    // Call the embedding service which interfaces with Gemini
    const vector = await generateEmbedding(textChunk);
    const vectorStr = `[${vector.join(",")}]`;

    // PostgreSQL pgvector upsert mechanism (using Prisma $executeRaw)
    await prisma.$executeRaw`
      INSERT INTO "NoteEmbedding" (id, "recordId", "recordType", content, embedding, "userId", "updatedAt")
      VALUES (
        gen_random_uuid(), 
        ${recordId}, 
        ${recordType}, 
        ${textChunk}, 
        ${vectorStr}::vector, 
        ${userId}, 
        NOW()
      )
      ON CONFLICT ("recordId", "recordType") 
      DO UPDATE SET 
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        "updatedAt" = NOW();
    `;
    
    console.log(`[Worker] Saved embedding for ${recordType} ${recordId}`);
  },
  { connection }
);


console.log("=========================================");
console.log(" Finpilot BullMQ Worker Nodes Active! ");
console.log("=========================================");

reminderScanWorker.on("completed", (job) => console.log(`[Worker] Check completed: ${job.id}`));
reminderScanWorker.on("failed", (job, err) => console.log(`[Worker] Check failed: ${job.id}`, err));
sendReminderWorker.on("failed", (job, err) => console.log(`[Worker] Send failed: ${job.id}`, err));

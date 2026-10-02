require('dotenv').config();
const prisma = require('./src/config/db');
const { embeddingGenerationQueue } = require('./src/config/queues');
const { formatTransactionText } = require('./src/services/embedding.service');

async function syncAllMissingTransactions() {
  console.log('Finding all transactions missing from NoteEmbedding...');
  
  const missingTxs = await prisma.$queryRawUnsafe(`
    SELECT t.id, t.date, t.amount, t.type, t."descriptionRaw", t.category, t."userId"
    FROM "Transaction" t
    LEFT JOIN "NoteEmbedding" ne ON t.id = ne."recordId" AND ne."recordType" = 'transaction'
    WHERE ne.id IS NULL;
  `);

  console.log('Found missing transactions:', missingTxs.length);

  if (missingTxs.length > 0) {
    const jobs = missingTxs.map(tx => ({
      name: 'generate',
      data: {
        recordId: tx.id,
        recordType: 'transaction',
        textChunk: formatTransactionText(tx),
        userId: tx.userId
      }
    }));

    await embeddingGenerationQueue.addBulk(jobs);
    console.log('Successfully enqueued all', jobs.length, 'missing transactions into embedding queue!');
  }
  process.exit(0);
}

syncAllMissingTransactions().catch(e => {
  console.error(e);
  process.exit(1);
});

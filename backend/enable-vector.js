require('dotenv').config(); // Ensure variables are loaded
const prisma = require('./src/config/db');

async function main() {
  try {
    console.log("Connecting to the database to configure pgvector and NoteEmbedding...");
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log("✅ Success: 'vector' extension is enabled.");

    await prisma.$executeRawUnsafe('ALTER TABLE "NoteEmbedding" ADD COLUMN IF NOT EXISTS "embedding" vector(768);');
    console.log("✅ Success: 'embedding' vector(768) column exists on NoteEmbedding.");

    const cols = await prisma.$queryRawUnsafe("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'NoteEmbedding';");
    console.log("CURRENT COLUMNS in NoteEmbedding:", cols.map(c => c.column_name));
  } catch (error) {
    console.error("❌ Failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

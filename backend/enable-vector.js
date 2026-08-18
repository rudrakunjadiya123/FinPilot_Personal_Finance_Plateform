require('dotenv').config(); // Ensure variables are loaded
const prisma = require('./src/config/db');

async function main() {
  try {
    console.log("Connecting to the new database to enable pgvector...");
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log("✅ Success: 'vector' extension is enabled in the new database.");
  } catch (error) {
    console.error("❌ Failed to enable vector extension:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

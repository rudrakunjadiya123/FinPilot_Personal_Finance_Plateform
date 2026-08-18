// ═══════════════════════════════════════════════════════════
// FINPILOT — Prisma Client Singleton (Prisma v7)
// Uses @prisma/adapter-pg for direct PostgreSQL connection
// ═══════════════════════════════════════════════════════════

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Create a connection pool using the DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Prisma PG adapter
const adapter = new PrismaPg(pool);

// Create the Prisma Client with the adapter
const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

module.exports = prisma;

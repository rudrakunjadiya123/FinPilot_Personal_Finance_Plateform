// ═══════════════════════════════════════════════════════════
// FINPILOT — Redis Connection
// Single shared Redis instance for caching, rate limiting,
// refresh tokens, and BullMQ backing store
// ═══════════════════════════════════════════════════════════

const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  family: 4, // Force IPv4 (prevents Windows IPv6 ETIMEDOUT loop)
  connectTimeout: 10000,
  tls: redisUrl.startsWith("rediss://") ? {} : undefined, // Enable TLS for rediss:// URLs
  retryStrategy(times) {
    if (times > 20) return null; // Stop infinite reconnection loop
    const delay = Math.min(times * 500, 5000);
    return delay;
  },
});

redis.on("connect", () => {
  console.log("[Redis] Connected successfully");
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

module.exports = redis;

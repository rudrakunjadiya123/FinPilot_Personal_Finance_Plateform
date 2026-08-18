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
  tls: redisUrl.startsWith("rediss://") ? {} : undefined, // Enable TLS for rediss:// URLs
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    console.log(
      `[Redis] Reconnecting in ${delay}ms... (attempt ${times})`
    );
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

import { Redis } from "ioredis";
import "dotenv/config";

if (!process.env.REDIS_URL!) {
  throw new Error("REDIS_URL environment variable is missing!");
}

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 4,
});

redis.on("connect", () => {
  console.log("🚀 Redis connection initialized successfully.");
});

redis.on("error", (error) => {
  console.error("❌ Redis Connection Error:", error);
});

export default redis;

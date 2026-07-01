import "dotenv/config";

/* BullMQ takes host/port/password options — shared by queue producer (api) */
export function parseRedisUrl(redisUrl: string) {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
  };
}

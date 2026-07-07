import "dotenv/config";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import session from "express-session";

const client = createClient({ url: process.env.REDIS_URL! });

/* awaited in startServer — no more "server up, sessions broken" boots */
export async function connectSessionStore(): Promise<void> {
  await client.connect();
}

const redisStore = new RedisStore({ client });

const isProduction = process.env.NODE_ENV === "production";

export const sessionMiddleware = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // isProduction,
    httpOnly: true,
    // sameSite: isProduction ? "none" : "lax",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});

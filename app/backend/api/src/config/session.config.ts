import "dotenv/config";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import session from "express-session";

const client = createClient({ url: process.env.REDIS_URL! });
client.connect().catch(console.error);

const redisStore = new RedisStore({ client });

export const sessionMiddleware = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});

import { RedisStore } from "connect-redis";
import redis from "./redis.config";
import session from "express-session";

const redisStore = new RedisStore({ client: redis });

export const sessionMiddleware = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET!,
  resave: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});

import session from "express-session";
import { RedisStore } from "connect-redis";
import { redisClient } from "./redis.config";

const store = new RedisStore({ client: redisClient });

export const sessionMiddleware = session({
  store,
  secret: process.env.SESSION_SECRET || "fallback-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  },
});

import type { NextFunction, Request, Response } from "express";
import redis from "../config/redis.config";
import { sendError } from "../interface/ApiResponse";
import { ERROR_MESSAGES } from "../config/constants.config";

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const key = `rateLimit:${req.project!.id}`;
    const now = Date.now();
    const windowMs = 60_000;

    await redis.zremrangebyscore(key, 0, now - windowMs);
    const count = await redis.zcard(key);

    if (count >= 100) {
      return sendError(res, 429, ERROR_MESSAGES.RATE_LIMITED);
    }

    await redis.zadd(key, now, `${now}:${crypto.randomUUID()}`);
    await redis.expire(key, 60);
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

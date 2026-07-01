import type { NextFunction, Request, Response } from "express";
import redis from "../config/redis.config";
import { sendError } from "../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  RATE_LIMIT,
} from "../config/constants.config";

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const key = `rateLimit:${req.project!.id}`;
    const now = Date.now();

    /* one atomic round-trip: trim window → record request → count */
    const results = await redis
      .multi()
      .zremrangebyscore(key, 0, now - RATE_LIMIT.WINDOW_MS)
      .zadd(key, now, `${now}:${crypto.randomUUID()}`)
      .zcard(key)
      .expire(key, Math.ceil(RATE_LIMIT.WINDOW_MS / 1000))
      .exec();

    const count = (results?.[2]?.[1] as number) ?? 0;

    if (count > RATE_LIMIT.MAX_EVENTS_PER_WINDOW) {
      return sendError(
        res,
        HTTP_STATUS.T00_MANY_REQUEST,
        ERROR_MESSAGES.RATE_LIMITED,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

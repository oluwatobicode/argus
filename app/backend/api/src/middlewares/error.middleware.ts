import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
import { sendError } from "../interface/ApiResponse";
import { ERROR_MESSAGES, HTTP_STATUS } from "../config/constants.config";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (res.headersSent) {
    return;
  }

  if (err instanceof ZodError) {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.VALIDATION_ERROR,
      err.issues,
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(res, HTTP_STATUS.CONFLICT, ERROR_MESSAGES.DUPLICATE_ENTRY);
    }
    if (err.code === "P2025") {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }
  }

  console.error(`[${req.method}] ${req.originalUrl} —`, err);
  return sendError(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_MESSAGES.SERVER_ERROR,
  );
}

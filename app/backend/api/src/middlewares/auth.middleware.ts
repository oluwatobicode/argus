import type { NextFunction, Request, Response } from "express";
import { ERROR_MESSAGES } from "../config/constants.config";

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res
    .status(401)
    .json({ status: "error", message: ERROR_MESSAGES.NOT_LOGGED_IN });
}

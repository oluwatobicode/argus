import type { NextFunction, Request, Response } from "express";

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ status: "error", message: "Unauthorized" });
}

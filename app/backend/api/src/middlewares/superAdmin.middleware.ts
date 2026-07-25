import type { NextFunction, Request, Response } from "express";
import { sendError } from "../interface/ApiResponse";
import { HTTP_STATUS } from "../config/constants.config";

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/*
 * Platform-level admin — separate from org-scoped MemberRole (OWNER/ADMIN/MEMBER).
 * Gated by a static email allowlist rather than a DB flag: no migration, no
 * write surface for who's an admin — just an env var only the operator controls.
 * Must run after ensureAuth (needs req.user populated).
 */
export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const email = req.user?.email?.toLowerCase();
  if (!email || !SUPER_ADMIN_EMAILS.includes(email)) {
    return sendError(res, HTTP_STATUS.FORBIDDEN, "Admin access required");
  }
  next();
}

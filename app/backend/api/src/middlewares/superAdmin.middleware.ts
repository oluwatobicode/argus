import type { NextFunction, Request, Response } from "express";
import { sendError } from "../interface/ApiResponse";
import { HTTP_STATUS } from "../config/constants.config";

/* bootstrap allowlist — lets the first admin in before any User.isSuperAdmin
 * flag is set. The DB flag is the real mechanism; this is the escape hatch. */
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/*
 * Platform-level admin — separate from org-scoped MemberRole (OWNER/ADMIN/MEMBER).
 * Must run after ensureAuth (needs req.user populated).
 */
export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
  const email = user?.email?.toLowerCase();
  const allowed =
    user?.isSuperAdmin === true ||
    (email ? SUPER_ADMIN_EMAILS.includes(email) : false);

  if (!allowed) {
    return sendError(res, HTTP_STATUS.FORBIDDEN, "Admin access required");
  }
  next();
}

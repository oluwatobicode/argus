import type { NextFunction, Request, Response } from "express";
import { sendError } from "../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  PLAN_EVENT_LIMITS,
} from "../config/constants.config";
import { prisma } from "../config/db.config";

export const quotaLimit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.project!.orgId;
    const month = new Date()
      .toISOString()
      .slice(0, 7); /* returns month as 2026-06 */

    let quota = await prisma.eventQuota.findUnique({
      where: { orgId_month: { orgId, month } },
    });

    if (!quota) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
      });
      const limit =
        org?.plan === "PRO" ? PLAN_EVENT_LIMITS.PRO : PLAN_EVENT_LIMITS.FREE;
      try {
        quota = await prisma.eventQuota.create({
          data: { orgId, month, count: 0, limit },
        });
      } catch {
        /* concurrent request created it first — re-read below */
        quota = await prisma.eventQuota.findUnique({
          where: { orgId_month: { orgId, month } },
        });
      }
    }

    if (!quota) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.SERVER_ERROR,
      );
    }

    /* check-and-consume in one guarded UPDATE — no overshoot under bursts */
    const consumed = await prisma.eventQuota.updateMany({
      where: { orgId, month, count: { lt: quota.limit } },
      data: { count: { increment: 1 } },
    });

    if (consumed.count === 0) {
      return sendError(
        res,
        HTTP_STATUS.T00_MANY_REQUEST,
        ERROR_MESSAGES.QUOTA_EXCEEDED,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

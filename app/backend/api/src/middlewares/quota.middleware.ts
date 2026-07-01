import type { NextFunction, Request, Response } from "express";
import redis from "../config/redis.config";
import { sendError } from "../interface/ApiResponse";
import { ERROR_MESSAGES } from "../config/constants.config";
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

    let currentQuota = await prisma.eventQuota.findUnique({
      where: { orgId_month: { orgId, month } },
    });

    if (!currentQuota) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
      });
      const limit = org?.plan === "PRO" ? 500_000 : 10_000;
      currentQuota = await prisma.eventQuota.create({
        data: { orgId, month, count: 0, limit },
      });
    }

    if (currentQuota.count >= currentQuota.limit) {
      return sendError(res, 429, ERROR_MESSAGES.QUOTA_EXCEEDED);
    }

    next();
  } catch (error) {
    next(error);
    console.error(error);
  }
};

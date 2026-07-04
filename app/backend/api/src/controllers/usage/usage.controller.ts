import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  PLAN_EVENT_LIMITS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";

export const getUsage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: req.user!.id },
      include: { org: true },
    });

    if (!membership) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    const org = membership.org;
    const month = new Date().toISOString().slice(0, 7); /* e.g. 2026-07 */

    const quota = await prisma.eventQuota.findUnique({
      where: { orgId_month: { orgId: org.id, month } },
    });

    /* limit follows the org's CURRENT plan, not the value frozen on the quota
       row when it was first created (which would be stale after an upgrade) */
    const limit =
      org.plan === "PRO" ? PLAN_EVENT_LIMITS.PRO : PLAN_EVENT_LIMITS.FREE;
    const used = quota?.count ?? 0;

    /* breakdown by level across the org's projects this month */
    const projects = await prisma.project.findMany({
      where: { orgId: org.id },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);
    const monthStart = new Date(`${month}-01T00:00:00.000Z`);

    const grouped = projectIds.length
      ? await prisma.event.groupBy({
          by: ["level"],
          where: {
            projectId: { in: projectIds },
            receivedAt: { gte: monthStart },
          },
          _count: { _all: true },
        })
      : [];

    const byLevel = Object.fromEntries(
      grouped.map((g) => [g.level, g._count._all]),
    ) as Record<string, number>;

    const breakdown = {
      errors: (byLevel.ERROR ?? 0) + (byLevel.FATAL ?? 0),
      warnings: byLevel.WARNING ?? 0,
      info: (byLevel.INFO ?? 0) + (byLevel.DEBUG ?? 0),
    };

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.USAGE_FETCHED, {
      plan: org.plan,
      used,
      limit,
      month,
      breakdown,
    });
  } catch (error) {
    next(error);
  }
};

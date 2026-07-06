import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";
import { percentile } from "../../utils/percentile.util";

/* the project must belong to an org the user is a member of */
async function assertProjectAccess(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, org: { members: { some: { userId } } } },
    select: { id: true },
  });
}

/* bounded window: ?days=1|7|30 (default 7) */
function windowStart(req: Request): Date {
  const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const SAMPLE_CAP = 5_000;

export const listTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId as string;
    const project = await assertProjectAccess(req.user!.id, projectId);
    if (!project) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PROJECT_NOT_FOUND,
      );
    }

    const rows = await prisma.transaction.findMany({
      where: { projectId, timestamp: { gte: windowStart(req) } },
      select: { name: true, duration: true, timestamp: true },
      orderBy: { timestamp: "desc" },
      take: SAMPLE_CAP,
    });

    /* group by name → count, p50/p75/p95, lastSeen */
    const groups = new Map<string, { durations: number[]; lastSeen: Date }>();
    for (const row of rows) {
      const group = groups.get(row.name);
      if (group) {
        group.durations.push(row.duration);
        if (row.timestamp > group.lastSeen) group.lastSeen = row.timestamp;
      } else {
        groups.set(row.name, { durations: [row.duration], lastSeen: row.timestamp });
      }
    }

    const transactions = [...groups.entries()]
      .map(([name, g]) => {
        const sorted = g.durations.sort((a, b) => a - b);
        return {
          name,
          count: sorted.length,
          p50: Math.round(percentile(sorted, 50)),
          p75: Math.round(percentile(sorted, 75)),
          p95: Math.round(percentile(sorted, 95)),
          lastSeen: g.lastSeen,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.TRANSACTIONS_FETCHED,
      transactions,
    );
  } catch (error) {
    next(error);
  }
};

/* good / needs-improvement / poor thresholds (web.dev standards) */
const VITAL_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
} as const;

type VitalKey = keyof typeof VITAL_THRESHOLDS;

function rate(key: VitalKey, value: number): "good" | "needs-improvement" | "poor" {
  const t = VITAL_THRESHOLDS[key];
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

export const getWebVitals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId as string;
    const project = await assertProjectAccess(req.user!.id, projectId);
    if (!project) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PROJECT_NOT_FOUND,
      );
    }

    const rows = await prisma.transaction.findMany({
      where: {
        projectId,
        timestamp: { gte: windowStart(req) },
        vitals: { not: Prisma.AnyNull },
      },
      select: { vitals: true },
      orderBy: { timestamp: "desc" },
      take: SAMPLE_CAP,
    });

    const samples: Record<VitalKey, number[]> = { lcp: [], cls: [], fcp: [], ttfb: [] };
    for (const row of rows) {
      const v = row.vitals as Record<string, unknown> | null;
      if (!v) continue;
      for (const key of Object.keys(samples) as VitalKey[]) {
        if (typeof v[key] === "number") samples[key].push(v[key] as number);
      }
    }

    /* p75 is the web-vitals reporting standard */
    const vitals = Object.fromEntries(
      (Object.keys(samples) as VitalKey[]).map((key) => {
        const sorted = samples[key].sort((a, b) => a - b);
        if (sorted.length === 0) return [key, null];
        const p75 = key === "cls"
          ? Number(percentile(sorted, 75).toFixed(3))
          : Math.round(percentile(sorted, 75));
        return [key, { p75, rating: rate(key, p75), samples: sorted.length }];
      }),
    );

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.VITALS_FETCHED, {
      vitals,
      sampleCount: rows.length,
    });
  } catch (error) {
    next(error);
  }
};

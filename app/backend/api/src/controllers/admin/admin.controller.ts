import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db.config";
import { sendSuccess } from "../../interface/ApiResponse";
import { HTTP_STATUS } from "../../config/constants.config";

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = (req.query.search as string | undefined)?.trim();

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true,
          memberships: {
            select: {
              role: true,
              org: { select: { id: true, name: true, slug: true, plan: true } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return sendSuccess(res, HTTP_STATUS.OK, "Users fetched", {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const listOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = (req.query.search as string | undefined)?.trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          createdAt: true,
          bachsCustomerId: true,
          _count: { select: { members: true, projects: true } },
          subscription: {
            select: {
              status: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
            },
          },
        },
      }),
      prisma.organization.count({ where }),
    ]);

    return sendSuccess(res, HTTP_STATUS.OK, "Organizations fetched", {
      organizations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalOrganizations,
      proOrganizations,
      totalProjects,
      newUsersLast30d,
      newOrgsLast30d,
      eventsIngested,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.organization.count({ where: { plan: "PRO" } }),
      prisma.project.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.organization.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.eventQuota.aggregate({ _sum: { count: true } }),
    ]);

    return sendSuccess(res, HTTP_STATUS.OK, "Stats fetched", {
      totalUsers,
      totalOrganizations,
      plan: { free: totalOrganizations - proOrganizations, pro: proOrganizations },
      totalProjects,
      totalEventsIngested: eventsIngested._sum.count ?? 0,
      last30Days: { newUsers: newUsersLast30d, newOrganizations: newOrgsLast30d },
    });
  } catch (error) {
    next(error);
  }
};

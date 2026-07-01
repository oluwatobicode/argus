import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";

const ISSUE_STATUSES = ["UNRESOLVED", "RESOLVED", "IGNORED"] as const;
const ISSUE_LEVELS = ["FATAL", "ERROR", "WARNING", "INFO", "DEBUG"] as const;

export const listIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const status = req.query.status as string | undefined;
    const level = req.query.level as string | undefined;

    const where: Record<string, unknown> = { projectId };

    if (status && ISSUE_STATUSES.includes(status as typeof ISSUE_STATUSES[number])) {
      where.status = status;
    }
    if (level && ISSUE_LEVELS.includes(level as typeof ISSUE_LEVELS[number])) {
      where.level = level;
    }

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lastSeen: "desc" },
      }),
      prisma.issue.count({ where }),
    ]);

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.ISSUES_FETCHED, {
      issues,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId as string;
    const issueId = req.params.id as string;

    const issue = await prisma.issue.findFirst({
      where: { id: issueId, projectId },
      include: {
        events: {
          take: 10,
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!issue) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ISSUE_NOT_FOUND);
    }

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.ISSUE_FETCHED, issue);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateIssueStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId as string;
    const issueId = req.params.id as string;
    const { status } = req.body;

    if (!status || !ISSUE_STATUSES.includes(status)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Invalid status value");
    }

    const issue = await prisma.issue.findFirst({
      where: { id: issueId, projectId },
    });

    if (!issue) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ISSUE_NOT_FOUND);
    }

    const updated = await prisma.issue.update({
      where: { id: issueId },
      data: { status },
    });

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.ISSUE_STATUS_UPDATED, updated);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";

export const listEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const issueId = req.params.issueId as string;
    const projectId = req.params.projectId as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const issue = await prisma.issue.findFirst({
      where: { id: issueId, projectId },
    });

    if (!issue) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ISSUE_NOT_FOUND);
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { issueId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: "desc" },
      }),
      prisma.event.count({ where: { issueId } }),
    ]);

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.EVENTS_FETCHED, {
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

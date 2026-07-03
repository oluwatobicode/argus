import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";
import {
  CreateAlertSchema,
  UpdateAlertSchema,
} from "../../validators/alert.validator";

/* the project must belong to an org the user is a member of */
async function assertProjectAccess(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, org: { members: { some: { userId } } } },
    select: { id: true },
  });
}

export const listAlerts = async (
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

    const alerts = await prisma.alertRule.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.ALERTS_FETCHED,
      alerts,
    );
  } catch (error) {
    next(error);
  }
};

export const createAlert = async (
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

    const data = CreateAlertSchema.parse(req.body);

    const alert = await prisma.alertRule.create({
      data: { ...data, projectId },
    });

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      SUCCESS_MESSAGES.ALERT_CREATED,
      alert,
    );
  } catch (error) {
    next(error);
  }
};

export const updateAlert = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId as string;
    const alertId = req.params.id as string;
    const project = await assertProjectAccess(req.user!.id, projectId);
    if (!project) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PROJECT_NOT_FOUND,
      );
    }

    const existing = await prisma.alertRule.findFirst({
      where: { id: alertId, projectId },
    });
    if (!existing) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.ALERT_NOT_FOUND,
      );
    }

    const data = UpdateAlertSchema.parse(req.body);
    const updated = await prisma.alertRule.update({
      where: { id: alertId },
      data,
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.ALERT_UPDATED,
      updated,
    );
  } catch (error) {
    next(error);
  }
};

export const deleteAlert = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId as string;
    const alertId = req.params.id as string;
    const project = await assertProjectAccess(req.user!.id, projectId);
    if (!project) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PROJECT_NOT_FOUND,
      );
    }

    const existing = await prisma.alertRule.findFirst({
      where: { id: alertId, projectId },
    });
    if (!existing) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.ALERT_NOT_FOUND,
      );
    }

    await prisma.alertRule.delete({ where: { id: alertId } });

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.ALERT_DELETED);
  } catch (error) {
    next(error);
  }
};

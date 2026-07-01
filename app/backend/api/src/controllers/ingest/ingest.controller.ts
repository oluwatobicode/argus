import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";
import { EventEnvelopeSchema } from "../../validators/envelope.validator";
import { addEvent } from "../../services/queue.service";

export const ingestEnvelope = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = EventEnvelopeSchema.parse(req.body);

    const projectId = req.params.projectId as string;
    await addEvent(projectId, parsed);

    const orgId = req.project!.orgId;
    const month = new Date().toISOString().slice(0, 7);

    await prisma.eventQuota.update({
      where: { orgId_month: { orgId, month } },
      data: { count: { increment: 1 } },
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.EVENT_RECEIVED,
    );
  } catch (error) {
    console.error(error);
    next(error);
  }
};

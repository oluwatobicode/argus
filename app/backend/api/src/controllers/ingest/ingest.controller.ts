import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../interface/ApiResponse";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../../config/constants.config";
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

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.EVENT_RECEIVED);
  } catch (error) {
    next(error);
  }
};

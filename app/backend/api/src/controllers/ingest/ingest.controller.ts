import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../interface/ApiResponse";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../../config/constants.config";
import {
  EventEnvelopeSchema,
  TransactionEnvelopeSchema,
} from "../../validators/envelope.validator";
import { addEvent, addPerfEvent } from "../../services/queue.service";

export const ingestEnvelope = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId as string;

    /* one endpoint, two envelope kinds — discriminated by `type` */
    if (req.body?.type === "transaction") {
      const parsed = TransactionEnvelopeSchema.parse(req.body);
      await addPerfEvent(projectId, parsed);
    } else {
      const parsed = EventEnvelopeSchema.parse(req.body);
      await addEvent(projectId, parsed);
    }

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.EVENT_RECEIVED);
  } catch (error) {
    next(error);
  }
};

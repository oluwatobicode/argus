import type { NextFunction, Request, Response } from "express";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";
import { POLAR_WEBHOOK_SECRET } from "../../config/polar.config";
import {
  createProCheckout,
  createPortalSession,
  activateSubscription,
  revokeSubscription,
  markSubscriptionCanceled,
} from "../../services/billing.service";

async function getUserOrg(userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { org: true },
  });
  return membership?.org ?? null;
}

export const createCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const org = await getUserOrg(req.user!.id);
    if (!org) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }
    if (org.plan === "PRO") {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "You're already on the Pro plan",
      );
    }

    const url = await createProCheckout(org.id, req.user!.email ?? null);
    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.CHECKOUT_CREATED, {
      url,
    });
  } catch (error) {
    next(error);
  }
};

export const createBillingPortal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const org = await getUserOrg(req.user!.id);
    if (!org) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    const url = await createPortalSession(org.id);
    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PORTAL_CREATED, {
      url,
    });
  } catch (error) {
    next(error);
  }
};

/* Polar webhook — no session auth; verified by signature over the raw body */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const event = validateEvent(
      req.rawBody ?? Buffer.from(JSON.stringify(req.body)),
      req.headers as Record<string, string>,
      POLAR_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case "subscription.created":
      case "subscription.active":
      case "subscription.updated":
      case "subscription.uncanceled":
        await activateSubscription(event.data);
        break;
      case "subscription.canceled":
        await markSubscriptionCanceled(event.data);
        break;
      case "subscription.revoked":
        await revokeSubscription(event.data);
        break;
      default:
        break; /* ignore other events */
    }

    return res.status(HTTP_STATUS.OK).json({ received: true });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Invalid webhook signature");
    }
    next(error);
  }
};

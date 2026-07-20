import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";
import { BACHS_WEBHOOK_SECRET } from "../../config/bachs.config";
import redis from "../../config/redis.config";
import {
  createProCheckout,
  cancelSubscription,
  activateSubscription,
  revokeSubscription,
  markSubscriptionCanceled,
  type BachsSubscription,
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

    /* Bachs requires an email to create the org's customer */
    const email = req.user!.email;
    if (!email) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "An email is required to upgrade",
      );
    }

    const url = await createProCheckout(org.id, email, req.user!.name ?? null);
    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.CHECKOUT_CREATED, {
      url,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBilling = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const org = await getUserOrg(req.user!.id);
    if (!org) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }
    if (org.plan !== "PRO") {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "No active Pro subscription to cancel",
      );
    }

    const { cancel_at_period_end = true } = req.body ?? {};
    await cancelSubscription(org.id, cancel_at_period_end);
    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      cancel_at_period_end
        ? "Subscription will cancel at period end"
        : "Subscription canceled immediately",
    );
  } catch (error) {
    next(error);
  }
};

/* verify Bachs webhook signature: HMAC-SHA256("{timestamp}.{rawBody}") */
function verifyBachsSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
): boolean {
  if (!BACHS_WEBHOOK_SECRET) {
    console.error(
      "[billing] webhook rejected: BACHS_WEBHOOK_SECRET is not set",
    );
    return false;
  }

  /* reject stale deliveries (> 5 min old) */
  const ts = parseInt(timestamp, 10);
  if (Number.isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    console.error(
      `[billing] webhook rejected: stale/invalid timestamp (${timestamp})`,
    );
    return false;
  }

  const message = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", BACHS_WEBHOOK_SECRET)
    .update(message, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  const valid =
    expectedBuf.length === signatureBuf.length &&
    crypto.timingSafeEqual(expectedBuf, signatureBuf);

  if (!valid) {
    console.error("[billing] webhook rejected: signature mismatch");
  }

  return valid;
}

/* Bachs webhook — no session auth; verified by HMAC signature over the raw body */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const timestamp = req.headers["x-bachs-timestamp"] as string | undefined;
    const signature = req.headers["x-bachs-signature"] as string | undefined;

    if (!timestamp || !signature) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Missing webhook signature headers",
      );
    }

    if (!req.rawBody) {
      console.error(
        "[billing] webhook: req.rawBody is missing — falling back to JSON.stringify(req.body), signature verification will likely fail",
      );
    }
    const rawBody = req.rawBody?.toString("utf8") ?? JSON.stringify(req.body);

    if (!verifyBachsSignature(rawBody, timestamp, signature)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid webhook signature",
      );
    }

    const event = req.body as {
      id: string;
      type: string;
      data: BachsSubscription;
    };

    console.log(
      `[billing] webhook received: id=${event.id} type=${event.type}`,
    );

    /* idempotency: Bachs guarantees at-least-once delivery, so the same event
     * may arrive more than once. Claim the id atomically; if it's already been
     * seen, ack without reprocessing. */
    const dedupeKey = `bachs:webhook:${event.id}`;
    const claimed = await redis.set(dedupeKey, "1", "EX", 60 * 60 * 24, "NX");
    if (claimed !== "OK") {
      console.log(`[billing] webhook duplicate, skipping: id=${event.id}`);
      return res
        .status(HTTP_STATUS.OK)
        .json({ received: true, duplicate: true });
    }

    try {
      await processWebhookEvent(event);
      console.log(`[billing] webhook processed: id=${event.id} type=${event.type}`);
    } catch (err) {
      /* release the claim so Bachs's retry can reprocess this event */
      console.error(
        `[billing] webhook processing failed: id=${event.id} type=${event.type}`,
        err,
      );
      await redis.del(dedupeKey);
      throw err;
    }

    return res.status(HTTP_STATUS.OK).json({ received: true });
  } catch (error) {
    next(error);
  }
};

async function processWebhookEvent(event: {
  type: string;
  data: BachsSubscription;
}) {
  switch (event.type) {
    case "customer.subscription.created":
      await activateSubscription(event.data);
      break;
    case "customer.subscription.updated": {
      const status = event.data.status;
      if (status === "active" || status === "trialing") {
        await activateSubscription(event.data);
      } else if (status === "canceled") {
        await markSubscriptionCanceled(event.data);
      } else if (status === "past_due" || status === "unpaid") {
        await markSubscriptionCanceled(event.data);
      } else {
        console.warn(
          `[billing] customer.subscription.updated with unhandled status="${status}" for subscription ${event.data.subscription_id} — no action taken`,
        );
      }
      break;
    }
    case "customer.subscription.deleted":
      await revokeSubscription(event.data);
      break;
    default:
      console.warn(
        `[billing] unhandled webhook event type="${event.type}" — no action taken. If this is a checkout/payment confirmation event, it needs a case here.`,
      );
      break;
  }
}

import { prisma } from "../config/db.config";
import { PLAN_EVENT_LIMITS } from "../config/constants.config";
import {
  bachsFetch,
  BACHS_PRO_PRODUCT_ID,
  BACHS_SUCCESS_URL,
  BACHS_CANCEL_URL,
} from "../config/bachs.config";

/* keep the current month's quota ceiling in sync with the plan (mid-cycle change) */
async function syncQuotaLimit(orgId: string, plan: "FREE" | "PRO") {
  const month = new Date().toISOString().slice(0, 7);
  await prisma.eventQuota.updateMany({
    where: { orgId, month },
    data: {
      limit: plan === "PRO" ? PLAN_EVENT_LIMITS.PRO : PLAN_EVENT_LIMITS.FREE,
    },
  });
}

/* create a Bachs checkout for the Pro plan, linked to our org via metadata */
export async function createProCheckout(
  orgId: string,
  email: string | null,
  name: string | null,
) {
  const body = await bachsFetch<{
    checkout_id: string;
    checkout_url: string;
    status: string;
  }>("/v1/checkout-sessions", {
    method: "POST",
    body: JSON.stringify({
      product_cart: [{ product_id: BACHS_PRO_PRODUCT_ID, quantity: 1 }],
      customer: {
        email: email ?? undefined,
        name: name ?? undefined,
      },
      success_url: BACHS_SUCCESS_URL,
      cancel_url: BACHS_CANCEL_URL,
      metadata: { orgId },
    }),
  });

  return body.checkout_url;
}

/* cancel a subscription (immediately or at period end) */
export async function cancelSubscription(
  orgId: string,
  cancelAtPeriodEnd: boolean,
) {
  const sub = await prisma.subscription.findUnique({ where: { orgId } });
  if (!sub) return;

  await bachsFetch(`/v1/subscriptions/${sub.bachsSubscriptionId}`, {
    method: "DELETE",
    body: JSON.stringify({ cancel_at_period_end: cancelAtPeriodEnd }),
  });
}

/* Bachs subscription shape from webhook event.data */
export interface BachsSubscription {
  subscription_id: string;
  product_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  customer: { customer_id: string; email?: string; name?: string };
  metadata?: Record<string, unknown>;
}

/* find the org this subscription belongs to (metadata.orgId set at checkout) */
function orgIdFrom(sub: BachsSubscription): string | null {
  return typeof sub.metadata?.orgId === "string" ? sub.metadata.orgId : null;
}

async function upsertSubscription(
  orgId: string,
  sub: BachsSubscription,
  plan: "FREE" | "PRO",
) {
  const now = new Date();
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start)
    : now;
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end)
    : now;

  await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      bachsSubscriptionId: sub.subscription_id,
      bachsProductId: sub.product_id,
      plan,
      status: sub.status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
    update: {
      bachsSubscriptionId: sub.subscription_id,
      bachsProductId: sub.product_id,
      plan,
      status: sub.status,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
  });
}

/* subscription became/stays active → org is PRO */
export async function activateSubscription(sub: BachsSubscription) {
  const orgId = orgIdFrom(sub);
  if (!orgId) return;
  await prisma.organization.update({
    where: { id: orgId },
    data: { plan: "PRO", bachsCustomerId: sub.customer.customer_id },
  });
  await upsertSubscription(orgId, sub, "PRO");
  await syncQuotaLimit(orgId, "PRO");
}

/* deleted/canceled → access removed now → back to FREE */
export async function revokeSubscription(sub: BachsSubscription) {
  const orgId = orgIdFrom(sub);
  if (!orgId) return;
  await prisma.organization.update({
    where: { id: orgId },
    data: { plan: "FREE" },
  });
  await upsertSubscription(orgId, sub, "FREE");
  await syncQuotaLimit(orgId, "FREE");
}

/* canceled but not yet expired → keeps PRO until currentPeriodEnd; just flag it */
export async function markSubscriptionCanceled(sub: BachsSubscription) {
  const orgId = orgIdFrom(sub);
  if (!orgId) return;
  await upsertSubscription(orgId, sub, "PRO");
}

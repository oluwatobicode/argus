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

/* get the org's Bachs customer, creating one on first upgrade.
 * a stable per-org customer lets us map every webhook (including the very first
 * subscription.created) back to the org by customer_id — no reliance on whether
 * Bachs echoes checkout metadata onto subscription events. */
async function getOrCreateBachsCustomer(
  orgId: string,
  email: string,
  name: string | null,
): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { bachsCustomerId: true },
  });
  if (org?.bachsCustomerId) return org.bachsCustomerId;

  const customer = await bachsFetch<{ customer_id: string }>("/v1/customers", {
    method: "POST",
    /* idempotency-key collapses double-clicks into a single customer */
    headers: { "Idempotency-Key": `customer-${orgId}` },
    body: JSON.stringify({
      email,
      ...(name ? { name } : {}),
      metadata: { orgId },
    }),
  });

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data: { bachsCustomerId: customer.customer_id },
    });
    return customer.customer_id;
  } catch (err) {
    /* concurrent request won the unique(bachsCustomerId) race — use theirs */
    if ((err as { code?: string }).code === "P2002") {
      const fresh = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { bachsCustomerId: true },
      });
      if (fresh?.bachsCustomerId) return fresh.bachsCustomerId;
    }
    throw err;
  }
}

/* create a Bachs checkout for the Pro plan, linked to our org via a stable customer */
export async function createProCheckout(
  orgId: string,
  email: string,
  name: string | null,
) {
  const customerId = await getOrCreateBachsCustomer(orgId, email, name);

  const body = await bachsFetch<{
    checkout_id: string;
    checkout_url: string;
    status: string;
  }>("/v1/checkout-sessions", {
    method: "POST",
    body: JSON.stringify({
      product_cart: [{ product_id: BACHS_PRO_PRODUCT_ID, quantity: 1 }],
      customer: { customer_id: customerId },
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

/* Bachs "collection.succeeded" shape from webhook event.data — a one-time
 * charge confirmation. No subscription_id/period fields; the customer is
 * nested as { id }, not { customer_id } like BachsSubscription. */
export interface BachsCollection {
  charge_id: string;
  checkout_id: string;
  reference: string;
  status: string;
  customer: { id: string; email?: string; name?: string };
  metadata?: Record<string, unknown>;
}

/* a successful charge is the only payment-confirmation signal Bachs sends for
 * this product — no customer.subscription.created has been observed. Activate
 * PRO directly off metadata.orgId (present on this event), falling back to
 * the customer id the same way orgIdFrom does for subscription events. */
export async function activateProFromCollection(collection: BachsCollection) {
  if (collection.status !== "SUCCEEDED") {
    console.warn(
      `[billing] activateProFromCollection: charge ${collection.charge_id} has status="${collection.status}", not SUCCEEDED — skipping`,
    );
    return;
  }

  let orgId: string | null =
    typeof collection.metadata?.orgId === "string"
      ? collection.metadata.orgId
      : null;

  if (!orgId && collection.customer?.id) {
    const org = await prisma.organization.findUnique({
      where: { bachsCustomerId: collection.customer.id },
      select: { id: true },
    });
    orgId = org?.id ?? null;
  }

  if (!orgId) {
    console.error(
      `[billing] activateProFromCollection: FAILED to resolve org for charge ${collection.charge_id} (customer.id=${collection.customer?.id ?? "none"}) — payment will not reflect for this org`,
    );
    return;
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { plan: "PRO", bachsCustomerId: collection.customer.id },
  });
  await syncQuotaLimit(orgId, "PRO");
  console.log(
    `[billing] activateProFromCollection: org ${orgId} is now PRO (charge ${collection.charge_id})`,
  );
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

/* find the org this subscription belongs to. resolution order is by reliability:
 * the customer is created per-org before checkout, so customer_id is present and
 * mappable from the very first event — unlike checkout metadata, whose
 * propagation onto subscription events isn't guaranteed. */
async function orgIdFrom(sub: BachsSubscription): Promise<string | null> {
  /* primary: stable per-org customer, present on every event incl. the first */
  const customerId = sub.customer?.customer_id;
  if (customerId) {
    const org = await prisma.organization.findUnique({
      where: { bachsCustomerId: customerId },
      select: { id: true },
    });
    if (org) {
      console.log(
        `[billing] orgIdFrom: resolved org ${org.id} via customer_id ${customerId}`,
      );
      return org.id;
    }
  }

  /* fallback 1: we've persisted this subscription before */
  const existing = await prisma.subscription.findUnique({
    where: { bachsSubscriptionId: sub.subscription_id },
    select: { orgId: true },
  });
  if (existing) {
    console.log(
      `[billing] orgIdFrom: resolved org ${existing.orgId} via existing subscription ${sub.subscription_id} (customer_id ${customerId} had no match)`,
    );
    return existing.orgId;
  }

  /* fallback 2: last-ditch, if checkout metadata happens to be echoed */
  if (typeof sub.metadata?.orgId === "string") {
    console.log(
      `[billing] orgIdFrom: resolved org ${sub.metadata.orgId} via checkout metadata fallback for subscription ${sub.subscription_id}`,
    );
    return sub.metadata.orgId;
  }

  console.error(
    `[billing] orgIdFrom: FAILED to resolve org for subscription ${sub.subscription_id} (customer_id=${customerId ?? "none"}) — payment will not reflect for this org`,
  );
  return null;
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
  console.log(
    `[billing] activateSubscription: subscription ${sub.subscription_id} status=${sub.status} customer=${sub.customer?.customer_id}`,
  );
  const orgId = await orgIdFrom(sub);
  if (!orgId) return;
  await prisma.organization.update({
    where: { id: orgId },
    data: { plan: "PRO", bachsCustomerId: sub.customer.customer_id },
  });
  await upsertSubscription(orgId, sub, "PRO");
  await syncQuotaLimit(orgId, "PRO");
  console.log(`[billing] activateSubscription: org ${orgId} is now PRO`);
}

/* deleted/canceled → access removed now → back to FREE */
export async function revokeSubscription(sub: BachsSubscription) {
  console.log(
    `[billing] revokeSubscription: subscription ${sub.subscription_id} status=${sub.status} customer=${sub.customer?.customer_id}`,
  );
  const orgId = await orgIdFrom(sub);
  if (!orgId) return;
  await prisma.organization.update({
    where: { id: orgId },
    data: { plan: "FREE" },
  });
  await upsertSubscription(orgId, sub, "FREE");
  await syncQuotaLimit(orgId, "FREE");
  console.log(`[billing] revokeSubscription: org ${orgId} is now FREE`);
}

/* canceled but not yet expired → keeps PRO until currentPeriodEnd; just flag it */
export async function markSubscriptionCanceled(sub: BachsSubscription) {
  console.log(
    `[billing] markSubscriptionCanceled: subscription ${sub.subscription_id} status=${sub.status} customer=${sub.customer?.customer_id}`,
  );
  const orgId = await orgIdFrom(sub);
  if (!orgId) return;
  await upsertSubscription(orgId, sub, "PRO");
}

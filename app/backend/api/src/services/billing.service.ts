import { prisma } from "../config/db.config";
import {
  polar,
  POLAR_PRO_PRODUCT_ID,
  POLAR_SUCCESS_URL,
} from "../config/polar.config";

/* create a Polar checkout for the Pro plan, linked to our org via externalCustomerId */
export async function createProCheckout(orgId: string, email: string | null) {
  const checkout = await polar.checkouts.create({
    products: [POLAR_PRO_PRODUCT_ID],
    successUrl: POLAR_SUCCESS_URL,
    externalCustomerId: orgId,
    customerEmail: email ?? undefined,
    metadata: { orgId },
  });
  return checkout.url;
}

/* customer portal session (manage/cancel) — Polar resolves the customer by our org id */
export async function createPortalSession(orgId: string) {
  const session = await polar.customerSessions.create({
    externalCustomerId: orgId,
  });
  return session.customerPortalUrl;
}

/* Polar Subscription shape (only the fields we use) */
interface PolarSubscription {
  id: string;
  status: string;
  productId: string;
  customerId: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean | null;
  customer?: { externalId?: string | null } | null;
  metadata?: Record<string, unknown> | null;
}

/* find the org this subscription belongs to (externalId set at checkout, or metadata) */
function orgIdFrom(sub: PolarSubscription): string | null {
  return (
    sub.customer?.externalId ??
    (typeof sub.metadata?.orgId === "string" ? sub.metadata.orgId : null)
  );
}

async function upsertSubscription(
  orgId: string,
  sub: PolarSubscription,
  plan: "FREE" | "PRO",
) {
  const now = new Date();
  await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      polarSubscriptionId: sub.id,
      polarProductId: sub.productId,
      plan,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart ?? now,
      currentPeriodEnd: sub.currentPeriodEnd ?? now,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    },
    update: {
      polarSubscriptionId: sub.id,
      polarProductId: sub.productId,
      plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd ?? now,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    },
  });
}

/* subscription became/stays active → org is PRO */
export async function activateSubscription(sub: PolarSubscription) {
  const orgId = orgIdFrom(sub);
  if (!orgId) return;
  await prisma.organization.update({
    where: { id: orgId },
    data: { plan: "PRO", polarCustomerId: sub.customerId },
  });
  await upsertSubscription(orgId, sub, "PRO");
}

/* revoked → access removed now → back to FREE */
export async function revokeSubscription(sub: PolarSubscription) {
  const orgId = orgIdFrom(sub);
  if (!orgId) return;
  await prisma.organization.update({
    where: { id: orgId },
    data: { plan: "FREE" },
  });
  await upsertSubscription(orgId, sub, "FREE");
}

/* canceled → keeps PRO until currentPeriodEnd; just flag it */
export async function markSubscriptionCanceled(sub: PolarSubscription) {
  const orgId = orgIdFrom(sub);
  if (!orgId) return;
  await upsertSubscription(orgId, sub, "PRO");
}

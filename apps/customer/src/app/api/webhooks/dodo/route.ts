import { Webhooks } from "@dodopayments/nextjs";
import { prisma, SubscriptionStatus } from "@booking-easy/db";
import { tierFromDodoProductId } from "@/lib/billing/plans";

// Dodo subscription webhook payloads extend their Subscription object
// directly (subscription_id, product_id, metadata, status, customer,
// next_billing_date), rather than nesting it under a `data` key.
type SubscriptionPayload = {
  subscription_id: string;
  product_id: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  customer?: { customer_id?: string } | null;
  next_billing_date?: string | null;
};

async function upsertFromSubscription(payload: SubscriptionPayload, status: SubscriptionStatus) {
  const businessId = payload.metadata?.businessId;
  const tier = tierFromDodoProductId(payload.product_id);

  const where = typeof businessId === "string" ? { id: businessId } : { dodoSubscriptionId: payload.subscription_id };

  await prisma.business.updateMany({
    where,
    data: {
      dodoSubscriptionId: payload.subscription_id,
      dodoCustomerId: payload.customer?.customer_id,
      dodoProductId: payload.product_id,
      ...(tier ? { subscriptionTier: tier } : {}),
      subscriptionStatus: status,
      currentPeriodEnd: payload.next_billing_date ? new Date(payload.next_billing_date) : undefined,
    },
  });
}

// Read directly (not via a throwing helper) — this module is imported during
// Next's build-time page-data collection, before runtime env vars are set,
// so an eager throw here would break every build.
export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? "",

  onSubscriptionActive: async (payload) => {
    await upsertFromSubscription(payload as unknown as SubscriptionPayload, SubscriptionStatus.ACTIVE);
  },
  onSubscriptionRenewed: async (payload) => {
    await upsertFromSubscription(payload as unknown as SubscriptionPayload, SubscriptionStatus.ACTIVE);
  },
  onSubscriptionPlanChanged: async (payload) => {
    await upsertFromSubscription(payload as unknown as SubscriptionPayload, SubscriptionStatus.ACTIVE);
  },
  onSubscriptionOnHold: async (payload) => {
    await upsertFromSubscription(payload as unknown as SubscriptionPayload, SubscriptionStatus.PAST_DUE);
  },
  onSubscriptionFailed: async (payload) => {
    await upsertFromSubscription(payload as unknown as SubscriptionPayload, SubscriptionStatus.PAST_DUE);
  },
  onSubscriptionCancelled: async (payload) => {
    await upsertFromSubscription(payload as unknown as SubscriptionPayload, SubscriptionStatus.CANCELED);
  },
  onSubscriptionExpired: async (payload) => {
    await upsertFromSubscription(payload as unknown as SubscriptionPayload, SubscriptionStatus.CANCELED);
  },
});

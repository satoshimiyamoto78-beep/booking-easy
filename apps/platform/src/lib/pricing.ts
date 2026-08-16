import type { SubscriptionTier } from "@booking-easy/db";

// Placeholder monthly prices in cents, pending real Stripe Billing wiring.
// Used only to estimate platform MRR until subscriptions carry a real price.
export const TIER_PRICE_CENTS: Record<SubscriptionTier, number> = {
  STARTER: 2900,
  PRO: 5900,
  BUSINESS: 9900,
};

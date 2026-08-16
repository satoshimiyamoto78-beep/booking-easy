import { SubscriptionTier } from "@booking-easy/db";

export type PlanDefinition = {
  tier: SubscriptionTier;
  name: string;
  priceCents: number;
  tagline: string;
  features: string[];
};

export const PLANS: PlanDefinition[] = [
  {
    tier: SubscriptionTier.STARTER,
    name: "Starter",
    priceCents: 2900,
    tagline: "For a single practitioner getting started online.",
    features: [
      "Up to 2 staff members",
      "Unlimited services & bookings",
      "Custom booking page & branding",
      "Email support",
    ],
  },
  {
    tier: SubscriptionTier.PRO,
    name: "Pro",
    priceCents: 5900,
    tagline: "For a growing team juggling multiple calendars.",
    features: [
      "Up to 10 staff members",
      "Everything in Starter",
      "Staff-level scheduling & time off",
      "Priority support",
    ],
  },
  {
    tier: SubscriptionTier.BUSINESS,
    name: "Business",
    priceCents: 9900,
    tagline: "For multi-location shops that need it all.",
    features: [
      "Unlimited staff members",
      "Everything in Pro",
      "Advanced reporting",
      "Priority phone + email support",
    ],
  },
];

// Dodo Payments product ids are created per-tier in the Dodo dashboard and
// injected as env vars — there is no sensible hardcoded default.
const PRODUCT_ID_ENV: Record<SubscriptionTier, string | undefined> = {
  STARTER: process.env.DODO_PRODUCT_ID_STARTER,
  PRO: process.env.DODO_PRODUCT_ID_PRO,
  BUSINESS: process.env.DODO_PRODUCT_ID_BUSINESS,
};

export function getPlan(tier: SubscriptionTier): PlanDefinition {
  const plan = PLANS.find((p) => p.tier === tier);
  if (!plan) throw new Error(`Unknown plan tier: ${tier}`);
  return plan;
}

export function getDodoProductId(tier: SubscriptionTier): string {
  const productId = PRODUCT_ID_ENV[tier];
  if (!productId) {
    throw new Error(
      `Missing Dodo product id for tier ${tier}. Set DODO_PRODUCT_ID_${tier} in the environment.`,
    );
  }
  return productId;
}

export function tierFromDodoProductId(productId: string): SubscriptionTier | null {
  for (const tier of Object.keys(PRODUCT_ID_ENV) as SubscriptionTier[]) {
    if (PRODUCT_ID_ENV[tier] === productId) return tier;
  }
  return null;
}

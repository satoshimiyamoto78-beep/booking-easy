-- Rename billing provider columns from Stripe to Dodo Payments naming.
-- No production data exists in these columns yet (billing was never wired),
-- so a straight rename is safe and preserves the unique constraints.

ALTER TABLE "Business" RENAME COLUMN "stripeCustomerId" TO "dodoCustomerId";
ALTER TABLE "Business" RENAME COLUMN "stripeSubscriptionId" TO "dodoSubscriptionId";
ALTER TABLE "Business" RENAME COLUMN "stripePriceId" TO "dodoProductId";

ALTER INDEX "Business_stripeCustomerId_key" RENAME TO "Business_dodoCustomerId_key";
ALTER INDEX "Business_stripeSubscriptionId_key" RENAME TO "Business_dodoSubscriptionId_key";

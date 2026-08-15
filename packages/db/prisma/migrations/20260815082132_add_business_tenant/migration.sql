-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- DropIndex
DROP INDEX "Appointment_staffId_startsAt_idx";

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "businessId" TEXT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "businessId" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "businessId" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "businessId" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "businessId" TEXT;

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Business_stripeCustomerId_key" ON "Business"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_stripeSubscriptionId_key" ON "Business"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Appointment_businessId_staffId_startsAt_idx" ON "Appointment"("businessId", "staffId", "startsAt");

-- CreateIndex
CREATE INDEX "Service_businessId_active_idx" ON "Service"("businessId", "active");

-- CreateIndex
CREATE INDEX "Staff_businessId_active_idx" ON "Staff"("businessId", "active");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: create the first tenant ("the-studio") from the existing
-- BusinessSettings singleton (if present) and attach every pre-existing
-- row to it. Idempotent — safe if re-run, though `prisma migrate deploy`
-- only ever applies a given migration once per database.
DO $$
DECLARE
  biz_id TEXT;
BEGIN
  SELECT id INTO biz_id FROM "Business" WHERE slug = 'the-studio';

  IF biz_id IS NULL THEN
    biz_id := 'biz_the_studio_seed';

    IF EXISTS (SELECT 1 FROM "BusinessSettings" WHERE id = 'default') THEN
      INSERT INTO "Business" (id, slug, name, tagline, address, phone, email, instagram, "createdAt", "updatedAt")
      SELECT biz_id, 'the-studio', COALESCE("shopName", 'The Studio'), tagline, address, phone, email, instagram, now(), now()
      FROM "BusinessSettings" WHERE id = 'default';
    ELSE
      INSERT INTO "Business" (id, slug, name, tagline, "createdAt", "updatedAt")
      VALUES (biz_id, 'the-studio', 'The Studio', 'Barbershop · Spa · Salon', now(), now());
    END IF;
  END IF;

  UPDATE "Service" SET "businessId" = biz_id WHERE "businessId" IS NULL;
  UPDATE "Staff" SET "businessId" = biz_id WHERE "businessId" IS NULL;
  UPDATE "Customer" SET "businessId" = biz_id WHERE "businessId" IS NULL;
  UPDATE "Appointment" SET "businessId" = biz_id WHERE "businessId" IS NULL;
  UPDATE "AdminUser" SET "businessId" = biz_id WHERE "businessId" IS NULL;
END $$;

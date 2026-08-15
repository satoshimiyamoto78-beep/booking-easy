-- DropIndex
DROP INDEX "Customer_email_key";

-- AlterTable
ALTER TABLE "AdminUser" ALTER COLUMN "businessId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "businessId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "businessId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "businessId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Staff" ALTER COLUMN "businessId" SET NOT NULL;

-- DropTable
DROP TABLE "BusinessSettings";

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessId_email_key" ON "Customer"("businessId", "email");

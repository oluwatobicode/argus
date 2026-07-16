/*
  Warnings:

  - You are about to drop the column `polarCustomerId` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `polarProductId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `polarSubscriptionId` on the `Subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bachsCustomerId]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bachsSubscriptionId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bachsProductId` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bachsSubscriptionId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Organization_polarCustomerId_key";

-- DropIndex
DROP INDEX "Subscription_polarSubscriptionId_key";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "polarCustomerId",
ADD COLUMN     "bachsCustomerId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "polarProductId",
DROP COLUMN "polarSubscriptionId",
ADD COLUMN     "bachsProductId" TEXT NOT NULL,
ADD COLUMN     "bachsSubscriptionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_bachsCustomerId_key" ON "Organization"("bachsCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_bachsSubscriptionId_key" ON "Subscription"("bachsSubscriptionId");

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('NEW_ISSUE', 'ERROR_RATE');

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AlertType" NOT NULL DEFAULT 'NEW_ISSUE',
    "threshold" INTEGER,
    "windowMinutes" INTEGER,
    "notifyEmail" TEXT,
    "webhookUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "alertRuleId" TEXT NOT NULL,
    "issueId" TEXT,
    "channel" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertRule_projectId_idx" ON "AlertRule"("projectId");

-- CreateIndex
CREATE INDEX "AlertLog_alertRuleId_idx" ON "AlertLog"("alertRuleId");

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_alertRuleId_fkey" FOREIGN KEY ("alertRuleId") REFERENCES "AlertRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

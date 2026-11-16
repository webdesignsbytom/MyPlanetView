-- Plans and payments (docs/API.md, "Plans and billing"; docs/FEATURE-PLAN.md, "Tiers"):
-- the Stripe subscription, complimentary plan grants, webhook idempotency, the grace
-- period of a transferred map, Economy's print copy, and the stored leaving plan.
-- Made with `prisma migrate diff`; the CHECK at the end is added by hand (Prisma can't
-- express CHECK constraints, and leaves them alone on later diffs).

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'REGULAR', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR');

-- AlterEnum
ALTER TYPE "PhotoSize" ADD VALUE 'PRINT';

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "leavingPlan" JSONB,
ADD COLUMN     "leavingPlanAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "travel_map" ADD COLUMN     "graceUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "subscription" (
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "interval" "BillingInterval",
    "status" TEXT,
    "extraMaps" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "plan_grant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeCustomerId_key" ON "subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeSubscriptionId_key" ON "subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "plan_grant_userId_endsAt_idx" ON "plan_grant"("userId", "endsAt");

-- CreateIndex
CREATE INDEX "plan_grant_grantedById_idx" ON "plan_grant"("grantedById");

-- CreateIndex
CREATE INDEX "stripe_event_processedAt_idx" ON "stripe_event"("processedAt");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_grant" ADD CONSTRAINT "plan_grant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_grant" ADD CONSTRAINT "plan_grant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CHECKs (each mirrors a rule in the code: the webhook and POST /billing/extra-maps)
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_extra_maps_not_negative"
  CHECK ("extraMaps" >= 0);

-- Give a month, get a month (docs/API.md "Give a month, get a month"; 21 Nov 2026): a member's
-- own code (promo_code.ownerId) and the months friends brought them (referral_reward).


-- CreateEnum
CREATE TYPE "ReferralRewardKind" AS ENUM ('CREDIT', 'GRANT', 'CAPPED');

-- AlterTable
ALTER TABLE "promo_code" ADD COLUMN     "ownerId" TEXT;

-- CreateTable
CREATE TABLE "referral_reward" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "friendId" TEXT,
    "kind" "ReferralRewardKind" NOT NULL,
    "amountPence" INTEGER,
    "planGrantId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_reward_friendId_key" ON "referral_reward"("friendId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_reward_planGrantId_key" ON "referral_reward"("planGrantId");

-- CreateIndex
CREATE INDEX "referral_reward_referrerId_createdAt_idx" ON "referral_reward"("referrerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "promo_code_ownerId_key" ON "promo_code"("ownerId");

-- AddForeignKey
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_reward" ADD CONSTRAINT "referral_reward_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_reward" ADD CONSTRAINT "referral_reward_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_reward" ADD CONSTRAINT "referral_reward_planGrantId_fkey" FOREIGN KEY ("planGrantId") REFERENCES "plan_grant"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A reward's shape: a credit has its amount, a capped one gives nothing
ALTER TABLE "referral_reward" ADD CONSTRAINT "referral_reward_shape" CHECK (
  ("kind" = 'CREDIT' AND "amountPence" > 0 AND "planGrantId" IS NULL)
  OR ("kind" = 'GRANT' AND "amountPence" IS NULL)
  OR ("kind" = 'CAPPED' AND "amountPence" IS NULL AND "planGrantId" IS NULL)
);

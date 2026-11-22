-- Gifts of a year of a paid plan (docs/API.md "Gifts"; 21 Nov 2026): bought with a one-off
-- Stripe payment, redeemed for a PlanGrant.

-- CreateTable
CREATE TABLE "gift_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "months" INTEGER NOT NULL DEFAULT 12,
    "amountPence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "buyerId" TEXT,
    "toName" TEXT,
    "message" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "redeemedById" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "grantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gift_code_code_key" ON "gift_code"("code");

-- CreateIndex
CREATE UNIQUE INDEX "gift_code_stripeSessionId_key" ON "gift_code"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "gift_code_stripePaymentIntentId_key" ON "gift_code"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "gift_code_grantId_key" ON "gift_code"("grantId");

-- CreateIndex
CREATE INDEX "gift_code_buyerId_createdAt_idx" ON "gift_code"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "gift_code_paidAt_createdAt_idx" ON "gift_code"("paidAt", "createdAt");

-- CreateIndex
CREATE INDEX "gift_code_redeemedById_idx" ON "gift_code"("redeemedById");

-- AddForeignKey
ALTER TABLE "gift_code" ADD CONSTRAINT "gift_code_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_code" ADD CONSTRAINT "gift_code_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_code" ADD CONSTRAINT "gift_code_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "plan_grant"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A gift is of a paid plan, for 1 to 24 months, at a price; it can only be redeemed once paid
ALTER TABLE "gift_code" ADD CONSTRAINT "gift_code_shape" CHECK (
  "plan" IN ('REGULAR', 'PREMIUM') AND "months" BETWEEN 1 AND 24 AND "amountPence" > 0
);
ALTER TABLE "gift_code" ADD CONSTRAINT "gift_code_paid_before_redeemed" CHECK ("redeemedAt" IS NULL OR "paidAt" IS NOT NULL);

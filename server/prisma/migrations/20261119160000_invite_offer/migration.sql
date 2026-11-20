-- The invite offer (19 Nov 2026, docs/API.md "The invite offer"): half price for the first
-- 3 months on the invited map's paid plan, for a new account that subscribes within 7 days.

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "inviteOfferEndsAt" TIMESTAMP(3),
ADD COLUMN     "inviteOfferPlan" "Plan",
ADD COLUMN     "inviteOfferUsedAt" TIMESTAMP(3);

-- An offer is a plan and its end together, and only ever a paid plan
ALTER TABLE "profile" ADD CONSTRAINT "profile_invite_offer" CHECK (
  ("inviteOfferPlan" IS NULL) = ("inviteOfferEndsAt" IS NULL)
  AND ("inviteOfferPlan" IS NULL OR "inviteOfferPlan" <> 'FREE')
);

-- Promo codes' offer is now the same for every code (the user's decision, 16 Nov 2026;
-- docs/API.md, "Promo codes"): a follower's first month free on the paid plan they choose,
-- as a Stripe trial at Checkout (a card is needed). So a code no longer carries its own
-- plan and days, and a profile records when its free month started instead of a grant.
-- Written by hand: Prisma would drop and re-add the renamed column.

ALTER TABLE "promo_code" DROP CONSTRAINT "promo_code_offer";
ALTER TABLE "promo_code" DROP COLUMN "offerPlan",
DROP COLUMN "offerDays";

ALTER TABLE "profile" RENAME COLUMN "promoOfferGrantedAt" TO "promoTrialUsedAt";

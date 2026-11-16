-- Travel offers: the ad cards and the Travel Desk (docs/API.md "Travel offers";
-- docs/FEATURE-PLAN.md "Ads" and "Travel Desk"): partners' offers, imported by `key`, and
-- their clicks counted per offer, day and placement (nothing about who clicked).
-- Made with `prisma migrate diff`; the CHECKs at the end are added by hand (Prisma can't
-- express CHECK constraints, and leaves them alone on later diffs).

-- CreateEnum
CREATE TYPE "OfferKind" AS ENUM ('HOTEL', 'TOUR', 'FLIGHT', 'ESIM', 'INSURANCE', 'LUGGAGE', 'CAR_HIRE', 'OTHER');

-- CreateEnum
CREATE TYPE "OfferPlacement" AS ENUM ('GALLERY', 'SLIDESHOW', 'COUNTRY_PAGE', 'TRAVEL_DESK');

-- CreateTable
CREATE TABLE "affiliate_offer" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "kind" "OfferKind" NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT,
    "countryCode" CHAR(2),
    "placements" "OfferPlacement"[],
    "url" TEXT NOT NULL,
    "imageKey" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_click_daily" (
    "offerId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "placement" "OfferPlacement" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "offer_click_daily_pkey" PRIMARY KEY ("offerId","day","placement")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_offer_key_key" ON "affiliate_offer"("key");

-- AddForeignKey
ALTER TABLE "affiliate_offer" ADD CONSTRAINT "affiliate_offer_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_click_daily" ADD CONSTRAINT "offer_click_daily_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "affiliate_offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- An offer is picked by weight (1–100), shows somewhere, and doesn't end before it starts
ALTER TABLE "affiliate_offer" ADD CONSTRAINT "affiliate_offer_weight_range" CHECK ("weight" BETWEEN 1 AND 100);
ALTER TABLE "affiliate_offer" ADD CONSTRAINT "affiliate_offer_has_placement" CHECK (cardinality("placements") > 0);
ALTER TABLE "affiliate_offer" ADD CONSTRAINT "affiliate_offer_dates_in_order"
  CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" >= "startsAt");
ALTER TABLE "offer_click_daily" ADD CONSTRAINT "offer_click_daily_count_not_negative" CHECK ("count" >= 0);

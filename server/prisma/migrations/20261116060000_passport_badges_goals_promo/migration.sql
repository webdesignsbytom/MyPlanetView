-- The passport, badges and goals, slideshows and influencer codes (docs/API.md "Passport",
-- "Badges and goals", "Slideshows", "Promo codes"; docs/DATABASE-REVIEW.md "Passport and
-- landmarks", "Slideshows and photo dates"):
--   - landmark.isUnesco (set by the seed and `npm run db:reference`);
--   - photo_landmark.mapId (backfilled from the photo) and confirmedAt, so the passport
--     reads one table;
--   - photo.shotAt (backfilled takenAt ?? createdAt) and its index, for the slideshows;
--   - landmark_cover, badge_award, goal, promo_code, and profile.promoCodeId.
-- Made with `prisma migrate diff`; the backfills and the CHECKs at the end are added by
-- hand (Prisma can't express CHECK constraints, and leaves them alone on later diffs).

-- CreateEnum
CREATE TYPE "GoalKind" AS ENUM ('COUNTRY_COUNT', 'COUNTRY_LIST', 'REGION', 'LANDMARK_COUNT');

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "promoCodeId" TEXT,
ADD COLUMN     "promoOfferGrantedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "landmark" ADD COLUMN     "isUnesco" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: when each photo was taken, or uploaded when the file had no date
ALTER TABLE "photo" ADD COLUMN     "shotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "photo" SET "shotAt" = COALESCE("takenAt", "createdAt");

-- AlterTable: each match's map (copied from its photo), and when it was confirmed (the
-- matches confirmed before this migration are dated from when they were made)
ALTER TABLE "photo_landmark" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "mapId" TEXT;
UPDATE "photo_landmark" AS pl SET "mapId" = p."mapId" FROM "photo" AS p WHERE p."id" = pl."photoId";
UPDATE "photo_landmark" SET "confirmedAt" = "createdAt" WHERE "confirmed";
ALTER TABLE "photo_landmark" ALTER COLUMN "mapId" SET NOT NULL;

-- CreateTable
CREATE TABLE "landmark_cover" (
    "mapId" TEXT NOT NULL,
    "landmarkId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landmark_cover_pkey" PRIMARY KEY ("mapId","landmarkId")
);

-- CreateTable
CREATE TABLE "badge_award" (
    "mapId" TEXT NOT NULL,
    "badgeKey" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_award_pkey" PRIMARY KEY ("mapId","badgeKey")
);

-- CreateTable
CREATE TABLE "goal" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "kind" "GoalKind" NOT NULL,
    "title" TEXT,
    "target" INTEGER,
    "countryCodes" TEXT[],
    "region" TEXT,
    "deadline" DATE,
    "achievedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "offerPlan" "Plan",
    "offerDays" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "endsAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "landmark_cover_photoId_landmarkId_idx" ON "landmark_cover"("photoId", "landmarkId");

-- CreateIndex
CREATE INDEX "landmark_cover_landmarkId_idx" ON "landmark_cover"("landmarkId");

-- CreateIndex
CREATE INDEX "goal_mapId_createdAt_idx" ON "goal"("mapId", "createdAt");

-- CreateIndex
CREATE INDEX "goal_createdById_idx" ON "goal"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "promo_code_code_key" ON "promo_code"("code");

-- CreateIndex
CREATE INDEX "promo_code_createdById_idx" ON "promo_code"("createdById");

-- CreateIndex
CREATE INDEX "profile_promoCodeId_idx" ON "profile"("promoCodeId");

-- CreateIndex
CREATE INDEX "photo_mapId_shotAt_id_idx" ON "photo"("mapId", "shotAt", "id");

-- CreateIndex
CREATE INDEX "photo_landmark_mapId_landmarkId_idx" ON "photo_landmark"("mapId", "landmarkId");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "promo_code"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_landmark" ADD CONSTRAINT "photo_landmark_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark_cover" ADD CONSTRAINT "landmark_cover_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark_cover" ADD CONSTRAINT "landmark_cover_landmarkId_fkey" FOREIGN KEY ("landmarkId") REFERENCES "landmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark_cover" ADD CONSTRAINT "landmark_cover_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark_cover" ADD CONSTRAINT "landmark_cover_photoId_landmarkId_fkey" FOREIGN KEY ("photoId", "landmarkId") REFERENCES "photo_landmark"("photoId", "landmarkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_award" ADD CONSTRAINT "badge_award_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A match is confirmed exactly when it has a confirmation time
ALTER TABLE "photo_landmark" ADD CONSTRAINT "photo_landmark_confirmed_at"
  CHECK ("confirmed" = ("confirmedAt" IS NOT NULL));

-- Each kind of goal has exactly its own fields
ALTER TABLE "goal" ADD CONSTRAINT "goal_shape" CHECK (
  ("kind" IN ('COUNTRY_COUNT', 'LANDMARK_COUNT') AND "target" > 0 AND "region" IS NULL
     AND cardinality("countryCodes") = 0)
  OR ("kind" = 'COUNTRY_LIST' AND "target" IS NULL AND "region" IS NULL
     AND cardinality("countryCodes") > 0)
  OR ("kind" = 'REGION' AND "target" IS NULL AND "region" IS NOT NULL
     AND cardinality("countryCodes") = 0)
);

-- A code is 3–24 upper-case letters and digits; its offer is a paid plan for 1–366 days,
-- or nothing; a use limit is positive
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_format" CHECK ("code" ~ '^[A-Z0-9]{3,24}$');
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_offer" CHECK (
  ("offerPlan" IS NULL AND "offerDays" IS NULL)
  OR ("offerPlan" <> 'FREE' AND "offerDays" BETWEEN 1 AND 366)
);
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_max_uses_positive" CHECK ("maxUses" IS NULL OR "maxUses" > 0);
